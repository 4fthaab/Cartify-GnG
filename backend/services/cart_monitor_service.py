from utils.db import get_db


def get_live_carts(store_id: str):
    db = get_db()

    carts = list(
        db["carts"].find(
            {
                "store_id": store_id,
                "status": {"$in": ["active", "shopping"]}
            },
            {"_id": 0}
        )
    )

    return carts


def get_cart_details(store_id: str, cart_id: str):
    db = get_db()

    cart = db["carts"].find_one(
        {"store_id": store_id, "cart_id": cart_id},
        {"_id": 0}
    )

    return cart


def get_cart_detections(store_id: str, cart_id: str):
    db = get_db()

    detections = list(
        db["detections"].find(
            {"store_id": store_id, "cart_id": cart_id},
            {"_id": 0}
        )
    )

    return detections


def get_weight_events(store_id: str, cart_id: str):
    db = get_db()

    events = list(
        db["weight_events"].find(
            {"store_id": store_id, "cart_id": cart_id},
            {"_id": 0}
        )
    )

    return events


def force_close_cart(store_id: str, cart_id: str):
    db = get_db()

    result = db["carts"].update_one(
        {"store_id": store_id, "cart_id": cart_id},
        {"$set": {"status": "force_closed"}}
    )

    return result.modified_count