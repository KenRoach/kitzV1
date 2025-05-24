from fastapi import FastAPI, Depends, HTTPException, Request,APIRouter
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.encoders import jsonable_encoder
from fastapi.responses import JSONResponse
from datetime import datetime, timedelta
from pathlib import Path
from typing import List
from modelo import Base, Order, TicketItem, Payment, CashReturn  ,MenuHomologado
from pydantic import BaseModel
import uvicorn
import models, schema
from config import SessionLocal, engine
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker,Session

origins = [
    "http://localhost",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    # Agrega aquí otros orígenes si es necesario
]

models.Base.metadata.create_all(bind=engine)
app = FastAPI(title="Order API", description="API para gestionar órdenes", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Permite solicitudes desde estos orígenes
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos los métodos HTTP
    allow_headers=["*"],  # Permite todos los encabezados
)

# Pydantic Schemas
class TicketItemSchema(BaseModel):
    nombre: str
    cantidad: int
    precio: float
    impuesto: float

    class Config:
        orm_mode = True

class PaymentSchema(BaseModel):
    metodo: str
    monto: float
    descripcion: str

    class Config:
        orm_mode = True

class CashReturnSchema(BaseModel):
    monto: float
    moneda: str
    descripcion: str

    class Config:
        orm_mode = True

class MenuHomologadoSchema(BaseModel):
    Item_Name: str
    Sale_Price: float
    Category_Code: str
    SubCategoria: str
    Category_Name: str
    Tax: float
    Special_Price: float
    Description: str

    class Config:
        orm_mode = True

class OrderSchema(BaseModel):
    orden: str
    franquicia: str
    tipo_orden: str
    subtotal: float
    tax: float
    total: float
    item_discount: float
    fecha_apertura: str
    fecha_cierre: str
    empleado_abre: str
    empleado_cierra: str
    discountname: str

    class Config:
        orm_mode = True

class OrderRequest(BaseModel):
    order: OrderSchema
    items: List[TicketItemSchema]
    payments: List[PaymentSchema]

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Para servir templates
BASE_DIR = Path(__file__).resolve().parent
templates = Jinja2Templates(directory=str(BASE_DIR / "frontend"))

# Opcional: para servir archivos estáticos como CSS o JS
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# Endpoints
@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request, "message": "Hola desde FastAPI!"})

# Endpoints POS
@app.get("/POS", response_class=HTMLResponse)
async def read_root1(request: Request):
    return templates.TemplateResponse("POS.html", {"request": request, "message": "Hola desde FastAPI!"})

# Endpoints Ecommerce
@app.get("/ecommerce", response_class=HTMLResponse)
async def read_root2(request: Request):
    return templates.TemplateResponse("ecommerce.html", {"request": request, "message": "Hola desde FastAPI!"})

# Endpoints datos
@app.get("/datos", response_class=HTMLResponse)
async def read_root3(request: Request):
    return templates.TemplateResponse("datos.html", {"request": request, "message": "Hola desde FastAPI!"})




@app.get("/orders/", response_model=List[OrderSchema])
def read_orders(db: Session = Depends(get_db)):
    try:
        today = datetime.now().date()
        yesterday = today - timedelta(days=1)

        orders = db.query(Order).filter(
            Order.fecha_apertura >= datetime.combine(today, datetime.min.time()),
            Order.fecha_apertura <= datetime.combine(today, datetime.max.time())
        ).all()

        json_compatible_orders = jsonable_encoder(orders)
        return JSONResponse(content=json_compatible_orders)
    except Exception as e:
        return {"error": str(e)}

@app.get("/menu/", response_model=List[MenuHomologadoSchema])
def read_menu1(db: Session = Depends(get_db)):
    try:
        menu_items = db.query(models.MenuHomologado).all()
        json_compatible_orders = jsonable_encoder(menu_items)
        return JSONResponse(content=json_compatible_orders)
    except Exception as e:
        return JSONResponse(content={"error": str(e)})

@app.post("/orders/")
def crear_orden(request: OrderRequest, db: Session = Depends(get_db)):
    db_order = Order(**request.order.dict())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)

    for item in request.items:
        db_item = TicketItem(**item.dict(), order_id=db_order.id)
        db.add(db_item)

    for payment in request.payments:
        db_payment = Payment(**payment.dict(), order_id=db_order.id)
        db.add(db_payment)

    db.commit()
    return {"message": "Orden creada", "order_id": db_order.id}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
