# routers/cart.py
from fastapi import APIRouter,HTTPException
from utils.db import get_db
from datetime import datetime,timedelta
import uuid
from fastapi.responses import JSONResponse
from services.matcher import match_items
from services.verifier import decide_match, decide_removal
import pdfkit
from bson import ObjectId
from utils.cart_utils import is_cart_locked,lock_cart
from services.location_service import update_location_from_marker,update_location_from_item

def convert_objectid(obj):
    """Recursively convert ObjectId and nested values to strings for JSON-safe responses."""
    if isinstance(obj, list):
        return [convert_objectid(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_objectid(v) for k, v in obj.items()}
    elif isinstance(obj, ObjectId):
        return str(obj)
    else:
        return obj

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.post("/login")
def cart_login(payload: dict):
    """
    Assign an available cart to a user for this shopping session.
    Expected payload:
    {
        "user_id": "USR496713",
        "store_id": "STORE001",
        "cart_id": "CART103"
    }
    """
    db = get_db()
    user_id = payload.get("user_id")
    store_id = payload.get("store_id")
    cart_id = payload.get("cart_id")

    if not user_id:
        return {"error": "Missing user_id"}

    # Step 1: Find and lock the cart
    if cart_id:
        # User scanned a specific cart
        cart = db["carts"].find_one_and_update(
            {"cart_id": cart_id, "status": "available", "locked": False},
            {"$set": {"status": "in_use", "locked": False, "last_used": datetime.utcnow().isoformat()}}
        )
        if not cart:
            return {"error": "Cart is not available or already in use."}
    else:
        # Auto-assign a random cart
        cart = db["carts"].find_one_and_update(
            {"store_id": store_id, "status": "available", "locked": False},
            {"$set": {"status": "in_use", "locked": False, "last_used": datetime.utcnow().isoformat()}}
        )
        if not cart:
            return {"error": "No available carts right now. Please wait."}
        cart_id = cart["cart_id"]

    # Step 2: Create session variables
    session_id = f"{cart_id}_SESS_{uuid.uuid4().hex[:6].upper()}"
    session_doc = {
        "session_id": session_id,
        "user_id": user_id,
        "login_time": datetime.utcnow().isoformat(),
        "checkout_time": None,
        "items": [],
        "total_items": 0,
        "total_price": 0,
        "total_weight": 0,
        "shopping_list_id": None
    }

    # Step 3: Update cart with current session and lock status
    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {"current_session": session_doc, "store_id": store_id , "linked_user_id": user_id}}
    )

    return {
        "message": "Cart assigned successfully",
        "cart_id": cart_id,
        "session_id": session_id,
        "store_id": store_id,
        "user_id": user_id,
        "status": "in_use"
    }
    
@router.get("/status/{cart_id}")
async def get_cart_status(cart_id: str):
    db = get_db()

    cart = db["carts"].find_one({"cart_id": cart_id})

    if not cart:
        return {"error": "Cart not found"}

    # If cart not in use
    if cart.get("status") != "in_use" or not cart.get("linked_user_id"):
        return {"assigned": False}

    return {
        "assigned": True,
        "user": {
            "user_id": cart.get("linked_user_id"),
            "session_id": cart.get("current_session", {}).get("session_id"),
            "login_time": cart.get("current_session", {}).get("login_time")
        }
    }

@router.get("/session/{cart_id}")
def get_cart_session(cart_id: str):
    db = get_db()
    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart or "current_session" not in cart:
        return {"error": "No active session"}
    return cart["current_session"]

# ==========================================================
# UNIFIED CART EVENT (ADD + REMOVE)
# ==========================================================
@router.post("/event")
def cart_event(payload: dict):
    """
    {
        "cart_id": "CART103",
        "event_type": "add" | "remove",
        "detected_label": "Orange",
        "camera_confidence": 0.93,
        "weight_delta_g": 500,
        "cart_total_weight_g": 500
    }
    """
    db = get_db()

    cart_id = payload.get("cart_id")
    event_type = payload.get("event_type")
    label = payload.get("detected_label")
    confidence = payload.get("camera_confidence", 0.0)
    weight_delta = payload.get("weight_delta_g")
    new_total_weight = payload.get("cart_total_weight_g")

    if is_cart_locked(cart_id):
        return {"error": "Cart is locked. Checkout in progress or completed."}

    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart:
        return {"error": "Cart not found"}

    store_id = cart.get("store_id")
    if not store_id:
        return {"error": "Cart missing store_id"}

    # ------------------------------------------------------
    # MATCH LABEL TO STORE ITEMS
    # ------------------------------------------------------
    candidates_res = match_items([{"name": label}], store_id)
    candidates = candidates_res.get("matched_items", [])

    event_id = str(uuid.uuid4())

    # ------------------------------------------------------
    # HANDLE ADD EVENT
    # ------------------------------------------------------
    if event_type == "add":

        detection_doc = {
            "event_id": event_id,
            "cart_id": cart_id,
            "type": "add",
            "detected_label": label,
            "camera_confidence": confidence,
            "candidate_items": candidates,
            "weight_delta_g": weight_delta,
            "cart_total_weight_g": new_total_weight,
            "timestamp": datetime.utcnow().isoformat(),
            "status": "processing"
        }

        result = decide_match({
            "candidate_items": candidates,
            "camera_confidence": confidence,
            "weight_readings": [weight_delta]
        })

        if result.get("status") != "verified":
            detection_doc["status"] = result.get("status")
            db["detections"].insert_one(detection_doc)
            return {"status": result.get("status"), "candidates": result.get("candidates", [])}

        matched_item = result.get("matched_item")
        weight_type = matched_item.get("weight_type", "fixed")

        # ---- price calculation ----
        if weight_type == "variable":
            item_weight_g = weight_delta
            price_per_kg = matched_item.get("unit_price_per_kg", 0)
            item_price = round((item_weight_g / 1000) * price_per_kg, 2)
        else:
            item_weight_g = matched_item.get("weight_g", 0)
            item_price = matched_item.get("price", 0)

        cart_item = {
            "item_id": matched_item.get("item_id"),
            "name": matched_item.get("name"),
            "weight_g": item_weight_g,
            "price": item_price,
            "qty": 1,
            "added_at": datetime.utcnow().isoformat(),
            "confirmed": True
        }

        items = cart.get("items", []) + [cart_item]
        current_total_weight = cart.get("total_weight", 0)
        expected_total_weight = current_total_weight + weight_delta

        # Verify against Pi reported total
        if abs(expected_total_weight - new_total_weight) > 10:
            return {
                "status": "suspicious",
                "reason": "Weight mismatch detected",
                "expected_total": expected_total_weight,
                "reported_total": new_total_weight
            }

        db["carts"].update_one(
            {"cart_id": cart_id},
            {"$set": {
                "items": items,
                "total_items": len(items),
                "total_weight": new_total_weight,
                "total_price": cart.get("total_price", 0) + item_price
            }}
        )

        # Update location
        update_location_from_item(cart_id=cart_id, item=matched_item, store_id=store_id)

        cart_data = db["carts"].find_one({"cart_id": cart_id})
        linked_user_id = cart_data.get("linked_user_id")
        linked_list_id = cart_data.get("linked_list_id")

        if linked_user_id and linked_list_id:
            matched_name = matched_item.get("name")
            label_variants = [v.lower() for v in matched_item.get("label_variants", [])]
            all_aliases = label_variants + [matched_name.lower()]

            shopping_list = db["shopping_lists"].find_one({
                "user_id": linked_user_id,
                "list_id": linked_list_id
            })

            if shopping_list:
                updated_items = []

                for item in shopping_list.get("items", []):
                    if isinstance(item, dict):
                        item_name_lower = item.get("name", "").lower().strip()
                    else:
                        item_name_lower = str(item).lower().strip()

                    if any(alias in item_name_lower or item_name_lower in alias for alias in all_aliases):
                        if isinstance(item, dict):
                            item["bought"] = True
                        else:
                            item = {"name": item, "bought": True}

                    updated_items.append(item)

                db["shopping_lists"].update_one(
                    {"user_id": linked_user_id, "list_id": linked_list_id},
                    {"$set": {"items": updated_items}}
                )

            # Also update cart copy of user_list_items if exists
            cart_user_items = cart_data.get("user_list_items", [])
            new_cart_user_items = []

            for ui in cart_user_items:
                ui_name = ui.get("name", "").lower().strip()
                if any(alias in ui_name or ui_name in alias for alias in all_aliases):
                    ui["bought"] = True
                new_cart_user_items.append(ui)

            db["carts"].update_one(
                {"cart_id": cart_id},
                {"$set": {"user_list_items": new_cart_user_items}}
            )

        detection_doc["status"] = "verified"
        detection_doc["matched_item"] = matched_item
        db["detections"].insert_one(detection_doc)

        return {
            "status": "verified",
            "matched_item": matched_item,
            "cart_summary": {
                "total_items": len(items),
                "total_weight": expected_total_weight,
                "total_price": cart.get("total_price", 0) + item_price
            }
        }

    # ------------------------------------------------------
    # HANDLE REMOVE EVENT
    # ------------------------------------------------------
    elif event_type == "remove":

        old_total = cart.get("total_weight", 0)

        cart_items = cart.get("items", [])
        delta = abs(weight_delta)

        matched = None

        for it in cart_items:
            expected = it.get("weight_g", 0)
            tol = max(0.15 * expected, 10)

            if abs(delta - expected) <= tol:
                matched = it
                break
            
        if not matched:
            res = decide_removal(
                {"candidate_items": candidates},
                cart_id)
            if res.get("status") != "removed":
                return {"status": res.get("status"), "candidates": res.get("candidates", [])}
            matched = res.get("matched_item")

        # remove from cart
        items = cart.get("items", [])
        item_price_deduction = 0  # Default 0 in case item isn't found
        
        for idx, it in enumerate(items):
            if it.get("item_id") == matched.get("item_id"):
                # ✅ Grab the exact price that was calculated and saved during the "add" event
                item_price_deduction = it.get("price", 0)
                
                if it.get("qty", 1) > 1:
                    items[idx]["qty"] -= 1
                else:
                    items.pop(idx)
                break

        # ✅ Safely deduct the price (preventing negative totals)
        current_total_price = cart.get("total_price", 0)
        new_total_price = max(0, current_total_price - item_price_deduction)
        
        current_total_weight = cart.get("total_weight", 0)
        expected_total_weight = current_total_weight + weight_delta  # delta is negative

        if abs(expected_total_weight - new_total_weight) > 10:
            return {
                "status": "suspicious",
                "reason": "Weight mismatch detected",
                "expected_total": expected_total_weight,
                "reported_total": new_total_weight
            }
        db["carts"].update_one(
            {"cart_id": cart_id},
            {"$set": {
                "items": items,
                "total_items": len(items),
                "total_weight": expected_total_weight,
                "total_price": new_total_price
            }}
        )

        db["detections"].insert_one({
            "event_id": event_id,
            "cart_id": cart_id,
            "type": "remove",
            "detected_label": label,
            "camera_confidence": confidence,
            "weight_delta_g": weight_delta,
            "cart_total_weight_g": new_total_weight,
            "matched_item": matched,
            "status": "removed",
            "timestamp": datetime.utcnow().isoformat()
        })

        return {
            "status": "removed",
            "matched_item": matched,
            "cart_summary": {
                "total_items": len(items),
                "total_weight_g": new_total_weight,
                "total_price": new_total_price
            }
        }
    return {"error": "Invalid event_type"}

@router.get("/view/{cart_id}")
def view_cart(cart_id: str):
    db = get_db()
    cart = db["carts"].find_one({"cart_id": cart_id}, {"_id": 0})
    if not cart:
        return {"cart_id": cart_id, "items": []}
    total_price = sum(item.get("price", 0) * item.get("qty", 1) for item in cart.get("items", []))
    return {
        "cart_id": cart["cart_id"],
        "items": cart.get("items", []),
        "total_items": len(cart.get("items", [])),
        "total_price": total_price
    }
    
@router.post("/cart/marker-update")
async def marker_update(payload: dict):

    cart_id = payload["cart_id"]
    marker_id = payload["marker_id"]
    confidence = payload.get("confidence", 1.0)

    success = update_location_from_marker(cart_id, marker_id, confidence)

    if not success:
        return {"error": "Marker not found"}

    return {"message": "Location updated from marker"}

@router.post("/confirm-list")
def confirm_list(payload: dict):
    """
    Two-step list linking. Cart UI previews the list first, then calls this
    endpoint only when user taps Confirm. This prevents accidental early linking.
    { "cart_id": "CART103", "user_id": "USR...", "list_id": "USR..._L..." }
    """
    from services.matcher import match_items
    db = get_db()
    cart_id  = payload.get("cart_id")
    user_id  = payload.get("user_id")
    list_id  = payload.get("list_id")

    if not all([cart_id, user_id, list_id]):
        return {"error": "cart_id, user_id, list_id required"}

    sl = db["shopping_lists"].find_one({"user_id": user_id, "list_id": list_id})
    if not sl:
        return {"error": "Shopping list not found"}

    cart = db["carts"].find_one({"cart_id": cart_id})
    store_id = cart.get("store_id") if cart else None

    raw_items = sl.get("items", [])
    item_names = [{"name": i["name"] if isinstance(i, dict) else i} for i in raw_items]
    match_result = match_items(item_names, store_id) if store_id else {"matched_items": []}
    backend_matches = match_result.get("matched_items", [])

    # Fetch store layout to get friendly rack names
    layout = db["store_layouts"].find_one({"store_id": store_id}, {"_id": 0}) if store_id else None
    rack_name_map = {}
    if layout:
        for el in layout.get("elements", []):
            if el.get("type") == "rack":
                rack_name_map[el["rack_id"]] = el.get("name", el["rack_id"])

    for bm in backend_matches:
        rid = bm.get("rack_id")
        if rid and rid in rack_name_map:
            bm["rack_name"] = rack_name_map[rid]

    user_list_items = []
    for i in raw_items:
        if isinstance(i, dict):
            user_list_items.append({"name": i.get("name", ""), "bought": i.get("bought", False)})
        else:
            user_list_items.append({"name": str(i), "bought": False})

    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {
            "linked_list_id": list_id,
            "linked_user_id": user_id,
            "list_name": sl.get("list_name", "My List"),
            "user_list_items": user_list_items,
            "backend_matches": backend_matches,
            "linked_at": datetime.utcnow().isoformat(),
        }}
    )
    return {
        "status": "linked",
        "list_id": list_id,
        "list_name": sl.get("list_name"),
        "item_count": len(user_list_items),
        "backend_matches": convert_objectid(backend_matches),
    }


@router.get("/payment-session/{cart_id}")
def get_payment_session(cart_id: str):
    """
    Mobile app polls this after checkout is initiated on the cart UI.
    Returns the active pending payment_id + amount + qr_payload so mobile can
    display a Pay button and scan the QR shown on the cart screen.
    """
    db = get_db()
    cart = db["carts"].find_one({"cart_id": cart_id}, {"_id": 0})
    if not cart:
        return {"error": "Cart not found"}

    payment_id = cart.get("active_payment_id")
    if not payment_id:
        return {"pending": False}

    pay = db["payments"].find_one({"payment_id": payment_id}, {"_id": 0})
    if not pay or pay.get("status") != "pending":
        return {"pending": False}

    return {
        "pending": True,
        "payment_id": payment_id,
        "amount": pay.get("amount", 0),
        "currency": pay.get("currency", "INR"),
        "qr_payload": pay.get("qr_payload"),
        "order_id": pay.get("order_id"),
    }

@router.get("/payment-session/{cart_id}")
def get_payment_session(cart_id: str):
    """
    Mobile polls this endpoint to check if cart UI has initiated checkout.
    Returns payment session info if checkout has been initiated.
    """
    db = get_db()
    cart = db["carts"].find_one({"cart_id": cart_id})
    
    if not cart:
        return {"error": "Cart not found"}
    
    # Check if there's an active payment session
    active_payment_id = cart.get("active_payment_id")
    
    if not active_payment_id:
        return {"pending": False}
    
    # Return payment session details
    return {
        "pending": True,
        "payment_id": active_payment_id,
        "amount": cart.get("active_payment_amount", 0),
        "order_id": cart.get("active_order_id"),
        "status": "awaiting_payment"
    }

@router.post("/checkout")
def cart_checkout(payload: dict):
    """
    FIXED VERSION: 
    1. Lock the cart and mark as checked_out
    2. Create order with pending_payment status
    3. Create payment session
    4. Store payment info on cart BUT DO NOT CLEAR ITEMS
    5. Items are only cleared AFTER successful payment
    
    Payload: {
        "cart_id": "CART103",
        "user_id": "USR496713",  # optional
        "payment_method": "upi" | "cash"
    }
    """
    import requests
    db = get_db()
    
    cart_id = payload.get("cart_id")
    user_id = payload.get("user_id")
    payment_method = payload.get("payment_method", "upi")
    
    if not cart_id:
        return {"error": "cart_id required"}
    
    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart:
        return {"error": "Cart not found"}
    
    # Fallback: Extract from current_session if payload didn't have it
    if not user_id:
        current_session = cart.get("current_session", {})
        user_id = current_session.get("user_id") or cart.get("linked_user_id")
    
    # Lock the cart
    lock_cart(cart_id)
    
    checkout_time = datetime.utcnow().isoformat()
    
    # ✅ Mark as checked-out but KEEP items (we need them for payment amount)
    db["carts"].update_one(
        {"cart_id": cart_id},
        {
            "$set": {
                "status": "checked_out",  # Changed from "in_use"
                "checked_out": True,
                "checkout_time": checkout_time,
                "pending_payment": True,
            }
        }
    )
    
    store_id = cart.get("store_id")
    total_price = cart.get("total_price", 0)
    
    # ✅ Create pending order
    order_id = f"ORD{int(datetime.utcnow().timestamp())}"
    order_doc = {
        "order_id": order_id,
        "user_id": user_id,
        "cart_id": cart_id,
        "store_id": store_id,
        "items": cart.get("items", []),
        "total_items": cart.get("total_items", 0),
        "total_price": total_price,
        "total_weight_g": cart.get("total_weight", 0),
        "created_at": checkout_time,
        "status": "pending_payment",
        "payment_status": "pending",
        "payment_method": payment_method
    }
    db["orders"].insert_one(order_doc)
    
    # ✅ Payment initiation
    try:
        payment_resp = requests.post(
            "http://127.0.0.1:8000/mock-payment/create",
            json={"order_id": order_id, "amount": total_price, "currency": "INR"},
            timeout=5
        )
        payment_data = payment_resp.json()
    except Exception as e:
        payment_data = {"error": f"Payment initiation failed: {str(e)}"}
    
    # ✅ Store payment_id on cart for mobile to poll
    # BUT DO NOT CLEAR ITEMS - they'll be cleared after payment success
    active_payment_id = payment_data.get("payment_id")
    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {
            "active_payment_id": active_payment_id,
            "active_payment_amount": total_price,
            "active_order_id": order_id,
        }}
    )
    
    # ✅ Handle shopping list forwarder
    linked_user_id = cart.get("linked_user_id")
    linked_list_id = cart.get("linked_list_id")
    next_list_id = None
    remaining_items = 0
    
    if linked_user_id and linked_list_id:
        old_list = db["shopping_lists"].find_one({"user_id": linked_user_id, "list_id": linked_list_id})
        if old_list:
            not_bought = [
                i for i in old_list.get("items", []) 
                if not (isinstance(i, dict) and i.get("bought"))
            ]
            not_found = old_list.get("not_found", [])
            new_items = not_bought + not_found
            
            # 1. ONLY create forwarder if items remain
            if len(new_items) > 0:
                timestamp = int(datetime.utcnow().timestamp())
                next_list_id = f"{linked_user_id}_L{timestamp}"
                new_list = {
                    "user_id": linked_user_id,
                    "list_id": next_list_id,
                    "items": new_items,
                    "created_at": datetime.utcnow().isoformat(),
                    "status": "pending",
                    "list_name": f"{old_list.get('list_name', 'My List')} (Next)"
                }
                db["shopping_lists"].insert_one(new_list)
                remaining_items = len(new_items)
                
                # Add new list to user doc
                db["users"].update_one(
                    {"user_id": linked_user_id},
                    {"$addToSet": {"shopping_lists": {"list_id": next_list_id, "list_name": new_list["list_name"]}}}
                )
            
            # 2. DELETE the old list entirely
            db["shopping_lists"].delete_one({"user_id": linked_user_id, "list_id": linked_list_id})
            db["users"].update_one(
                {"user_id": linked_user_id},
                {"$pull": {"shopping_lists": {"list_id": linked_list_id}}}
            )          
    
    # ✅ Save receipt for reference
    receipt = {
        "cart_id": cart_id,
        "checkout_time": checkout_time,
        "order_id": order_id,
        "total_items": cart.get("total_items", 0),
        "total_weight_g": cart.get("total_weight", 0),
        "total_price": total_price,
        "linked_user_id": linked_user_id,
        "old_list_id": linked_list_id,
        "new_list_id": next_list_id,
        "remaining_items_next_list": remaining_items
    }
    db["receipts"].insert_one(receipt)
    
    # ✅ Return unified result
    def clean(obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        elif isinstance(obj, list):
            return [clean(o) for o in obj]
        elif isinstance(obj, dict):
            return {k: clean(v) for k, v in obj.items()}
        return obj
    
    return {
        "message": "Checkout initiated. Proceed to payment.",
        "order_id": order_id,
        "order_status": "pending_payment",
        "payment_session": payment_data,
        "order_summary": {
            "total_items": cart.get("total_items", 0),
            "total_price": total_price,
            "store_id": store_id
        },
        "shopping_list_update": {
            "new_list_id": next_list_id,
            "remaining_items": remaining_items
        },
        "receipt": clean(receipt)
    }

@router.get("/receipt/{order_id}")
def get_receipt(order_id: str):
    """
    Returns order details (can be rendered to PDF on frontend or server).
    """
    db = get_db()
    order = db["orders"].find_one({"order_id": order_id}, {"_id": 0})
    if not order:
        return {"error": "Order not found or expired"}
    return {
        "order_id": order["order_id"],
        "user_id": order.get("user_id"),
        "checkout_time": order.get("checkout_time"),
        "items": order.get("items", []),
        "total_items": order.get("total_items"),
        "total_price": order.get("total_price"),
        "status": order.get("status")
    }

@router.post("/logout")
def cart_logout(payload: dict):
    """
    Called after receipt printed / session timeout.
    Cleans cart and removes session data completely.
    Payload: { "cart_id": "CART103" }
    """
    db = get_db()
    cart_id = payload.get("cart_id")

    if not cart_id:
        return {"error": "cart_id required"}
    
    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart:
        return {"error": "Cart not found"}

    # 🚨 NEW: Prevent logout if cart has items and isn't checked out
    if cart.get("total_items", 0) > 0 and not cart.get("checked_out", False):
        return {"error": "Cannot logout. Please empty your physical cart or complete checkout first."}

    # 🧹 Fields to remove completely
    fields_to_unset = {
        "items": "",
        "total_items": "",
        "total_weight": "",
        "total_price": "",
        "user_list_items": "",
        "checked_out": "",
        "checkout_time": "",
        "linked": "",
        "linked_list_id": "",
        "linked_user_id": "",
        "backend_matches": "",
        "linked_at": "",
        "list_name": "",
        "optimized_path": "",
        "current_session":"",
        "current_location":"",
        "checkout_initiated_at":"",
        "checkout_stage":"",
        "pending_payment":"",
        "active_order_id":"",
        "active_payment_id":""
    }

    # 🧩 Reset cart to available & unlocked, then unset old session data
    db["carts"].update_one(
        {"cart_id": cart_id},
        {
            "$set": {
                "status": "available",
                "locked": False
            },
            "$unset": fields_to_unset
        }
    )

    # 🗑️ Clean related detections
    db["detections"].delete_many({"cart_id": cart_id})

    return {"message": f"Cart {cart_id} session cleared and unlocked successfully."}

@router.get("/sync/{cart_id}")
def sync_cart(cart_id: str):

    db = get_db()

    cart = db["carts"].find_one({"cart_id": cart_id})

    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # Optional: auto-detect offline if no heartbeat
    last_seen = cart.get("last_seen")
    if last_seen:
        try:
            last_seen_dt = datetime.fromisoformat(last_seen)
            if (datetime.utcnow() - last_seen_dt).seconds > 60:
                db["carts"].update_one(
                    {"cart_id": cart_id},
                    {"$set": {"network_status": "offline"}}
                )
                cart["network_status"] = "offline"
        except:
            pass

    return {
        "cart_id": cart["cart_id"],
        "store_id": cart["store_id"],
        "status": cart.get("status"),
        "locked": cart.get("locked"),
        "battery_level": cart.get("battery_level"),
        "network_status": cart.get("network_status"),
        "current_location": cart.get("current_location"),
        "current_session": cart.get("current_session")
    }
    
@router.post("/configure")
def configure_cart(payload: dict):

    cart_id = payload.get("cart_id")
    device_serial = payload.get("device_serial")

    if not cart_id or not device_serial:
        raise HTTPException(status_code=400, detail="cart_id and device_serial required")

    db = get_db()

    # 1️⃣ Check cart exists
    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    # 2️⃣ Check if device_serial is already assigned to another cart
    existing_device = db["carts"].find_one({
        "device_serial": device_serial,
        "cart_id": {"$ne": cart_id}
    })

    if existing_device:
        raise HTTPException(
            status_code=400,
            detail=f"Device already assigned to cart {existing_device['cart_id']}"
        )

    # 3️⃣ If this cart already has another serial assigned → block
    if cart.get("device_serial") and cart["device_serial"] != device_serial:
        raise HTTPException(
            status_code=400,
            detail="Cart already configured with another device"
        )

    # 4️⃣ Update cart
    db["carts"].update_one(
        {"cart_id": cart_id},
        {
            "$set": {
                "device_serial": device_serial,
                "network_status": "online",
                "last_seen": datetime.utcnow().isoformat()
            }
        }
    )

    return {
        "message": "Cart configured successfully",
        "cart_id": cart_id
    }
    
@router.post("/heartbeat")
def cart_heartbeat(payload: dict):

    cart_id = payload.get("cart_id")
    battery_level = payload.get("battery_level")

    if not cart_id:
        raise HTTPException(status_code=400, detail="cart_id required")

    db = get_db()

    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    update_data = {
        "network_status": "online",
        "last_seen": datetime.utcnow().isoformat()
    }

    if battery_level is not None:
        update_data["battery_level"] = battery_level

    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": update_data}
    )

    return {
        "message": "Heartbeat received",
        "cart_id": cart_id
    }
    
@router.get("/display/{cart_id}")
def get_cart_display(cart_id: str):
    """
    Returns all data needed by the cart display frontend:
    - Top-level items (scanned products), totals
    - user_list_items (shopping list with bought status)
    - backend_matches (for rack info)
    - optimized_path
    - current_location (for minimap)
    - list_name, linked_list_id
    """
    db = get_db()
    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    return convert_objectid({
        "cart_id": cart.get("cart_id"),
        "store_id": cart.get("store_id"),
        "status": cart.get("status"),
        "items": cart.get("items", []),
        "total_items": cart.get("total_items", 0),
        "total_price": cart.get("total_price", 0),
        "total_weight": cart.get("total_weight", 0),
        "user_list_items": cart.get("user_list_items", []),
        "backend_matches": cart.get("backend_matches", []),
        "optimized_path": cart.get("optimized_path", []),
        "current_location": cart.get("current_location"),
        "list_name": cart.get("list_name"),
        "linked_list_id": cart.get("linked_list_id"),
        "linked_user_id": cart.get("linked_user_id"),
    })