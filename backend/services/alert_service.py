from utils.db import get_db
from datetime import datetime


def get_all_alerts(store_id: str):
    db = get_db()

    alerts = list(
        db["alerts"].find(
            {"store_id": store_id},
            {"_id": 0}
        ).sort("created_at", -1)
    )

    return alerts


def get_open_alerts(store_id: str):
    db = get_db()

    alerts = list(
        db["alerts"].find(
            {"store_id": store_id, "status": "open"},
            {"_id": 0}
        ).sort("created_at", -1)
    )

    return alerts


def get_alert_by_id(store_id: str, alert_id: str):
    db = get_db()

    alert = db["alerts"].find_one(
        {"store_id": store_id, "alert_id": alert_id},
        {"_id": 0}
    )

    return alert


def resolve_alert(store_id: str, alert_id: str, admin_id: str):
    db = get_db()

    result = db["alerts"].update_one(
        {"store_id": store_id, "alert_id": alert_id},
        {
            "$set": {
                "status": "resolved",
                "resolved_at": datetime.utcnow().isoformat(),
                "resolved_by": admin_id
            }
        }
    )

    return result.modified_count


def get_alerts_for_cart(store_id: str, cart_id: str):
    db = get_db()

    alerts = list(
        db["alerts"].find(
            {"store_id": store_id, "cart_id": cart_id},
            {"_id": 0}
        )
    )

    return alerts