# routers/user.py
"""
User-facing APIs:
  - GET  /user/profile/{user_id}
  - PUT  /user/profile/{user_id}
  - GET  /user/receipts/{user_id}           → list all receipts/orders
  - GET  /user/receipt/{order_id}           → single receipt detail
  - GET  /user/orders/{user_id}             → list previous orders
  - POST /user/report-issue                 → report a problem
  - POST /user/rate                         → submit rating & review
  - GET  /user/ratings/{user_id}            → list user's ratings
"""

from fastapi import APIRouter, HTTPException
from utils.db import get_db
from datetime import datetime
from bson import ObjectId

router = APIRouter(prefix="/user", tags=["User"])


def _clean(obj):
    if isinstance(obj, list):
        return [_clean(i) for i in obj]
    if isinstance(obj, dict):
        return {k: _clean(v) for k, v in obj.items()}
    if isinstance(obj, ObjectId):
        return str(obj)
    return obj


# ─────────────────────────────────────────────
# PROFILE
# ─────────────────────────────────────────────

@router.get("/profile/{user_id}")
def get_profile(user_id: str):
    db = get_db()
    user = db["users"].find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return _clean(user)


@router.put("/profile/{user_id}")
def update_profile(user_id: str, data: dict):
    """
    Updatable fields: name, phone, email
    { "name": "...", "phone": "...", "email": "..." }
    """
    db = get_db()
    allowed = {k: v for k, v in data.items() if k in ("name", "phone", "email")}
    if not allowed:
        return {"error": "No valid fields to update"}
    db["users"].update_one({"user_id": user_id}, {"$set": allowed})
    return {"status": "success", "updated": allowed}


# ─────────────────────────────────────────────
# RECEIPTS
# ─────────────────────────────────────────────

@router.get("/receipts/{user_id}")
def get_receipts(user_id: str):
    """Return all past receipts for a user (summary list)."""
    db = get_db()
    orders = list(
        db["orders"].find(
            {"user_id": user_id, "payment_status": "paid"},
            {"_id": 0}
        ).sort("created_at", -1)
    )
    return {"receipts": _clean(orders)}


@router.get("/receipt/{order_id}")
def get_receipt_detail(order_id: str):
    """Full receipt / order details."""
    db = get_db()
    order = db["orders"].find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return _clean(order)


# ─────────────────────────────────────────────
# ORDER HISTORY
# ─────────────────────────────────────────────

@router.get("/orders/{user_id}")
def get_order_history(user_id: str):
    """All orders (any status) for a user, newest first."""
    db = get_db()
    orders = list(
        db["orders"].find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)
    )
    return {"orders": _clean(orders), "total": len(orders)}


# ─────────────────────────────────────────────
# REPORT ISSUE
# ─────────────────────────────────────────────

@router.post("/report-issue")
def report_issue(data: dict):
    """
    {
      "user_id": "USR123",
      "subject": "App | Cart | Supermarket",   // free text category
      "description": "...",
      "order_id": "ORD..."                       // optional
    }
    """
    db = get_db()
    user_id = data.get("user_id")
    subject = data.get("subject", "").strip()
    description = data.get("description", "").strip()

    if not user_id or not subject or not description:
        return {"error": "user_id, subject, and description are required"}

    issue_id = f"ISS{int(datetime.utcnow().timestamp())}"
    doc = {
        "issue_id": issue_id,
        "user_id": user_id,
        "subject": subject,
        "description": description,
        "order_id": data.get("order_id"),
        "status": "open",          # open | in_progress | resolved
        "created_at": datetime.utcnow().isoformat(),
        "resolved_at": None,
        "admin_response": None
    }
    db["issues"].insert_one(doc)
    return {"status": "reported", "issue_id": issue_id}


@router.get("/issues/{user_id}")
def get_user_issues(user_id: str):
    """List all issues reported by a user."""
    db = get_db()
    issues = list(db["issues"].find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1))
    return {"issues": _clean(issues)}


# ─────────────────────────────────────────────
# RATINGS & REVIEWS
# ─────────────────────────────────────────────

@router.post("/rate")
def submit_rating(data: dict):
    """
    Submit a rating for app / cart / supermarket.
    {
      "user_id": "USR123",
      "target_type": "app | cart | supermarket",
      "target_id": "CART102 | STORE001 | null",  // null for app
      "rating": 4,                                 // 1-5
      "review": "Great experience!"
    }
    """
    db = get_db()
    user_id = data.get("user_id")
    target_type = data.get("target_type")
    rating = data.get("rating")
    review = data.get("review", "")

    if not user_id or not target_type or rating is None:
        return {"error": "user_id, target_type, and rating are required"}

    if not (1 <= int(rating) <= 5):
        return {"error": "Rating must be between 1 and 5"}

    valid_types = ("app", "cart", "supermarket")
    if target_type not in valid_types:
        return {"error": f"target_type must be one of {valid_types}"}

    # Check if user already rated this target in this session
    target_id = data.get("target_id")
    existing = db["ratings"].find_one({"user_id": user_id, "target_type": target_type, "target_id": target_id})

    rating_doc = {
        "user_id": user_id,
        "target_type": target_type,
        "target_id": target_id,
        "rating": int(rating),
        "review": review,
        "updated_at": datetime.utcnow().isoformat()
    }

    if existing:
        db["ratings"].update_one(
            {"user_id": user_id, "target_type": target_type, "target_id": target_id},
            {"$set": rating_doc}
        )
        return {"status": "updated", "message": "Rating updated"}
    else:
        rating_doc["created_at"] = datetime.utcnow().isoformat()
        db["ratings"].insert_one(rating_doc)
        return {"status": "submitted", "message": "Rating submitted successfully"}


@router.get("/ratings/{user_id}")
def get_user_ratings(user_id: str):
    """Get all ratings submitted by a user."""
    db = get_db()
    ratings = list(db["ratings"].find({"user_id": user_id}, {"_id": 0}).sort("updated_at", -1))
    return {"ratings": _clean(ratings)}


@router.get("/ratings/target/{target_type}/{target_id}")
def get_target_ratings(target_type: str, target_id: str):
    """Get all ratings for a specific target (e.g. a store or cart)."""
    db = get_db()
    ratings = list(db["ratings"].find({"target_type": target_type, "target_id": target_id}, {"_id": 0}))
    if not ratings:
        return {"average": None, "count": 0, "ratings": []}
    avg = round(sum(r["rating"] for r in ratings) / len(ratings), 2)
    return {"average": avg, "count": len(ratings), "ratings": _clean(ratings)}
