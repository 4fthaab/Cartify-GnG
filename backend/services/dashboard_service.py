from utils.db import get_db
from datetime import datetime

def get_dashboard_summary(store_id: str):
    db = get_db()

    today = datetime.utcnow().date().isoformat()

    total_items = db["items"].count_documents({
        "store_id": store_id,
        "is_active": True
    })

    active_carts = db["carts"].count_documents({
        "store_id": store_id,
        "status": "active"
    })

    today_orders = list(db["orders"].find({
        "store_id": store_id,
        "status": "completed",
        "paid_at": {"$regex": today}
    }))

    today_order_count = len(today_orders)
    today_revenue = sum(o.get("total_price", 0) for o in today_orders)

    low_stock_items = db["inventory"].count_documents({
        "store_id": store_id,
        "stock_left": {"$lte": 10}
    })

    fraud_alerts = db["alerts"].count_documents({
        "store_id": store_id,
        "status": "open"
    })

    return {
        "total_items": total_items,
        "active_carts": active_carts,
        "today_orders": today_order_count,
        "today_revenue": today_revenue,
        "low_stock_items": low_stock_items,
        "open_fraud_alerts": fraud_alerts
    }