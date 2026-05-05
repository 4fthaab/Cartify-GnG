# layout_service.py
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

    # Create the update payload by starting with the new layout data
    update_payload = layout_data.copy()
    
    # Add our tracking fields
    update_payload["store_id"] = store_id
    update_payload["updated_at"] = datetime.utcnow().isoformat()

    # Save it flat! This overwrites the old flat structure with the new flat structure
    db["store_layouts"].update_one(
        {"store_id": store_id},
        {
            "$set": update_payload 
        },
        upsert=True
    )

    # Optional but highly recommended: Clean up the old nested 'layout_data' 
    # to stop confusing your Cart UI.
    db["store_layouts"].update_one(
        {"store_id": store_id},
        {
            "$unset": { "layout_data": "" } 
        }
    )

    return True