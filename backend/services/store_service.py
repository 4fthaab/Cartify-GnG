from utils.db import get_db
from datetime import datetime

def get_store_by_id(store_id: str):
    db = get_db()
    store = db["stores"].find_one(
        {"store_id": store_id},
        {"_id": 0}
    )
    return store


def update_store_details(store_id: str, update_data: dict):
    db = get_db()

    # Prevent store_id modification
    update_data.pop("store_id", None)

    update_data["updated_at"] = datetime.utcnow().isoformat()

    result = db["stores"].update_one(
        {"store_id": store_id},
        {"$set": update_data}
    )

    return result.modified_count