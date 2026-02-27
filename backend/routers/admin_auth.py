# admin_auth.py
from fastapi import APIRouter
from datetime import datetime,timedelta
from utils.db import get_db
from utils.config import settings
import hashlib
import jwt
import os

router = APIRouter(prefix="/admin", tags=["Admin Auth"])

def hash_password(pw: str) -> str:
    return hashlib.sha256(pw.encode()).hexdigest()

def generate_token(payload: dict):
    expire = datetime.utcnow() + timedelta(days=settings.ACCESS_TOKEN_EXPIRE_DAYS)

    payload.update({"exp": expire})

    return jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
# ---------------------------------------------------
# CREATE STORE ADMIN
# ---------------------------------------------------

@router.post("/create")
def create_admin(data: dict):
    """
    {
        "name": "Admin Name",
        "email": "admin@store.com",
        "password": "123456",
        "store_id": "STR001"
    }
    """
    db = get_db()

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    store_id = data.get("store_id")

    if not all([name, email, password, store_id]):
        return {"status": "error", "message": "All fields required"}

    # Check if store exists
    store = db["stores"].find_one({"store_id": store_id})
    if not store:
        return {"status": "error", "message": "Store not found"}

    # Check if admin already exists
    existing = db["users"].find_one({"email": email})
    if existing:
        return {"status": "error", "message": "Admin already exists"}

    admin_id = f"ADM{str(datetime.utcnow().timestamp()).replace('.', '')[-6:]}"

    db["users"].insert_one({
        "user_id": admin_id,
        "name": name,
        "email": email,
        "password_hash": hash_password(password),
        "role": "store_admin",
        "store_id": store_id,
        "status": "active",
        "created_at": datetime.utcnow().isoformat()
    })

    return {
        "status": "success",
        "admin_id": admin_id,
        "store_id": store_id
    }

# ---------------------------------------------------
# ADMIN LOGIN
# ---------------------------------------------------

@router.post("/login")
def login_admin(data: dict):
    """
    {
        "email": "admin@store.com",
        "password": "123456"
    }
    """
    db = get_db()

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return {"status": "error", "message": "Email and password required"}

    admin = db["users"].find_one({
        "email": email,
        "role": "store_admin"
    })

    if not admin:
        return {"status": "error", "message": "Admin not found"}

    if admin.get("password_hash") != hash_password(password):
        return {"status": "error", "message": "Incorrect password"}

    if admin.get("status") != "active":
        return {"status": "error", "message": "Admin account inactive"}

    token_payload = {
        "user_id": admin["user_id"],
        "store_id": admin["store_id"],
        "role": "store_admin",
        "exp": datetime.now().timestamp() + 86400
    }

    token = generate_token(token_payload)

    return {
        "status": "success",
        "token": token,
        "admin": {
            "user_id": admin["user_id"],
            "name": admin.get("name"),
            "store_id": admin.get("store_id")
        }
    }
    
@router.post("/logout")
def logout_admin():
    """
    Simple logout for stateless JWT.
    Frontend should delete token.
    """
    return {
        "status": "success",
        "message": "Logged out successfully"
    }