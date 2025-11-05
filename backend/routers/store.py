from fastapi import APIRouter
from utils.db import get_db

router = APIRouter(prefix="/store", tags=["Store"])

@router.post("/create")
def create_store(store: dict):
    db = get_db()
    result = db["stores"].insert_one(store)
    return {"message": "Store created", "store_id": str(result.inserted_id)}

@router.get("/all")
def get_stores():
    db = get_db()
    stores = list(db["stores"].find({}))
    for s in stores:
        s["_id"] = str(s["_id"])
    return {"stores": stores}
