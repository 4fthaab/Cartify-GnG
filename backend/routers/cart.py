# routers/cart.py
from fastapi import APIRouter
from utils.db import get_db
from datetime import datetime,timedelta
import uuid
from fastapi.responses import JSONResponse
from services.matcher import match_items
from services.verifier import decide_match, decide_removal
import pdfkit
from bson import ObjectId
from utils.cart_utils import is_cart_locked,lock_cart


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
        "user_id": "USR123",
        "store_id": "STORE001"
    }
    """
    db = get_db()
    user_id = payload.get("user_id")
    store_id = payload.get("store_id")

    if not user_id or not store_id:
        return {"error": "Missing user_id or store_id"}

    # Step 1: Find an available cart
    available_cart = db["carts"].find_one_and_update(
        {"store_id": store_id, "status": "available", "locked": False},
        {"$set": {"status": "in_use", "locked": False, "last_used": datetime.utcnow().isoformat()}},
    )

    if not available_cart:
        return {"error": "No available carts right now. Please wait."}

    cart_id = available_cart["cart_id"]
    session_id = f"{cart_id}_SESS_{uuid.uuid4().hex[:6].upper()}"

    # Step 2: Create the session info
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

    # Step 3: Update cart with current session
    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {"current_session": session_doc}}
    )

    # Step 4: Return assigned cart
    return {
        "message": "Cart assigned successfully",
        "cart_id": cart_id,
        "session_id": session_id,
        "store_id": store_id,
        "user_id": user_id,
        "status": "in_use",
        "locked": False
    }


@router.post("/detect")
def cart_detect(payload: dict):
    """
    Camera sends detected label. Backend finds candidates and creates detection doc.
    """
    db = get_db()
    cart_id = payload.get("cart_id")
    if is_cart_locked(cart_id):
        return {"error": "Cart is locked. Checkout in progress or completed."}
    label = payload.get("detected_label")
    conf = payload.get("camera_confidence", 0.0)
    candidates_res = match_items([{"name": label}])
    candidates = candidates_res.get("matched_items", [])
    detection_id = str(uuid.uuid4())
    det_doc = {
        "detection_id": detection_id,
        "cart_id": cart_id,
        "detected_label": label,
        "camera_confidence": conf,
        "candidate_items": candidates,
        "status": "awaiting_weight",
        "weight_readings": [],
        "timestamp": datetime.utcnow().isoformat()
    }
    db["detections"].insert_one(det_doc)
    return {"detection_id": detection_id, "candidate_items": candidates, "status":"awaiting_weight", "timeout_ms": 7000}

@router.post("/weight")
def update_cart_weight(payload: dict):
    from services.verifier import decide_match
    from utils.db import get_db

    db = get_db()
    cart_id = payload.get("cart_id")
    if is_cart_locked(cart_id):
        return {"error": "Cart is locked. Checkout in progress or completed."}
    detection_id = payload.get("detection_id")
    reading = payload.get("weight_g")

    # 1️⃣ Validate detection
    det_doc = db["detections"].find_one({"detection_id": detection_id})
    if not det_doc:
        return {"status": "error", "message": "Detection not found"}

    # 2️⃣ Append new weight reading
    db["detections"].update_one({"detection_id": detection_id}, {"$push": {"weight_readings": reading}})
    det_doc["weight_readings"] = det_doc.get("weight_readings", []) + [reading]

    # 3️⃣ Decide which item matched
    result = decide_match(det_doc)
    if result.get("status") != "verified":
        return {"status": result.get("status"), "candidates": result.get("candidates", [])}

    matched_item = result.get("matched_item")
    weight_type = matched_item.get("weight_type", "fixed")

    # 4️⃣ Compute weight & price
    if weight_type == "variable":
        item_weight_g = reading  # take actual measured weight
        price_per_kg = matched_item.get("unit_price_per_kg", 0)
        item_price = round((item_weight_g / 1000) * price_per_kg, 2)
    else:
        item_weight_g = matched_item.get("weight_g", 0)
        item_price = matched_item.get("price", 0)

    cart_item = {
        "item_id": matched_item.get("item_id"),
        "name": matched_item.get("name"),
        "weight_g": item_weight_g,
        "unit_price_per_kg": matched_item.get("unit_price_per_kg", None),
        "price": item_price,
        "qty": 1,
        "added_at": datetime.utcnow().isoformat(),
        "confirmed": True
    }

    # 5️⃣ Update cart
    cart = db["carts"].find_one({"cart_id": cart_id}) or {"cart_id": cart_id, "items": [], "total_weight": 0, "total_price": 0}
    total_weight = cart.get("total_weight", 0) + item_weight_g
    total_price = cart.get("total_price", 0) + item_price
    items = cart.get("items", []) + [cart_item]

    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {
            "items": items,
            "total_items": len(items),
            "total_weight": total_weight,
            "total_price": total_price
        }},
        upsert=True
    )

    # 6️⃣ Update stock
    db["items"].update_one(
        {"item_id": matched_item.get("item_id")},
        {"$inc": {"stock_qty": -item_weight_g if weight_type == "variable" else -1}}
    )

    # 7️⃣ Auto mark in linked shopping list
    cart_data = db["carts"].find_one({"cart_id": cart_id})
    linked_user_id = cart_data.get("linked_user_id")
    linked_list_id = cart_data.get("linked_list_id")
    detected_label = (det_doc.get("detected_label") or matched_item.get("name", "")).lower()

    if linked_user_id and linked_list_id:
        matched_name = matched_item.get("name")
        label_variants = [v.lower() for v in matched_item.get("label_variants", [])]
        all_aliases = label_variants + [matched_name.lower()]

        # 🧾 Update user's shopping list
        shopping_list = db["shopping_lists"].find_one({"user_id": linked_user_id, "list_id": linked_list_id})
        if shopping_list:
            updated_items = []
            matched_any = False
            for item in shopping_list["items"]:
                item_name_lower = item["name"].lower().strip()
                # ✅ Match against all aliases (full or partial)
                if any(alias in item_name_lower or item_name_lower in alias for alias in all_aliases):
                    item["bought"] = True
                    matched_any = True
                updated_items.append(item)
            db["shopping_lists"].update_one(
                {"user_id": linked_user_id, "list_id": linked_list_id},
                {"$set": {"items": updated_items}}
            )

    # 🧾 Update cart user_list_items
    cart_user_items = cart_data.get("user_list_items", [])
    new_cart_user_items = []
    for ui in cart_user_items:
        ui_name = ui["name"].lower().strip()
        if any(alias in ui_name or ui_name in alias for alias in all_aliases):
            ui["bought"] = True
        new_cart_user_items.append(ui)

    db["carts"].update_one({"cart_id": cart_id}, {"$set": {"user_list_items": new_cart_user_items}})

    return {
        "status": "verified",
        "matched_item": matched_item,
        "cart_item": cart_item,
        "cart_summary": {
            "total_items": len(items),
            "total_weight_g": total_weight,
            "total_price": total_price
        },
        "auto_marked_in_list": bool(linked_user_id and linked_list_id)
    }

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

@router.post("/detect_remove")
def cart_detect_remove(payload: dict):
    """
    Camera notifies an item was lifted out of ROI (candidate removal).
    Payload: { "cart_id": "...", "detected_label": "Gday biscuit", "camera_confidence": 0.9 }
    """
    db = get_db()
    cart_id = payload.get("cart_id")
    if is_cart_locked(cart_id):
        return {"error": "Cart is locked. Checkout in progress or completed."}
    label = payload.get("detected_label")
    conf = payload.get("camera_confidence", 0.0)

    # Find candidate items (same matcher used for add)
    candidates_res = match_items([{"name": label}])
    candidates = candidates_res.get("matched_items", [])

    detection_id = str(uuid.uuid4())
    det_doc = {
        "detection_id": detection_id,
        "cart_id": cart_id,
        "detected_label": label,
        "camera_confidence": conf,
        "candidate_items": candidates,
        "status": "awaiting_weight_removal",
        "weight_readings": [],
        "timestamp": datetime.utcnow().isoformat(),
        "type": "removal"
    }
    db["detections"].insert_one(det_doc)
    return {"detection_id": detection_id, "candidate_items": candidates, "status": "awaiting_weight_removal", "timeout_ms":7000}


@router.post("/weight_remove")
def cart_weight_remove(payload: dict):
    """
    Weight sensor posts current cart total weight after removal.
    Payload: { "cart_id": "...", "detection_id":"...", "cart_total_weight": <grams> }
    We check old_total - candidate.weight ≈ new_total to identify removed item.
    """
    db = get_db()
    detection_id = payload.get("detection_id")
    cart_id = payload.get("cart_id")
    if is_cart_locked(cart_id):
        return {"error": "Cart is locked. Checkout in progress or completed."}
    new_total = payload.get("cart_total_weight")

    if new_total is None:
        return {"error": "Please provide cart_total_weight for removal verification"}

    det = db["detections"].find_one({"detection_id": detection_id})
    if not det:
        return {"error": "detection not found"}

    # Append reading for audit
    db["detections"].update_one({"detection_id": detection_id}, {"$push": {"weight_readings": new_total}})

    # Fetch current cart
    cart = db["carts"].find_one({"cart_id": cart_id}) or {"cart_id": cart_id, "items": [], "total_weight": 0}
    old_total = cart.get("total_weight", 0)
    delta = old_total - new_total  # expected removed weight

    candidates = det.get("candidate_items", [])
    matched = None
    for c in candidates:
        expected = c.get("weight_g", 0)
        tol = max(0.15 * expected, 10)
        if abs(delta - expected) <= tol:
            matched = c
            break

    if matched:
        # remove item from cart (decrement or pop)
        items = cart.get("items", [])
        updated = False
        for idx, it in enumerate(items):
            if it.get("item_id") == matched.get("item_id"):
                if it.get("qty", 1) > 1:
                    items[idx]["qty"] = it.get("qty", 1) - 1
                else:
                    items.pop(idx)
                updated = True
                break
        # update cart doc: items and total_weight -> new_total
        db["carts"].update_one({"cart_id": cart_id}, {"$set": {"items": items, "total_weight": new_total}}, upsert=True)
        db["detections"].update_one({"detection_id": detection_id}, {"$set": {"status": "removed", "matched_item": matched}})
        return {"status": "removed", "matched_item": matched, "cart_items": items, "total_weight": new_total}
    else:
        # fallback ambiguous decision using existing verifier
        from services.verifier import decide_removal
        res = decide_removal(det, cart_id)
        # If decide_removal returns removed, update total weight accordingly
        if res.get("status") == "removed":
            matched = res["matched_item"]
            # perform same removal as above and set total_weight to new_total
            items = cart.get("items", [])
            for idx, it in enumerate(items):
                if it.get("item_id") == matched.get("item_id"):
                    if it.get("qty", 1) > 1:
                        items[idx]["qty"] -= 1
                    else:
                        items.pop(idx)
                    break
            db["carts"].update_one({"cart_id": cart_id}, {"$set": {"items": items, "total_weight": new_total}}, upsert=True)
            db["detections"].update_one({"detection_id": detection_id}, {"$set": {"status": "removed", "matched_item": matched}})
            return {"status":"removed", "matched_item": matched, "cart_items": items, "total_weight": new_total}
        else:
            db["detections"].update_one({"detection_id": detection_id}, {"$set": {"status": res.get("status")}})
            return {"status": res.get("status"), "candidates": res.get("candidates", [])}

@router.post("/checkout")
def checkout_cart(payload: dict):
    """
    Finalize the cart:
    - Lock it
    - Create order
    - Initiate mock payment
    - Cleanup shopping list (forward unbought items)
    """
    from utils.db import get_db
    from utils.cart_utils import lock_cart
    from datetime import datetime
    import requests
    from bson import ObjectId

    db = get_db()
    cart_id = payload.get("cart_id")
    payment_method = payload.get("payment_method", "upi")

    if not cart_id:
        return {"error": "cart_id required"}

    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart:
        return {"error": "Cart not found"}

    # ✅ Lock the cart
    lock_cart(cart_id)

    checkout_time = datetime.utcnow().isoformat()
    db["carts"].update_one(
        {"cart_id": cart_id},
        {"$set": {"checked_out": True, "checkout_time": checkout_time, "linked": False}}
    )

    user_id = cart.get("linked_user_id")
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

    # ✅ Handle shopping list forwarder
    linked_user_id = cart.get("linked_user_id")
    linked_list_id = cart.get("linked_list_id")
    next_list_id = None
    remaining_items = 0
    if linked_user_id and linked_list_id:
        old_list = db["shopping_lists"].find_one({"user_id": linked_user_id, "list_id": linked_list_id})
        if old_list:
            not_bought = [i for i in old_list.get("items", []) if not i.get("bought")]
            not_found = old_list.get("not_found", [])
            new_items = not_bought + not_found

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

            db["shopping_lists"].update_one(
                {"user_id": linked_user_id, "list_id": linked_list_id},
                {"$set": {"status": "completed", "archived_at": datetime.utcnow().isoformat()}}
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
    Payload: { "cart_id": "CART102" }
    """
    db = get_db()
    cart_id = payload.get("cart_id")

    if not cart_id:
        return {"error": "cart_id required"}

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
        "optimized_path": ""
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

from services.weight_monitor import process_weight_event
from utils.db import get_db
from datetime import datetime

@router.post("/weight_event")
def simulate_weight_event(payload: dict):
    """
    Simulate a weight change event (used in testing instead of live sensor)
    Example payload:
    {
      "cart_id": "CART102",
      "new_weight_g": 350
    }
    """
    cart_id = payload.get("cart_id")
    new_weight = payload.get("new_weight_g", 0)

    db = get_db()
    cart = db["carts"].find_one({"cart_id": cart_id}) or {}
    last_weight = cart.get("total_weight", 0)

    result = process_weight_event(new_weight, last_weight)

    # optional: log fraud events
    if result.get("alert"):
        db["alerts"].insert_one({
            "cart_id": cart_id,
            "timestamp": datetime.utcnow().isoformat(),
            "delta_g": result["delta_g"],
            "status": "active"
        })

    return {
        "cart_id": cart_id,
        "last_weight": last_weight,
        "new_weight": new_weight,
        "alert_state": result["alert"],
        "delta_g": result["delta_g"]
    }
