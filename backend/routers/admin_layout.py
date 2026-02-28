from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.layout_service import get_layout, save_layout

router = APIRouter(prefix="/admin/layout", tags=["Admin Layout"])


# ----------------------------------------
# GET LAYOUT
# ----------------------------------------

@router.get("/")
def fetch_layout(admin=Depends(verify_admin_token)):
    layout = get_layout(admin["store_id"])

    if not layout:
        return {
            "status": "success",
            "layout": None
        }

    return {
        "status": "success",
        "layout": layout.get("layout_data")
    }


# ----------------------------------------
# SAVE LAYOUT
# ----------------------------------------

@router.post("/save")
def store_layout(payload: dict, admin=Depends(verify_admin_token)):
    save_layout(admin["store_id"], payload)

    return {
        "status": "success",
        "message": "Layout saved successfully"
    }