from pymongo import MongoClient
from utils.config import settings
import certifi

_client = None
_db = None

def connect_to_mongo():
    global _client, _db
    try:
        _client = MongoClient(settings.MONGO_URI, tlsCAFile=certifi.where())
        _db = _client[settings.DB_NAME]
        print(f"✅ Connected to MongoDB Atlas database: {settings.DB_NAME}")
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")

def get_db():
    global _db
    if _db is None:
        connect_to_mongo()
    return _db
