# routers/mock_payment.py
from fastapi import APIRouter, Body
from datetime import datetime
import uuid
from utils.db import get_db
from bson import ObjectId

router = APIRouter(prefix="/mock-payment", tags=["Mock Payment"])

def convert_objectid(obj):
    if isinstance(obj, list):
        return [convert_objectid(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    return obj

@router.post("/create")
def create_payment_session(payload: dict = Body(...)):
    """
    Create a mock payment session for an order/cart.
    payload: {
      "order_id": "ORD123"          # optional, but recommended
      "cart_id": "CART102"         # optional if order_id present
      "amount": 145.50,
      "currency": "INR",           # default INR
      "return_url": "https://..."  # optional, frontend callback URL
    }
    Response contains payment_id and qr_payload string (render into QR).
    """
    db = get_db()
    order_id = payload.get("order_id")
    cart_id = payload.get("cart_id")
    amount = payload.get("amount")
    currency = payload.get("currency", "INR")
    return_url = payload.get("return_url")

    if not amount and not order_id and not cart_id:
        return {"error": "Provide amount or order_id/cart_id to create payment session"}

    # If only order_id or cart_id supplied, try to derive amount from DB
    if not amount:
        if order_id:
            order = db["orders"].find_one({"order_id": order_id})
            if order:
                amount = order.get("total_price", 0)
        elif cart_id:
            cart = db["carts"].find_one({"cart_id": cart_id})
            if cart:
                amount = cart.get("total_price", 0)

    # create payment session
    payment_id = f"PAY_{uuid.uuid4().hex[:12]}"
    qr_payload = f"mockpay://pay?payment_id={payment_id}&amount={amount}&currency={currency}"

    payment_doc = {
        "payment_id": payment_id,
        "order_id": order_id,
        "cart_id": cart_id,
        "amount": amount,
        "currency": currency,
        "status": "pending",   # pending / paid / failed
        "created_at": datetime.utcnow().isoformat(),
        "return_url": return_url
    }
    db["payments"].insert_one(payment_doc)

    return {
        "payment_id": payment_id,
        "amount": amount,
        "currency": currency,
        "status": "pending",
        "qr_payload": qr_payload,
        "instructions": "Render qr_payload as a QR. Scan from mock GPay clone to complete."
    }

@router.get("/status/{payment_id}")
def payment_status(payment_id: str):
    """Poll payment status"""
    db = get_db()
    p = db["payments"].find_one({"payment_id": payment_id}, {"_id": 0})
    if not p:
        return {"error": "payment_id not found"}
    return convert_objectid(p)

@router.post("/complete")
def complete_payment(payload: dict = Body(...)):
    """
    Simulate completing a payment (call this from mock-gpay clone or simulate click).
    payload:
    {
      "payment_id": "PAY_xxx",
      "method": "upi" | "card" | "card-debit" | "cod",
      "payer_ref": "gpay_txn_123",   # optional reference id from the mock payer app
      "status": "success" | "failed"
    }
    """
    db = get_db()
    payment_id = payload.get("payment_id")
    method = payload.get("method", "upi")
    payer_ref = payload.get("payer_ref")
    status = payload.get("status", "success")

    if not payment_id:
        return {"error": "payment_id required"}

    p = db["payments"].find_one({"payment_id": payment_id})
    if not p:
        return {"error": "payment session not found"}

    new_status = "paid" if status == "success" else "failed"
    completed_at = datetime.utcnow().isoformat()

    db["payments"].update_one(
        {"payment_id": payment_id},
        {"$set": {
            "status": new_status,
            "method": method,
            "payer_ref": payer_ref,
            "completed_at": completed_at
        }}
    )

    # Update the order/cart if linked
    order_id = p.get("order_id")
    cart_id = p.get("cart_id")
    amount = p.get("amount")

    # If order exists, update order payment info
    if order_id:
        db["orders"].update_one(
            {"order_id": order_id},
            {"$set": {
                "payment_status": "paid" if new_status == "paid" else "failed",
                "payment_id": payment_id,
                "payment_method": method
            }}
        )
        # also push receipt summary into user receipts if user_id present on order
        order = db["orders"].find_one({"order_id": order_id})
        if order and order.get("user_id"):
            user_summary = {
                "order_id": order_id,
                "amount": order.get("total_price", amount),
                "payment_method": method,
                "payment_id": payment_id,
                "checkout_time": completed_at,
                "store_id": order.get("store_id"),
                "status": "paid" if new_status == "paid" else "failed"
            }
            db["users"].update_one(
                {"user_id": order.get("user_id")},
                {"$push": {"receipts": user_summary}}
            )
    else:
        # If only cart present, try to find order (if your flow creates order after checkout, use that)
        if cart_id:
            order = db["orders"].find_one({"cart_id": cart_id})
            if order:
                db["orders"].update_one(
                    {"cart_id": cart_id},
                    {"$set": {
                        "payment_status": "paid" if new_status == "paid" else "failed",
                        "payment_id": payment_id,
                        "payment_method": method
                    }}
                )
                if order.get("user_id"):
                    user_summary = {
                        "order_id": order.get("order_id"),
                        "amount": order.get("total_price", amount),
                        "payment_method": method,
                        "payment_id": payment_id,
                        "checkout_time": completed_at,
                        "store_id": order.get("store_id"),
                        "status": "paid" if new_status == "paid" else "failed"
                    }
                    db["users"].update_one(
                        {"user_id": order.get("user_id")},
                        {"$push": {"receipts": user_summary}}
                    )

    # Optionally: call return_url by storing it and allowing frontend to poll /status
    # We won't perform external HTTP callback here — the frontend can poll /status or the order endpoint.

    return {
        "message": "payment processed (mock)",
        "payment_id": payment_id,
        "status": new_status,
        "method": method,
        "payer_ref": payer_ref
    }
