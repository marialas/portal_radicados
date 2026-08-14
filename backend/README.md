# Backend Python · FastAPI - INTECOAL SAS

Servicio API REST independiente desarrollado en **Python (FastAPI)** para la gestión documental de Alumbrado Público, revisión RETILAP/RETIE, actas de recibo de conformidad y firmas digitales.

## 🚀 Requisitos
- Python 3.10+
- `pip`

## 🛠️ Instalación y Ejecución Local

```bash
# 1. Navegar a la carpeta backend
cd backend

# 2. Crear entorno virtual (opcional pero recomendado)
python -m venv venv
source venv/bin/activate  # En Linux/macOS
# venv\Scripts\activate   # En Windows

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Iniciar el servidor FastAPI con Uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

El servidor estará activo en `http://localhost:8000`.

## 📄 Documentación Interactiva OpenAPI (Swagger)
Acceda a la documentación automática de endpoints, esquemas Pydantic y pruebas en vivo ingresando a:
- **Swagger UI:** `http://localhost:8000/docs`
- **ReDoc UI:** `http://localhost:8000/redoc`

## 📡 Endpoints Principales

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Verificación de estado del backend |
| `GET` | `/api/documentos/catalogo` | Catálogo oficial de 21 ítems RETILAP/RETIE |
| `GET` | `/api/radicacion/lista` | Listar expedientes con filtros (municipio, estado, búsqueda) |
| `GET` | `/api/radicacion/{id}` | Detalle completo de una radicación |
| `POST` | `/api/radicacion/nueva` | Crear nuevo expediente radicado con archivos |
| `PATCH` | `/api/radicacion/{id}/estado` | Actualizar evaluación de interventoría y firmas |
| `POST` | `/api/auth/token` | Autenticación MSAL / Microsoft 365 |

## 🐳 Despliegue con Docker

```bash
docker build -t intecoal-fastapi-backend .
docker run -d -p 8000:8000 intecoal-fastapi-backend
```

Compatible para despliegue directo en **Render**, **Railway**, **Google Cloud Run**, **AWS ECS** o **Fly.io**.
