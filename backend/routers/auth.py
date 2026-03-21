from fastapi import APIRouter
from datetime import datetime
from utils.db import get_db
import hashlib
import re
router = APIRouter(prefix="/user", tags=["User Auth"])

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def is_valid_email(email: str) -> bool:
    if not email: return False
    return bool(re.match(r"[^@]+@[^@]+\.[^@]+", email))

@router.post("/signup")
def signup_user(data: dict):
    db = get_db()
    email = data.get("email")
    phone = data.get("phone")
    name = data.get("name")
    password = data.get("password")

    # 1. Validation Rules
    if not name or len(name.strip()) < 2:
        return {"status": "error", "message": "Valid name is required"}
    
    if not email and not phone:
        return {"status": "error", "message": "Email or 10-digit phone number required"}
    
    if email and not is_valid_email(email):
        return {"status": "error", "message": "Invalid email format"}
    
    if phone and (not phone.isdigit() or len(phone) != 10):
        return {"status": "error", "message": "Phone number must be 10 digits"}

    if not password or len(password) < 8:
        return {"status": "error", "message": "Password must be at least 8 characters"}

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
        "receipts": [],
        "loyalty_points": 0
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
