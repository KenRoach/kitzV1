import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Datos de conexión a PostgreSQL (¡Modifica con tus credenciales!)
DB_USER = "postgres"
DB_PASSWORD = "uRJn5h|U{$CoO06("
#DB_PASSWORD = 2jKx0G23Odpx!
DB_HOST = "34.133.217.13"  # Ejemplo: "localhost" o "127.0.0.1"
DB_PORT = "5432"  # Puerto por defecto de PostgreSQL
DB_NAME = "postgres"

DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Config:
    SQLALCHEMY_DATABASE_URI = DATABASE_URL
    SQLALCHEMY_TRACK_MODIFICATIONS = False
