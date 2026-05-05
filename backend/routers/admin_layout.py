# admin_layout.py
from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.layout_service import get_layout, save_layout

router = APIRouter(prefix="/admin/layout", tags=["Admin Layout"])

@router.get("/")
def fetch_layout(admin=Depends(verify_admin_token)):
    layout = get_layout(admin["store_id"])

    if not layout:
        return {
            "status": "success",
            "layout": None
        }

    # Reverted: Just send the flat layout document directly!
    return {
        "status": "success",
        "layout": layout 
    }

@router.post("/save")
def store_layout(payload: dict, admin=Depends(verify_admin_token)):
    save_layout(admin["store_id"], payload)

    return {
        "status": "success",
        "message": "Layout saved successfully"
    }