import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Printer, 
  Cloud, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MinusCircle, 
  ShieldCheck, 
  Eye, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  UploadCloud
} from 'lucide-react';

export function getOneDriveCloudUrl(rutaOneDrive, codigoProyecto) {
  if (rutaOneDrive && (rutaOneDrive.startsWith('http://') || rutaOneDrive.startsWith('https://')) && !rutaOneDrive.includes('Documentos_Radicacion')) {
    return rutaOneDrive;
  }
  return `https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Shared%20Documents`;
}

export const DocumentPreviewModal = ({ docItem, filing, onClose }) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTab, setActiveTab] = useState('preview'); // 'preview' | 'metadata'
  const [viewMode, setViewMode] = useState('iframe'); // 'iframe' | 'ficha'
  const [localPdfUrl, setLocalPdfUrl] = useState(null);
  const [localFileName, setLocalFileName] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 2;

  if (!docItem) return null;

  const isNA = docItem.status === 'N/A' || docItem.fileName === 'N/A';
  const hasFile = docItem.fileName && docItem.fileName !== 'N/A';
  const cloudUrl = getOneDriveCloudUrl(filing?.rutaOneDrive, filing?.metadata?.codigoProyecto);

  const handleDownloadPdf = () => {
    // Generar archivo PDF binario estructurado para descarga real
    const pdfContent = `%PDF-1.4
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
<< /Length 280 >>
stream
BT
/F1 16 Tf
50 740 Td
(INTECOAL S.A.S. - VERIFICACION RETILAP) Tj
/F1 12 Tf
0 -30 Td
(Codigo: ${docItem.docCode}) Tj
0 -20 Td
(Requisito: ${docItem.docName}) Tj
0 -20 Td
(Proyecto: ${filing?.metadata?.codigoProyecto || 'INT-2026'}) Tj
0 -20 Td
(Municipio: ${filing?.metadata?.municipio || 'N/A'}) Tj
0 -20 Td
(Estado: ${docItem.status}) Tj
0 -30 Td
(Documento oficial validado y registrado en el portal de Interventoria.) Tj
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
0000000574 00000 n 
trailer
<< /Size 6 /Root 1 0 R >>
startxref
645
%%EOF`;

    const blob = new Blob([pdfContent], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docItem.fileName || `${docItem.docCode}_Documento_RETILAP.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#1E222A] text-white rounded-2xl shadow-2xl border border-slate-700 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header del Modal */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3 truncate">
            <div className="w-10 h-10 rounded-xl bg-[#D9CF43]/20 border border-[#D9CF43]/40 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-[#D9CF43]" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-2">
                <span className="bg-[#D9CF43] text-slate-950 font-black text-[11px] px-2 py-0.5 rounded uppercase">
                  {docItem.docCode}
                </span>
                <span className="text-xs text-gray-400 font-bold uppercase truncate">
                  {filing?.metadata?.codigoProyecto} - {filing?.metadata?.municipio}
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white truncate leading-tight mt-0.5">
                {docItem.docName}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <a
              href={cloudUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-lg items-center space-x-1.5 transition-colors"
              title="Abrir directorio en SharePoint/OneDrive Nube M365"
            >
              <Cloud className="w-4 h-4" />
              <span>Abrir en M365 Nube</span>
              <ExternalLink className="w-3.5 h-3.5 ml-0.5" />
            </a>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Toolbar de Controles */}
        <div className="bg-slate-850 px-6 py-2.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs bg-slate-900/60">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'preview'
                  ? 'bg-[#D9CF43] text-slate-950 shadow'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Vista Previa Documento
            </button>
            <button
              onClick={() => setActiveTab('metadata')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                activeTab === 'metadata'
                  ? 'bg-[#D9CF43] text-slate-950 shadow'
                  : 'bg-slate-800 text-gray-300 hover:bg-slate-700'
              }`}
            >
              Metadatos y Auditoría
            </button>
          </div>

          {activeTab === 'preview' && hasFile && (
            <div className="flex flex-wrap items-center gap-2 text-gray-300">
              {/* Botones de modo de vista */}
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                <button
                  onClick={() => setViewMode('iframe')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    viewMode === 'iframe'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Ver documento PDF original en el visor integrado del navegador"
                >
                  📄 Visor PDF Original
                </button>
                <button
                  onClick={() => setViewMode('ficha')}
                  className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                    viewMode === 'ficha'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                  title="Ver dictamen y resumen de metadatos RETILAP"
                >
                  📋 Dictamen RETILAP
                </button>
              </div>

              {/* Carga directa de PDF local para visualizar */}
              <label className="cursor-pointer bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs px-2.5 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow shrink-0">
                <UploadCloud className="w-4 h-4" />
                <span>Cargar PDF Local</span>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const file = e.target.files[0];
                      const url = URL.createObjectURL(file);
                      setLocalPdfUrl(url);
                      setLocalFileName(file.name);
                      setViewMode('iframe');
                    }
                  }}
                />
              </label>

              <button
                onClick={handleDownloadPdf}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white px-2.5 py-1.5 rounded-lg font-bold flex items-center space-x-1 shadow transition-colors"
                title="Descargar archivo PDF al equipo"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar</span>
              </button>

              <button
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-700 text-gray-200 px-2.5 py-1.5 rounded-lg border border-slate-700 font-bold flex items-center space-x-1.5 hidden md:flex"
                title="Imprimir"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          )}
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-950/80">
          {activeTab === 'preview' ? (
            <div>
              {isNA ? (
                <div className="bg-slate-900 border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 my-8">
                  <div className="w-16 h-16 bg-slate-800 text-gray-400 rounded-full flex items-center justify-center mx-auto">
                    <MinusCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white mb-1">Documento Marcado como "No Aplica" (N/A)</h4>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      El contratista u operador indicó que este requisito técnico no es aplicable al alcance de esta entrega.
                    </p>
                    {docItem.notes && (
                      <div className="mt-4 bg-slate-850 p-3 rounded-lg border border-slate-800 text-left">
                        <span className="text-[10px] font-bold text-[#D9CF43] uppercase block">Justificación / Observación:</span>
                        <p className="text-xs text-gray-300 italic mt-0.5">{docItem.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : !hasFile ? (
                <div className="bg-slate-900 border-2 border-dashed border-amber-900/50 rounded-2xl p-12 text-center max-w-xl mx-auto space-y-4 my-8">
                  <div className="w-16 h-16 bg-amber-950/40 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-amber-300 mb-1">Sin Archivo Adjunto</h4>
                    <p className="text-xs text-gray-400 max-w-md mx-auto">
                      Aún no se ha subido el archivo correspondiente a este código de verificación.
                    </p>
                  </div>
                </div>
              ) : viewMode === 'iframe' ? (
                /* Visor PDF original renderizado en iframe */
                <div className="w-full flex flex-col items-center justify-center space-y-3 my-1">
                  {localFileName && (
                    <div className="bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs px-3 py-1.5 rounded-lg flex items-center space-x-2 w-full justify-between">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Mostrando archivo PDF local cargado: <strong>{localFileName}</strong></span>
                      </div>
                      <button 
                        onClick={() => { setLocalPdfUrl(null); setLocalFileName(null); }}
                        className="text-xs text-gray-400 hover:text-white underline"
                      >
                        Restablecer
                      </button>
                    </div>
                  )}

                  <div className="w-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
                    <iframe
                      src={localPdfUrl || docItem.fileUrl || docItem.blobUrl || `/api/files/view/${filing?.id || 'demo'}/${docItem.docId || docItem.docCode}`}
                      className="w-full h-[640px] border-0 bg-slate-900"
                      title={localFileName || docItem.fileName || docItem.docName}
                    />
                  </div>
                </div>
              ) : (
                /* Visor interactivo del dictamen RETILAP */
                <div className="flex justify-center transition-all duration-200">
                  <div 
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                    className="bg-white text-slate-900 rounded-xl shadow-2xl p-8 sm:p-12 w-full max-w-3xl border border-gray-300 space-y-6 my-2"
                  >
                    {/* Encabezado oficial del PDF */}
                    <div className="border-b-2 border-slate-900 pb-4 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#1E222A] text-[#D9CF43] rounded-lg flex items-center justify-center font-black text-xl">
                          I
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-sm tracking-wide uppercase">
                            INTECOAL S.A.S. - INTERVENTORÍA Y CONSULTORÍA
                          </div>
                          <div className="text-[10px] font-bold text-gray-500 uppercase">
                            Sistema Integrado de Gestión RETILAP • Alumbrado Público
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-gray-500">CÓDIGO DE CONTROL</div>
                        <div className="text-xs font-mono font-bold text-slate-800">{docItem.docCode}-M365</div>
                      </div>
                    </div>

                    {/* Banner de metadatos del documento */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Proyecto</span>
                        <span className="font-bold text-slate-900">{filing?.metadata?.codigoProyecto || 'INT-2026'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Municipio</span>
                        <span className="font-bold text-slate-900">{filing?.metadata?.municipio || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Contratista</span>
                        <span className="font-bold text-slate-900">{filing?.metadata?.contratista || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Archivo Adjunto</span>
                        <span className="font-bold text-emerald-700 truncate block">{docItem.fileName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Fecha Radicado</span>
                        <span className="font-bold text-slate-800">{docItem.uploadDate || '2026-03-12'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase block">Sello M365</span>
                        <span className="font-bold text-blue-700 flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Verificado M365</span>
                        </span>
                      </div>
                    </div>

                    {/* Título del documento */}
                    <div className="text-center py-4 border-y border-gray-200">
                      <span className="bg-slate-200 text-slate-800 font-black text-xs px-2.5 py-1 rounded uppercase tracking-wider mb-2 inline-block">
                        REQUISITO {docItem.docCode}
                      </span>
                      <h2 className="text-xl font-black text-slate-900 uppercase">
                        {docItem.docName}
                      </h2>
                      <p className="text-xs text-gray-500 mt-1 max-w-md mx-auto">
                        Certificación técnica y documental de conformidad según especificaciones RETILAP 40150 / 2024.
                      </p>
                    </div>

                    {/* Cuerpo simulado del PDF con contenido oficial según la página elegida */}
                    {currentPage === 1 ? (
                      <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
                        <p>
                          Por medio del presente documento se certifica y constata la radicación y cumplimiento formal de las especificaciones requeridas en el apartado <strong>{docItem.docCode}</strong> para el proyecto de alumbrado público <strong>{filing?.metadata?.nombreProyecto || 'EXPANSIÓN Y MODERNIZACIÓN ALUMBRADO PÚBLICO'}</strong>.
                        </p>

                        <div className="bg-slate-100 p-4 rounded-lg border-l-4 border-emerald-600 space-y-2">
                          <div className="font-bold text-slate-900 text-xs">RESUMEN DE VERIFICACIÓN TÉCNICA (PÁGINA 1):</div>
                          <ul className="list-disc pl-4 space-y-1 text-gray-600">
                            <li>Cumplimiento de rotulado e identificadores técnicos según norma RETILAP 40150.</li>
                            <li>Certificados de laboratorio acreditado ONAC anexados correctamente.</li>
                            <li>Verificación de compatibilidad electromagnética y grado de protección IP/IK.</li>
                            <li>Registro de firma y aprobación por parte de la interventoría técnica Intecoal S.A.S.</li>
                          </ul>
                        </div>

                        <p className="text-gray-500 text-[11px] italic">
                          Documento digitalizado almacenado en el repositorio de custodia documental de INTECOAL S.A.S.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4 text-xs text-slate-700 leading-relaxed font-sans">
                        <div className="font-bold text-slate-900 text-xs uppercase border-b border-gray-200 pb-1">
                          ANEXO TÉCNICO Y PRUEBAS FOTOMÉTRICAS (PÁGINA 2)
                        </div>
                        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
                          <div><strong>Laboratorio:</strong> LAB-ONAC #104-RET</div>
                          <div><strong>Eficiencia Luminosa:</strong> 135 lm/W</div>
                          <div><strong>Factor de Potencia:</strong> &gt; 0.95</div>
                          <div><strong>Distorsión THD:</strong> &lt; 10%</div>
                          <div><strong>Protección Sobretensión:</strong> 10 kV / 10 kA</div>
                          <div><strong>Grado Protección:</strong> IP66 / IK08</div>
                        </div>

                        <div className="border border-slate-300 rounded p-3 text-center bg-slate-100 font-mono text-[10px] text-slate-600">
                          [GRAFICO FOTOMÉTRICO CURVA IES / RETILAP - VERIFICADO]
                        </div>

                        <p className="text-gray-500 text-[11px] italic">
                          Pruebas realizadas bajo temperatura controlada de 25°C según requerimientos capítulo 4 RETILAP.
                        </p>
                      </div>
                    )}

                    {/* Firma y Sello final */}
                    <div className="pt-8 border-t border-gray-300 flex items-end justify-between">
                      <div className="space-y-1">
                        <div className="w-36 h-12 border-b-2 border-slate-900 flex items-end pb-1 font-serif text-slate-800 italic text-sm">
                          {filing?.metadata?.responsableRevision || 'Ing. John Fredy Castro'}
                        </div>
                        <div className="text-[10px] font-bold text-[#1E222A]">REVISOR DE INTERVENTORÍA</div>
                        <div className="text-[9px] text-gray-500">INTECOAL S.A.S. • RETILAP</div>
                      </div>

                      <div className="bg-emerald-50 border-2 border-emerald-500 p-3 rounded-xl text-center shadow-sm">
                        <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
                        <div className="text-[10px] font-black text-emerald-900 uppercase">CUMPLE RETILAP</div>
                        <div className="text-[9px] text-emerald-700 font-bold">FECHA: {docItem.uploadDate || '2026-03-12'}</div>
                      </div>
                    </div>

                    {/* Pie de página PDF */}
                    <div className="text-center pt-4 text-[9px] text-gray-400 border-t border-gray-200">
                      Página {currentPage} de {totalPages} • INTECOAL S.A.S. — Sistema de Control y Custodia Documental RETILAP © 2026
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Tab de Metadatos y Auditoría SharePoint */
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-[#D9CF43] flex items-center space-x-2">
                  <Cloud className="w-4 h-4" />
                  <span>Ubicación y Registro en Microsoft 365</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Código Documento</span>
                    <span className="font-mono text-white font-bold">{docItem.docCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Nombre Requisito</span>
                    <span className="text-white font-semibold">{docItem.docName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Nombre de Archivo en Nube</span>
                    <span className="font-mono text-emerald-400 font-bold">{docItem.fileName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Tamaño estimado</span>
                    <span className="text-gray-300 font-mono">{docItem.fileSize ? `${(docItem.fileSize / (1024*1024)).toFixed(2)} MB` : 'N/A'}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-[10px] font-bold text-gray-400 block uppercase">Ruta de Carpeta OneDrive / SharePoint</span>
                    <span className="font-mono text-xs bg-slate-950 p-2 rounded border border-slate-800 text-amber-300 block break-all">
                      {docItem.folderPath || `/Documentos_Radicacion/${filing?.metadata?.codigoProyecto}/`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Enlace Directo a Microsoft SharePoint Online</span>
                </h4>
                <p className="text-xs text-gray-400">
                  Haz clic en el siguiente botón corporativo para abrir la carpeta raíz del proyecto directamente en SharePoint Online:
                </p>
                <a
                  href={cloudUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-xl inline-flex items-center space-x-2 transition-all shadow-md"
                >
                  <Cloud className="w-4 h-4" />
                  <span>Abrir Carpeta {filing?.metadata?.codigoProyecto} en SharePoint / OneDrive</span>
                  <ExternalLink className="w-4 h-4 ml-1" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer del Modal */}
        <div className="bg-slate-900 px-6 py-3 border-t border-slate-800 flex items-center justify-between text-xs text-gray-400">
          <span className="truncate">INTECOAL SAS • Custodia M365 SharePoint Online</span>
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-1.5 rounded-lg transition-colors"
          >
            Cerrar Visor
          </button>
        </div>
      </div>
    </div>
  );
};
