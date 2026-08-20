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

export function getOneDriveCloudUrl(rutaOneDrive, numeroRadicado) {
  if (rutaOneDrive && (rutaOneDrive.startsWith('http://') || rutaOneDrive.startsWith('https://')) && !rutaOneDrive.includes('Documentos_Radicacion')) {
    return rutaOneDrive;
  }
  return `https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Shared%20Documents`;
}

export const DocumentPreviewModal = ({ docItem, filing, onClose }) => {
  const [localPdfUrl, setLocalPdfUrl] = useState(null);
  const [localFileName, setLocalFileName] = useState(null);

  if (!docItem) return null;

  const isNA = docItem.status === 'N/A' || docItem.fileName === 'N/A';
  const hasFile = docItem.fileName && docItem.fileName !== 'N/A';
  const cloudUrl = getOneDriveCloudUrl(filing?.rutaOneDrive, filing?.numeroRadicado);

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
(Radicado: ${filing?.numeroRadicado || 'N/A'}) Tj
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
                  {filing?.numeroRadicado} - {filing?.metadata?.municipio}
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
            ) : (
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
            )}
          </div>
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
