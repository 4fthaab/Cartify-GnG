from datetime import datetime

def decide_match(det_doc):
    """
    det_doc contains:
      - candidate_items: list of items (each has 'weight_g')
      - weight_readings: list of readings (may be appended)
    Returns dict with status and matched_item (if verified)
    """
    readings = det_doc.get("weight_readings", []) or []
    if not readings:
        return {"status": "awaiting_weight"}

    # use median to reduce noise
    sorted_r = sorted(readings)
    median = sorted_r[len(sorted_r)//2]
    candidates = det_doc.get("candidate_items", [])

    scores = []
    for c in candidates:
        expected = c.get("weight_g") or 0
        if expected <= 0:
            score = 0
        else:
            diff = abs(median - expected)
            rel = 1 - (diff / expected)
            score = rel  # between -inf and 1
        scores.append((c, score))

    # pick best
    best, best_score = max(scores, key=lambda x: x[1]) if scores else (None, 0)
    # thresholds (tune in testing)
    if best_score >= 0.7:
        return {"status":"verified","matched_item": best}
    elif best_score >= 0.45:
        # ambiguous - return candidates for UI confirmation
        return {"status":"ambiguous","candidates":[c for c,s in scores]}
    else:
        return {"status":"failed"}

def decide_removal(det_doc, cart_id=None):
    """
    Determine which candidate was removed based on weight readings and cart contents.
    det_doc: contains 'candidate_items' and 'weight_readings'
    cart_id: used to prefer items present in cart
    Returns:
      {"status":"removed", "matched_item": {...}} OR
      {"status":"ambiguous","candidates":[...]} OR {"status":"failed"}
    """
    readings = det_doc.get("weight_readings", []) or []
    if not readings:
        return {"status": "awaiting_weight_removal"}

    # compute weight delta (we expect a drop). Use median of last readings
    sorted_r = sorted(readings)
    median = sorted_r[len(sorted_r)//2]

    # If we want delta, we can compute last stable cart weight from DB (optional).
    # Simpler: compare median to candidates' expected weights and find best match that reduces weight.
    candidates = det_doc.get("candidate_items", [])
    if not candidates:
        return {"status": "failed"}

    # If cart_id provided, fetch cart to prefer items present
    from utils.db import get_db
    db = get_db()
    cart_items = []
    if cart_id:
        cart = db["carts"].find_one({"cart_id": cart_id}) or {}
        cart_items = cart.get("items", [])

    # compute score = (presence_in_cart ? +0.2) + weight_similarity
    scores = []
    for c in candidates:
        expected = c.get("weight_g") or 0
        if expected <= 0:
            weight_score = 0
        else:
            diff = abs(median - expected)
            weight_score = 1 - (diff / expected)  # could be negative if very off
        in_cart_bonus = 0.2 if any(ci.get("item_id")==c.get("item_id") for ci in cart_items) else 0.0
        camera_conf = det_doc.get("camera_confidence", 0.0)
        final_score = 0.6 * camera_conf + 0.4 * max(0, weight_score) + in_cart_bonus
        scores.append((c, final_score))

    best, best_score = max(scores, key=lambda x: x[1])

    # thresholds (tune): if best_score high enough -> remove; if medium -> ambiguous
    if best_score >= 0.7:
        return {"status": "removed", "matched_item": best}
    elif best_score >= 0.45:
        return {"status": "ambiguous", "candidates": [c for c,s in scores]}
    else:
        return {"status": "failed"}

