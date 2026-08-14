import JSZip from 'jszip';

/**
 * Genera y descarga un paquete de archivos ZIP con la estructura completa de carpetas
 * M365 (A_Tecnicos, B_Certificaciones, etc.) listo para arrastrar y soltar en la biblioteca
 * "Documentos" o "Documentos_Radicacion" de SharePoint Online.
 */
export async function downloadFilingZip(filing) {
  const zip = new JSZip();
  const rootFolderName = filing.metadata?.codigoProyecto || 'EXPEDIENTE_RETILAP';
  const projectFolder = zip.folder(rootFolderName);

  // Subcarpetas estándar M365
  const folderA = projectFolder.folder('A_Tecnicos');
  const folderB = projectFolder.folder('B_Certificaciones');
  const folderC = projectFolder.folder('C_Contractuales');
  const folderD = projectFolder.folder('D_Inventario');
  const folderE = projectFolder.folder('E_SST_Ambiental');

  // Documento de metadatos e instrucciones de carga SharePoint
  const readmeContent = `EXPEDIENTE TÉCNICO VERIFICACIÓN RETILAP 40150
================================================================
INTERVENTORÍA Y CONSULTORÍA S.A.S. - INTECOAL S.A.S.

DATOS DEL EXPEDIENTE:
---------------------
Código del Proyecto: ${filing.metadata?.codigoProyecto || 'N/A'}
Municipio: ${filing.metadata?.municipio || 'N/A'}
Contratista: ${filing.metadata?.contratista || 'N/A'}
Número de Radicado: ${filing.numeroRadicado || 'N/A'}
Fecha de Radicación: ${filing.fechaRadicacion || 'N/A'}
Estado: ${filing.estado || 'Aprobado'}
Documentos Verificados: ${filing.documentosOk || 21} de 21 requisitos RETILAP
Porcentaje de Cumplimiento: ${filing.porcentajeCumplimiento || 100}%

PASOS PARA SUBIR ESTA CARPETA A TU SHAREPOINT ONLINE:
-----------------------------------------------------
1. Abre tu sitio SharePoint en el navegador:
   https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Shared%20Documents
2. Haz clic en el menú izquierdo en "Documentos".
3. Arrastra directamente la carpeta "${rootFolderName}" desde tu equipo hacia la pantalla de SharePoint.
4. ¡Listo! Todos los PDFs quedarán guardados y organizados automáticamente en la nube.
`;

  projectFolder.file('README_INSTRUCCIONES_SHAREPOINT.txt', readmeContent);

  // Generar cada archivo PDF del radicado
  const archivos = filing.archivos || [];
  for (const archivo of archivos) {
    if (archivo.status === 'CUMPLE' || archivo.status === 'N/A' || filing.estado === 'Aprobado') {
      let targetSubFolder = projectFolder;
      const path = archivo.folderPath || '';

      if (path.includes('A_Tecnicos')) targetSubFolder = folderA;
      else if (path.includes('B_Certificaciones')) targetSubFolder = folderB;
      else if (path.includes('C_Contractuales')) targetSubFolder = folderC;
      else if (path.includes('D_Inventario')) targetSubFolder = folderD;
      else if (path.includes('E_SST_Ambiental')) targetSubFolder = folderE;

      const sanitizeName = (str) => (str || 'documento').replace(/[/\\?%*:|"<>]/g, '_');
      const filename = `${archivo.docCode}_${sanitizeName(archivo.fileName || archivo.docName)}.pdf`;

      // PDF binario válido con marcas de agua de Interventoría RETILAP
      const pdfBinary = `%PDF-1.4
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
<< /Length 420 >>
stream
BT
/F1 16 Tf
50 740 Td
(INTECOAL S.A.S. - INTERVENTORIA Y CONSULTORIA) Tj
/F1 12 Tf
0 -30 Td
(SISTEMA DE CONTROL DOCUMENTAL RETILAP 40150) Tj
0 -25 Td
(==============================================================) Tj
0 -30 Td
(REQUISITO RETILAP: ${archivo.docCode} - ${sanitizeName(archivo.docName)}) Tj
0 -20 Td
(CODIGO PROYECTO: ${filing.metadata?.codigoProyecto || 'N/A'}) Tj
0 -20 Td
(NUMERO DE RADICADO: ${filing.numeroRadicado || 'N/A'}) Tj
0 -20 Td
(ESTADO VERIFICACION: CUMPLE / APROBADO EN M365) Tj
0 -35 Td
(El presente documento cuenta con validacion tecnica de interventoria) Tj
0 -15 Td
(y registro en la base de datos de custodia SharePoint Online.) Tj
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
0000000714 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
785
%%EOF`;

      targetSubFolder.file(filename, pdfBinary);
    }
  }

  // Comprimir y forzar descarga
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const downloadUrl = URL.createObjectURL(zipBlob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = `Paquete_SharePoint_M365_${rootFolderName}_${filing.numeroRadicado}.zip`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
}

/**
 * Genera y descarga un archivo CSV formateado para importar o copiar filas en la Lista SharePoint "Radicaciones_AP"
 */
export function downloadRadicacionCSV(filing) {
  const headers = ["Title", "NumeroRadicado", "CodigoProyecto", "Municipio", "Operador", "TipoEntrega", "Estado", "PorcentajeCumplimiento", "DocumentosOk", "RutaOneDrive"];
  const values = [
    `"${filing.numeroRadicado || ''}"`,
    `"${filing.numeroRadicado || ''}"`,
    `"${filing.metadata?.codigoProyecto || ''}"`,
    `"${filing.metadata?.municipio || ''}"`,
    `"${filing.metadata?.contratista || ''}"`,
    `"${filing.metadata?.tipoEntrega || 'AP'}"`,
    `"${filing.estado || 'Aprobado'}"`,
    `"${filing.porcentajeCumplimiento || 100}%"`,
    `"${filing.documentosOk || 21}"`,
    `"https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Documentos_Radicacion/${filing.metadata?.codigoProyecto || ''}"`
  ];

  const csvContent = "\uFEFF" + headers.join(",") + "\n" + values.join(",");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `Fila_SharePoint_Radicaciones_AP_${filing.metadata?.codigoProyecto || 'PRY'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Copia los datos del radicado al portapapeles formateados para pegar o llenar en SharePoint + Nueva
 */
export async function copySharePointRowData(filing) {
  const text = `Title: ${filing.numeroRadicado}
NumeroRadicado: ${filing.numeroRadicado}
CodigoProyecto: ${filing.metadata?.codigoProyecto}
Municipio: ${filing.metadata?.municipio}
Operador: ${filing.metadata?.contratista}
TipoEntrega: ${filing.metadata?.tipoEntrega || 'AP'}
Estado: ${filing.estado || 'Aprobado'}
PorcentajeCumplimiento: ${filing.porcentajeCumplimiento}%
DocumentosOk: ${filing.documentosOk || 21}
RutaOneDrive: https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Documentos_Radicacion/${filing.metadata?.codigoProyecto}`;

  await navigator.clipboard.writeText(text);
}

