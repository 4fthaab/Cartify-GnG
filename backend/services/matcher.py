from utils.db import get_db

def match_items(user_items, store_id):
    db = get_db()
    items = db["items"]

    matched_items = []
    not_found = []

    for u in user_items:
        query = u.get("name", "").strip().lower()

        if not query:
            continue

        # 🔍 Flexible partial match on label_variants
        candidates = list(items.find(
            {
                "store_id": store_id,
                "is_active": True,
                "label_variants": {
                    "$elemMatch": {
                        "$regex": query,
                        "$options": "i"
                    }
                }
            },
            {"_id": 0}  # exclude Mongo _id
        ))

        if candidates:
            matched_items.extend(candidates)
        else:
            not_found.append({"name": u.get("name")})

    return {
        "matched_items": matched_items,
        "not_found": not_found
    }