from datetime import datetime
import math

def decide_match(det_doc):
    """
    Decide matched item based on weight reading and item type.
    Supports both 'fixed' and 'variable' weight items.
    """
    readings = det_doc.get("weight_readings", []) or []
    if not readings:
        return {"status": "awaiting_weight"}

    sorted_r = sorted(readings)
    median = sorted_r[len(sorted_r)//2]
    candidates = det_doc.get("candidate_items", [])
    if not candidates:
        return {"status": "failed", "candidates": []}

    # 🧠 Step 1: Check if any candidate is a variable-weight item
    variable_candidates = [c for c in candidates if c.get("weight_type") == "variable"]
    if variable_candidates:
        best = variable_candidates[0]
        best["measured_weight_g"] = median
        print(f"✅ Variable-weight item detected: {best.get('name')} | weight={median}g")
        return {"status": "verified", "matched_item": best}

    # 🧠 Step 2: Fixed-weight logic
    scores = []
    for c in candidates:
        expected = c.get("weight_g") or 0
        if expected <= 0:
            score = 0
        else:
            diff = abs(median - expected)
            
            # Allow a baseline flat tolerance of 15g before penalizing
            effective_diff = max(0, diff - 15)
            
            # Smooth exponential decay: 0 diff = 1.0 score. 
            # If expected is 100g and effective_diff is 20g, score is ~0.81
            score = math.exp(-effective_diff / expected)
            
        scores.append((c, score))

    if not scores:
         return {"status": "failed", "candidates": candidates}

    best, best_score = max(scores, key=lambda x: x[1])
    
    # We lowered the threshold slightly because the new formula is smoother
    if best_score >= 0.65:
        print(f"✅ Fixed-weight match: {best.get('name')} | expected={best.get('weight_g')}g | measured={median}g")
        return {"status": "verified", "matched_item": best}
    elif best_score >= 0.40:
        return {"status": "ambiguous", "candidates": candidates}
    else:
        # ✅ Always return candidates even on failure
        return {"status": "failed", "candidates": candidates}

def decide_removal(det_doc, cart_id=None):
    """
    Determine which candidate was removed based on weight readings and cart contents.
    """
    readings = det_doc.get("weight_readings", []) or []
    if not readings:
         # Changed to match the failure state your router expects if readings are missing
        return {"status": "failed", "candidates": det_doc.get("candidate_items", [])}

    sorted_r = sorted(readings)
    median = sorted_r[len(sorted_r)//2]

    candidates = det_doc.get("candidate_items", [])
    if not candidates:
        return {"status": "failed", "candidates": []}

    # 🧠 Step 1: Variable-weight bypass
    variable_candidates = [c for c in candidates if c.get("weight_type") == "variable"]
    if variable_candidates:
        best = variable_candidates[0]
        print(f"✅ Variable-weight removal detected: {best.get('name')}")
        return {"status": "removed", "matched_item": best}

    # 🧠 Step 2: Fixed-weight removal logic
    from utils.db import get_db
    db = get_db()
    cart_items = []
    if cart_id:
        cart = db["carts"].find_one({"cart_id": cart_id}) or {}
        cart_items = cart.get("items", [])

    scores = []
    for c in candidates:
        expected = c.get("weight_g") or 0
        if expected <= 0:
            weight_score = 0
        else:
            diff = abs(median - expected)
            effective_diff = max(0, diff - 15)
            
            import math
            weight_score = math.exp(-effective_diff / expected)
            
        in_cart_bonus = 0.2 if any(ci.get("item_id")==c.get("item_id") for ci in cart_items) else 0.0
        camera_conf = det_doc.get("camera_confidence", 0.0)
        
        final_score = 0.6 * camera_conf + 0.4 * weight_score + in_cart_bonus
        scores.append((c, final_score))

    if not scores:
        return {"status": "failed", "candidates": candidates}

    best, best_score = max(scores, key=lambda x: x[1])

    if best_score >= 0.7:
        return {"status": "removed", "matched_item": best}
    elif best_score >= 0.45:
        return {"status": "ambiguous", "candidates": candidates}
    else:
        return {"status": "failed", "candidates": candidates}