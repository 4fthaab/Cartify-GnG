# routers/cart.py
from fastapi import APIRouter
from utils.db import get_db
from datetime import datetime,timedelta
import uuid
from fastapi.responses import JSONResponse
from services.matcher import match_items
from services.verifier import decide_match, decide_removal
import pdfkit

router = APIRouter(prefix="/cart", tags=["Cart"])

@router.post("/login")
def cart_login(data: dict):
    db = get_db()
    data["linked"] = True
    data["login_time"] = datetime.utcnow().isoformat()
    db["carts"].update_one({"cart_id": data["cart_id"]}, {"$set": data}, upsert=True)
    return {"cart_id": data["cart_id"], "user_id": data.get("user_id"), "linked": True, "login_time": data["login_time"]}

@router.post("/detect")
def cart_detect(payload: dict):
    """
    Camera sends detected label. Backend finds candidates and creates detection doc.
    """
    db = get_db()
    cart_id = payload.get("cart_id")
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
def cart_weight(payload: dict):
    db = get_db()
    detection_id = payload.get("detection_id")
    cart_id = payload.get("cart_id")

    # Mode A: cart_total_weight provided (scale sends total weight)
    if "cart_total_weight" in payload:
        new_total = payload.get("cart_total_weight")
        # For an add flow: we know detection->candidate contains single or multiple candidates.
        det = db["detections"].find_one({"detection_id": detection_id})
        if not det:
            return {"error": "detection not found"}

        # try to decide which candidate fits the delta: new_total - old_total == candidate.weight (approx)
        cart = db["carts"].find_one({"cart_id": cart_id}) or {"cart_id": cart_id, "items": [], "total_weight": 0}
        old_total = cart.get("total_weight", 0)

        # Compute delta
        delta = new_total - old_total

        # find candidate whose weight matches delta within tolerance
        candidates = det.get("candidate_items", [])
        matched = None
        for c in candidates:
            expected = c.get("weight_g", 0)
            # tolerance: 20% absolute or +/-10 g min (tunable)
            tol = max(0.15 * expected, 10)
            if abs(delta - expected) <= tol:
                matched = c
                break

        if matched:
            # Add to cart
            cart_item = {
                "item_id": matched.get("item_id"),
                "name": matched.get("name"),
                "price": matched.get("price"),
                "qty": 1,
                "weight_g": matched.get("weight_g"),
                "added_at": datetime.utcnow().isoformat(),
                "confirmed": True
            }
            db["carts"].update_one({"cart_id": cart_id}, {"$push": {"items": cart_item}, "$set": {"total_weight": new_total}}, upsert=True)
            db["detections"].update_one({"detection_id": detection_id}, {"$set": {"status": "verified", "matched_item": matched}})
            return {"status": "verified", "matched_item": matched, "cart_item": cart_item, "total_weight": new_total}
        else:
            # Not matched by delta; fallback to previous logic (append reading & use verifier)
            db["detections"].update_one({"detection_id": detection_id}, {"$push": {"weight_readings": new_total}})
            det = db["detections"].find_one({"detection_id": detection_id})
            from services.verifier import decide_match
            result = decide_match(det)
            if result.get("status") == "verified":
                matched = result["matched_item"]
                cart_item = {
                    "item_id": matched.get("item_id"),
                    "name": matched.get("name"),
                    "price": matched.get("price"),
                    "qty": 1,
                    "weight_g": matched.get("weight_g"),
                    "added_at": datetime.utcnow().isoformat(),
                    "confirmed": True
                }
                # update total weight by adding expected weight
                new_total_calc = cart.get("total_weight", 0) + matched.get("weight_g", 0)
                db["carts"].update_one({"cart_id": cart_id}, {"$push": {"items": cart_item}, "$set": {"total_weight": new_total_calc}}, upsert=True)
                db["detections"].update_one({"detection_id": detection_id}, {"$set": {"status":"verified", "matched_item": matched}})
                return {"status":"verified", "matched_item": matched, "cart_item": cart_item, "total_weight": new_total_calc}
            else:
                return {"status": result.get("status"), "candidates": result.get("candidates", [])}

    # Mode B: legacy item-weight mode (single item weight provided)
    weight = payload.get("weight_g")
    if weight is None:
        return {"error": "No weight provided"}

    det = db["detections"].find_one({"detection_id": detection_id})
    if not det:
        return {"error": "detection not found"}

    db["detections"].update_one({"detection_id": detection_id}, {"$push": {"weight_readings": weight}})
    det = db["detections"].find_one({"detection_id": detection_id})
    from services.verifier import decide_match
    result = decide_match(det)

    if result.get("status") == "verified":
        matched = result["matched_item"]
        cart_item = {
            "item_id": matched.get("item_id"),
            "name": matched.get("name"),
            "price": matched.get("price"),
            "qty": 1,
            "weight_g": matched.get("weight_g"),
            "added_at": datetime.utcnow().isoformat(),
            "confirmed": True
        }
        # update cart total weight
        cart = db["carts"].find_one({"cart_id": cart_id}) or {"cart_id": cart_id, "items": [], "total_weight": 0}
        new_total = cart.get("total_weight", 0) + matched.get("weight_g", 0)
        db["carts"].update_one({"cart_id": cart_id}, {"$push": {"items": cart_item}, "$set": {"total_weight": new_total}}, upsert=True)
        db["detections"].update_one({"detection_id": detection_id}, {"$set": {"status":"verified", "matched_item": matched}})
        return {"status":"verified", "matched_item": matched, "cart_item": cart_item, "total_weight": new_total}
    else:
        return {"status": result.get("status"), "candidates": result.get("candidates", [])}

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
def cart_checkout(payload: dict):
    """
    User finishes shopping — finalize cart into orders and retain it for receipt.
    Payload: { "cart_id": "CART102", "user_id": "U123" }
    """
    db = get_db()
    cart_id = payload.get("cart_id")
    user_id = payload.get("user_id")

    cart = db["carts"].find_one({"cart_id": cart_id})
    if not cart or not cart.get("items"):
        return {"error": "Cart empty or not found"}

    # Calculate totals
    total_price = sum(item.get("price", 0) * item.get("qty", 1) for item in cart["items"])
    total_items = len(cart["items"])

    order_doc = {
        "order_id": f"ORD-{cart_id}-{int(datetime.utcnow().timestamp())}",
        "cart_id": cart_id,
        "user_id": user_id,
        "items": cart["items"],
        "total_items": total_items,
        "total_price": total_price,
        "checkout_time": datetime.utcnow().isoformat(),
        "status": "completed",
        "expire_at": (datetime.utcnow() + timedelta(minutes=15)).isoformat()  # retain 15 mins
    }

    db["orders"].insert_one(order_doc)
    db["carts"].update_one({"cart_id": cart_id}, {"$set": {"status": "checked_out"}})
    db["detections"].update_many({"cart_id": cart_id}, {"$set": {"status": "archived"}})

    return {
        "message": "Checkout completed successfully",
        "order_id": order_doc["order_id"],
        "total_price": total_price,
        "receipt_url": f"/cart/receipt/{order_doc['order_id']}"
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
    Deletes temp cart & detections for that cart_id.
    Payload: { "cart_id": "CART102" }
    """
    db = get_db()
    cart_id = payload.get("cart_id")

    db["carts"].delete_one({"cart_id": cart_id})
    db["detections"].delete_many({"cart_id": cart_id})
    return {"message": f"Cart {cart_id} session cleared successfully."}
