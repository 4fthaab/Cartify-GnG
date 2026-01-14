from fastapi import APIRouter, HTTPException
from services.matcher import match_items
from services.optimizer_v1 import optimize_path as optimize_path_v1
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

    store_id = payload.get("store_id")
    if not store_id:
        raise HTTPException(status_code=400, detail="Missing store_id")

    layout = db["store_layouts"].find_one({"store_id": store_id})
    if not layout:
        raise HTTPException(status_code=404, detail="Store layout not found")

    matched = match_items(user_items)

    # 🔧 TEMP ADAPTER (THIS IS THE KEY PART)
    normalized_items = []

    for it in matched["matched_items"]:
        # New schema (future)
        if "rack_id" in it and "position_index" in it:
            normalized_items.append({
                "item_id": it["item_id"],
                "name": it["name"],
                "rack_id": it["rack_id"],
                "position_index": it["position_index"],
            })

        # Old schema (current DB)
        elif "rack" in it and "col" in it:
            normalized_items.append({
                "item_id": it["item_id"],
                "name": it["name"],
                "rack_id": it["rack"],        # TEMP mapping
                "position_index": it["col"],  # TEMP mapping
            })

    # ✅ CALL THE NEW OPTIMIZER
    optimized = optimize_path_v1(
        items=normalized_items,
        store_layout=layout,
        start_position=(0, 0)
    )

    return {
        "matched_items": matched["matched_items"],
        "not_found": matched["not_found"],
        "optimized_path": optimized["optimized_path"],
    }

