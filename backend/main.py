import os
import json
import shutil
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List
from contextlib import asynccontextmanager

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Request, Query
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from jose import jwt, JWTError

from modelos import (
    CATALOGO_21_DOCUMENTOS, ESTADOS, GRUPOS_CARPETA,
    generar_numero_radicado, generar_id, calcular_porcentaje,
    inicializar_archivos_desde_catalogo,
)

try:
    from grafos import GraphService
except ImportError as _imp_err:
    print(f"[WARNING] No se pudo importar GraphService: {_imp_err}")
    GraphService = None

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-change-in-production")
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

MIME_PERMITIDOS = {
    "application/pdf",
}
MAX_TAMANIO_BYTES = 50 * 1024 * 1024

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(exist_ok=True)

radicaciones_db = []
graph_service = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global graph_service
    if GraphService:
        graph_service = GraphService()
        print(f"[STARTUP] GraphService OK | isConnected={graph_service.obtener_config()['isConnected']}")
    else:
        print("[STARTUP] GraphService NO DISPONIBLE - grafos.py no importado")
    yield


app = FastAPI(title="Portal INTECOAL - Radicación Técnica", lifespan=lifespan)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
cors_origins = [FRONTEND_URL, "http://localhost:5173", "http://localhost:8000"]
if FRONTEND_URL not in cors_origins:
    cors_origins.append(FRONTEND_URL)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


class MetadataRadicacion(BaseModel):
    nombreProyecto: str
    municipio: str
    contratista: str
    nitContratista: str
    responsable: str
    correoResponsable: Optional[str] = ""
    responsableRevision: Optional[str] = ""
    tipoEntrega: Optional[str] = "Inicial"
    fechaEntrega: Optional[str] = ""
    observaciones: Optional[str] = ""
    firmaContratista: Optional[dict] = None
    creadorEmail: Optional[str] = ""
    creadorName: Optional[str] = ""


class ActualizacionEstado(BaseModel):
    estado: str
    observaciones: Optional[str] = ""
    archivos: Optional[List[dict]] = None
    metadata: Optional[dict] = None


class ActualizacionMetadata(BaseModel):
    metadata: Optional[dict] = None
    archivos: Optional[List[dict]] = None
    estado: Optional[str] = None
    observacionesGenerales: Optional[str] = None


@app.get("/api/health")
async def health():
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}


@app.get("/api/documentos/catalogo")
async def obtener_catalogo():
    return {"data": CATALOGO_21_DOCUMENTOS, "total": len(CATALOGO_21_DOCUMENTOS)}


@app.get("/api/sharepoint/schema")
async def schema_sharepoint():
    columnas = [
        "Title", "NumeroRadicado", "CodigoProyecto", "NombreProyecto",
        "Municipio", "Contratista", "NIT", "Responsable", "CorreoResponsable",
        "TipoEntrega", "FechaEntrega", "Estado", "DocumentosOK",
        "PorcentajeCumplimiento", "FechaRadicacion", "ObservacionesGenerales",
    ]
    return {"columns": columnas, "listName": "Radicaciones_AP"}


@app.get("/api/radicacion/lista")
async def listar_radicaciones(
    search: Optional[str] = Query(None),
    municipio: Optional[str] = Query(None),
    estado: Optional[str] = Query(None),
    tipo: Optional[str] = Query(None),
    email: Optional[str] = Query(None),
    rol: Optional[str] = Query(None),
):
    resultados = list(radicaciones_db)

    if rol != "interventor" and email:
        email_lower = email.lower().strip()
        resultados = [
            r for r in resultados
            if (r.get("creadorEmail", "").lower().strip() == email_lower
                or r.get("metadata", {}).get("creadorEmail", "").lower().strip() == email_lower)
        ]

    if search:
        s = search.lower()
        resultados = [
            r for r in resultados
            if s in r["numeroRadicado"].lower()
            or s in r["metadata"].get("nombreProyecto", "").lower()
            or s in r["metadata"].get("contratista", "").lower()
            or s in r["metadata"].get("municipio", "").lower()
        ]

    if municipio and municipio != "TODOS":
        resultados = [r for r in resultados if r["metadata"].get("municipio") == municipio]

    if estado and estado != "TODOS":
        resultados = [r for r in resultados if r.get("estado") == estado]

    if tipo and tipo != "TODOS":
        resultados = [r for r in resultados if r["metadata"].get("tipoEntrega") == tipo]

    return {"data": resultados, "total": len(resultados)}


@app.get("/api/radicacion/{identificador}")
async def obtener_radicacion(identificador: str):
    for r in radicaciones_db:
        if r["id"] == identificador or r["numeroRadicado"] == identificador:
            return {"data": r}
    raise HTTPException(status_code=404, detail="Radicación no encontrada")


@app.delete("/api/radicacion/{identificador}")
async def eliminar_radicacion(identificador: str, email: Optional[str] = Query(None), rol: Optional[str] = Query(None)):
    if not radicaciones_db:
        raise HTTPException(status_code=404, detail="No hay radicaciones")

    ultimo = radicaciones_db[0]
    if ultimo["id"] != identificador and ultimo["numeroRadicado"] != identificador:
        raise HTTPException(
            status_code=400,
            detail="Solo se puede eliminar el último radicado registrado",
        )

    if not email:
        raise HTTPException(status_code=400, detail="Se requiere email del usuario")

    if rol and rol != "contratista":
        raise HTTPException(
            status_code=403,
            detail="Solo el contratista puede eliminar radicaciones",
        )

    email_lower = email.lower().strip()
    creador = (ultimo.get("creadorEmail", "") or ultimo.get("metadata", {}).get("creadorEmail", "")).lower().strip()
    if creador and creador != email_lower:
        raise HTTPException(
            status_code=403,
            detail="No tiene permiso para eliminar este radicado",
        )

    radicaciones_db.pop(0)
    return {"ok": True, "mensaje": "Radicación eliminada"}


@app.post("/api/radicacion/nueva")
async def crear_radicacion(request: Request):
    form = await request.form()

    text_fields = {}
    uploaded_files = {}
    for key in form:
        value = form[key]
        if hasattr(value, "read"):
            uploaded_files[key] = value
        else:
            text_fields[key] = value

    meta = json.loads(text_fields.get("metadatos", "{}"))
    elems = json.loads(text_fields.get("elementos", "[]"))
    na = json.loads(text_fields.get("naDocs", "[]"))
    docs_adic = json.loads(text_fields.get("docsAdicionales", "[]"))

    numero = generar_numero_radicado(radicaciones_db)
    nuevo_id = generar_id()
    total_docs = len(CATALOGO_21_DOCUMENTOS) + len(docs_adic)

    upload_dir = UPLOADS_DIR / nuevo_id
    upload_dir.mkdir(parents=True, exist_ok=True)

    saved_files = {}
    for field_name, upload_file in uploaded_files.items():
        mime = upload_file.content_type or ""
        if mime not in MIME_PERMITIDOS:
            raise HTTPException(status_code=400, detail=f"Tipo no permitido: {mime}. Solo PDF.")

        contenido = await upload_file.read()
        if len(contenido) > MAX_TAMANIO_BYTES:
            raise HTTPException(status_code=413, detail="Archivo supera 50 MB.")

        safe_name = (upload_file.filename or "file.pdf").replace("/", "_").replace("\\", "_")
        file_path = upload_dir / safe_name
        file_path.write_bytes(contenido)

        saved_files[field_name] = {
            "filename": safe_name,
            "originalName": upload_file.filename,
            "size": len(contenido),
            "mimeType": mime,
        }

    archivos_estado = []
    for doc in CATALOGO_21_DOCUMENTOS:
        status = "N/A" if doc["id"] in na else "PENDIENTE"
        file_info = saved_files.get(f"archivo_{doc['code']}")
        if file_info and status != "N/A":
            status = "CUMPLE"
        archivos_estado.append({
            "docId": doc["id"],
            "docCode": doc["code"],
            "docName": doc["name"],
            "fileName": file_info["originalName"] if file_info else "",
            "fileSize": file_info["size"] if file_info else 0,
            "fileType": file_info["mimeType"] if file_info else "application/pdf",
            "uploadDate": datetime.now(timezone.utc).isoformat() if file_info else "",
            "status": status,
            "folderPath": f"/Documentos_Radicacion/{numero}/{doc['folderGroup']}/",
            "notes": "",
            "esManual": False,
            "localPath": str(upload_dir / file_info["filename"]) if file_info else "",
        })

    for doc_adic in docs_adic:
        file_info = saved_files.get(f"archivo_custom_{doc_adic['docId']}")
        if file_info:
            archivos_estado.append({
                "docId": doc_adic["docId"],
                "docCode": doc_adic.get("docCode", f"X{doc_adic['docId']}"),
                "docName": doc_adic.get("docName", "Documento Adicional"),
                "fileName": file_info["originalName"],
                "fileSize": file_info["size"],
                "fileType": file_info["mimeType"],
                "uploadDate": datetime.now(timezone.utc).isoformat(),
                "status": "CUMPLE",
                "folderPath": f"/Documentos_Radicacion/{numero}/Documentos_Adicionales/",
                "notes": "",
                "esManual": True,
                "localPath": str(upload_dir / file_info["filename"]),
            })
        else:
            archivos_estado.append({
                "docId": doc_adic["docId"],
                "docCode": doc_adic.get("docCode", f"X{doc_adic['docId']}"),
                "docName": doc_adic.get("docName", "Documento Adicional"),
                "fileName": "",
                "fileSize": 0,
                "fileType": "application/pdf",
                "uploadDate": "",
                "status": "PENDIENTE",
                "folderPath": f"/Documentos_Radicacion/{numero}/Documentos_Adicionales/",
                "notes": "",
                "esManual": True,
                "localPath": "",
            })

    documentos_ok = sum(1 for a in archivos_estado if a["status"] in ("CUMPLE", "N/A"))

    radicacion = {
        "id": nuevo_id,
        "numeroRadicado": numero,
        "metadata": meta,
        "estado": "Radicado",
        "documentosOk": documentos_ok,
        "totalDocumentos": total_docs,
        "fechaRadicacion": datetime.now(timezone.utc).isoformat(),
        "fechaActualizacion": datetime.now(timezone.utc).isoformat(),
        "porcentajeCumplimiento": calcular_porcentaje(archivos_estado),
        "archivos": archivos_estado,
        "elementosEntregados": elems,
        "observacionesGenerales": "",
        "creadorEmail": meta.get("creadorEmail", ""),
        "creadorName": meta.get("creadorName", ""),
    }

    radicaciones_db.insert(0, radicacion)

    print(f"[MAIN] graph_service={'DISPONIBLE' if graph_service else 'NULL'}")

    if graph_service:
        try:
            destino = meta.get("correoResponsable", "")
            if destino:
                await graph_service.enviar_correo_confirmacion(radicacion, destino)
                print(f"[MAIN] Correo confirmacion enviado a {destino} para {numero}")
            else:
                print(f"[MAIN] Sin correoResponsable, se omite correo de creacion para {numero}")
        except Exception as e:
            print(f"[MAIN] Error correo confirmacion: {e}")

    return {"data": radicacion, "ok": True}


@app.post("/api/radicacion/{identificador}/archivo")
async def subir_archivo(
    identificador: str,
    docId: int = Form(...),
    archivo: UploadFile = File(...),
):
    radicacion = None
    for r in radicaciones_db:
        if r["id"] == identificador or r["numeroRadicado"] == identificador:
            radicacion = r
            break

    if not radicacion:
        raise HTTPException(status_code=404, detail="Radicacion no encontrada")

    mime = archivo.content_type or ""
    if mime not in MIME_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido: {mime}. Solo se aceptan archivos PDF.",
        )

    contenido = await archivo.read()
    if len(contenido) > MAX_TAMANIO_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"El archivo supera el limite de 50 MB.",
        )

    upload_dir = UPLOADS_DIR / radicacion["id"]
    upload_dir.mkdir(parents=True, exist_ok=True)

    safe_name = archivo.filename.replace("/", "_").replace("\\", "_")
    file_path = upload_dir / safe_name
    file_path.write_bytes(contenido)

    for doc in radicacion["archivos"]:
        if doc["docId"] == docId:
            doc["fileName"] = archivo.filename
            doc["fileSize"] = len(contenido)
            doc["fileType"] = mime
            doc["uploadDate"] = datetime.now(timezone.utc).isoformat()
            doc["status"] = "CUMPLE"
            doc["localPath"] = str(file_path)
            break

    radicacion["documentosOk"] = sum(
        1 for a in radicacion["archivos"] if a["status"] in ("CUMPLE", "N/A")
    )
    radicacion["porcentajeCumplimiento"] = calcular_porcentaje(radicacion["archivos"])
    radicacion["fechaActualizacion"] = datetime.now(timezone.utc).isoformat()

    return {"ok": True, "data": radicacion}


@app.patch("/api/radicacion/{identificador}/estado")
async def actualizar_estado(identificador: str, body: ActualizacionEstado):
    radicacion = None
    for r in radicaciones_db:
        if r["id"] == identificador or r["numeroRadicado"] == identificador:
            radicacion = r
            break

    if not radicacion:
        raise HTTPException(status_code=404, detail="Radicación no encontrada")

    estado_anterior = radicacion["estado"]
    radicacion["estado"] = body.estado
    radicacion["observacionesGenerales"] = body.observaciones or ""

    if body.archivos:
        local_paths = {a["docId"]: a.get("localPath", "") for a in radicacion["archivos"]}
        for a in body.archivos:
            if not a.get("localPath") and a["docId"] in local_paths:
                a["localPath"] = local_paths[a["docId"]]
        radicacion["archivos"] = body.archivos
        radicacion["documentosOk"] = sum(
            1 for a in body.archivos if a.get("status") in ("CUMPLE", "N/A")
        )
        radicacion["porcentajeCumplimiento"] = calcular_porcentaje(body.archivos)

    if body.metadata:
        radicacion["metadata"].update(body.metadata)

    radicacion["fechaActualizacion"] = datetime.now(timezone.utc).isoformat()

    if body.estado == "Aprobado" and graph_service:
        try:
            await graph_service.sincronizar_a_sharepoint(radicacion)
            radicacion["m365Synced"] = True
            print(f"[MAIN] SharePoint sync OK para {radicacion['numeroRadicado']}")
        except Exception as e:
            radicacion["m365Synced"] = False
            print(f"[MAIN] SharePoint sync FALLO para {radicacion['numeroRadicado']}: {e}")

    if graph_service and body.estado != estado_anterior:
        try:
            await graph_service.enviar_correo_estado(radicacion, estado_anterior, body.observaciones)
            print(f"[MAIN] Correo de cambio de estado enviado para {radicacion['numeroRadicado']}: {estado_anterior} -> {body.estado}")
        except Exception as e:
            print(f"[MAIN] Error correo cambio de estado: {e}")

    return {"ok": True, "data": radicacion}


@app.patch("/api/radicacion/{identificador}/metadata")
async def actualizar_metadata(identificador: str, body: ActualizacionMetadata):
    radicacion = None
    for r in radicaciones_db:
        if r["id"] == identificador or r["numeroRadicado"] == identificador:
            radicacion = r
            break

    if not radicacion:
        raise HTTPException(status_code=404, detail="Radicación no encontrada")

    if body.metadata:
        radicacion["metadata"].update(body.metadata)
    if body.archivos:
        local_paths = {a["docId"]: a.get("localPath", "") for a in radicacion["archivos"]}
        for a in body.archivos:
            if not a.get("localPath") and a["docId"] in local_paths:
                a["localPath"] = local_paths[a["docId"]]
        radicacion["archivos"] = body.archivos
        radicacion["documentosOk"] = sum(
            1 for a in body.archivos if a.get("status") in ("CUMPLE", "N/A")
        )
        radicacion["porcentajeCumplimiento"] = calcular_porcentaje(body.archivos)
    if body.estado:
        radicacion["estado"] = body.estado
    if body.observacionesGenerales is not None:
        radicacion["observacionesGenerales"] = body.observacionesGenerales

    radicacion["fechaActualizacion"] = datetime.now(timezone.utc).isoformat()

    return {"ok": True, "data": radicacion}


@app.get("/api/m365/status")
async def estado_m365():
    if graph_service:
        return graph_service.obtener_config()
    return {
        "azureClientId": os.getenv("AZURE_CLIENT_ID", ""),
        "azureTenantId": os.getenv("AZURE_TENANT_ID", ""),
        "sharepointSiteId": os.getenv("SHAREPOINT_SITE_ID", ""),
        "sharepointListId": os.getenv("SHAREPOINT_LIST_ID", ""),
        "isConnected": False,
    }


@app.get("/api/m365/list-columns")
async def columnas_lista():
    if not graph_service:
        raise HTTPException(status_code=503, detail="GraphService no disponible")
    try:
        cols = await graph_service._columnas_lista()
        return {"columns": cols, "total": len(cols)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/m365/test-connection")
async def probar_conexion():
    if graph_service:
        try:
            return await graph_service.probar_conexion()
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    raise HTTPException(status_code=503, detail="GraphService no disponible")


@app.get("/api/m365/webhook-config")
async def obtener_webhook():
    return {
        "webhookUrl": os.getenv("POWER_AUTOMATE_WEBHOOK_URL", ""),
        "autoSyncOnApprove": True,
    }


@app.post("/api/m365/webhook-config")
async def actualizar_webhook(request: Request):
    body = await request.json()
    os.environ["POWER_AUTOMATE_WEBHOOK_URL"] = body.get("webhookUrl", "")
    return {"ok": True}


def crear_token(data: dict) -> str:
    payload = {
        "sub": data.get("email", ""),
        "email": data.get("email", ""),
        "role": data.get("role", "contratista"),
        "company": data.get("company", ""),
        "exp": datetime.now(timezone.utc) + timedelta(hours=TOKEN_EXPIRE_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verificar_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


@app.post("/api/auth/token")
async def generar_token(request: Request):
    body = await request.json()
    email = body.get("email", "")
    company = body.get("company", "")
    role = body.get("role", "contratista")

    nombre = email.split("@")[0].replace(".", " ").replace("_", " ").title()
    token = crear_token({"email": email, "company": company, "role": role})
    return {"token": token, "user": {"email": email, "name": nombre, "company": company, "role": role}}


@app.post("/api/auth/msal-verify")
async def verificar_msal(request: Request):
    body = await request.json()
    account = body.get("account", {})
    email = account.get("username", account.get("localAccountId", ""))

    if not email:
        raise HTTPException(status_code=400, detail="Cuenta no válida")

    dominio = email.split("@")[-1].lower() if "@" in email else ""
    if dominio in ("intecoalsas.com", "intecoal.com"):
        rol = "interventor"
        empresa = "INTECOAL S.A.S."
    elif dominio in ("soy.sena.edu.co", "sena.edu.co"):
        rol = "contratista"
        empresa = "SENA"
    elif dominio in ("electroingenieria.com.co",):
        rol = "contratista"
        empresa = "ELECTROINGENIERIA S.A.S."
    else:
        rol = "contratista"
        empresa = dominio.upper().replace(".COM", "").replace(".CO", "")

    nombre = email.split("@")[0].replace(".", " ").replace("_", " ").title()
    token = crear_token({"email": email, "company": empresa, "role": rol})

    return {
        "token": token,
        "user": {
            "isAuthenticated": True,
            "name": nombre,
            "email": email.lower(),
            "role": rol,
            "company": empresa,
        }
    }


@app.get("/api/files/view/{radicacion_id}/{doc_id}")
async def ver_archivo(radicacion_id: str, doc_id: int):
    for r in radicaciones_db:
        if r["id"] == radicacion_id or r["numeroRadicado"] == radicacion_id:
            for a in r.get("archivos", []):
                if a["docId"] == doc_id and a.get("localPath"):
                    file_path = Path(a["localPath"])
                    if file_path.exists():
                        return FileResponse(
                            path=str(file_path),
                            media_type=a.get("fileType", "application/pdf"),
                            filename=a.get("fileName", "documento.pdf"),
                        )
                    raise HTTPException(status_code=404, detail="Archivo no encontrado en disco")
                if a["docId"] == doc_id and a.get("fileName"):
                    return {
                        "fileName": a["fileName"],
                        "fileType": a.get("fileType", "application/pdf"),
                        "fileSize": a.get("fileSize", 0),
                        "folderPath": a.get("folderPath", ""),
                        "status": a.get("status", ""),
                    }
            raise HTTPException(status_code=404, detail="Archivo no encontrado")
    raise HTTPException(status_code=404, detail="Radicacion no encontrada")
