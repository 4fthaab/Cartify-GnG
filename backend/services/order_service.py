from utils.db import get_db


def get_all_orders(store_id: str):
    db = get_db()

    orders = list(
        db["orders"].find(
            {"store_id": store_id},
            {"_id": 0}
        )
    )

    return orders


def get_order_by_id(store_id: str, order_id: str):
    db = get_db()

    order = db["orders"].find_one(
        {"store_id": store_id, "order_id": order_id},
        {"_id": 0}
    )

    return order


def get_receipt_by_order(store_id: str, order_id: str):
    db = get_db()

    receipt = db["receipts"].find_one(
        {"order_id": order_id},
        {"_id": 0}
    )

    return receipt


def get_payments_for_store(store_id: str):
    db = get_db()

    payments = list(
        db["payments"].find(
            {"store_id": store_id},
            {"_id": 0}
        )
    )

    return payments