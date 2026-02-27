from utils.db import get_db
from datetime import datetime


def get_inventory(store_id: str):
    db = get_db()
    records = list(
        db["inventory"].find(
            {"store_id": store_id},
            {"_id": 0}
        )
    )
    return records


def get_inventory_by_item(store_id: str, item_id: str):
    db = get_db()
    records = list(
        db["inventory"].find(
            {"store_id": store_id, "item_id": item_id},
            {"_id": 0}
        )
    )
    return records


def add_inventory_batch(store_id: str, data: dict):
    db = get_db()

    data["store_id"] = store_id
    data["last_updated"] = datetime.utcnow().isoformat()
    data["stock_history"] = []

    db["inventory"].insert_one(data)

    return True


def update_stock(store_id: str, item_id: str, batch_code: str, new_stock: float):
    db = get_db()

    result = db["inventory"].update_one(
        {
            "store_id": store_id,
            "item_id": item_id,
            "batch_code": batch_code
        },
        {
            "$set": {
                "stock_left": new_stock,
                "last_updated": datetime.utcnow().isoformat()
            }
        }
    )

    return result.modified_count


def get_stock_history(store_id: str, item_id: str):
    db = get_db()

    record = db["inventory"].find_one(
        {"store_id": store_id, "item_id": item_id},
        {"_id": 0, "stock_history": 1}
    )

    if record:
        return record.get("stock_history", [])
    return []