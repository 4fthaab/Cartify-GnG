from utils.db import get_db
from datetime import datetime

def update_location_from_marker(cart_id, marker_id, confidence=1.0):

    db = get_db()

    marker = db["aisle_markers"].find_one({
        "marker_id": marker_id,
        "is_active": True
    })

    if not marker:
        return False

    location_data = {
        "x": marker["position"]["x"],
        "y": marker["position"]["y"],
        "marker_id": marker_id,
        "nearby_racks": [
            marker.get("left_rack_id"),
            marker.get("right_rack_id")
        ],
        "source": "marker",
        "confidence": confidence,
        "updated_at": datetime.utcnow().isoformat()
    }

    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {"current_location": location_data}}
    )

    return True

from services.path_optimizer import compute_pickup_point

def update_location_from_item(cart_id, item, store_id):

    db = get_db()

    # 🔹 Fetch layout using store_id
    layout = db["store_layouts"].find_one({"store_id": store_id})
    if not layout:
        return False

    pickup = compute_pickup_point(item, layout)

    location_data = {
        "x": pickup[0],
        "y": pickup[1],
        "rack_id": item["rack_id"],
        "source": "item_detection",
        "confidence": 1.0,
        "updated_at": datetime.utcnow().isoformat()
    }

    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {"current_location": location_data}}
    )
    

    return True