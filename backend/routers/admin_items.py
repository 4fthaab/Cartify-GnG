from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.item_service import (
    get_all_items,
    create_item,
    update_item,
    delete_item
)

router = APIRouter(prefix="/admin/items", tags=["Admin Items"])

# --------------------------------------------------
# GET ALL ITEMS
# --------------------------------------------------

@router.get("/")
def get_items(admin=Depends(verify_admin_token)):
    items = get_all_items(admin["store_id"])

    return {
        "status": "success",
        "count": len(items),
        "items": items
    }


# --------------------------------------------------
# CREATE ITEM
# --------------------------------------------------

@router.post("/create")
def create_new_item(data: dict, admin=Depends(verify_admin_token)):
    success, message = create_item(admin["store_id"], data)

    if not success:
        return {"status": "error", "message": message}

    return {"status": "success", "message": message}


# --------------------------------------------------
# UPDATE ITEM
# --------------------------------------------------

@router.put("/update/{item_id}")
def update_existing_item(item_id: str, data: dict, admin=Depends(verify_admin_token)):
    modified = update_item(admin["store_id"], item_id, data)

    if modified == 0:
        return {"status": "error", "message": "Item not found or no change"}

    return {"status": "success", "message": "Item updated successfully"}


@router.delete("/delete/{item_id}")
def remove_item(item_id: str, admin=Depends(verify_admin_token)):
    deleted = delete_item(admin["store_id"], item_id)

    if deleted == 0:
        return {"status": "error", "message": "Item not found"}

    return {"status": "success", "message": "Item deactivated successfully"}