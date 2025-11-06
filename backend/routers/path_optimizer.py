from fastapi import APIRouter, HTTPException
from services.matcher import match_items
from services.optimizer import optimize_path
from utils.db import get_db

router = APIRouter(prefix="/path", tags=["Path Optimization"])


@router.post("/generate")
def generate_path(payload: dict):
    """
    Generate optimized shopping path for a user's list.
    Input example:
    {
        "user_id": "U123",
        "store_id": "STORE001",
        "list_id": "U123L1"
    }
    """
    user_id = payload.get("user_id")
    list_id = payload.get("list_id")

    if not user_id or not list_id:
        raise HTTPException(status_code=400, detail="Missing user_id or list_id")

    db = get_db()
    shopping_list = db["shopping_lists"].find_one({"user_id": user_id, "list_id": list_id})

    if not shopping_list or not shopping_list.get("items"):
        raise HTTPException(status_code=404, detail="No shopping list found or list empty")

    user_items = shopping_list["items"]

    print("🧾 User shopping list:", user_items)

    matched = match_items(user_items)
    optimized = optimize_path(matched["matched_items"])

    return {
        "matched_items": matched["matched_items"],
        "not_found": matched["not_found"],
        "optimized_path": optimized["optimized_path"]
    }
