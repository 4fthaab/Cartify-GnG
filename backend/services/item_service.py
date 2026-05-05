from utils.db import get_db
from datetime import datetime


def get_all_items(store_id: str):
    db = get_db()
    items = list(
        db["items"].find(
            {"store_id": store_id},
            {"_id": 0}
        ).sort("item_id", 1) 
    )

    return items


def create_item(store_id: str, data: dict):
    db = get_db()

    item_id = data.get("item_id")

    if not item_id:
        return False, "item_id is required"

    # Prevent duplicate
    existing = db["items"].find_one({
        "store_id": store_id,
        "item_id": item_id
    })

    if existing:
        return False, "Item already exists"

    data["store_id"] = store_id
    data["created_at"] = datetime.utcnow().isoformat()
    data["updated_at"] = datetime.utcnow().isoformat()
    data["is_active"] = True

    db["items"].insert_one(data)

    return True, "Item created successfully"


def update_item(store_id: str, item_id: str, update_data: dict):
    db = get_db()

    # Prevent critical changes
    update_data.pop("store_id", None)
    update_data.pop("item_id", None)
    update_data["updated_at"] = datetime.utcnow().isoformat()

    result = db["items"].update_one(
        {"store_id": store_id, "item_id": item_id},
        {"$set": update_data}
    )

    return result.modified_count


def delete_item(store_id: str, item_id: str):
    db = get_db()

    # Soft delete (better than hard delete)
    result = db["items"].update_one(
        {"store_id": store_id, "item_id": item_id},
        {"$set": {"is_active": False, "updated_at": datetime.utcnow().isoformat()}}
    )

    return result.modified_count