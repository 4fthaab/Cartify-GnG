from utils.db import get_db
from difflib import get_close_matches

def match_items(user_items, store_id):
    db = get_db()

    products = db["itemdata"]
    items = db["items"]

    matched_items = []
    not_found = []

    for u in user_items:
        query = u["name"].lower().strip()

        # 1️⃣ Find matching products
        matched_products = products.find({
            "label_variants": {
                "$elemMatch": {
                    "$regex": f"^{query}$",
                    "$options": "i"
                }
            }
        })

        product_ids = [p["product_id"] for p in matched_products]

        if not product_ids:
            not_found.append({"name": u["name"]})
            continue

        # 2️⃣ Find store items
        store_items = list(items.find({
            "store_id": store_id,
            "product_id": {"$in": product_ids},
            "is_active": True
        }, {"_id": 0}))
        for si in store_items:
            product = products.find_one({"product_id": si["product_id"]})
            if product:
                si["weight_g"] = product.get("weight_g")
                si["weight_type"] = product.get("weight_type", "fixed")
                si["unit_price_per_kg"] = product.get("unit_price_per_kg")
                si["label_variants"] = product.get("label_variants", [])
                si["name"] = product.get("name")

        if store_items:
            matched_items.extend(store_items)
        else:
            not_found.append({"name": u["name"]})
    
    print("User input:", u)
    print("Matched product_ids:", product_ids)
    print("Store items found:", store_items)

    return {
        "matched_items": matched_items,
        "not_found": not_found
    }


