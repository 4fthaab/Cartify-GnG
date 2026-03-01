from utils.db import get_db


def get_store_ratings(store_id: str):
    db = get_db()

    ratings = list(
        db["ratings"].find(
            {"target_type": "supermarket", "target_id": store_id},
            {"_id": 0}
        )
    )

    if not ratings:
        return {"average": None, "count": 0, "ratings": []}

    avg = round(sum(r["rating"] for r in ratings) / len(ratings), 2)

    return {
        "average": avg,
        "count": len(ratings),
        "ratings": ratings
    }