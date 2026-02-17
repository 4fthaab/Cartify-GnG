from fastapi import APIRouter, HTTPException
from services.matcher import match_items
from services.path_optimizer import optimize_path
from utils.db import get_db

router = APIRouter(prefix="/path", tags=["Path Optimization"])


@router.post("/generate")
def generate_path(payload: dict):
    """
    Generate optimized shopping path for a user's list.
    Input example:
    {
        "user_id": "USR496713",
        "store_id": "STORE001",
        "list_id": "USR496713_L1762692068"
    }
    """
    user_id = payload.get("user_id")
    list_id = payload.get("list_id")
    store_id = payload.get("store_id")
    
    print("Using new optimizer")

    if not user_id or not list_id:
        raise HTTPException(status_code=400, detail="Missing user_id or list_id")

    db = get_db()
    shopping_list = db["shopping_lists"].find_one({"user_id": user_id, "list_id": list_id})

    if not shopping_list or not shopping_list.get("items"):
        raise HTTPException(status_code=404, detail="No shopping list found or list empty")

    user_items = shopping_list["items"]

    store_id = payload.get("store_id")
    if not store_id:
        raise HTTPException(status_code=400, detail="Missing store_id")

    layout_doc = db["store_layouts"].find_one({"store_id": store_id})
    layout = layout_doc
    if not layout:
        raise HTTPException(status_code=404, detail="Store layout not found")

    matched = match_items(user_items, store_id)

    normalized_items = [
        {
            "item_id": it["item_id"],
            "rack_id": it["rack_id"],
            "position_index": it["position_index"],
        }
        for it in matched["matched_items"]
    ]

    optimized = optimize_path(normalized_items, layout)

    return {
        "matched_items": matched["matched_items"],
        "not_found": matched["not_found"],
        "optimized_path": optimized,
    }


