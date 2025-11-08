from fastapi import FastAPI
from routers import store,cart,path_optimizer,alerts,shopping_list,auth
from utils.db import connect_to_mongo

app = FastAPI(title="Cartify GnG Backend", version="1.0.0")

@app.on_event("startup")
def startup_event():
    connect_to_mongo()

app.include_router(store.router)
app.include_router(auth.router)
app.include_router(cart.router)
app.include_router(shopping_list.router)
app.include_router(path_optimizer.router)
app.include_router(alerts.router)


@app.get("/")
def root():
    return {"message": "Cartify GnG backend is running!"}
