from fastapi import FastAPI
from routers import store
from utils.db import connect_to_mongo

app = FastAPI(title="Cartify GnG Backend", version="1.0.0")

@app.on_event("startup")
def startup_event():
    connect_to_mongo()

app.include_router(store.router)

@app.get("/")
def root():
    return {"message": "Cartify GnG backend is running!"}
