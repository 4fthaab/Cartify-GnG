# routers/offers.py
"""
Offers & Coupons APIs (admin posts, users browse):
  - GET  /offers/all                       → list all active offers
  - GET  /offers/{offer_id}                → single offer detail
  - GET  /coupons/user/{user_id}           → coupons available to a user
  - POST /coupons/validate                 → validate a coupon code before payment
  - POST /coupons/apply                    → apply coupon to an order
"""

from fastapi import APIRouter, HTTPException
from utils.db import get_db
from datetime import datetime
from bson import ObjectId

router = APIRouter(tags=["Offers & Coupons"])


def _clean(obj):
    if isinstance(obj, list):
        return [_clean(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj


# ─────────────────────────────────────────────
# OFFERS
# ─────────────────────────────────────────────

@router.get("/offers/all")
def get_all_offers():
    """
    Returns all currently active offers posted by admin.
    Admin creates offers via POST /admin/offers (see admin_offers router).
    """
    db = get_db()
    now = datetime.utcnow().isoformat()
    offers = list(
        db["offers"].find(
            {
                "active": True,
                "$or": [
                    {"expires_at": {"$gte": now}},
                    {"expires_at": None}
                ]
            },
            {"_id": 0}
        ).sort("created_at", -1)
    )
    return {"offers": _clean(offers), "count": len(offers)}


@router.get("/offers/{offer_id}")
def get_offer(offer_id: str):
    db = get_db()
    offer = db["offers"].find_one({"offer_id": offer_id}, {"_id": 0})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    return _clean(offer)


# ─────────────────────────────────────────────
# COUPONS
# ─────────────────────────────────────────────

@router.get("/coupons/user/{user_id}")
def get_user_coupons(user_id: str):
    """
    Returns coupons targeted to this user (or global coupons).
    Coupons can be:
      - global  (target_users: null / [])
      - user-specific (target_users contains user_id)
    """
    db = get_db()
    now = datetime.utcnow().isoformat()
    coupons = list(
        db["coupons"].find(
            {
                "active": True,
                "$or": [
                    {"target_users": {"$exists": False}},
                    {"target_users": []},
                    {"target_users": user_id}
                ],
                "$or": [
                    {"expires_at": {"$gte": now}},
                    {"expires_at": None}
                ]
            },
            {"_id": 0}
        )
    )
    return {"coupons": _clean(coupons), "count": len(coupons)}


@router.post("/coupons/validate")
def validate_coupon(data: dict):
    """
    Check if a coupon is valid for a given user and order amount.
    { "code": "SAVE20", "user_id": "USR123", "order_amount": 450.0 }
    """
    db = get_db()
    code = (data.get("code") or "").strip().upper()
    user_id = data.get("user_id")
    order_amount = data.get("order_amount", 0)

    if not code:
        return {"valid": False, "message": "Coupon code is required"}

    coupon = db["coupons"].find_one({"code": code, "active": True})
    if not coupon:
        return {"valid": False, "message": "Invalid or expired coupon code"}

    # Expiry check
    now = datetime.utcnow().isoformat()
    if coupon.get("expires_at") and coupon["expires_at"] < now:
        return {"valid": False, "message": "Coupon has expired"}

    # Usage limit check
    used_count = coupon.get("used_count", 0)
    max_uses = coupon.get("max_uses")
    if max_uses and used_count >= max_uses:
        return {"valid": False, "message": "Coupon usage limit reached"}

    # Per-user usage check
    if user_id:
        user_uses = db["coupon_uses"].count_documents({"code": code, "user_id": user_id})
        per_user_limit = coupon.get("per_user_limit", 1)
        if user_uses >= per_user_limit:
            return {"valid": False, "message": "You have already used this coupon"}

    # Minimum order check
    min_order = coupon.get("min_order_amount", 0)
    if order_amount < min_order:
        return {"valid": False, "message": f"Minimum order amount is ₹{min_order}"}

    # Calculate discount
    discount_type = coupon.get("discount_type", "flat")
    discount_value = coupon.get("discount_value", 0)
    if discount_type == "percent":
        discount = round(order_amount * discount_value / 100, 2)
        max_discount = coupon.get("max_discount_cap")
        if max_discount:
            discount = min(discount, max_discount)
    else:
        discount = min(discount_value, order_amount)

    final_amount = round(order_amount - discount, 2)

    return {
        "valid": True,
        "code": code,
        "discount_type": discount_type,
        "discount_value": discount_value,
        "discount_amount": discount,
        "original_amount": order_amount,
        "final_amount": final_amount,
        "coupon_title": coupon.get("title", ""),
        "coupon_description": coupon.get("description", "")
    }


@router.post("/coupons/apply")
def apply_coupon(data: dict):
    """
    Apply a validated coupon to an order and record usage.
    { "code": "SAVE20", "user_id": "USR123", "order_id": "ORD123" }
    """
    db = get_db()
    code = (data.get("code") or "").strip().upper()
    user_id = data.get("user_id")
    order_id = data.get("order_id")

    if not (code and user_id and order_id):
        return {"error": "code, user_id, and order_id are required"}

    order = db["orders"].find_one({"order_id": order_id})
    if not order:
        return {"error": "Order not found"}

    if order.get("coupon_applied"):
        return {"error": "A coupon has already been applied to this order"}

    # Re-validate
    validation = validate_coupon({"code": code, "user_id": user_id, "order_amount": order["total_price"]})
    if not validation.get("valid"):
        return {"error": validation.get("message")}

    discount = validation["discount_amount"]
    final_amount = validation["final_amount"]

    # Update order
    db["orders"].update_one(
        {"order_id": order_id},
        {"$set": {
            "coupon_applied": code,
            "discount_amount": discount,
            "final_amount": final_amount
        }}
    )

    # Record coupon usage
    db["coupon_uses"].insert_one({
        "code": code,
        "user_id": user_id,
        "order_id": order_id,
        "discount_applied": discount,
        "used_at": datetime.utcnow().isoformat()
    })

    # Increment used_count
    db["coupons"].update_one({"code": code}, {"$inc": {"used_count": 1}})

    return {
        "status": "applied",
        "code": code,
        "discount_amount": discount,
        "final_amount": final_amount,
        "order_id": order_id
    }


# Admin offer/coupon management is handled by routers/admin_offers.py
# (requires admin JWT — see POST /admin/login for token)
