from pymongo import MongoClient
import certifi

uri = "mongodb+srv://cartify_admin:grabngo123@cartify-gng-db.fkaa21v.mongodb.net/?retryWrites=true&w=majority&appName=Cartify-GnG-DB"

try:
    client = MongoClient(uri, tlsCAFile=certifi.where())
    print("✅ Connected successfully!")
    print("Databases:", client.list_database_names())
except Exception as e:
    print("❌ Connection failed:", e)
