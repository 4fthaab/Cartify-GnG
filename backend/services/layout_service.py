from utils.db import get_db
from datetime import datetime


def get_layout(store_id: str):
    db = get_db()

    layout = db["store_layouts"].find_one(
        {"store_id": store_id},
        {"_id": 0}
    )

    return layout


def save_layout(store_id: str, layout_data: dict):
    db = get_db()

    db["store_layouts"].update_one(
        {"store_id": store_id},
        {
            "$set": {
                "store_id": store_id,
                "layout_data": layout_data,
                "updated_at": datetime.utcnow().isoformat()
            }
        },
        upsert=True
    )

    return True