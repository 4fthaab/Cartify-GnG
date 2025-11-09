# services/inventory_updater.py
from utils.db import get_db
from datetime import datetime

def deduct_stock_after_payment(order_doc: dict):
    """
    Deduct stock for each item in the given order.
    Creates transaction logs for traceability.
    """
    db = get_db()
    inventory = db["inventory"]

    updates = []
    for item in order_doc.get("items", []):
        item_id = item.get("item_id")
        if not item_id:
            continue

        weight_g = item.get("weight_g", 0)
        qty = item.get("qty", 1)

        # Find the inventory record for this item (latest batch)
        inv_doc = inventory.find_one({"item_id": item_id}, sort=[("last_updated", -1)])
        if not inv_doc:
            print(f"⚠️ No inventory found for {item_id}")
            continue

        # Compute deduction amount
        deduction = (weight_g / 1000) if inv_doc.get("unit") == "kg" else qty

        # Update stock and log transaction
        inventory.update_one(
            {"_id": inv_doc["_id"]},
            {
                "$inc": {"stock_left": -deduction},
                "$set": {"last_updated": datetime.utcnow().isoformat()},
                "$push": {
                    "stock_history": {
                        "type": "sale",
                        "order_id": order_doc.get("order_id"),
                        "cart_id": order_doc.get("cart_id"),
                        "user_id": order_doc.get("user_id"),
                        "amount_deducted": deduction,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }
            }
        )
        updates.append({"item_id": item_id, "deducted": deduction})

    return {"message": "Stock updated", "updated_items": updates}
