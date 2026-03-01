from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.admin_rating_service import get_store_ratings

router = APIRouter(prefix="/admin/ratings", tags=["Admin Ratings"])


@router.get("/store")
def store_ratings(admin=Depends(verify_admin_token)):
    data = get_store_ratings(admin["store_id"])
    return {"status": "success", **data}