from typing import List
from models import DocumentCatalogItem, FilingRecord, ProjectMetadata, UploadedFileItem, PhysicalElement

DOCUMENT_CATALOG: List[DocumentCatalogItem] = [
    DocumentCatalogItem(id=1, code="A1", name="Planos de Alumbrado Público As-Built", description="Planos definitivos de la instalación eléctrica y luminarias según construido en formato CAD/PDF.", folderGroup="A_Tecnicos", required=True),
    DocumentCatalogItem(id=2, code="A2", name="Memorias de Cálculo Fotométrico", description="Simulaciones Dialux/Relux comprobando niveles de lux e uniformidad RETILAP.", folderGroup="A_Tecnicos", required=True),
    DocumentCatalogItem(id=3, code="A3", name="Memorias de Cálculo Eléctrico", description="Cálculos de caída de tensión, regulación y capacidad de conductores.", folderGroup="A_Tecnicos", required=True),
    DocumentCatalogItem(id=4, code="A4", name="Cálculos de Puesta a Tierra y Apantallamiento", description="Medición de resistividad de terreno y diseño del sistema de puesta a tierra (SPT).", folderGroup="A_Tecnicos", required=True),
    DocumentCatalogItem(id=5, code="A5", name="Diagrama Unifilar y Cuadro de Cargas", description="Esquema eléctrico unifilar de tableros de control y circuitos.", folderGroup="A_Tecnicos", required=True),
    DocumentCatalogItem(id=6, code="A6", name="Especificaciones Técnicas de Equipos", description="Fichas técnicas de luminarias LED, fotoceldas, postes, brazos y cables.", folderGroup="A_Tecnicos", required=True),
    DocumentCatalogItem(id=7, code="A7", name="Certificado RETILAP del Diseñador", description="Matrícula profesional y certificado de competencia del ingeniero diseñador.", folderGroup="A_Tecnicos", required=True),
    
    DocumentCatalogItem(id=8, code="B8", name="Certificados de Producto RETILAP (Luminarias)", description="Certificado de conformidad de producto expedido por organismo acreditado (ONAC).", folderGroup="B_Certificaciones", required=True),
    DocumentCatalogItem(id=9, code="B9", name="Certificados de Producto RETIE (Postes, Cables, Protecciones)", description="Certificados RETIE de transformación, protecciones y soportes.", folderGroup="B_Certificaciones", required=True),
    DocumentCatalogItem(id=10, code="B10", name="Garantías de Fábrica (Luminarias >= 10 Años)", description="Documento de garantía expedido por fabricante con vigencia exigida.", folderGroup="B_Certificaciones", required=True),
    DocumentCatalogItem(id=11, code="B11", name="Protocolos de Ensayos de Laboratorio", description="Pruebas de hermeticidad IP, impacto IK y fotometría de laboratorio.", folderGroup="B_Certificaciones", required=True),
    DocumentCatalogItem(id=12, code="B12", name="Certificado de Inspección de Primera Parte", description="Dictamen previo firmado por el director de obra del contratista.", folderGroup="B_Certificaciones", required=False),

    DocumentCatalogItem(id=13, code="C13", name="Actas de Inicio y Modificatorios Contractuales", description="Copia del acta de inicio y sus extensiones o adicionales legalizados.", folderGroup="C_Contractuales", required=True),
    DocumentCatalogItem(id=14, code="C14", name="Poliza de Cumplimiento y Calidad de Bienes", description="Pólizas vigentes con aprobación de la entidad contratante.", folderGroup="C_Contractuales", required=True),
    DocumentCatalogItem(id=15, code="C15", name="PAGO de Seguridad Social y Parafiscales", description="Paz y salvo del revisor fiscal o contador sobre aportes al sistema.", folderGroup="C_Contractuales", required=True),
    DocumentCatalogItem(id=16, code="C16", name="Certificado de Cámara de Comercio y RUT", description="Documentación legal del contratista con vigencia inferior a 30 días.", folderGroup="C_Contractuales", required=True),

    DocumentCatalogItem(id=17, code="D17", name="Inventario Georreferenciado en Excel/GIS", description="Formato estandarizado INTECOAL con coordenadas GPS de cada punto.", folderGroup="D_Inventario", required=True),
    DocumentCatalogItem(id=18, code="D18", name="Registro Fotográfico de Puntos Instalados", description="Fotografías antes/después de luminarias, transformadores y medidores.", folderGroup="D_Inventario", required=True),
    DocumentCatalogItem(id=19, code="D19", name="Acta de Recibo Físico de Elementos", description="Acta de entrega en bodega o sitio firmada por la supervisión.", folderGroup="D_Inventario", required=True),

    DocumentCatalogItem(id=20, code="E20", name="Plan de Manejo Ambiental y Gestión de Residuos", description="Disposición final de luminarias retiradas (Sodio/Mercurio) con gestor autorizado.", folderGroup="E_SST_Ambiental", required=True),
    DocumentCatalogItem(id=21, code="E21", name="Bitácora de Obra y Registro de Novedades SST", description="Copia de la bitácora de obra con firmas de la residencia e interventoría.", folderGroup="E_SST_Ambiental", required=True),
]

def build_default_files(codigo_proyecto: str) -> List[UploadedFileItem]:
    files = []
    for doc in DOCUMENT_CATALOG:
        files.append(UploadedFileItem(
            docId=doc.id,
            docCode=doc.code,
            docName=doc.name,
            fileName=f"{doc.code}_DOCUMENTO_VALIDADO.pdf" if doc.required else "",
            fileSize=2450000 if doc.required else 0,
            fileType="application/pdf",
            uploadDate="2026-07-28",
            status="CUMPLE" if doc.required else "N/A",
            folderPath=f"/Documentos_Radicacion/{codigo_proyecto}/{doc.folderGroup}/{doc.code}_DOCUMENTO_VALIDADO.pdf",
            notes="Verificado según RETILAP/RETIE por la Interventoría."
        ))
    return files

INITIAL_SEED_FILINGS: List[FilingRecord] = [
    FilingRecord(
        id="rad-101",
        numeroRadicado="RAD-2026-000142",
        metadata=ProjectMetadata(
            codigoProyecto="INT-2026-045",
            nombreProyecto="MODERNIZACIÓN ALUMBRADO PÚBLICO ETAPA 1 FASE 2",
            municipio="CALI",
            contratista="CONSORCIO LUZ Y VIDA 2026",
            nitContratista="901.458.922-3",
            responsableRevision="Ing. John Fredy Castro",
            responsable="Ing. Carlos Mario Aristizábal",
            correoResponsable="proyectos@luzyvida.com",
            tipoEntrega="Inicial",
            fechaEntrega="2026-07-25",
            observaciones="Entrega de 120 puntos LED en Avenida Pasoancho con certificación RETILAP."
        ),
        estado="Aprobado",
        documentosOk=21,
        fechaRadicacion="2026-07-25T10:30:00Z",
        fechaActualizacion="2026-07-28T14:00:00Z",
        rutaOneDrive="/Documentos_Radicacion/INT-2026-045/",
        archivos=build_default_files("INT-2026-045"),
        elementosEntregados=[
            PhysicalElement(id=1, elemento="Luminarias LED 120W", cantidad=120, especificacion="Philips GreenVision Xceed RETILAP IP66 IK08"),
            PhysicalElement(id=2, elemento="Brazos Galvanizados en Caliente", cantidad=120, especificacion="Diámetro 2 pulgadas, longitud 1.5 metros"),
            PhysicalElement(id=3, elemento="Fotoceldas Multitensión 105-305V", cantidad=120, especificacion="Ansell Electronic Photocell 10 Años Garantía"),
            PhysicalElement(id=4, elemento="Tableros de Control con Medición", cantidad=2, especificacion="Gabinete Auto-soportado NEMA 4X con Telemetría")
        ],
        observacionesGenerales="Expediente completamente aprobado a conformidad por INTECOAL SAS.",
        porcentajeCumplimiento=100
    )
]
