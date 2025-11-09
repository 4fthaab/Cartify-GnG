from fastapi import APIRouter, Body
from utils.db import get_db
from datetime import datetime
import time
from utils.cart_utils import is_cart_locked

router = APIRouter(prefix="/shopping-list", tags=["Shopping List"])

# ✅ CREATE LIST
@router.post("/create")
def create_shopping_list(payload: dict):
    db = get_db()
    user_id = payload.get("user_id")
    items = payload.get("items")

    if not user_id or not items:
        return {"error": "Missing required fields (user_id or items)"}

    # Validate user exists
    user = db["users"].find_one({"user_id": user_id})
    if not user:
        return {"error": f"Invalid user_id: {user_id}"}

    # Default list name
    list_name = payload.get("list_name")
    if not list_name:
        date_str = datetime.utcnow().strftime("%Y-%m-%d")
        today_count = db["shopping_lists"].count_documents({
            "user_id": user_id,
            "list_name": {"$regex": f"List_{date_str}"}
        }) + 1
        list_name = f"List_{date_str}_{today_count}"

    # Unique list_id
    list_id = f"{user_id}_L{int(time.time())}"

    doc = {
        "user_id": user_id,
        "list_id": list_id,
        "list_name": list_name,
        "items": items,
        "created_at": datetime.utcnow().isoformat(),
        "status": "pending"
    }

    db["shopping_lists"].insert_one(doc)

    # 🔗 Update user's shopping_lists array
    db["users"].update_one(
        {"user_id": user_id},
        {"$addToSet": {"shopping_lists": {"list_id": list_id, "list_name": list_name}}},
    )

    return {
        "message": "Shopping list created successfully",
        "user_id": user_id,
        "list_id": list_id,
        "list_name": list_name,
        "item_count": len(items)
    }


# ✅ UPDATE LIST
@router.post("/update")
@router.post("/update")
def update_shopping_list(payload: dict = Body(...)):
    """
    Update shopping list after checkout or cart session end.
    Keeps only not-bought or not-found items for reuse.
    Expected payload:
    {
        "user_id": "USR123",
        "list_id": "USR123_L1762675439",
        "mode": "checkout"   # or "manual"
    }
    """
    db = get_db()
    user_id = payload.get("user_id")
    list_id = payload.get("list_id")
    mode = payload.get("mode", "checkout")

    if not (user_id and list_id):
        return {"error": "Missing required fields"}

    shopping_list = db["shopping_lists"].find_one({"user_id": user_id, "list_id": list_id})
    if not shopping_list:
        return {"error": "Shopping list not found"}

    old_items = shopping_list.get("items", [])
    not_bought = [i for i in old_items if not i.get("bought")]
    not_found = shopping_list.get("not_found", [])

    new_items = not_bought + not_found

    # Generate a new list_id for next session
    timestamp = int(datetime.utcnow().timestamp())
    new_list_id = f"{user_id}_L{timestamp}"

    # Create new list for next session
    new_list_doc = {
        "user_id": user_id,
        "list_id": new_list_id,
        "items": new_items,
        "created_at": datetime.utcnow().isoformat(),
        "status": "pending",
        "list_name": f"{shopping_list.get('list_name', 'My List')} (Next)"
    }

    db["shopping_lists"].insert_one(new_list_doc)

    # Optional: archive the old list
    db["shopping_lists"].update_one(
        {"user_id": user_id, "list_id": list_id},
        {"$set": {"status": "completed", "archived_at": datetime.utcnow().isoformat()}}
    )

    # Optional: clear linked cart
    db["carts"].update_many(
        {"linked_user_id": user_id, "linked_list_id": list_id},
        {"$set": {"linked": False, "checkout_time": datetime.utcnow().isoformat()}}
    )

    return {
        "message": "Shopping list finalized and next-session list created.",
        "old_list_id": list_id,
        "new_list_id": new_list_id,
        "remaining_items_count": len(new_items)
    }


# ✅ SELECT LIST FOR CART
@router.post("/select")
def select_shopping_list(payload: dict):
    """
    Links a shopping list to a cart and prepares optimized path.
    Keeps only user’s list item names for cart display (avoids duplicates).
    """
    from services.matcher import match_items
    from services.optimizer import optimize_path

    db = get_db()
    user_id = payload.get("user_id")
    list_id = payload.get("list_id")
    cart_id = payload.get("cart_id")

    if not (user_id and list_id and cart_id):
        return {"error": "Missing required fields"}

    selected_list = db["shopping_lists"].find_one({"user_id": user_id, "list_id": list_id})
    if not selected_list:
        return {"error": "Shopping list not found"}

    # Run matching (for backend logic)
    matched_data = match_items(selected_list["items"])
    matched_items = matched_data["matched_items"]
    not_found = matched_data["not_found"]

    # Optimize backend path (internal use)
    optimized_path = optimize_path(matched_items)

    # ✅ Store only user list names for cart display
    user_display_items = [{"name": item["name"], "bought": False} for item in selected_list["items"]]

    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {
            "linked_user_id": user_id,
            "linked_list_id": list_id,
            "linked_at": datetime.utcnow().isoformat(),
            "list_name": selected_list.get("list_name"),
            "user_list_items": user_display_items,
            "backend_matches": matched_items,
            "optimized_path": optimized_path
        }},
        upsert=True
    )

    return {
        "message": "List linked successfully to cart",
        "cart_id": cart_id,
        "list_id": list_id,
        "list_name": selected_list.get("list_name"),
        "total_list_items": len(user_display_items),
        "not_found": not_found,
        "optimized_path": optimized_path
    }

@router.post("/mark-item")
def mark_item_as_bought(payload: dict = Body(...)):
    """
    Mark or unmark items in shopping list and linked cart using detected labels.

    Expected payload:
    {
        "user_id": "USR123",
        "list_id": "USR123_L1730933212",
        "cart_id": "CART102",
        "detected_label": "lays classic",
        "action": "mark"   # or "unmark"
    }
    """
    db = get_db()

    user_id = payload.get("user_id")
    list_id = payload.get("list_id")
    cart_id = payload.get("cart_id")
    if is_cart_locked(cart_id):
        return {"error": "Cart is locked. Checkout in progress or completed."}
    detected_label = (payload.get("detected_label") or "").lower().strip()
    action = payload.get("action", "mark").lower()

    # Validate input
    if not (user_id and list_id and cart_id and detected_label):
        return {"error": "Missing required fields"}

    # 🧠 Step 1: Find item that matches detected label
    matched_item = db["items"].find_one(
        {"label_variants": {"$elemMatch": {"$regex": f"^{detected_label}$", "$options": "i"}}},
        {"_id": 0, "name": 1, "label_variants": 1}
    )
    if not matched_item:
        return {"error": f"No item found matching label: {detected_label}"}

    matched_name = matched_item["name"]
    label_variants = [v.lower() for v in matched_item.get("label_variants", [])]

    # 🧾 Step 2: Fetch user's shopping list
    shopping_list = db["shopping_lists"].find_one({"user_id": user_id, "list_id": list_id})
    if not shopping_list:
        return {"error": "Shopping list not found"}

    # Step 3: Find which item in list matches any variant
    updated_items = []
    matched_list_entry = None

    for item in shopping_list["items"]:
        item_name_lower = item["name"].lower().strip()
        if item_name_lower in label_variants or item_name_lower in matched_name.lower():
            if action == "mark":
                item["bought"] = True
            elif action == "unmark":
                item["bought"] = False
            matched_list_entry = item["name"]
        updated_items.append(item)

    if not matched_list_entry:
        return {"message": "No matching item in user's list for detected label"}

    # Step 4: Update shopping list
    db["shopping_lists"].update_one(
        {"user_id": user_id, "list_id": list_id},
        {"$set": {"items": updated_items}}
    )

    # Step 5: Update in cart as well
    cart = db["carts"].find_one({"cart_id": cart_id})
    if cart and "user_list_items" in cart:
        new_cart_items = []
        for item in cart["user_list_items"]:
            if item["name"].lower() == matched_list_entry.lower():
                item["bought"] = (True if action == "mark" else False)
            new_cart_items.append(item)
        db["carts"].update_one({"cart_id": cart_id}, {"$set": {"user_list_items": new_cart_items}})

    return {
        "message": f"Item successfully {'marked' if action=='mark' else 'unmarked'}",
        "detected_label": detected_label,
        "matched_name": matched_name,
        "list_item_marked": matched_list_entry,
        "action": action,
        "cart_id": cart_id,
        "list_id": list_id
    }

@router.post("/delete")
def delete_shopping_list(payload: dict):
    """
    Delete entire list or selected items from it.
    {
        "user_id": "USR123",
        "list_id": "USR123_L1730933212",
        "items": ["Brush", "Onion"]   # optional
    }
    """
    db = get_db()
    user_id = payload.get("user_id")
    list_id = payload.get("list_id")
    items = payload.get("items")

    if not (user_id and list_id):
        return {"error": "Missing required fields"}

    if not items:
        # Delete full list
        db["shopping_lists"].delete_one({"user_id": user_id, "list_id": list_id})
        db["users"].update_one({"user_id": user_id}, {"$pull": {"shopping_lists": {"list_id": list_id}}})
        return {"message": f"List {list_id} deleted fully"}

    # Delete only selected items
    db["shopping_lists"].update_one(
        {"user_id": user_id, "list_id": list_id},
        {"$pull": {"items": {"name": {"$in": items}}}}
    )
    return {"message": "Selected items removed", "removed": items}


# 🧩 FETCH USER LISTS (sorted by most recent first)
@router.get("/get/{user_id}")
def get_user_lists(user_id: str):
    db = get_db()
    user = db["users"].find_one({"user_id": user_id})
    if not user:
        return {"error": "Invalid user_id"}

    lists = list(
        db["shopping_lists"].find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)
    )
    return {"shopping_lists": lists}