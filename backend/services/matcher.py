from utils.db import get_db
from difflib import get_close_matches

def match_items(user_items):
    db = get_db()
    store_items = list(db["items"].find({}, {"_id": 0}))

    matched = []
    not_found = []

    all_names = [item.get("name", "").lower() for item in store_items]

    for u_item in user_items:
        name = (u_item.get("name") or "").lower().strip()
        if not name:
            continue

        # try exact label_variant match first
        candidate_group = [
            it for it in store_items
            if name in [v.lower() for v in it.get("label_variants", [])]
        ]

        if not candidate_group:
            # try approximate name match
            match = get_close_matches(name, all_names, n=1, cutoff=0.6)
            if match:
                base_name = match[0].split("(")[0].strip()
                # find all items starting with the same base name (Good Day Biscuit)
                candidate_group = [
                    it for it in store_items
                    if it.get("name", "").lower().startswith(base_name)
                ]

        if candidate_group:
            matched.extend(candidate_group)
        else:
            not_found.append({"name": u_item.get("name"), "not_found": True})

    return {"matched_items": matched, "not_found": not_found}



