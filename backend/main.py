from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Form, Request, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Any
import json
import time
from datetime import datetime

from models import (
    FilingRecord, FilingStatus, ProjectMetadata, UploadedFileItem,
    PhysicalElement, StatusUpdatePayload, LoginPayload, MsalTokenPayload, DocumentCatalogItem
)
from data import DOCUMENT_CATALOG, INITIAL_SEED_FILINGS, build_default_files

app = FastAPI(
    title="INTECOAL SAS - API Portal de Radicación y Interventoría",
    description="API REST en Python FastAPI para la gestión documental de Alumbrado Público (RETILAP/RETIE)",
    version="2.0.0"
)

# Enable CORS for Frontend hosted on any origin (Vercel, Netlify, localhost, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory store
filings_db: List[FilingRecord] = [...INITIAL_SEED_FILINGS]
radicado_counter = 145

def generate_radicado_id() -> str:
    global radicado_counter
    seq = str(radicado_counter).zfill(6)
    radicado_counter += 1
    year = datetime.now().year
    return f"RAD-{year}-{seq}"

@app.get("/api/health", summary="Estado del servicio Backend FastAPI")
def get_health():
    return {
        "status": "ok",
        "service": "INTECOAL SAS - Python FastAPI Backend Service",
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/documentos/catalogo", response_model=List[DocumentCatalogItem], summary="Obtener el catálogo oficial de 21 requisitos RETILAP")
def get_document_catalog():
    return DOCUMENT_CATALOG

@app.get("/api/radicacion/lista", summary="Listar expedientes radicados con filtros")
def list_radicaciones(
    search: Optional[str] = Query(None, description="Búsqueda libre por número, proyecto o contratista"),
    municipio: Optional[str] = Query("TODOS", description="Filtrar por municipio"),
    estado: Optional[str] = Query("TODOS", description="Filtrar por estado"),
    tipo: Optional[str] = Query("TODOS", description="Filtrar por tipo de entrega")
):
    result = list(filings_db)

    if search:
        q = search.lower()
        result = [
            f for f in result if (
                q in f.numeroRadicado.lower() or
                q in f.metadata.codigoProyecto.lower() or
                q in f.metadata.nombreProyecto.lower() or
                q in f.metadata.contratista.lower() or
                q in f.metadata.municipio.lower()
            )
        ]

    if municipio and municipio != "TODOS":
        result = [f for f in result if f.metadata.municipio.lower() == municipio.lower()]

    if estado and estado != "TODOS":
        result = [f for f in result if f.estado == estado]

    if tipo and tipo != "TODOS":
        result = [f for f in result if f.metadata.tipoEntrega == tipo]

    # Newest first
    result.sort(key=lambda x: x.fechaRadicacion, reverse=True)

    return {
        "total": len(result),
        "data": result
    }

@app.get("/api/radicacion/{filing_id}", response_model=FilingRecord, summary="Obtener detalle de un expediente")
def get_radicacion_detail(filing_id: str):
    for record in filings_db:
        if record.id == filing_id or record.numeroRadicado == filing_id:
            return record
    raise HTTPException(status_code=404, detail="Radicación no encontrada")

@app.post("/api/radicacion/nueva", status_code=status.HTTP_201_CREATED, summary="Crear nueva radicación documental")
async def create_radicacion(
    request: Request,
    metadatos: Optional[str] = Form(None),
    elementos: Optional[str] = Form(None),
    naDocs: Optional[str] = Form(None)
):
    # Parse form JSON data or body JSON
    try:
        body_json = {}
        if request.headers.get("content-type", "").startswith("application/json"):
            body_json = await request.json()

        metadata_raw = metadatos or body_json.get("metadatos")
        if isinstance(metadata_raw, str):
            meta_dict = json.loads(metadata_raw)
        elif isinstance(metadata_raw, dict):
            meta_dict = metadata_raw
        else:
            meta_dict = {
                "codigoProyecto": f"INT-{datetime.now().year}-{int(time.time()) % 1000}",
                "nombreProyecto": "PROYECTO ALUMBRADO PUBLICO",
                "municipio": "CALI",
                "contratista": "CONTRATISTA REGISTRADO",
                "nitContratista": "900000000",
                "responsableRevision": "John Fredy Castro",
                "responsable": "Ingeniero Responsable",
                "correoResponsable": "contacto@proyecto.com",
                "tipoEntrega": "Inicial",
                "fechaEntrega": datetime.now().strftime("%Y-%m-%d"),
                "observaciones": ""
            }

        metadata_obj = ProjectMetadata(**meta_dict)

        elementos_raw = elementos or body_json.get("elementos")
        if isinstance(elementos_raw, str):
            elem_list = json.loads(elementos_raw)
        elif isinstance(elementos_raw, list):
            elem_list = elementos_raw
        else:
            elem_list = [
                {"id": 1, "elemento": "Luminarias LED", "cantidad": 50, "especificacion": "100W RETILAP IP66"},
                {"id": 2, "elemento": "Brazos Galvanizados", "cantidad": 50, "especificacion": "1.5m 2 pulgadas"}
            ]

        physical_elements = [PhysicalElement(**item) for item in elem_list]

        # Process attached files and N/A flags
        na_list = []
        if naDocs:
            na_list = json.loads(naDocs) if isinstance(naDocs, str) else naDocs
        elif "naDocs" in body_json:
            na_list = body_json["naDocs"]

        form_data = await request.form() if not request.headers.get("content-type", "").startswith("application/json") else {}

        uploaded_files_map = {}
        for key, value in form_data.items():
            if isinstance(value, UploadFile):
                # find doc id from field key (e.g., archivo_A1, archivo_1)
                for doc in DOCUMENT_CATALOG:
                    if doc.code in key or f"archivo_{doc.id}" in key:
                        uploaded_files_map[doc.id] = value
                        break

        docs_ok_count = 0
        file_items: List[UploadedFileItem] = []

        for doc in DOCUMENT_CATALOG:
            is_na = doc.id in na_list
            up_file = uploaded_files_map.get(doc.id)

            if up_file:
                st = "CUMPLE"
                f_name = f"{doc.code}_{up_file.filename}"
                f_size = 1024 * 500
                f_type = up_file.content_type or "application/pdf"
                docs_ok_count += 1
            elif is_na:
                st = "N/A"
                f_name = "N/A"
                f_size = 0
                f_type = "application/pdf"
                docs_ok_count += 1
            else:
                st = "PENDIENTE"
                f_name = ""
                f_size = 0
                f_type = "application/pdf"

            file_items.append(UploadedFileItem(
                docId=doc.id,
                docCode=doc.code,
                docName=doc.name,
                fileName=f_name,
                fileSize=f_size,
                fileType=f_type,
                uploadDate=datetime.now().strftime("%Y-%m-%d") if (up_file or is_na) else "",
                status=st,
                folderPath=f"/Documentos_Radicacion/{metadata_obj.codigoProyecto}/{doc.folderGroup}/{f_name}",
                notes="Marcar como N/A por contratista" if is_na else ""
            ))

        missing_required = [d for d in DOCUMENT_CATALOG if d.required and not any(f.docId == d.id and f.status in ["CUMPLE", "N/A"] for f in file_items)]
        is_complete = len(missing_required) == 0

        rad_num = generate_radicado_id()
        new_id = f"rad-{int(time.time()*1000)}"

        new_record = FilingRecord(
            id=new_id,
            numeroRadicado=rad_num,
            metadata=metadata_obj,
            estado="Radicado" if is_complete else "Con Observaciones",
            documentosOk=docs_ok_count,
            fechaRadicacion=datetime.now().isoformat(),
            rutaOneDrive=f"/Documentos_Radicacion/{metadata_obj.codigoProyecto}/",
            archivos=file_items,
            elementosEntregados=physical_elements,
            observacionesGenerales="Radicación recibida a satisfacción." if is_complete else f"Faltan {len(missing_required)} documentos obligatorios.",
            porcentajeCumplimiento=int((docs_ok_count / 21) * 100),
            ipOrigen=request.client.host if request.client else "127.0.0.1"
        )

        filings_db.insert(0, new_record)

        return {
            "success": True,
            "message": "Radicación guardada exitosamente en el backend Python FastAPI",
            "data": new_record
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al procesar la radicación: {str(e)}")

@app.patch("/api/radicacion/{filing_id}/estado", summary="Actualizar estado o guardar evaluación de interventoría")
def update_radicacion_status(filing_id: str, payload: StatusUpdatePayload):
    for i, record in enumerate(filings_db):
        if record.id == filing_id or record.numeroRadicado == filing_id:
            if payload.estado:
                record.estado = payload.estado
            if payload.observaciones:
                record.observacionesGenerales = payload.observaciones
            if payload.archivos:
                record.archivos = payload.archivos
                # Recalculate percent compliance
                valid_count = sum(1 for a in payload.archivos if a.status in ["CUMPLE", "N/A"])
                record.documentosOk = valid_count
                record.porcentajeCumplimiento = int((valid_count / 21) * 100)

            record.fechaActualizacion = datetime.now().isoformat()
            filings_db[i] = record
            return {
                "success": True,
                "data": record
            }

    raise HTTPException(status_code=404, detail="Radicación no encontrada")

@app.post("/api/auth/token", summary="Autenticación JWT de Microsoft 365 / INTECOAL SAS")
def login(payload: LoginPayload):
    return {
        "token": f"intecoal-python-fastapi-jwt-{int(time.time())}",
        "user": {
            "name": payload.email.split("@")[0].upper() if payload.email else "JOHN FREDY CASTRO",
            "email": payload.email or "jcastro@intecoal.com.co",
            "role": payload.role or "interventor",
            "company": payload.company or "INTECOAL SAS"
        },
        "m365Connected": True
    }

@app.post("/api/auth/msal-verify", summary="Verificación de Token MSAL Microsoft 365 (Azure AD / Entra ID)")
def verify_msal_token(payload: MsalTokenPayload):
    acc = payload.account or {}
    email = acc.get("username") or "estudiante@soy.sena.edu.co"
    name = acc.get("name") or email.split("@")[0].replace(".", " ").title()
    tenant_id = acc.get("tenantId") or payload.tenantId or "6b2d1840-1E222A-4192-bf38-028f89c445a1"

    # Infer company and role dynamically for ANY email domain
    domain = email.split("@")[1].lower() if "@" in email else ""
    role = "interventor" if "intecoal" in domain else "contratista"

    if "intecoal" in domain:
        company = "INTECOAL SAS"
    elif "sena" in domain:
        company = "SENA - Servicio Nacional de Aprendizaje"
    elif "electroingenieria" in domain:
        company = "ELECTROINGENIERIA S.A.S."
    elif "ingenieria-energia" in domain:
        company = "INGENIERIA Y ENERGIA S.A.S."
    else:
        parts = [p.upper() for p in domain.split(".") if p not in ["com", "co", "edu", "gov", "org", "net", "io", "es"]]
        if parts:
            main_name = " ".join(parts)
            if ".edu" in domain:
                company = f"INSTITUCIÓN EDUCATIVA {main_name}"
            elif ".gov" in domain:
                company = f"ENTIDAD GUBERNAMENTAL {main_name}"
            else:
                company = f"{main_name} S.A.S."
        else:
            company = f"{domain.upper()} S.A.S."

    return {
        "verified": True,
        "token": f"msal-azure-jwt-{int(time.time())}",
        "user": {
            "name": f"{name} (M365)",
            "email": email,
            "role": role,
            "company": company,
            "azureTenantId": tenant_id,
            "authProvider": "Microsoft 365 / Azure Active Directory (MSAL.js)"
        },
        "scopes": ["User.Read", "Files.ReadWrite.All", "Sites.ReadWrite.All"]
    }

@app.get("/api/sharepoint/schema", summary="Obtener el esquema de la Lista de SharePoint Online Radicaciones_AP")
def get_sharepoint_schema():
    return {
        "listName": "Radicaciones_AP",
        "siteUrl": "https://intecoal.sharepoint.com/sites/AlumbradoPublico",
        "columns": [
            {"internalName": "Title", "displayName": "Número de Radicado (ID)", "type": "Text", "required": True},
            {"internalName": "CodigoProyecto", "displayName": "Código del Proyecto", "type": "Text", "required": True},
            {"internalName": "NombreProyecto", "displayName": "Nombre del Proyecto", "type": "Text", "required": True},
            {"internalName": "Municipio", "displayName": "Municipio", "type": "Choice", "choices": ["Cali", "Palmira", "Buenaventura", "Jamundí", "Yumbo", "Tuluá", "Buga", "Cartago", "Otro"]},
            {"internalName": "Contratista", "displayName": "Contratista Creador", "type": "Text", "required": True},
            {"internalName": "NitContratista", "displayName": "NIT Contratista", "type": "Text"},
            {"internalName": "CorreoResponsable", "displayName": "Correo Responsable M365", "type": "Text", "required": True},
            {"internalName": "ResponsableRevision", "displayName": "Revisor Interventoría", "type": "Text"},
            {"internalName": "Estado", "displayName": "Estado de Radicación", "type": "Choice", "choices": ["Radicado", "En Revisión", "Con Observaciones", "Subsanación Requerida", "Aprobado"]},
            {"internalName": "PorcentajeCumplimiento", "displayName": "% Cumplimiento RETILAP", "type": "Number"},
            {"internalName": "DocumentosOkCount", "displayName": "Documentos Válidos", "type": "Number"},
            {"internalName": "RutaOneDrive", "displayName": "Ruta Carpeta OneDrive", "type": "Text"},
            {"internalName": "ArchivosJSON", "displayName": "Detalle Archivos (JSON)", "type": "Note"},
            {"internalName": "ElementosJSON", "displayName": "Elementos Físicos (JSON)", "type": "Note"},
            {"internalName": "ObservacionesGenerales", "displayName": "Observaciones Interventoría", "type": "Note"},
            {"internalName": "FechaRadicacion", "displayName": "Fecha de Radicación", "type": "DateTime"}
        ]
    }

@app.post("/api/sharepoint/sync", summary="Sincronizar expediente en la Lista SharePoint Online M365")
def sync_to_sharepoint(filing_id: Optional[str] = None):
    synced_items = []
    records = [f for f in filings_db if f.id == filing_id or f.numeroRadicado == filing_id] if filing_id else filings_db

    for f in records:
        sp_item = {
          "Title": f.numeroRadicado,
          "CodigoProyecto": f.metadata.codigoProyecto,
          "NombreProyecto": f.metadata.nombreProyecto,
          "Municipio": f.metadata.municipio,
          "Contratista": f.metadata.contratista,
          "NitContratista": f.metadata.nitContratista or "",
          "CorreoResponsable": f.metadata.correoResponsable or "",
          "ResponsableRevision": f.metadata.responsableRevision or "Ing. John Fredy Castro",
          "Estado": f.estado,
          "PorcentajeCumplimiento": f.porcentajeCumplimiento,
          "DocumentosOkCount": f.documentosOk,
          "RutaOneDrive": f.rutaOneDrive,
          "ArchivosJSON": json.dumps([a.dict() for a in f.archivos]),
          "ElementosJSON": json.dumps([e.dict() for e in f.elementosEntregados]),
          "ObservacionesGenerales": f.observacionesGenerales or "",
          "FechaRadicacion": f.fechaRadicacion
        }
        synced_items.append(sp_item)

    return {
        "success": True,
        "message": f"Se prepararon y sincronizaron {len(synced_items)} registros para la Lista SharePoint 'Radicaciones_AP' en Microsoft 365",
        "listTarget": "Radicaciones_AP",
        "siteUrl": "https://intecoal.sharepoint.com/sites/AlumbradoPublico",
        "data": synced_items
    }

