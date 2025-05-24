
import os
import pandas as pd
import sqlite3
import json
import requests
from requests.auth import HTTPBasicAuth
from io import StringIO
import re
import json
import datetime
from pandas import json_normalize
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from datetime import date, datetime
from modelo import Base, Order, TicketItem, Payment, CashReturn  # Importa tus modelos
from flask import Flask, render_template, request, jsonify, redirect, url_for
"""
ya
-Calendarizar
-Monitorearla grafana
-API que tenga Forward Automatico
-colocarle los logs
------------------------
semana
-disenar la base datos de redundancia
-----------------------
otros
-crm
-colocar info de marketing
-pedidos ya
-dgi

"""


# Datos de conexión a PostgreSQL (¡Modifica con tus credenciales!)
DB_USER = "postgres"
DB_PASSWORD = "uRJn5h|U{$CoO06("
#DB_PASSWORD = 2jKx0G23Odpx!
DB_HOST = "34.133.217.13"  # Ejemplo: "localhost" o "127.0.0.1"
DB_PORT = "5432"  # Puerto por defecto de PostgreSQL
DB_NAME = "postgres"

# Crear conexión con PostgreSQL
engine = create_engine(f"postgresql+psycopg2://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}")


Session = sessionmaker(bind=engine)
session = Session()
app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/ejecutar", methods=["GET"])
def ejecutar_carga_completa():
    Base.metadata.create_all(engine)
    try:
        print("🔄 Iniciando carga de datos...")
        data = cargar_json()
        if data == "Fallo":
            return "Error al obtener datos de Invupos.", 500
        y = csv_cat()
        print("Carga Lista")
        y.to_sql("Categorias", engine, if_exists="replace", index=False)
        cargar_datos(data)
        return "✅ Carga completada exitosamente.", 200

    except Exception as e:
        print(f"❌ Error durante ejecución: {e}")
        return f"Error: {str(e)}", 500

def procesar_json(json_data):
    """Convierte un JSON en objetos de la base de datos"""
    try:
        # Limpiar campos monetarios
        limpiar_moneda = lambda x: float(x.replace("$", "").strip()) if x else 0.0
        
        order = Order(
            orden=json_data["Orden"],
            franquicia=json_data["Franquicia"],
            tipo_orden=json_data["Tipo de orden"],
            subtotal=limpiar_moneda(json_data["Subtotal"]),
            tax=limpiar_moneda(json_data["Tax"]),
            total=limpiar_moneda(json_data["Total"]),
            fecha_apertura=datetime.strptime(json_data["Fecha de apertura"], "%Y-%m-%d %H:%M:%S"),
            fecha_cierre=datetime.strptime(json_data["Fecha de Cierre"], "%Y-%m-%d %H:%M:%S"),
            empleado_abre=json_data["Empleado Abre"],
            empleado_cierra=json_data["Empleado Cierre"],
            item_discount=limpiar_moneda(json_data["Item Discount"]),
            discountname=json_data["discountName"]
        )
        
        # Procesar items
        for item in json_data["ticketDataJson"]["items"]:
            order.items.append(TicketItem(
                nombre=item["name_item"],
                cantidad=item["quantity"],
                precio=item["price"],
                impuesto=item["tax"]
            ))
        
        # Procesar pagos
        for pago in json_data["ticketDataJson"]["payments"]:
            order.payments.append(Payment(
                metodo=pago["name"],
                monto=pago["total"],
                descripcion=f"Pago {pago['name']}"
            ))
        
        # Procesar devoluciones
        for devolucion in json_data["ticketDataJson"]["cashReturns"]:
            order.cash_returns.append(CashReturn(
                monto=devolucion["monto"],
                moneda=devolucion["nombreMoneda"],
                descripcion=devolucion["payDescription"]
            ))
        
        return order
    
    except KeyError as e:
        print(f"Error en JSON {json_data.get('Orden', '')}: Campo faltante - {e}")
        return None
    except ValueError as e:
        print(f"Error en JSON {json_data.get('Orden', '')}: Valor inválido - {e}")
        return None

def cargar_datos(lista_json):
    """Carga una lista de JSONs a la base de datos"""
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        existing_orders = {result[0] for result in session.query(Order.orden).all()}
        for json_data in lista_json:
            if orden := procesar_json(json_data):
                if orden.orden not in existing_orders:  # Verificar en memoria
                    session.add(orden)
                    existing_orders.add(orden.orden)  # Actualizar caché
                    print(f"Orden Ingresada {orden.orden} - Ingresado")
                else:
                    print(f"Orden duplicada {orden.orden} - Omitiendo")
        session.commit()
        print(f"¡Datos cargados exitosamente! Órdenes procesadas: {len(lista_json)}")
    
    except Exception as e:
        session.rollback()
        print(f"Error general: {e}")
    
    finally:
        session.close()

def csv_cat():
    csv_file = "Categoria.csv"  # Cambia esto por la ruta real
# Leer el CSV manejando posibles problemas con separadores
    df = pd.read_csv(csv_file, delimiter=",", quotechar='"', skip_blank_lines=True)
    print("Csv Ok✅")
    return df

def cargar_json():
    # Credenciales de autenticación
    username = "Kenneth.MealKitz"
    password = "Kenneth.Mealkitz000"
    fecha_hoy = date.today().strftime("%Y-%m-%d")
    # URLs de los endpoints
    url_dashboard = "https://admindev.invupos.com/dashboard"
    url_middles   = "https://reportes2.invupos.com/reports/bd_mealkitz/false/es"
    url_ordenesCerrada   = f"https://reportes2.invupos.com/orders/1,2,4/2022-02-01/{fecha_hoy}"
    #url_ordenesXitmMod   = f"https://reportes2.invupos.com/orders/1,2,4/2022-02-01/{fecha_hoy}"
    #url_ordenesDescuen   = f"https://reportes2.invupos.com/discount/2022-02-01/{fecha_hoy}"\

    # Crear una sesión que gestione las cookies y autenticación
    session = requests.Session()

    # Realizar la solicitud al dashboard para establecer la sesión
    response_dashboard = session.get(url_dashboard, auth=HTTPBasicAuth(username, password))
    if response_dashboard.status_code == 200:
        print("Login en dashboard exitoso ✅")
    else:
        print("Error en el login del dashboard:", response_dashboard.status_code)

    # (Opcional) Realizar la solicitud al endpoint "middles" si es necesario para cargar algún header o token
    response_middles = session.get(url_middles, auth=HTTPBasicAuth(username, password))
    if response_middles.status_code == 200:
        print("Acceso a middles exitoso ✅")
    else:
        print("Error en middles:", response_middles.status_code)

    # Ahora se puede acceder al endpoint de órdenes con la sesión establecida
    response_ordenes = session.get(url_ordenesCerrada, auth=HTTPBasicAuth(username, password))
    if response_ordenes.status_code == 200:
        pattern =  r"if\s*\(!showDownloadPopup\)\s*{\s*dataBuffer\s*=\s*`([\s\S]*?)`;"
        match = re.search(pattern, response_ordenes.text, re.DOTALL)
        if match:
            json_str = match.group(1)
            try:
                data_dict = json.loads(json_str)
                
                print("\nContenido convertido a JSON Pa Dataframe ✅")
                #with open("DetallesDeOrdenes.json", "w", encoding="utf-8") as f:
                #    json.dump(data_dict, f, ensure_ascii=False, indent=4)
                return data_dict
                #with open("DetallesDeOrdenes.json", "w", encoding="utf-8") as f:
                #    json.dump(data, f, ensure_ascii=False, indent=4)

            except json.JSONDecodeError as e:
                #with open("Output.txt", "w") as text_file:
                #    text_file.write(json_str)
                df = pd.DataFrame()
        else:
            print("No se encontró el JSON en la respuesta.")
        return "Fallo"
    else:
        print("Error al obtener órdenes:", response_ordenes.status_code)
        return "Fallo"



if __name__ == "__main__":
    # Crear tablas si no existen
    #app.run(debug=True, port=5000)
    Base.metadata.create_all(engine)
    data = cargar_json()
    y = csv_cat()

    print("Carga Lista")
    
    y.to_sql("Categorias", engine, if_exists="replace", index=False)
    cargar_datos(data)
    print("Exitoso")