from utils.db import get_db
from datetime import datetime

def update_location_from_marker(cart_id, marker_id, confidence=1.0):

    db = get_db()

    # 1️⃣ Get cart to know store_id
    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart:
        return False

    store_id = cart.get("store_id")
    if not store_id:
        return False

    # 2️⃣ Fetch layout from store_layouts
    layout = db["store_layouts"].find_one({"store_id": store_id})
    if not layout:
        return False

    # 3️⃣ Search marker inside layout["elements"]
    marker = next(
        (e for e in layout.get("elements", [])
         if e.get("type") == "aisle_marker" and e.get("id") == marker_id),
        None
    )

    if not marker:
        return False

    # 4️⃣ Build location object from layout marker
    location_data = {
        "x": marker["x"],
        "y": marker["y"],
        "marker_id": marker_id,
        "nearby_racks": [
            marker.get("left_rack_id"),
            marker.get("right_rack_id")
        ],
        "source": "marker",
        "confidence": confidence,
        "updated_at": datetime.utcnow().isoformat()
    }

    # 5️⃣ Update cart
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