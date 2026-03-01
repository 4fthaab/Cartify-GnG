from utils.db import get_db
from datetime import datetime


def get_all_issues(store_id: str):
    db = get_db()

    return list(
        db["issues"].find(
            {"store_id": store_id},
            {"_id": 0}
        ).sort("created_at", -1)
    )


def get_issue(store_id: str, issue_id: str):
    db = get_db()

    return db["issues"].find_one(
        {"store_id": store_id, "issue_id": issue_id},
        {"_id": 0}
    )


def update_issue(store_id: str, issue_id: str, payload: dict):
    db = get_db()

    update_data = {
        "updated_at": datetime.utcnow().isoformat()
    }

    if "status" in payload:
        update_data["status"] = payload["status"]

        if payload["status"] == "resolved":
            update_data["resolved_at"] = datetime.utcnow().isoformat()

    if "admin_response" in payload:
        update_data["admin_response"] = payload["admin_response"]

    result = db["issues"].update_one(
        {"store_id": store_id, "issue_id": issue_id},
        {"$set": update_data}
    )

    return result.modified_count