from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.dashboard_service import get_dashboard_summary

router = APIRouter(prefix="/admin/dashboard", tags=["Admin Dashboard"])

@router.get("/summary")
def dashboard_summary(admin=Depends(verify_admin_token)):
    data = get_dashboard_summary(admin["store_id"])

    return {
        "status": "success",
        "summary": data
    }