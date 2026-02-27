from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.cart_monitor_service import (
    get_live_carts,
    get_cart_details,
    get_cart_detections,
    get_weight_events,
    force_close_cart
)

router = APIRouter(prefix="/admin/carts", tags=["Admin Cart Monitoring"])


# --------------------------------------------------
# LIVE CARTS
# --------------------------------------------------

@router.get("/live")
def live_carts(admin=Depends(verify_admin_token)):
    carts = get_live_carts(admin["store_id"])

    return {
        "status": "success",
        "count": len(carts),
        "carts": carts
    }


# --------------------------------------------------
# CART DETAILS
# --------------------------------------------------

@router.get("/{cart_id}")
def cart_details(cart_id: str, admin=Depends(verify_admin_token)):
    cart = get_cart_details(admin["store_id"], cart_id)

    if not cart:
        return {"status": "error", "message": "Cart not found"}

    return {"status": "success", "cart": cart}


# --------------------------------------------------
# CART DETECTIONS
# --------------------------------------------------

@router.get("/{cart_id}/detections")
def cart_detections(cart_id: str, admin=Depends(verify_admin_token)):
    data = get_cart_detections(admin["store_id"], cart_id)
    return {"status": "success", "detections": data}


# --------------------------------------------------
# CART WEIGHT EVENTS
# --------------------------------------------------

@router.get("/{cart_id}/weight-events")
def cart_weight_events(cart_id: str, admin=Depends(verify_admin_token)):
    data = get_weight_events(admin["store_id"], cart_id)
    return {"status": "success", "weight_events": data}


# --------------------------------------------------
# FORCE CLOSE CART
# --------------------------------------------------

@router.post("/{cart_id}/force-close")
def close_cart(cart_id: str, admin=Depends(verify_admin_token)):
    modified = force_close_cart(admin["store_id"], cart_id)

    if modified == 0:
        return {"status": "error", "message": "Cart not found"}

    return {"status": "success", "message": "Cart force closed"}