# routers/mock_payment.py - FIXED VERSION
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
        "status": "pending",   # pending / success / failed
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
def complete_payment(payload: dict):
    """
    FIXED VERSION:
    1. Update payment status
    2. Update order status
    3. Award loyalty points
    4. Deduct stock
    5. CLEAR cart items (now that payment is complete)
    6. Unlock cart
    7. Add receipt to user
    """
    from utils.db import get_db
    from utils.cart_utils import unlock_cart
    from datetime import datetime

    db = get_db()
    payment_id = payload.get("payment_id")
    status = payload.get("status", "failed")
    method = payload.get("method", "upi")
    payer_ref = payload.get("payer_ref")
    
    if not payment_id:
        return {"error": "payment_id required"}

    # Find payment record
    payment_doc = db["payments"].find_one({"payment_id": payment_id})
    if not payment_doc:
        return {"error": "Invalid payment_id"}

    order_id = payment_doc.get("order_id")
    order_doc = db["orders"].find_one({"order_id": order_id})
    
    if not order_doc:
        return {"error": "Order not found for payment"}
    
    user_id = order_doc.get("user_id")
    cart_id = order_doc.get("cart_id")

    # Update mock payment status
    db["payments"].update_one(
        {"payment_id": payment_id},
        {"$set": {
            "status": status,
            "user_id": user_id,
            "method": method,
            "payer_ref": payer_ref,
            "completed_at": datetime.utcnow().isoformat()
        }}
    )

    if status == "success":
        # 1. Fetch the order to get total_price
        total_price = order_doc.get("total_price", 0)
        
        # 2. Calculate points (2% of total price)
        points_earned = int(total_price * 0.02)

        # 3. Update the user's loyalty points
        if user_id:
            db["users"].update_one(
                {"user_id": user_id},
                {"$inc": {"loyalty_points": points_earned}}
            )

        # 4. Update order status and payment details
        db["orders"].update_one(
            {"order_id": order_id},
            {"$set": {
                "status": "completed",
                "payment_status": "paid",
                "payment_method": method,
                "paid_at": datetime.utcnow().isoformat(),
                "payer_ref": payer_ref,
                "points_awarded": points_earned
            }}
        )
        
        # 5. Deduct stock
        try:
            from services.inventory_updater import deduct_stock_after_payment
            stock_result = deduct_stock_after_payment(order_doc)
        except Exception as e:
            stock_result = {"error": str(e)}

        # 6. NOW clear cart items and unlock (payment is complete)
        if cart_id:
            db["carts"].update_one(
                {"cart_id": cart_id},
                {
                    "$set": {
                        "items": [],
                        "total_items": 0,
                        "total_price": 0,
                        "total_weight": 0,
                        "status": "in_use",  # Keep in_use for user to continue shopping
                        "pending_payment": False,
                    },
                    "$unset": {
                        "active_payment_id": "",
                        "active_payment_amount": "",
                        "active_order_id": "",
                        "checked_out": "",
                        "checkout_time": "",
                    }
                }
            )
            unlock_cart(cart_id)

        # 7. Add receipt to user's account
        if user_id:
            db["users"].update_one(
                {"user_id": user_id},
                {"$push": {
                    "receipts": {
                        "order_id": order_id,
                        "payment_id": payment_id,
                        "amount": total_price,
                        "method": method,
                        "status": "paid",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                }}
            )

        return {
            "message": "Payment successful",
            "order_id": order_id,
            "cart_id": cart_id,
            "payment_id": payment_id,
            "status": "paid",
            "points_earned": points_earned,
            "stock_update": stock_result
        }

    else:
        # Payment failed path
        db["orders"].update_one(
            {"order_id": order_id},
            {"$set": {"status": "payment_failed", "payment_status": "failed"}}
        )
        
        # Unlock cart but keep items so user can retry
        if cart_id:
            db["carts"].update_one(
                {"cart_id": cart_id},
                {
                    "$set": {
                        "status": "in_use",
                        "pending_payment": False,
                    },
                    "$unset": {
                        "active_payment_id": "",
                        "active_payment_amount": "",
                        "active_order_id": "",
                        "checked_out": "",
                        "checkout_time": "",
                    }
                }
            )
            unlock_cart(cart_id)
        
        return {"message": "Payment failed", "order_id": order_id, "status": "failed"}
