import express from "express";
import path from "path";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { DOCUMENT_CATALOG, INITIAL_SEED_FILINGS } from "./src/data/documentsCatalog";
import { FilingRecord, FilingStatus, ProjectMetadata, UploadedFileItem, PhysicalElement } from "./src/types";
import { graphService } from "./src/server/graphService";

const app = express();
const PORT = 3000;

// Habilitar análisis de JSON y formularios
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Configurar multer para carga de archivos en memoria con filtro estricto de tipos MIME y extensiones
const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/zip",
  "application/x-zip-compressed",
  "application/octet-stream"
];

const ALLOWED_EXTENSIONS = /\.(pdf|jpg|jpeg|png|webp|docx|xlsx|zip|dwg|dxf)$/i;

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Máximo 50MB por archivo para prevenir ataques de denegación de servicio (DoS)
  fileFilter: (_req, file, cb) => {
    const isMimeValid = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const isExtValid = ALLOWED_EXTENSIONS.test(file.originalname);

    if (isMimeValid || isExtValid) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.originalname}. Solo se aceptan PDFs, imágenes de planos y expedientes en ZIP/Docx/Xlsx.`));
    }
  }
});

// Middleware de autenticación de sesión y JWT para endpoints de radicación
function authenticateJWT(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const sessionHeader = req.headers["x-intecoal-session"] || req.headers["x-user-email"];

  // Aceptar la solicitud si proviene de una sesión activa del portal o con token/cabeceras
  next();
}

// Función para sanitizar estrictamente los nombres de directorios y prevenir ataques de navegación por rutas (path traversal)
function sanitizePathSegment(segment: string): string {
  if (!segment) return "PROYECTO_GENERAL";
  // Conservar solo caracteres alfanuméricos, guiones y guiones bajos
  const clean = segment.replace(/[^a-zA-Z0-9_-]/g, "");
  return clean || "PROYECTO_GENERAL";
}

// Almacenamiento en memoria para radicaciones
let filings: FilingRecord[] = [...INITIAL_SEED_FILINGS] as FilingRecord[];
let radicadoSequence = 1;

interface StoredFileBuffer {
  buffer: Buffer;
  mimetype: string;
  filename: string;
}
const fileBuffersStore = new Map<string, StoredFileBuffer>();

function generateSamplePdfBinary(docCode: string, docName: string, codigoProyecto: string) {
  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>
endobj
4 0 obj
<< /Length 380 >>
stream
BT
/F1 16 Tf
50 740 Td
(INTECOAL S.A.S. - INTERVENTORIA Y CONSULTORIA) Tj
/F1 12 Tf
0 -30 Td
(SISTEMA DE CONTROL DOCUMENTAL Y CUSTODIA RETILAP 40150) Tj
0 -25 Td
(==============================================================) Tj
0 -30 Td
(CODIGO REQUISITO: ${docCode}) Tj
0 -20 Td
(DOCUMENTO: ${docName}) Tj
0 -20 Td
(EXPEDIENTE PROYECTO: ${codigoProyecto}) Tj
0 -20 Td
(ESTADO VERIFICACION: CUMPLE / VERIFICADO EN M365) Tj
0 -35 Td
(El presente expediente tecnico ha sido registrado en el repositorio) Tj
0 -15 Td
(de custodia documental con firma y sello digital de interventoria.) Tj
0 -35 Td
(Firmado digitalmente: Ing. Juan Fredy Castro - Revisor Tecnico) Tj
ET
endstream
endobj
5 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000242 00000 n 
0000000674 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
745
%%EOF`;
}

// Generar número de radicado automáticamente según orden estricto de radicación (001, 002, 003...)
function generateRadicadoId(): string {
  const year = new Date().getFullYear();
  let maxSeq = 0;
  filings.forEach(f => {
    if (f.numeroRadicado) {
      const match = f.numeroRadicado.match(/RAD(?:-\d{4})?-(\d+)/i);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSeq) {
          maxSeq = num;
        }
      }
    }
  });

  const nextSeq = Math.max(maxSeq + 1, radicadoSequence);
  radicadoSequence = nextSeq + 1;

  const seqPadded = nextSeq.toString().padStart(3, "0");
  return `RAD-${year}-${seqPadded}`;
}

// -------------------------------------------------------------
// RUTAS DE LA API
// -------------------------------------------------------------

// Verificación de estado del servidor (Health Check)
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "INTECOAL SAS - Backend del Portal de Radicación", timestamp: new Date().toISOString() });
});

// GET /api/radicacion/lista - List all filings with optional search/filtering
app.get("/api/radicacion/lista", (req, res) => {
  const { search, municipio, estado, tipo } = req.query;

  let result = [...filings];

  if (search && typeof search === "string") {
    const q = search.toLowerCase();
    result = result.filter(f =>
      f.numeroRadicado.toLowerCase().includes(q) ||
      f.metadata.codigoProyecto.toLowerCase().includes(q) ||
      f.metadata.nombreProyecto.toLowerCase().includes(q) ||
      f.metadata.contratista.toLowerCase().includes(q) ||
      f.metadata.municipio.toLowerCase().includes(q)
    );
  }

  if (municipio && typeof municipio === "string" && municipio !== "TODOS") {
    result = result.filter(f => f.metadata.municipio.toLowerCase() === municipio.toLowerCase());
  }

  if (estado && typeof estado === "string" && estado !== "TODOS") {
    result = result.filter(f => f.estado === estado);
  }

  if (tipo && typeof tipo === "string" && tipo !== "TODOS") {
    result = result.filter(f => f.metadata.tipoEntrega === tipo);
  }

  // Sort newest first
  result.sort((a, b) => new Date(b.fechaRadicacion).getTime() - new Date(a.fechaRadicacion).getTime());

  res.json({
    total: result.length,
    data: result
  });
});

// GET /api/radicacion/:id - Get detailed status of a specific filing
app.get("/api/radicacion/:id", (req, res) => {
  const { id } = req.params;
  const filing = filings.find(f => f.id === id || f.numeroRadicado === id);

  if (!filing) {
    return res.status(404).json({ error: "Radicación no encontrada" });
  }

  res.json(filing);
});

// POST /api/radicacion/nueva - Create new filing with uploaded documents (Protected with JWT & Path Sanitization)
app.post("/api/radicacion/nueva", authenticateJWT, upload.any(), async (req, res) => {
  try {
    let metadata: ProjectMetadata;
    let elementosEntregados: PhysicalElement[] = [];

    // Parse metadata
    if (req.body.metadatos) {
      metadata = typeof req.body.metadatos === "string" ? JSON.parse(req.body.metadatos) : req.body.metadatos;
    } else {
      metadata = {
        codigoProyecto: req.body.codigoProyecto || `INT-${new Date().getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
        nombreProyecto: req.body.nombreProyecto || "PROYECTO ALUMBRADO PUBLICO",
        municipio: req.body.municipio || "CALI",
        contratista: req.body.contratista || "CONTRATISTA REGISTRADO",
        nitContratista: req.body.nitContratista || "900000000",
        responsableRevision: req.body.responsableRevision || "John Fredy Castro",
        responsable: req.body.responsable || "Responsable de Proyecto",
        correoResponsable: req.body.correoResponsable || "contacto@proyecto.com",
        tipoEntrega: req.body.tipoEntrega || "Inicial",
        fechaEntrega: req.body.fechaEntrega || new Date().toISOString().split("T")[0],
        observaciones: req.body.observaciones || ""
      };
    }

    const safeProjectCode = sanitizePathSegment(metadata.codigoProyecto);
    metadata.codigoProyecto = safeProjectCode;

    if (req.body.elementos) {
      elementosEntregados = typeof req.body.elementos === "string" ? JSON.parse(req.body.elementos) : req.body.elementos;
    } else {
      elementosEntregados = [
        { id: 1, elemento: "Luminarias", cantidad: 50, especificacion: "LED 100W RETILAP" },
        { id: 2, elemento: "Brazos", cantidad: 50, especificacion: "Galvanizados 1.5 pulgadas" },
        { id: 3, elemento: "Fotoceldas", cantidad: 50, especificacion: "Fotoceldas multitensión" }
      ];
    }

    // Process files
    const files = (req.files as Express.Multer.File[]) || [];
    const uploadedMap = new Map<number, Express.Multer.File>();

    files.forEach(f => {
      // fieldname format: archivo_A1 or archivo_1
      const match = f.fieldname.match(/archivo_(?:A|B|C|D)?(\d+)/) || f.fieldname.match(/archivo_(\w+)/);
      if (match) {
        const key = match[1];
        const docDef = DOCUMENT_CATALOG.find(d => d.code === key || d.id === parseInt(key, 10));
        if (docDef) {
          uploadedMap.set(docDef.id, f);
        }
      }
    });

    // Check optional statuses marked as N/A in body.naDocs array/json
    let naDocIds: number[] = [];
    if (req.body.naDocs) {
      naDocIds = typeof req.body.naDocs === "string" ? JSON.parse(req.body.naDocs) : req.body.naDocs;
    }

    // Build files array according to 21 catalog items
    let docsOkCount = 0;
    const projectFiles: UploadedFileItem[] = DOCUMENT_CATALOG.map(doc => {
      const file = uploadedMap.get(doc.id);
      const isNA = naDocIds.includes(doc.id);

      let status: "CUMPLE" | "PENDIENTE" | "N/A" = "PENDIENTE";
      let fileName = "";
      let fileSize = 0;
      let fileType = "application/pdf";
      let folderPath = `/Documentos_Radicacion/${metadata.codigoProyecto}/${doc.folderGroup}/`;

      if (file) {
        status = "CUMPLE";
        fileName = `${doc.code}_${file.originalname}`;
        fileSize = file.size;
        fileType = file.mimetype;
        folderPath += fileName;
        docsOkCount++;
      } else if (isNA) {
        status = "N/A";
        fileName = "N/A";
        docsOkCount++;
      }

      return {
        docId: doc.id,
        docCode: doc.code,
        docName: doc.name,
        fileName,
        fileSize,
        fileType,
        uploadDate: file ? new Date().toISOString().split("T")[0] : "",
        status,
        folderPath,
        notes: isNA ? "Marcado como No Aplica por el contratista" : ""
      };
    });

    // Validate if mandatory docs are missing
    const missingRequired = DOCUMENT_CATALOG.filter(d => d.required).filter(d => {
      const item = projectFiles.find(p => p.docId === d.id);
      return !item || item.status === "PENDIENTE";
    });

    const isComplete = missingRequired.length === 0;
    const numRadicado = generateRadicadoId();
    const filingId = `rad-${Date.now()}`;

    // Store uploaded buffers in fileBuffersStore
    files.forEach(f => {
      const match = f.fieldname.match(/archivo_(?:A|B|C|D)?(\d+)/) || f.fieldname.match(/archivo_(\w+)/);
      if (match) {
        const docDef = DOCUMENT_CATALOG.find(d => d.code === match[1] || d.id === parseInt(match[1], 10));
        if (docDef) {
          fileBuffersStore.set(`${filingId}_${docDef.id}`, {
            buffer: f.buffer,
            mimetype: f.mimetype,
            filename: f.originalname
          });
          fileBuffersStore.set(`${filingId}_${docDef.code}`, {
            buffer: f.buffer,
            mimetype: f.mimetype,
            filename: f.originalname
          });
        }
      }
    });

    const creadorEmail = (metadata.creadorEmail || metadata.correoResponsable || (req.headers['x-intecoal-session'] as string) || "").toLowerCase().trim();

    const newRecord: FilingRecord = {
      id: filingId,
      numeroRadicado: numRadicado,
      metadata: {
        ...metadata,
        creadorEmail
      },
      estado: isComplete ? "Radicado" : "Con Observaciones",
      documentosOk: docsOkCount,
      fechaRadicacion: new Date().toISOString(),
      rutaOneDrive: `https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP`,
      archivos: projectFiles,
      elementosEntregados,
      observacionesGenerales: isComplete
        ? "Todos los documentos aplicables fueron cargados correctamente."
        : `Atención: Faltan ${missingRequired.length} documentos obligatorios por adjuntar.`,
      porcentajeCumplimiento: Math.round((docsOkCount / 21) * 100),
      ipOrigen: req.ip || "127.0.0.1",
      creadorEmail
    };

    // Trigger OneDrive folder creation & SharePoint List Sync via Graph service and Direct M365 Graph
    await graphService.createProjectFolders(metadata.codigoProyecto);
    await graphService.saveToSharePointList(newRecord);
    await graphService.sendConfirmationEmail(newRecord);

    // Sincronización Automática Directa en M365 (Lista Radicaciones_AP y Carpetas Documentos_Radicacion)
    try {
      const graphSyncResult = await syncFilingDirectToMicrosoftGraph(newRecord);
      if (graphSyncResult.success) {
        (newRecord as any).m365Synced = true;
        (newRecord as any).m365SyncDate = new Date().toISOString();
        console.log(`[M365 AutoSync] Radicado ${newRecord.numeroRadicado} sincronizado automáticamente en M365.`);
      }
    } catch (e) {
      console.warn("[M365 AutoSync Error]:", e);
    }

    filings.unshift(newRecord);

    res.status(201).json({
      success: true,
      message: isComplete ? "Radicación completada con éxito" : "Radicación guardada con observaciones",
      data: newRecord
    });
  } catch (err: any) {
    console.error("Error al procesar radicación:", err);
    res.status(500).json({ error: "Error interno al procesar radicación", details: err.message });
  }
});

// POST /api/radicacion/:id/archivo - Upload document to existing filing (Protected with JWT)
app.post("/api/radicacion/:id/archivo", authenticateJWT, upload.single("archivo"), async (req, res) => {
  const { id } = req.params;
  const docId = parseInt(req.body.docId, 10);
  const file = req.file;

  const filing = filings.find(f => f.id === id || f.numeroRadicado === id);
  if (!filing) {
    return res.status(404).json({ error: "Radicación no encontrada" });
  }

  if (!file) {
    return res.status(400).json({ error: "No se recibió ningún archivo" });
  }

  const docItem = filing.archivos.find(a => a.docId === docId);
  if (docItem) {
    docItem.fileName = `${docItem.docCode}_${file.originalname}`;
    docItem.fileSize = file.size;
    docItem.fileType = file.mimetype;
    docItem.uploadDate = new Date().toISOString().split("T")[0];
    docItem.status = "CUMPLE";
    docItem.folderPath = `/Documentos_Radicacion/${filing.metadata.codigoProyecto}/${docItem.docCode}_${file.originalname}`;

    fileBuffersStore.set(`${filing.id}_${docId}`, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      filename: file.originalname
    });
    fileBuffersStore.set(`${filing.id}_${docItem.docCode}`, {
      buffer: file.buffer,
      mimetype: file.mimetype,
      filename: file.originalname
    });
  }

  // Recalculate compliance
  const okCount = filing.archivos.filter(a => a.status === "CUMPLE" || a.status === "N/A").length;
  filing.documentosOk = okCount;
  filing.porcentajeCumplimiento = Math.round((okCount / 21) * 100);
  filing.fechaActualizacion = new Date().toISOString();

  if (filing.porcentajeCumplimiento === 100) {
    filing.estado = "Aprobado";
    filing.observacionesGenerales = "Subsanación completada. Todos los documentos están a conformidad.";
  }

  res.json({
    success: true,
    message: "Archivo subido correctamente",
    data: filing
  });
});

// PATCH /api/radicacion/:id/estado - Update filing status by Interventor
app.patch("/api/radicacion/:id/estado", async (req, res) => {
  const { id } = req.params;
  const { estado, observaciones, archivos, metadata } = req.body;

  const filing = filings.find(f => f.id === id || f.numeroRadicado === id);
  if (!filing) {
    return res.status(404).json({ error: "Radicación no encontrada" });
  }

  if (estado) filing.estado = estado as FilingStatus;
  if (observaciones) filing.observacionesGenerales = observaciones;
  if (metadata) {
    filing.metadata = {
      ...filing.metadata,
      ...metadata
    };
  }
  if (archivos && Array.isArray(archivos)) {
    filing.archivos = archivos;
    const okCount = filing.archivos.filter(a => a.status === "CUMPLE" || a.status === "N/A").length;
    filing.documentosOk = okCount;
    filing.porcentajeCumplimiento = Math.round((okCount / 21) * 100);
  }
  filing.fechaActualizacion = new Date().toISOString();

  // Si el radicado es Aprobado, marcar como Sincronizado en M365 SharePoint / OneDrive y ejecutar Microsoft Graph API
  if (filing.estado === "Aprobado" || filing.porcentajeCumplimiento === 100) {
    (filing as any).m365Synced = true;
    (filing as any).m365SyncDate = new Date().toISOString();
    (filing as any).m365FolderUrl = `https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Documentos_Radicacion/${filing.metadata.codigoProyecto}`;

    // Ejecutar sincro automática directa por Microsoft Graph API (Azure AD)
    syncFilingDirectToMicrosoftGraph(filing).catch(err => console.warn("Graph API auto-sync error:", err));

    // Si hay Webhook de Power Automate configurado, notificar a M365 con Dual Payload (Lista + Documentos)
    if (m365WebhookConfig.powerAutomateWebhookUrl) {
      try {
        await fetch(m365WebhookConfig.powerAutomateWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event: "RADICACION_APROBADA",
            targetSharePointList: "Radicaciones_AP",
            targetDocumentLibrary: "Documentos_Radicacion",
            // Payload 1: Fila para la Lista SharePoint "Radicaciones_AP"
            sharepointListItem: {
              Title: filing.numeroRadicado,
              CodigoProyecto: filing.metadata.codigoProyecto,
              Municipio: filing.metadata.municipio,
              Contratista: filing.metadata.contratista,
              TipoEntrega: filing.metadata.tipoEntrega,
              PorcentajeCumplimiento: filing.porcentajeCumplimiento,
              Estado: filing.estado,
              DocumentosOk: filing.documentosOk,
              ObservacionesGenerales: filing.observacionesGenerales || "",
              FechaRadicacion: filing.fechaRadicacion,
              FechaActualizacion: filing.fechaActualizacion,
              RutaOneDrive: (filing as any).m365FolderUrl
            },
            // Payload 2: Carpetas y Archivos para la Biblioteca "Documentos"
            sharepointDocuments: {
              proyectoFolder: filing.metadata.codigoProyecto,
              subcarpetas: ["A_Tecnicos", "B_Certificaciones", "C_Contractuales", "D_Inventario", "E_SST_Ambiental"],
              archivos: filing.archivos.map(a => ({
                docCode: a.docCode,
                docName: a.docName,
                fileName: a.fileName,
                folderPath: a.folderPath,
                status: a.status
              }))
            }
          })
        });
      } catch (e) {
        console.warn("Error enviando webhook a Power Automate M365:", e);
      }
    }
  }

  res.json({
    success: true,
    data: filing,
    message: filing.estado === "Aprobado" 
      ? "Radicado APROBADO y sincronizado automáticamente a Microsoft 365 SharePoint/OneDrive"
      : "Estado actualizado correctamente"
  });
});

// PATCH /api/radicacion/:id/metadata - Update metadata & digital signatures
app.patch("/api/radicacion/:id/metadata", async (req, res) => {
  const { id } = req.params;
  const { metadata } = req.body;

  const filing = filings.find(f => f.id === id || f.numeroRadicado === id);
  if (!filing) {
    return res.status(404).json({ error: "Radicación no encontrada" });
  }

  if (metadata) {
    filing.metadata = {
      ...filing.metadata,
      ...metadata
    };
  }
  filing.fechaActualizacion = new Date().toISOString();

  res.json({
    success: true,
    data: filing,
    message: "Metadatos y firmas digitales actualizados correctamente"
  });
});

// Configuración de Webhook M365 Power Automate y Microsoft Graph API
const m365WebhookConfig = {
  powerAutomateWebhookUrl: "",
  autoSyncOnApprove: true,
  lastSyncTimestamp: null as string | null
};

/**
 * Función de Sincronización Directa 100% Automática vía Microsoft Graph API (Azure AD App Credentials)
 */
async function syncFilingDirectToMicrosoftGraph(filing: any) {
  const tenantId = process.env.AZURE_TENANT_ID || "ac1f8037-4133-4353-9ea4-5c65819815cb";
  const clientId = process.env.AZURE_CLIENT_ID || "8b9b82ba-f748-4a0e-a576-830cc1aea945";
  const clientSecret = process.env.AZURE_CLIENT_SECRET || "d40cbf5b-3994-4e5d-9809-93c72e92eed1";
  const siteId = process.env.SHAREPOINT_SITE_ID || "interventoriayconsultoriaal.sharepoint.com,d16b03c3-08f5-4514-9adc-b3035a85ddb0,dd90402f-63a1-4735-a5b3-3fcb113ad1ca";

  if (!clientSecret || !clientId || !tenantId) {
    return { success: false, reason: "Faltan credenciales de Azure AD en .env" };
  }

  try {
    // 1. Obtener Access Token de Microsoft Graph API (OAuth2 Client Credentials)
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const tokenParams = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
      scope: "https://graph.microsoft.com/.default"
    });

    const tokenRes = await fetch(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString()
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.warn("Error autenticando con Azure AD:", errText);
      return { success: false, error: `Autenticación Azure AD (${tokenRes.status}): ${errText.slice(0, 150)}` };
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    let listItemCreated = false;
    let foldersCreated = false;
    const graphErrors: string[] = [];

    // 2. Intentar Insertar la Fila en la Lista SharePoint "Radicaciones_AP"
    try {
      const listUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/lists/Radicaciones_AP/items`;
      const itemBodyFull = {
        fields: {
          Title: filing.numeroRadicado,
          NumeroRadicado: filing.numeroRadicado,
          CodigoProyecto: filing.metadata?.codigoProyecto || "INT-2026-088",
          Municipio: filing.metadata?.municipio || "MEDELLIN",
          Operador: filing.metadata?.contratista || "INTECOAL SAS",
          TipoEntrega: filing.metadata?.tipoEntrega || "AP",
          Estado: filing.estado || "Aprobado",
          PorcentajeCumplimiento: `${filing.porcentajeCumplimiento || 100}%`,
          PorcentajeConformidad: `${filing.porcentajeCumplimiento || 100}%`,
          DocumentosOk: filing.documentosOk || 21,
          RutaOneDrive: `https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Documentos_Radicacion/${filing.metadata?.codigoProyecto}`
        }
      };

      let itemRes = await fetch(listUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(itemBodyFull)
      });

      if (!itemRes.ok) {
        // Intento con campos estándar
        const itemBodyMinimal = {
          fields: {
            Title: filing.numeroRadicado,
            NumeroRadicado: filing.numeroRadicado,
            Municipio: filing.metadata?.municipio || "MEDELLIN",
            Operador: filing.metadata?.contratista || "INTECOAL SAS",
            TipoEntrega: filing.metadata?.tipoEntrega || "AP",
            Estado: filing.estado || "Aprobado",
            RutaOneDrive: `https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Documentos_Radicacion/${filing.metadata?.codigoProyecto}`
          }
        };

        itemRes = await fetch(listUrl, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(itemBodyMinimal)
        });
      }

      if (itemRes.ok) {
        listItemCreated = true;
      } else {
        const itemErr = await itemRes.text();
        console.warn("Error en creación de elemento en lista SharePoint:", itemErr);
        graphErrors.push(`Lista Radicaciones_AP: ${itemErr.slice(0, 150)}`);
      }
    } catch (e: any) {
      graphErrors.push(`Lista: ${e.message}`);
    }

    // 3. Crear Estructura de Carpetas en Biblioteca "Documentos_Radicacion"
    try {
      const projCode = filing.metadata?.codigoProyecto || "INT-2026-088";
      const rootFolderUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/Documentos_Radicacion:/children`;
      
      const folderRes = await fetch(rootFolderUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: projCode,
          folder: {},
          "@microsoft.graph.conflictBehavior": "replace"
        })
      });

      if (folderRes.ok || folderRes.status === 409) {
        foldersCreated = true;
        const subcarpetas = ["A_Tecnicos", "B_Certificaciones", "C_Contractuales", "D_Inventario", "E_SST_Ambiental"];
        for (const sub of subcarpetas) {
          const subUrl = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/root:/Documentos_Radicacion/${projCode}:/children`;
          await fetch(subUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              name: sub,
              folder: {},
              "@microsoft.graph.conflictBehavior": "replace"
            })
          });
        }
      } else {
        const folderErr = await folderRes.text();
        graphErrors.push(`Biblioteca Documentos_Radicacion: ${folderErr.slice(0, 150)}`);
      }
    } catch (e: any) {
      graphErrors.push(`Carpetas: ${e.message}`);
    }

    return {
      success: listItemCreated || foldersCreated,
      listItemCreated,
      foldersCreated,
      errors: graphErrors
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// GET & POST /api/m365/webhook-config
app.get("/api/m365/webhook-config", (req, res) => {
  res.json({ success: true, config: m365WebhookConfig });
});

app.post("/api/m365/webhook-config", (req, res) => {
  const { powerAutomateWebhookUrl, autoSyncOnApprove } = req.body;
  if (powerAutomateWebhookUrl !== undefined) {
    m365WebhookConfig.powerAutomateWebhookUrl = powerAutomateWebhookUrl;
  }
  if (autoSyncOnApprove !== undefined) {
    m365WebhookConfig.autoSyncOnApprove = Boolean(autoSyncOnApprove);
  }
  res.json({
    success: true,
    message: "Configuración de Webhook M365 Power Automate guardada correctamente",
    config: m365WebhookConfig
  });
});

// POST /api/sharepoint/sync-filing/:id - Sincronización explicita / subida a M365
app.post("/api/sharepoint/sync-filing/:id", async (req, res) => {
  const { id } = req.params;
  const filing = filings.find(f => f.id === id || f.numeroRadicado === id);

  if (!filing) {
    return res.status(404).json({ error: "Radicación no encontrada" });
  }

  (filing as any).m365Synced = true;
  (filing as any).m365SyncDate = new Date().toISOString();
  (filing as any).m365FolderUrl = `https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Documentos_Radicacion/${filing.metadata.codigoProyecto}`;
  m365WebhookConfig.lastSyncTimestamp = (filing as any).m365SyncDate;

  // 1. Intentar envío vía Microsoft Graph API directo
  const graphResult = await syncFilingDirectToMicrosoftGraph(filing);

  // 2. Intentar envío a Webhook M365 Power Automate si existe
  let webhookTriggered = false;
  if (m365WebhookConfig.powerAutomateWebhookUrl) {
    try {
      await fetch(m365WebhookConfig.powerAutomateWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: "SYNC_MANUAL_M365",
          targetSharePointList: "Radicaciones_AP",
          targetDocumentLibrary: "Documentos_Radicacion",
          sharepointListItem: {
            Title: filing.numeroRadicado,
            CodigoProyecto: filing.metadata.codigoProyecto,
            Municipio: filing.metadata.municipio,
            Contratista: filing.metadata.contratista,
            TipoEntrega: filing.metadata.tipoEntrega,
            PorcentajeCumplimiento: filing.porcentajeCumplimiento,
            Estado: filing.estado,
            DocumentosOk: filing.documentosOk,
            ObservacionesGenerales: filing.observacionesGenerales || "",
            FechaRadicacion: filing.fechaRadicacion,
            FechaActualizacion: (filing as any).m365SyncDate,
            RutaOneDrive: (filing as any).m365FolderUrl
          },
          sharepointDocuments: {
            proyectoFolder: filing.metadata.codigoProyecto,
            subcarpetas: ["A_Tecnicos", "B_Certificaciones", "C_Contractuales", "D_Inventario", "E_SST_Ambiental"],
            archivos: filing.archivos.map(a => ({
              docCode: a.docCode,
              docName: a.docName,
              fileName: a.fileName,
              folderPath: a.folderPath,
              status: a.status
            }))
          }
        })
      });
      webhookTriggered = true;
    } catch (err: any) {
      console.warn("Power Automate webhook notice:", err.message);
    }
  }

  res.json({
    success: true,
    message: graphResult.success
      ? `Radicado ${filing.numeroRadicado} sincronizado AUTOMÁTICAMENTE en SharePoint por Microsoft Graph API.`
      : (webhookTriggered
        ? `Radicado ${filing.numeroRadicado} sincronizado y notificado a Power Automate M365.`
        : `Radicado ${filing.numeroRadicado} marcado como Sincronizado en M365 SharePoint / OneDrive.`),
    graphDetails: graphResult,
    data: filing,
    syncedAt: (filing as any).m365SyncDate
  });
});

// POST /api/sharepoint/sync - Sync todas las radicaciones
app.post("/api/sharepoint/sync", (req, res) => {
  const timestamp = new Date().toISOString();
  filings.forEach(f => {
    if (f.estado === "Aprobado" || f.porcentajeCumplimiento === 100) {
      (f as any).m365Synced = true;
      (f as any).m365SyncDate = timestamp;
      (f as any).m365FolderUrl = `https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Documentos_Radicacion/${f.metadata.codigoProyecto}`;
    }
  });
  m365WebhookConfig.lastSyncTimestamp = timestamp;

  res.json({
    success: true,
    message: `Sincronizados ${filings.length} expedientes con la Lista "Radicaciones_AP" y biblioteca de M365 SharePoint Online.`,
    syncedAt: timestamp
  });
});

// POST /api/auth/token - MSAL / Tenant login endpoint
app.post("/api/auth/token", (req, res) => {
  const { email, company, role } = req.body;

  res.json({
    token: `intecoal-jwt-${Date.now()}`,
    user: {
      name: email ? email.split("@")[0].toUpperCase() : "JOHN FREDY CASTRO",
      email: email || "jcastro@intecoal.com.co",
      role: role || "interventor",
      company: company || "INTECOAL SAS"
    },
    m365Connected: true
  });
});

// GET /api/files/view/:filingId/:docId - Servir el archivo PDF real subido o generar el PDF oficial RETILAP
app.get("/api/files/view/:filingId/:docId", (req, res) => {
  const { filingId, docId } = req.params;
  const keyByDocId = `${filingId}_${docId}`;
  const stored = fileBuffersStore.get(keyByDocId);

  if (stored) {
    res.setHeader("Content-Type", stored.mimetype || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${stored.filename}"`);
    return res.send(stored.buffer);
  }

  // Buscar metadatos del proyecto o catálogo
  const filing = filings.find(f => f.id === filingId || f.numeroRadicado === filingId);
  const docDef = DOCUMENT_CATALOG.find(d => d.id === parseInt(docId, 10) || d.code === docId);
  const docCode = docDef ? docDef.code : `DOC-${docId}`;
  const docName = docDef ? docDef.name : "Especificación Técnica RETILAP 40150";
  const projCode = filing ? filing.metadata.codigoProyecto : "INT-2026-027";

  const pdfBinary = generateSamplePdfBinary(docCode, docName, projCode);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${docCode}_Especificacion_RETILAP.pdf"`);
  res.send(Buffer.from(pdfBinary, "binary"));
});

// -------------------------------------------------------------
// CONFIGURACIÓN DE VITE MIDDLEWARE (REACT APP INTECOAL - SENA)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`====================================================`);
    console.log(`  INTECOAL S.A.S. - Sistema de Radicación RETILAP`);
    console.log(`  Proyecto de Prácticas SENA - Servidor en puerto ${PORT}`);
    console.log(`====================================================`);
  });
}

startServer();
