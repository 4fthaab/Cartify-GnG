from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.order_service import (
    get_all_orders,
    get_order_by_id,
    get_receipt_by_order,
    get_payments_for_store
)

router = APIRouter(prefix="/admin/orders", tags=["Admin Orders"])


# --------------------------------------------------
# ALL ORDERS
# --------------------------------------------------

@router.get("/")
def all_orders(admin=Depends(verify_admin_token)):
    data = get_all_orders(admin["store_id"])

    return {
        "status": "success",
        "count": len(data),
        "orders": data
    }


# --------------------------------------------------
# SINGLE ORDER
# --------------------------------------------------

@router.get("/{order_id}")
def order_details(order_id: str, admin=Depends(verify_admin_token)):
    order = get_order_by_id(admin["store_id"], order_id)

    if not order:
        return {"status": "error", "message": "Order not found"}

    return {"status": "success", "order": order}


# --------------------------------------------------
# RECEIPT
# --------------------------------------------------

@router.get("/{order_id}/receipt")
def order_receipt(order_id: str, admin=Depends(verify_admin_token)):
    receipt = get_receipt_by_order(admin["store_id"], order_id)

    if not receipt:
        return {"status": "error", "message": "Receipt not found"}

    return {"status": "success", "receipt": receipt}


# --------------------------------------------------
# PAYMENTS
# --------------------------------------------------

@router.get("/payments/all")
def store_payments(admin=Depends(verify_admin_token)):
    payments = get_payments_for_store(admin["store_id"])

    return {
        "status": "success",
        "count": len(payments),
        "payments": payments
    }