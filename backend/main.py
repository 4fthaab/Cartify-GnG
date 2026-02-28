from fastapi import FastAPI
from routers import store,cart,path_optimizer,alerts,shopping_list,auth,mock_payment,admin_store,admin_dashboard,admin_auth,admin_items,admin_inventory,admin_alerts,admin_carts,admin_layout,admin_offers,admin_orders
from utils.db import connect_to_mongo
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer

app = FastAPI(title="Cartify GnG Backend", version="1.0.0")

@app.on_event("startup")
def startup_event():
    connect_to_mongo()

app.include_router(store.router)
app.include_router(admin_auth.router)
app.include_router(admin_store.router)
app.include_router(admin_dashboard.router)
app.include_router(admin_items.router)
app.include_router(admin_inventory.router)
app.include_router(admin_orders.router)
app.include_router(admin_carts.router)
app.include_router(admin_offers.router)  
app.include_router(admin_alerts.router)
app.include_router(admin_layout.router)


app.include_router(auth.router)
app.include_router(cart.router)
app.include_router(shopping_list.router)
app.include_router(path_optimizer.router)
app.include_router(alerts.router)
app.include_router(mock_payment.router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or restrict to specific frontend URLs later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Cartify GnG backend is running!"}
