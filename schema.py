from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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

class OrderSchema(BaseModel):
    orden: str
    franquicia: Optional[str] = None
    tipo_orden: Optional[str] = None
    subtotal: Optional[float] = None
    tax: Optional[float] = None
    total: Optional[float] = None
    item_discount: Optional[float] = None
    fecha_apertura: Optional[datetime] = None
    fecha_cierre: Optional[datetime] = None
    empleado_abre: Optional[str] = None
    empleado_cierra: Optional[str] = None
    discountname: Optional[str] = None

    class Config:
        orm_mode = True
