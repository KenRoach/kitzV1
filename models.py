from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from config import Base

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    orden = Column(String, unique=True, nullable=False)
    franquicia = Column(String)
    tipo_orden = Column(String)
    subtotal = Column(Float)
    tax = Column(Float)
    total = Column(Float)
    item_discount = Column(Float)
    fecha_apertura = Column(DateTime)
    fecha_cierre = Column(DateTime)
    empleado_abre = Column(String)
    empleado_cierra = Column(String)
    discountname = Column(String)

    items = relationship("TicketItem", back_populates="order")
    payments = relationship("Payment", back_populates="order")
    cash_returns = relationship("CashReturn", back_populates="order")

class TicketItem(Base):
    __tablename__ = "ticket_items"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String)
    cantidad = Column(Integer)
    precio = Column(Float)
    impuesto = Column(Float)
    order_id = Column(Integer, ForeignKey("orders.id"))
    order = relationship("Order", back_populates="items")

class Payment(Base):
    __tablename__ = "payments"
    id = Column(Integer, primary_key=True, index=True)
    metodo = Column(String)
    monto = Column(Float)
    descripcion = Column(String)
    order_id = Column(Integer, ForeignKey("orders.id"))
    order = relationship("Order", back_populates="payments")

class CashReturn(Base):
    __tablename__ = "devoluciones"
    id = Column(Integer, primary_key=True, index=True)
    monto = Column(Float)
    moneda = Column(String)
    descripcion = Column(String)
    order_id = Column(Integer, ForeignKey("orders.id"))
    order = relationship("Order", back_populates="cash_returns")

class MenuHomologado(Base):
    __tablename__ = "menu_homologado"
    __table_args__ = {'schema': 'public'}

    Code = Column("Code", String, primary_key=True, index=True)
    Item_Name = Column("Item Name", String(200))
    Sale_Price = Column("Sale Price", Float)
    Category_Code = Column("Category Code", String(200))
    SubCategoria = Column("SubCategoria", String(200))
    Category_Name = Column("Category Name", String(200))
    Tax = Column("Tax", Float)
    Special_Price = Column("Special Price", Float)
    Description = Column("Description", String(200))
