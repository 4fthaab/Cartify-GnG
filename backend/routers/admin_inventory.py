from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.inventory_service import (
    get_inventory,
    get_inventory_by_item,
    add_inventory_batch,
    update_stock,
    get_stock_history
)

router = APIRouter(prefix="/admin/inventory", tags=["Admin Inventory"])


@router.get("/")
def view_inventory(admin=Depends(verify_admin_token)):
    data = get_inventory(admin["store_id"])
    return {"status": "success", "count": len(data), "inventory": data}


@router.get("/{item_id}")
def view_item_inventory(item_id: str, admin=Depends(verify_admin_token)):
    data = get_inventory_by_item(admin["store_id"], item_id)
    return {"status": "success", "inventory": data}


@router.post("/add-batch")
def add_batch(data: dict, admin=Depends(verify_admin_token)):
    add_inventory_batch(admin["store_id"], data)
    return {"status": "success", "message": "Batch added"}


@router.put("/update-stock")
def manual_stock_update(payload: dict, admin=Depends(verify_admin_token)):
    modified = update_stock(
        admin["store_id"],
        payload.get("item_id"),
        payload.get("batch_code"),
        payload.get("stock_left")
    )

    if modified == 0:
        return {"status": "error", "message": "Batch not found"}

    return {"status": "success", "message": "Stock updated"}


@router.get("/history/{item_id}")
def stock_history(item_id: str, admin=Depends(verify_admin_token)):
    history = get_stock_history(admin["store_id"], item_id)
    return {"status": "success", "history": history}