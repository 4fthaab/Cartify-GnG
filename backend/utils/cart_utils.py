# utils/cart_utils.py
from utils.db import get_db

def is_cart_locked(cart_id: str) -> bool:
    """
    Check if a cart is locked.
    Returns True if locked, else False.
    """
    db = get_db()
    cart = db["carts"].find_one({"cart_id": cart_id}, {"locked": 1})
    return bool(cart and cart.get("locked", False))


def lock_cart(cart_id: str):
    """
    Lock a cart — typically triggered during checkout.
    """
    db = get_db()
    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {"locked": True, "status": "locked"}}
    )


def unlock_cart(cart_id: str):
    """
    Unlock a cart — after checkout ends or when manually released.
    """
    db = get_db()
    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {"locked": False, "status": "available"}}
    )
