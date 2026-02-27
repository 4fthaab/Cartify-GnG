from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.store_service import get_store_by_id, update_store_details

router = APIRouter(prefix="/admin/store", tags=["Admin Store"])

# -------------------------------------------------
# GET STORE DETAILS
# -------------------------------------------------

@router.get("/", dependencies=[Depends(verify_admin_token)])
def get_store(admin=Depends(verify_admin_token)):
    store = get_store_by_id(admin["store_id"])

    if not store:
        return {"status": "error", "message": "Store not found"}

    return {
        "status": "success",
        "store": store
    }

# -------------------------------------------------
# UPDATE STORE DETAILS
# -------------------------------------------------

@router.put("/update")
def update_store(data: dict, admin=Depends(verify_admin_token)):
    modified = update_store_details(admin["store_id"], data)

    if modified == 0:
        return {"status": "error", "message": "No changes made"}

    return {
        "status": "success",
        "message": "Store updated successfully"
    }