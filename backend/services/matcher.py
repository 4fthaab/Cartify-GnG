import re
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

        escaped_query = re.escape(query)
        best_match = None

        # 🥇 TIER 1: Exact Match
        best_match = items.find_one(
            {
                "store_id": store_id,
                "is_active": True,
                "$or": [
                    {"name": {"$regex": f"^{escaped_query}$", "$options": "i"}},
                    {"label_variants": {"$elemMatch": {"$regex": f"^{escaped_query}$", "$options": "i"}}}
                ]
            },
            {"_id": 0}
        )

        # 🥈 TIER 2: "Starts With" Match 
        # (e.g., "Apple" successfully finds "Apple - Royal Gala")
        if not best_match:
            best_match = items.find_one(
                {
                    "store_id": store_id,
                    "is_active": True,
                    "$or": [
                        {"name": {"$regex": f"^{escaped_query}", "$options": "i"}},
                        {"label_variants": {"$elemMatch": {"$regex": f"^{escaped_query}", "$options": "i"}}}
                    ]
                },
                {"_id": 0}
            )

        # 🥉 TIER 3: "Word Boundary" Substring Match 
        # (e.g., prevents "Apple" from matching "Pineapple", but matches "Fresh Apple")
        if not best_match:
            best_match = items.find_one(
                {
                    "store_id": store_id,
                    "is_active": True,
                    "$or": [
                        {"name": {"$regex": f"\\b{escaped_query}\\b", "$options": "i"}},
                        {"label_variants": {"$elemMatch": {"$regex": f"\\b{escaped_query}\\b", "$options": "i"}}}
                    ]
                },
                {"_id": 0}
            )

        if best_match:
            matched_items.append(best_match)
        else:
            not_found.append({"name": u.get("name")})

    return {
        "matched_items": matched_items,
        "not_found": not_found
    }