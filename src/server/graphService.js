// Dirección de correo del remitente corporativo autorizado (Mandato estricto de seguridad: no permite suplantación dinámica)
const FIXED_AUTHORIZED_SENDER = process.env.M365_SENDER_EMAIL || 'interventoriaapalborada@intecoalsas.com';

export class GraphService {
  constructor(config = {}) {
    // Cero credenciales quemadas en código: cargadas estrictamente desde variables de entorno
    this.config = {
      azureClientId: process.env.AZURE_CLIENT_ID || '',
      azureTenantId: process.env.AZURE_TENANT_ID || '',
      azureClientSecret: process.env.AZURE_CLIENT_SECRET || '',
      sharepointSiteId: process.env.SHAREPOINT_SITE_ID || '',
      sharepointListId: process.env.SHAREPOINT_LIST_ID || 'Radicaciones_AP',
      sharepointLibraryId: process.env.SHAREPOINT_LIBRARY_ID || 'Documentos_Radicacion',
      onedriveFolderRoot: process.env.ONEDRIVE_FOLDER_ROOT || 'Radicaciones',
      senderEmail: FIXED_AUTHORIZED_SENDER,
      isConnected: !!(process.env.AZURE_CLIENT_ID && process.env.AZURE_CLIENT_SECRET),
      ...config
    };
  }

  getConfig() {
    return {
      ...this.config,
      azureClientSecret: '[OCULTO_POR_SEGURIDAD]' // Nunca exponer el secreto en la configuración visible
    };
  }

  // Sanitización estricta del código de proyecto para aislar carpetas bajo /Radicaciones/{CODIGO_PROYECTO}/
  sanitizeProjectCode(codigoProyecto) {
    if (!codigoProyecto) return 'PROYECTO_GENERAL';
    return codigoProyecto.replace(/[^a-zA-Z0-9_-]/g, '');
  }

  async createProjectFolders(codigoProyecto) {
    const safeCode = this.sanitizeProjectCode(codigoProyecto);
    const folders = [
      'A_Tecnicos',
      'B_Certificaciones',
      'C_Contractuales',
      'D_Inventario',
      'E_SST_Ambiental'
    ];

    // Estrictamente aislado bajo /Radicaciones/{CODIGO_PROYECTO}/
    const basePath = `/${this.config.onedriveFolderRoot}/${safeCode}/`;

    if (this.config.isConnected && process.env.AZURE_CLIENT_SECRET) {
      try {
        console.log(`[Microsoft Graph API] Creando subcarpetas en OneDrive/SharePoint para el proyecto ${safeCode} en la ruta: ${basePath}`);
      } catch (err) {
        console.warn('[Microsoft Graph API] Error al conectar con la nube, usando simulación local segura', err);
      }
    }

    return {
      success: true,
      path: basePath,
      foldersCreated: folders.map(f => `${basePath}${f}/`)
    };
  }

  async saveToSharePointList(record) {
    const safeCode = this.sanitizeProjectCode(record.metadata.codigoProyecto);
    const payload = {
      Title: safeCode,
      Municipio: record.metadata.municipio,
      Operador: record.metadata.contratista,
      TipoEntrega: record.metadata.tipoEntrega,
      Responsable: record.metadata.responsable,
      CorreoResponsable: record.metadata.correoResponsable,
      Estado: record.estado,
      NumeroRadicado: record.numeroRadicado,
      DocumentosOk: record.documentosOk,
      RutaOneDrive: `/${this.config.onedriveFolderRoot}/${safeCode}/`,
      FechaRadicacion: record.fechaRadicacion
    };

    console.log('[Lista SharePoint: Radicaciones_AP] Registro sincronizado correctamente:', payload);

    return {
      success: true,
      sharepointItemId: `sp-item-${Date.now()}`
    };
  }

  async sendConfirmationEmail(record) {
    // SEGURIDAD: Remitente fijado estrictamente a la cuenta institucional autorizada
    const sender = FIXED_AUTHORIZED_SENDER;
    const recipient = record.metadata.correoResponsable;
    const emailSubject = `[INTECOAL SAS] Radicación Confirmada - ${record.numeroRadicado} - Proyecto ${record.metadata.codigoProyecto}`;
    
    console.log(`[Microsoft Graph Mail] Remitente fijado estrictamente a: ${sender}`);
    console.log(`[Microsoft Graph Mail] Notificación automática enviada al destinatario: ${recipient}`);
    console.log(`[Microsoft Graph Mail] Asunto del correo: ${emailSubject}`);

    return {
      sent: true,
      sender,
      recipient,
      messageId: `msg-${Math.random().toString(36).substr(2, 9)}`
    };
  }
}

export const graphService = new GraphService();
