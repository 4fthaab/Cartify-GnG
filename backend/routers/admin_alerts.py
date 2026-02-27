from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.alert_service import (
    get_all_alerts,
    get_open_alerts,
    get_alert_by_id,
    resolve_alert,
    get_alerts_for_cart
)

router = APIRouter(prefix="/admin/alerts", tags=["Admin Alerts"])


# --------------------------------------------------
# ALL ALERTS
# --------------------------------------------------

@router.get("/")
def all_alerts(admin=Depends(verify_admin_token)):
    alerts = get_all_alerts(admin["store_id"])

    return {
        "status": "success",
        "count": len(alerts),
        "alerts": alerts
    }


# --------------------------------------------------
# OPEN ALERTS ONLY
# --------------------------------------------------

@router.get("/open")
def open_alerts(admin=Depends(verify_admin_token)):
    alerts = get_open_alerts(admin["store_id"])

    return {
        "status": "success",
        "count": len(alerts),
        "alerts": alerts
    }


# --------------------------------------------------
# SINGLE ALERT
# --------------------------------------------------

@router.get("/{alert_id}")
def alert_details(alert_id: str, admin=Depends(verify_admin_token)):
    alert = get_alert_by_id(admin["store_id"], alert_id)

    if not alert:
        return {"status": "error", "message": "Alert not found"}

    return {"status": "success", "alert": alert}


# --------------------------------------------------
# RESOLVE ALERT
# --------------------------------------------------

@router.post("/{alert_id}/resolve")
def mark_resolved(alert_id: str, admin=Depends(verify_admin_token)):
    modified = resolve_alert(
        admin["store_id"],
        alert_id,
        admin["user_id"]
    )

    if modified == 0:
        return {"status": "error", "message": "Alert not found"}

    return {"status": "success", "message": "Alert resolved"}


# --------------------------------------------------
# ALERTS FOR CART
# --------------------------------------------------

@router.get("/cart/{cart_id}")
def alerts_by_cart(cart_id: str, admin=Depends(verify_admin_token)):
    alerts = get_alerts_for_cart(admin["store_id"], cart_id)

    return {
        "status": "success",
        "alerts": alerts
    }