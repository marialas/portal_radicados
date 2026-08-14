from pydantic import BaseModel, Field
from typing import List, Optional, Literal

FilingStatus = Literal[
    'Radicado',
    'En Revisión',
    'Con Observaciones',
    'Subsanación Requerida',
    'Aprobado'
]

FilingType = Literal['Inicial', 'Parcial', 'Final', 'Subsanación']

class SignatureData(BaseModel):
    dataUrl: str
    nombreSignatario: str
    cargo: str
    tarjetaProfesional: Optional[str] = None
    fechaFirma: str
    hashVerificacion: str
    tipoFirma: Literal['dibujada', 'imagen', 'texto']

class ProjectMetadata(BaseModel):
    codigoProyecto: str
    nombreProyecto: str
    municipio: str
    contratista: str
    nitContratista: str
    responsableRevision: Optional[str] = "John Fredy Castro"
    responsable: str
    correoResponsable: str
    tipoEntrega: FilingType
    fechaEntrega: str
    observaciones: Optional[str] = ""
    firmaInterventoria: Optional[SignatureData] = None
    firmaContratista: Optional[SignatureData] = None

class PhysicalElement(BaseModel):
    id: int
    elemento: str
    cantidad: int
    especificacion: str

class UploadedFileItem(BaseModel):
    docId: int
    docCode: str
    docName: str
    fileName: str
    fileSize: int
    fileType: str
    uploadDate: str
    status: Literal['CUMPLE', 'PENDIENTE', 'N/A', 'NO CUMPLE']
    folderPath: str
    notes: Optional[str] = ""

class FilingRecord(BaseModel):
    id: str
    numeroRadicado: str
    metadata: ProjectMetadata
    estado: FilingStatus
    documentosOk: int
    fechaRadicacion: str
    fechaActualizacion: Optional[str] = None
    rutaOneDrive: str
    archivos: List[UploadedFileItem]
    elementosEntregados: List[PhysicalElement]
    observacionesGenerales: Optional[str] = ""
    porcentajeCumplimiento: int
    ipOrigen: Optional[str] = "127.0.0.1"

class DocumentCatalogItem(BaseModel):
    id: int
    code: str
    name: str
    description: str
    folderGroup: str
    required: bool

class StatusUpdatePayload(BaseModel):
    estado: Optional[FilingStatus] = None
    observaciones: Optional[str] = None
    archivos: Optional[List[UploadedFileItem]] = None

class LoginPayload(BaseModel):
    email: Optional[str] = "jcastro@intecoal.com.co"
    company: Optional[str] = "INTECOAL SAS"
    role: Optional[str] = "interventor"

class MsalTokenPayload(BaseModel):
    accessToken: Optional[str] = None
    idToken: Optional[str] = None
    account: Optional[dict] = None
    tenantId: Optional[str] = "6b2d1840-1E222A-4192-bf38-028f89c445a1"
    clientId: Optional[str] = "0a7114b3-42b2-9840-a39e8f19227d"
