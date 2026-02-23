from fastapi import APIRouter
from datetime import datetime
from utils.db import get_db
import hashlib

router = APIRouter(prefix="/user", tags=["User Auth"])

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

@router.post("/signup")
def signup_user(data: dict):
    """
    { "name":"USER123", "email":"user1@test.com", "phone":"9999999999", "password":"123456" }
    """
    db = get_db()
    email = data.get("email")
    phone = data.get("phone")
    name = data.get("name")
    password = data.get("password")

    if not (email or phone):
        return {"status": "error", "message": "Email or phone required"}

    query = []

    if email:
        query.append({"email": email})

    if phone:
        query.append({"phone": phone})

    if query and db["users"].find_one({"$or": query}):
        return {"status": "error", "message": "User already exists"}

    user_id = f"USR{str(datetime.utcnow().timestamp()).replace('.', '')[-6:]}"
    db["users"].insert_one({
        "user_id": user_id,
        "name": name,
        "email": email,
        "phone": phone,
        "password_hash": hash_password(password),
        "created_at": datetime.utcnow().isoformat(),
        "shopping_lists": [],
        "receipts": []
    })

    return {"status": "success", "user_id": user_id}

@router.post("/login")
def login_user(data: dict):
    """
    { "email":"user1@test.com", "password":"123456" }
    """
    db = get_db()
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")

    q = {}
    if email:
        q["email"] = email
    elif phone:
        q["phone"] = phone

    user = db["users"].find_one(q)
    if not user:
        return {"status": "error", "message": "User not found"}

    if user.get("password_hash") != hash_password(password):
        return {"status": "error", "message": "Incorrect password"}

    return {
        "status": "success",
        "user_id": user["user_id"],
        "name": user.get("name"),
        "email": user.get("email"),
        "phone": user.get("phone")
    }
