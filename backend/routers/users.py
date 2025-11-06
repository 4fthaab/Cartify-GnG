from fastapi import APIRouter
from utils.db import get_db
from datetime import datetime

router = APIRouter(prefix="/shopping-list", tags=["Shopping List"])

@router.post("/create")
def create_shopping_list(payload: dict):
    """
    Create or update a user's shopping list.
    Expected format:
    {
        "user_id": "U123",
        "list_id": "u123li1",
        "items": [
            {"name": "Apple"},
            {"name": "Banana"},
            {"name": "Brush"}
        ]
    }
    """
    db = get_db()

    # Basic validation
    if not payload.get("user_id") or not payload.get("items"):
        return {"error": "Missing required fields"}

    payload["created_at"] = datetime.utcnow().isoformat()
    payload["status"] = "pending"

    # Upsert logic: update if same list_id exists, else insert
    db["shopping_lists"].update_one(
        {"list_id": payload["list_id"], "user_id": payload["user_id"]},
        {"$set": payload},
        upsert=True
    )

    return {
        "message": "Shopping list saved successfully",
        "user_id": payload["user_id"],
        "list_id": payload["list_id"],
        "item_count": len(payload["items"])
    }

@router.get("/get/{user_id}")
def get_user_lists(user_id: str):
    db = get_db()
    lists = list(db["shopping_lists"].find({"user_id": user_id}, {"_id": 0}))
    return {"shopping_lists": lists}
