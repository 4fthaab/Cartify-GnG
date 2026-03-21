from fastapi import APIRouter, Body
from utils.db import get_db
from datetime import datetime
import time
from utils.cart_utils import is_cart_locked

router = APIRouter(prefix="/shopping-list", tags=["Shopping List"])

# ✅ CREATE LIST
@router.post("/create")
def create_shopping_list(payload: dict):
    """
    {"user_id": "USR496713", "items": ["apple","lays","good day","orange","paal","cover","ice cream"]}
    """
    db = get_db()
    user_id = payload.get("user_id")
    items = payload.get("items", [])

    if not user_id:
        return {"error": "Missing required field: user_id"}

    if items is None:
        items = []
    # 🔥 Normalize items to dict format
    normalized_items = []
    for item in items:
        if isinstance(item, str):
            normalized_items.append({"name": item})
        elif isinstance(item, dict) and "name" in item:
            normalized_items.append({"name": item["name"]})
        else:
            return {"error": "Invalid item format. Each item must be string or {'name': ...}"}

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
        "items": normalized_items,   # 🔥 store normalized
        "created_at": datetime.utcnow().isoformat(),
        "status": "pending"
    }

    db["shopping_lists"].insert_one(doc)

    db["users"].update_one(
        {"user_id": user_id},
        {"$addToSet": {"shopping_lists": {"list_id": list_id, "list_name": list_name}}},
    )

    return {
        "message": "Shopping list created successfully",
        "user_id": user_id,
        "list_id": list_id,
        "list_name": list_name,
        "item_count": len(normalized_items)
    }

@router.post("/update")
def update_shopping_list(payload: dict = Body(...)):
    db = get_db()
    user_id = payload.get("user_id")
    list_id = payload.get("list_id")

    if not (user_id and list_id):
        return {"error": "Missing required fields"}

    shopping_list = db["shopping_lists"].find_one({"user_id": user_id, "list_id": list_id})
    if not shopping_list:
        return {"error": "Shopping list not found"}

    old_items = shopping_list.get("items", [])
    # Safely handle both dicts and strings
    not_bought = [
        i for i in old_items 
        if not (isinstance(i, dict) and i.get("bought"))
    ]
    not_found = shopping_list.get("not_found", [])
    new_items = not_bought + not_found

    new_list_id = None
    
    # 1. ONLY create new list if there are remaining items
    if len(new_items) > 0:
        timestamp = int(datetime.utcnow().timestamp())
        new_list_id = f"{user_id}_L{timestamp}"
        
        # --- NEW NAMING LOGIC ---
        current_name = shopping_list.get('list_name', 'My List').strip()
        
        # If the string ends with "(Next)", slice off the last 6 characters
        if current_name.endswith("(Next)"):
            base_name = current_name[:-6].strip()
        else:
            base_name = current_name
            
        new_list_name = f"{base_name} (Next)"
        # ------------------------

        new_list_doc = {
            "user_id": user_id,
            "list_id": new_list_id,
            "items": new_items,
            "created_at": datetime.utcnow().isoformat(),
            "status": "pending",
            "list_name": new_list_name
        }
        db["shopping_lists"].insert_one(new_list_doc)
        
        # Add the new list to the user's document
        db["users"].update_one(
            {"user_id": user_id},
            {"$addToSet": {"shopping_lists": {"list_id": new_list_id, "list_name": new_list_doc["list_name"]}}}
        )

    # 2. DELETE the old list entirely (instead of marking completed)
    db["shopping_lists"].delete_one({"user_id": user_id, "list_id": list_id})
    db["users"].update_one(
        {"user_id": user_id},
        {"$pull": {"shopping_lists": {"list_id": list_id}}}
    )

    # 3. Clear linked cart
    db["carts"].update_many(
        {"linked_user_id": user_id, "linked_list_id": list_id},
        {"$set": {"linked": False, "checkout_time": datetime.utcnow().isoformat()}}
    )

    return {
        "message": "Shopping list finalized.",
        "old_list_id": list_id,
        "new_list_id": new_list_id,
        "remaining_items_count": len(new_items)
    }

# ✅ SELECT LIST FOR CART
@router.post("/select")
def select_shopping_list(payload: dict):
    """
   { "user_id":"USR496713", "list_id":"USR496713_L1771856583", "cart_id":"CART103" }
    """
    from services.matcher import match_items
    from services.path_optimizer import optimize_path

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
    # 1️⃣ Get cart to fetch store_id
    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart:
        return {"error": "Cart not found"}

    store_id = cart.get("store_id")
    if not store_id:
        return {"error": "Cart does not have store_id"}

    # Normalize items into {"name": "..."} format
    normalized_items = []

    for item in selected_list["items"]:
        if isinstance(item, str):
            normalized_items.append({"name": item})
        else:
            normalized_items.append(item)

    matched_data = match_items(normalized_items, store_id)
    matched_items = matched_data["matched_items"]
    not_found = matched_data["not_found"]

    # 3️⃣ Fetch layout
    layout_doc = db["store_layouts"].find_one({"store_id": store_id})
    if not layout_doc:
        return {"error": "Store layout not found"}

    layout = layout_doc  # direct use

    # 4️⃣ Optimize path
    optimized_path = optimize_path(matched_items, layout)

    # ✅ Store only user list names for cart display
    user_display_items = []
    for item in selected_list["items"]:
        if isinstance(item, str):
            user_display_items.append({"name": item, "bought": False})
        else:
            user_display_items.append({"name": item["name"], "bought": False})

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
        "cart_id": "CART103",
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

@router.post("/add-item")
def add_item_to_list(payload: dict):
    db = get_db()
    user_id = payload.get("user_id")
    list_id = payload.get("list_id")
    item_name = payload.get("item_name")

    if not (user_id and list_id and item_name):
        return {"error": "Missing required fields"}

    db["shopping_lists"].update_one(
        {"user_id": user_id, "list_id": list_id},
        {"$push": {"items": {"name": item_name}}}
    )

    return {"message": "Item added successfully"}

@router.post("/delete")
def delete_shopping_list(payload: dict):
    """
    Delete entire list or selected items from it.
    {
        "user_id": "USR123",
        "list_id": "USR123_L1730933212",
        "items": ["Brush", "Onion"]   # optional to remove the entire list dont pass the items
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
def get_user_lists(user_id: str, include_empty: bool = False):
    db = get_db()
    user = db["users"].find_one({"user_id": user_id})
    if not user:
        return {"error": "Invalid user_id"}

    # Base query
    query = {"user_id": user_id}
    
    # If false (Cart UI default), strictly require at least 1 item
    if not include_empty:
        query["items.0"] = {"$exists": True}

    lists = list(
        db["shopping_lists"].find(query, {"_id": 0}).sort("created_at", -1)
    )
    return {"shopping_lists": lists}