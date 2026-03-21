from fastapi import APIRouter
from utils.db import get_db

router = APIRouter(prefix="/store", tags=["Store"])

@router.post("/create")
def create_store(store: dict):
    """
    { "store_id":"STR001", "name":"Cartify SuperMart", "location":"Calicut" }
    """
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

@router.get("/layout/{store_id}")
def get_store_layout(store_id: str):
    """
    Returns the store layout JSON (the ST001.json-style document) for a given store.
    The layout document is stored in the store_layouts collection under the key store_id.
    """
    db = get_db()
    layout = db["store_layouts"].find_one({"store_id": store_id}, {"_id": 0})
    if not layout:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail=f"Layout for store {store_id} not found")
    return layout

@router.get("/items/{store_id}")
def get_store_items(store_id: str):
    """
    Fetch all active items for a specific store to power the frontend search.
    """
    db = get_db()
    # Fetch items, excluding the MongoDB ObjectId for JSON serialization
    items = list(db["items"].find({"store_id": store_id, "is_active": True}, {"_id": 0}))
    
    if not items:
        return {"items": []}
        
    return {"items": items}