from fastapi import APIRouter
from utils.db import get_db
from datetime import datetime
import time

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
def update_shopping_list(payload: dict):
    db = get_db()
    user_id = payload.get("user_id")
    list_id = payload.get("list_id")

    if not user_id or not list_id:
        return {"error": "Missing user_id or list_id"}

    existing = db["shopping_lists"].find_one({"user_id": user_id, "list_id": list_id})
    if not existing:
        return {"error": "List not found"}

    update_data = {
        "items": payload.get("items", existing.get("items")),
        "updated_at": datetime.utcnow().isoformat()
    }

    if payload.get("list_name"):
        update_data["list_name"] = payload["list_name"]

    db["shopping_lists"].update_one(
        {"user_id": user_id, "list_id": list_id},
        {"$set": update_data}
    )

    # 🔗 Sync the user's shopping_lists entry
    if "list_name" in update_data:
        db["users"].update_one(
            {"user_id": user_id, "shopping_lists.list_id": list_id},
            {"$set": {"shopping_lists.$.list_name": update_data["list_name"]}}
        )

    return {
        "message": "List updated successfully",
        "user_id": user_id,
        "list_id": list_id,
        "updated_items": len(update_data["items"])
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
def mark_item_as_bought(payload: dict):
    """
    Mark one or multiple items as bought in both shopping_list and linked cart.
    {
        "user_id": "USR123",
        "list_id": "USR123_L1730933212",
        "cart_id": "CART102",
        "items": ["Lays", "Brush"]
    }
    """
    db = get_db()
    user_id = payload.get("user_id")
    list_id = payload.get("list_id")
    cart_id = payload.get("cart_id")
    items_to_mark = [i.lower().strip() for i in payload.get("items", [])]

    if not (user_id and list_id and cart_id and items_to_mark):
        return {"error": "Missing required fields"}

    # 🧾 Update in shopping list
    shopping_list = db["shopping_lists"].find_one({"user_id": user_id, "list_id": list_id})
    if not shopping_list:
        return {"error": "Shopping list not found"}

    updated_items = []
    for item in shopping_list["items"]:
        if item["name"].lower() in items_to_mark:
            item["bought"] = True
        updated_items.append(item)

    db["shopping_lists"].update_one(
        {"user_id": user_id, "list_id": list_id},
        {"$set": {"items": updated_items}}
    )

    # 🛒 Update in linked cart
    cart = db["carts"].find_one({"cart_id": cart_id})
    if cart and "user_list_items" in cart:
        new_cart_items = []
        for item in cart["user_list_items"]:
            if item["name"].lower() in items_to_mark:
                item["bought"] = True
            new_cart_items.append(item)

        db["carts"].update_one(
            {"cart_id": cart_id},
            {"$set": {"user_list_items": new_cart_items}}
        )

    return {
        "message": "Items marked as bought successfully",
        "marked_items": items_to_mark,
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