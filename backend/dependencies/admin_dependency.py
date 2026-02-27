from fastapi import Security, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from utils.config import settings

security = HTTPBearer()

def verify_admin_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
):
    try:
        token = credentials.credentials

        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        if payload.get("role") != "store_admin":
            raise HTTPException(status_code=403, detail="Not authorized")

        return {
            "user_id": payload.get("user_id"),
            "store_id": payload.get("store_id")
        }

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")