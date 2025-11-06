from utils.db import get_db
from difflib import get_close_matches

def match_items(user_items):
    db = get_db()
    store_items = list(db["items"].find({}, {"_id": 0}))

    matched = []
    not_found = []

    all_names = [item.get("name","").lower() for item in store_items]
    # also include label_variants in search tokens (optional improvement)
    for u_item in user_items:
        name = (u_item.get("name") or "").lower().strip()
        if not name:
            continue
        # try exact label_variants first
        candidate = None
        for it in store_items:
            variants = it.get("label_variants", [])
            if name in [v.lower() for v in variants]:
                candidate = it
                break
        if not candidate:
            match = get_close_matches(name, all_names, n=1, cutoff=0.6)
            if match:
                candidate = next((it for it in store_items if it.get("name","").lower() == match[0]), None)
        if candidate:
            matched.append(candidate)
        else:
            not_found.append({"name": u_item.get("name"), "not_found": True})
    return {"matched_items": matched, "not_found": not_found}
