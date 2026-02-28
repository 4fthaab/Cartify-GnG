# routers/admin_offers.py
"""
Admin APIs for Offers & Coupons — all routes require admin JWT.

Offers:
  POST   /admin/offers/create          → create a new offer banner
  GET    /admin/offers/all             → list all offers (active + inactive)
  PUT    /admin/offers/update/{id}     → edit an offer
  PATCH  /admin/offers/toggle/{id}     → activate / deactivate
  DELETE /admin/offers/delete/{id}     → hard delete

Coupons:
  POST   /admin/coupons/create         → create a new coupon
  GET    /admin/coupons/all            → list all coupons
  PUT    /admin/coupons/update/{code}  → edit coupon details
  PATCH  /admin/coupons/toggle/{code}  → activate / deactivate
  DELETE /admin/coupons/delete/{code}  → hard delete
  GET    /admin/coupons/usage/{code}   → usage stats for a coupon
"""

from fastapi import APIRouter, Depends, HTTPException
from dependencies.admin_dependency import verify_admin_token
from utils.db import get_db
from datetime import datetime
from bson import ObjectId
import time

router = APIRouter(prefix="/admin", tags=["Admin Offers & Coupons"])


def _clean(obj):
    """Recursively stringify ObjectId for JSON serialisation."""
    if isinstance(obj, list):
        return [_clean(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj


# ══════════════════════════════════════════════════════════
#  OFFERS
# ══════════════════════════════════════════════════════════

@router.post("/offers/create")
def create_offer(data: dict, admin=Depends(verify_admin_token)):
    """
    Create a new promotional offer banner.
    Admin JWT required (Authorization: Bearer <token>).

    Payload:
    {
      "title": "50% OFF Dairy",
      "description": "Get 50% off on all dairy products this weekend.",
      "category": "dairy",               // optional, for filtering
      "discount_percent": 50,            // display-only; actual discount is in coupons
      "banner_color": "from-purple-500 to-pink-500",  // Tailwind gradient string
      "emoji": "🥛",                      // optional display emoji
      "image_url": "https://...",        // optional banner image
      "expires_at": "2025-12-31T23:59:59"  // ISO string or null for no expiry
    }
    """
    db = get_db()

    title = (data.get("title") or "").strip()
    if not title:
        return {"status": "error", "message": "title is required"}

    offer_id = f"OFR{int(time.time())}"

    doc = {
        "offer_id": offer_id,
        "title": title,
        "description": data.get("description", ""),
        "category": data.get("category"),
        "discount_percent": data.get("discount_percent"),
        "banner_color": data.get("banner_color", "from-blue-500 to-indigo-500"),
        "emoji": data.get("emoji"),
        "image_url": data.get("image_url"),
        "active": True,
        "expires_at": data.get("expires_at"),
        "created_by": admin["user_id"],
        "store_id": admin["store_id"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    db["offers"].insert_one(doc)

    return {
        "status": "success",
        "message": "Offer created successfully",
        "offer_id": offer_id
    }


@router.get("/offers/all")
def get_all_offers_admin(admin=Depends(verify_admin_token)):
    """
    List all offers for this store (active + inactive + expired).
    Sorted by created_at descending.
    """
    db = get_db()
    offers = list(
        db["offers"].find(
            {"store_id": admin["store_id"]},
            {"_id": 0}
        ).sort("created_at", -1)
    )
    now = datetime.utcnow().isoformat()
    for o in offers:
        o["is_expired"] = bool(o.get("expires_at") and o["expires_at"] < now)

    return {
        "status": "success",
        "count": len(offers),
        "offers": _clean(offers)
    }


@router.put("/offers/update/{offer_id}")
def update_offer(offer_id: str, data: dict, admin=Depends(verify_admin_token)):
    """
    Update any field of an existing offer.
    Updatable: title, description, category, discount_percent,
               banner_color, emoji, image_url, expires_at
    """
    db = get_db()

    offer = db["offers"].find_one({"offer_id": offer_id, "store_id": admin["store_id"]})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    allowed_fields = {
        "title", "description", "category", "discount_percent",
        "banner_color", "emoji", "image_url", "expires_at"
    }
    updates = {k: v for k, v in data.items() if k in allowed_fields}

    if not updates:
        return {"status": "error", "message": "No valid fields to update"}

    updates["updated_at"] = datetime.utcnow().isoformat()
    db["offers"].update_one({"offer_id": offer_id}, {"$set": updates})

    return {"status": "success", "message": "Offer updated", "updated_fields": list(updates.keys())}


@router.patch("/offers/toggle/{offer_id}")
def toggle_offer(offer_id: str, admin=Depends(verify_admin_token)):
    """
    Flip active ↔ inactive for an offer.
    Returns new active status.
    """
    db = get_db()
    offer = db["offers"].find_one({"offer_id": offer_id, "store_id": admin["store_id"]})
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    new_status = not offer.get("active", True)
    db["offers"].update_one(
        {"offer_id": offer_id},
        {"$set": {"active": new_status, "updated_at": datetime.utcnow().isoformat()}}
    )

    return {
        "status": "success",
        "offer_id": offer_id,
        "active": new_status,
        "message": f"Offer {'activated' if new_status else 'deactivated'}"
    }


@router.delete("/offers/delete/{offer_id}")
def delete_offer(offer_id: str, admin=Depends(verify_admin_token)):
    """Permanently delete an offer."""
    db = get_db()
    result = db["offers"].delete_one({"offer_id": offer_id, "store_id": admin["store_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Offer not found")
    return {"status": "success", "message": f"Offer {offer_id} deleted"}


# ══════════════════════════════════════════════════════════
#  COUPONS
# ══════════════════════════════════════════════════════════

@router.post("/coupons/create")
def create_coupon(data: dict, admin=Depends(verify_admin_token)):
    """
    Create a discount coupon.
    Admin JWT required.

    Payload:
    {
      "code": "SAVE20",                   // unique, auto-uppercased
      "title": "Flat ₹20 off",
      "description": "On orders above ₹200",
      "discount_type": "flat",            // "flat" or "percent"
      "discount_value": 20,               // ₹20 off  (or 20% if type=percent)
      "max_discount_cap": null,           // max ₹ cap when type=percent (null = no cap)
      "min_order_amount": 200,            // minimum cart value to apply coupon
      "max_uses": 500,                    // total usage limit (null = unlimited)
      "per_user_limit": 1,                // how many times same user can use it
      "target_users": [],                 // [] = global; ["USR123"] = specific users only
      "expires_at": "2025-12-31T23:59:59" // null = no expiry
    }
    """
    db = get_db()

    code = (data.get("code") or "").strip().upper()
    if not code:
        return {"status": "error", "message": "Coupon code is required"}

    discount_type = data.get("discount_type", "flat")
    if discount_type not in ("flat", "percent"):
        return {"status": "error", "message": "discount_type must be 'flat' or 'percent'"}

    discount_value = data.get("discount_value")
    if discount_value is None or float(discount_value) <= 0:
        return {"status": "error", "message": "discount_value must be a positive number"}

    if discount_type == "percent" and float(discount_value) > 100:
        return {"status": "error", "message": "Percent discount cannot exceed 100"}

    # Unique code check (across all stores)
    if db["coupons"].find_one({"code": code}):
        return {"status": "error", "message": f"Coupon code '{code}' already exists"}

    doc = {
        "code": code,
        "title": data.get("title", ""),
        "description": data.get("description", ""),
        "discount_type": discount_type,
        "discount_value": float(discount_value),
        "max_discount_cap": data.get("max_discount_cap"),
        "min_order_amount": float(data.get("min_order_amount", 0)),
        "max_uses": data.get("max_uses"),            # None = unlimited
        "per_user_limit": int(data.get("per_user_limit", 1)),
        "target_users": data.get("target_users", []),  # [] = global
        "used_count": 0,
        "active": True,
        "expires_at": data.get("expires_at"),
        "created_by": admin["user_id"],
        "store_id": admin["store_id"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }

    db["coupons"].insert_one(doc)

    return {
        "status": "success",
        "message": "Coupon created successfully",
        "code": code
    }


@router.get("/coupons/all")
def get_all_coupons(admin=Depends(verify_admin_token)):
    """
    List all coupons for this store, with live usage stats.
    Sorted by created_at descending.
    """
    db = get_db()
    coupons = list(
        db["coupons"].find({"store_id": admin["store_id"]}, {"_id": 0}).sort("created_at", -1)
    )
    now = datetime.utcnow().isoformat()

    for c in coupons:
        c["is_expired"] = bool(c.get("expires_at") and c["expires_at"] < now)
        c["remaining_uses"] = (
            (c["max_uses"] - c["used_count"])
            if c.get("max_uses") is not None
            else None  # unlimited
        )

    return {
        "status": "success",
        "count": len(coupons),
        "coupons": _clean(coupons)
    }


@router.put("/coupons/update/{code}")
def update_coupon(code: str, data: dict, admin=Depends(verify_admin_token)):
    """
    Update coupon details.
    Updatable: title, description, discount_type, discount_value,
               max_discount_cap, min_order_amount, max_uses,
               per_user_limit, target_users, expires_at
    Note: 'code' itself cannot be changed (delete + recreate instead).
    """
    db = get_db()
    code = code.upper()
    coupon = db["coupons"].find_one({"code": code, "store_id": admin["store_id"]})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    allowed_fields = {
        "title", "description", "discount_type", "discount_value",
        "max_discount_cap", "min_order_amount", "max_uses",
        "per_user_limit", "target_users", "expires_at"
    }
    updates = {k: v for k, v in data.items() if k in allowed_fields}

    if not updates:
        return {"status": "error", "message": "No valid fields to update"}

    # Validate discount fields if changed
    if "discount_type" in updates and updates["discount_type"] not in ("flat", "percent"):
        return {"status": "error", "message": "discount_type must be 'flat' or 'percent'"}

    updates["updated_at"] = datetime.utcnow().isoformat()
    db["coupons"].update_one({"code": code}, {"$set": updates})

    return {"status": "success", "message": "Coupon updated", "updated_fields": list(updates.keys())}


@router.patch("/coupons/toggle/{code}")
def toggle_coupon(code: str, admin=Depends(verify_admin_token)):
    """Flip active ↔ inactive for a coupon."""
    db = get_db()
    code = code.upper()
    coupon = db["coupons"].find_one({"code": code, "store_id": admin["store_id"]})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    new_status = not coupon.get("active", True)
    db["coupons"].update_one(
        {"code": code},
        {"$set": {"active": new_status, "updated_at": datetime.utcnow().isoformat()}}
    )

    return {
        "status": "success",
        "code": code,
        "active": new_status,
        "message": f"Coupon {'activated' if new_status else 'deactivated'}"
    }


@router.delete("/coupons/delete/{code}")
def delete_coupon(code: str, admin=Depends(verify_admin_token)):
    """Permanently delete a coupon and its usage records."""
    db = get_db()
    code = code.upper()
    result = db["coupons"].delete_one({"code": code, "store_id": admin["store_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Coupon not found")

    # Clean up usage records too
    db["coupon_uses"].delete_many({"code": code})

    return {"status": "success", "message": f"Coupon {code} and its usage records deleted"}


@router.get("/coupons/usage/{code}")
def get_coupon_usage(code: str, admin=Depends(verify_admin_token)):
    """
    Detailed usage analytics for a specific coupon.
    Returns: total uses, unique users, total discount given, recent uses list.
    """
    db = get_db()
    code = code.upper()

    coupon = db["coupons"].find_one({"code": code, "store_id": admin["store_id"]}, {"_id": 0})
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    uses = list(db["coupon_uses"].find({"code": code}, {"_id": 0}).sort("used_at", -1))

    total_discount = sum(u.get("discount_applied", 0) for u in uses)
    unique_users = len(set(u["user_id"] for u in uses))

    return {
        "status": "success",
        "code": code,
        "coupon": _clean(coupon),
        "stats": {
            "total_uses": len(uses),
            "unique_users": unique_users,
            "total_discount_given": round(total_discount, 2),
            "remaining_uses": (
                (coupon["max_uses"] - coupon["used_count"])
                if coupon.get("max_uses") is not None else None
            )
        },
        "recent_uses": _clean(uses[:20])   # last 20 uses
    }
