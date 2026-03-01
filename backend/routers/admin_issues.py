from fastapi import APIRouter, Depends
from dependencies.admin_dependency import verify_admin_token
from services.admin_issue_service import (
    get_all_issues,
    get_issue,
    update_issue
)

router = APIRouter(prefix="/admin/issues", tags=["Admin Issues"])


@router.get("/")
def all_issues(admin=Depends(verify_admin_token)):
    issues = get_all_issues(admin["store_id"])
    return {"status": "success", "issues": issues}


@router.get("/{issue_id}")
def single_issue(issue_id: str, admin=Depends(verify_admin_token)):
    issue = get_issue(admin["store_id"], issue_id)

    if not issue:
        return {"status": "error", "message": "Issue not found"}

    return {"status": "success", "issue": issue}


@router.put("/{issue_id}")
def resolve_issue(issue_id: str, payload: dict, admin=Depends(verify_admin_token)):
    modified = update_issue(admin["store_id"], issue_id, payload)

    if modified == 0:
        return {"status": "error", "message": "Update failed"}

    return {"status": "success", "message": "Issue updated"}