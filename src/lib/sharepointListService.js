export const SHAREPOINT_LIST_COLUMNS = [
  {
    internalName: 'Title',
    displayName: 'Número de Radicado (ID)',
    type: 'Text',
    required: true,
    description: 'Identificador único de radicación (ej. RAD-2026-000142)'
  },
  {
    internalName: 'CodigoProyecto',
    displayName: 'Código del Proyecto',
    type: 'Text',
    required: true,
    description: 'Código asignado al proyecto de Alumbrado Público (ej. INT-2026-001)'
  },
  {
    internalName: 'NombreProyecto',
    displayName: 'Nombre del Proyecto',
    type: 'Text',
    required: true,
    description: 'Nombre descriptivo de la obra de alumbrado'
  },
  {
    internalName: 'Municipio',
    displayName: 'Municipio',
    type: 'Choice',
    required: true,
    choices: ['Cali', 'Palmira', 'Buenaventura', 'Jamundí', 'Yumbo', 'Tuluá', 'Buga', 'Cartago', 'Otro'],
    description: 'Municipio del Valle del Cauca donde se realiza la obra'
  },
  {
    internalName: 'Contratista',
    displayName: 'Contratista Creador',
    type: 'Text',
    required: true,
    description: 'Empresa contratista que radica los documentos'
  },
  {
    internalName: 'NitContratista',
    displayName: 'NIT Contratista',
    type: 'Text',
    required: false,
    description: 'Número de Identificación Tributaria del contratista'
  },
  {
    internalName: 'CorreoResponsable',
    displayName: 'Correo Responsable M365',
    type: 'Text',
    required: true,
    description: 'Correo M365 / SENA / Empresa del creador'
  },
  {
    internalName: 'ResponsableRevision',
    displayName: 'Revisor Interventoría',
    type: 'Text',
    required: true,
    description: 'Ingeniero de INTECOAL SAS a cargo de la revisión'
  },
  {
    internalName: 'Estado',
    displayName: 'Estado de Radicación',
    type: 'Choice',
    required: true,
    choices: ['Radicado', 'En Revisión', 'Con Observaciones', 'Subsanación Requerida', 'Aprobado'],
    description: 'Estado actual del trámite documental RETILAP'
  },
  {
    internalName: 'PorcentajeCumplimiento',
    displayName: '% Cumplimiento RETILAP',
    type: 'Number',
    required: false,
    description: 'Porcentaje de los 21 requisitos validados (0 - 100%)'
  },
  {
    internalName: 'DocumentosOkCount',
    displayName: 'Documentos Válidos',
    type: 'Number',
    required: false,
    description: 'Cantidad de documentos aprobados o marcados N/A (máx 21)'
  },
  {
    internalName: 'RutaOneDrive',
    displayName: 'Ruta Carpeta OneDrive / SharePoint',
    type: 'Text',
    required: false,
    description: 'Enlace o ruta de la carpeta del expediente en M365'
  },
  {
    internalName: 'ArchivosJSON',
    displayName: 'Detalle de Archivos (JSON)',
    type: 'Note',
    required: false,
    description: 'Estructura JSON con los 21 ítems RETILAP y estados'
  },
  {
    internalName: 'ElementosJSON',
    displayName: 'Elementos Físicos (JSON)',
    type: 'Note',
    required: false,
    description: 'Estructura JSON con la lista de luminarias y materiales'
  },
  {
    internalName: 'ObservacionesGenerales',
    displayName: 'Observaciones Interventoría',
    type: 'Note',
    required: false,
    description: 'Comentarios del interventor durante la evaluación'
  },
  {
    internalName: 'FechaRadicacion',
    displayName: 'Fecha de Radicación',
    type: 'DateTime',
    required: true,
    description: 'Fecha y hora de radicación oficial'
  }
];

export function formatFilingForSharePoint(record) {
  return {
    Title: record.numeroRadicado,
    CodigoProyecto: record.metadata.codigoProyecto,
    NombreProyecto: record.metadata.nombreProyecto,
    Municipio: record.metadata.municipio,
    Contratista: record.metadata.contratista,
    NitContratista: record.metadata.nitContratista || '',
    CorreoResponsable: record.metadata.correoResponsable || '',
    ResponsableRevision: record.metadata.responsableRevision || 'Ing. John Fredy Castro',
    Estado: record.estado,
    PorcentajeCumplimiento: record.porcentajeCumplimiento,
    DocumentosOkCount: record.documentosOk,
    RutaOneDrive: record.rutaOneDrive,
    ArchivosJSON: JSON.stringify(record.archivos),
    ElementosJSON: JSON.stringify(record.elementosEntregados),
    ObservacionesGenerales: record.observacionesGenerales || '',
    FechaRadicacion: record.fechaRadicacion
  };
}

export function generatePnPPowerShellScript(siteUrl = 'https://intecoal.sharepoint.com/sites/AlumbradoPublico') {
  return `# Script PnP PowerShell para crear la Lista SharePoint "Radicaciones_AP" en Microsoft 365
# Ejecutar en PowerShell como Administrador

Connect-PnPOnline -Url "${siteUrl}" -Interactive
$listName = "Radicaciones_AP"
$list = Get-PnPList -Identity $listName -ErrorAction SilentlyContinue

if (-not $list) {
    Write-Host "Creando Lista SharePoint '$listName'..." -ForegroundColor Green
    $list = New-PnPList -Title $listName -Template GenericList -EnableVersioning
} else {
    Write-Host "La lista '$listName' ya existe en el sitio." -ForegroundColor Yellow
}

Add-PnPField -List $listName -DisplayName "Código Proyecto" -InternalName "CodigoProyecto" -Type Text -AddToDefaultView | Out-Null
Add-PnPField -List $listName -DisplayName "Nombre Proyecto" -InternalName "NombreProyecto" -Type Text -AddToDefaultView | Out-Null
Add-PnPField -List $listName -DisplayName "Municipio" -InternalName "Municipio" -Type Choice -Choices "Cali","Palmira","Buenaventura","Jamundí","Yumbo","Tuluá","Buga","Cartago","Otro" -AddToDefaultView | Out-Null
Add-PnPField -List $listName -DisplayName "Contratista Creador" -InternalName "Contratista" -Type Text -AddToDefaultView | Out-Null
Add-PnPField -List $listName -DisplayName "NIT Contratista" -InternalName "NitContratista" -Type Text | Out-Null
Add-PnPField -List $listName -DisplayName "Correo Responsable" -InternalName "CorreoResponsable" -Type Text -AddToDefaultView | Out-Null
Add-PnPField -List $listName -DisplayName "Responsable Revisión" -InternalName "ResponsableRevision" -Type Text | Out-Null
Add-PnPField -List $listName -DisplayName "Estado Radicación" -InternalName "Estado" -Type Choice -Choices "Radicado","En Revisión","Con Observaciones","Subsanación Requerida","Aprobado" -AddToDefaultView | Out-Null
Add-PnPField -List $listName -DisplayName "% Cumplimiento" -InternalName "PorcentajeCumplimiento" -Type Number -AddToDefaultView | Out-Null
Add-PnPField -List $listName -DisplayName "Documentos Válidos" -InternalName "DocumentosOkCount" -Type Number | Out-Null
Add-PnPField -List $listName -DisplayName "Ruta OneDrive" -InternalName "RutaOneDrive" -Type Text | Out-Null
Add-PnPField -List $listName -DisplayName "Archivos JSON" -InternalName "ArchivosJSON" -Type Note | Out-Null
Add-PnPField -List $listName -DisplayName "Elementos JSON" -InternalName "ElementosJSON" -Type Note | Out-Null
Add-PnPField -List $listName -DisplayName "Observaciones" -InternalName "ObservacionesGenerales" -Type Note -AddToDefaultView | Out-Null

Write-Host "Lista SharePoint '$listName' configurada exitosamente con las 16 columnas oficiales de RETILAP!" -ForegroundColor Green
`;
}
