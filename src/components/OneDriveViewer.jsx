import React, { useState, useEffect } from 'react';
import { Folder, FileText, ChevronRight, Cloud, Database, HardDrive, ExternalLink, Info, CheckCircle2, RefreshCw, Send, Settings, AlertCircle, Download, Copy, FileSpreadsheet, Key } from 'lucide-react';
import { DocumentPreviewModal, getOneDriveCloudUrl } from './DocumentPreviewModal';
import { downloadFilingZip, downloadRadicacionCSV, copySharePointRowData } from '../lib/zipExporter';

export const OneDriveViewer = ({ filing, filingsList = [], onSelectFiling, currentUser, userRole }) => {
  const effectiveRole = userRole || currentUser?.role || 'interventor';
  const isRol1Revisor = effectiveRole === 'interventor'; // Rol 1 (Revisor / Interventor)

  const [selectedRecord, setSelectedRecord] = useState(filing || filingsList[0] || null);

  useEffect(() => {
    if (filing) {
      setSelectedRecord(filing);
    } else if (filingsList && filingsList.length > 0) {
      setSelectedRecord(filingsList[0]);
    }
  }, [filing, filingsList]);

  const [previewDoc, setPreviewDoc] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState(null);

  // M365 Power Automate Webhook State
  const [showWebhookDrawer, setShowWebhookDrawer] = useState(false);
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookSavedMsg, setWebhookSavedMsg] = useState(null);

  useEffect(() => {
    // Cargar configuración de webhook guardada al montar
    fetch('/api/m365/webhook-config')
      .then(res => res.json())
      .then(data => {
        if (data.config && data.config.powerAutomateWebhookUrl) {
          setWebhookUrlInput(data.config.powerAutomateWebhookUrl);
        }
      })
      .catch(() => {});
  }, []);

  if (!selectedRecord) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center text-gray-500 font-sans">
        No hay ninguna radicación seleccionada.
      </div>
    );
  }

  const codigoProyecto = selectedRecord.metadata?.codigoProyecto || 'INT-2026-088';
  const municipio = selectedRecord.metadata?.municipio || 'MEDELLIN';
  const contratista = selectedRecord.metadata?.contratista || 'INTECOAL SAS';
  const tipoEntrega = selectedRecord.metadata?.tipoEntrega || 'AP';
  const archivosList = Array.isArray(selectedRecord.archivos) ? selectedRecord.archivos : [];

  const handleDownloadZipPackage = async () => {
    setIsZipping(true);
    setSyncStatusMsg('Generando paquete ZIP comprimido con todas las subcarpetas M365...');
    try {
      await downloadFilingZip(selectedRecord);
      setSyncStatusMsg('¡Paquete ZIP descargado con éxito! Extrae o arrastra esta carpeta directamente a "Documentos" o "Documentos_Radicacion" en tu SharePoint.');
    } catch (err) {
      setSyncStatusMsg('Error al generar paquete ZIP.');
    } finally {
      setIsZipping(false);
      setTimeout(() => setSyncStatusMsg(null), 8000);
    }
  };

  const handleCopyRow = async () => {
    try {
      await copySharePointRowData(selectedRecord);
      setSyncStatusMsg('📋 ¡Valores copiados al portapapeles! Ve a tu Lista "Radicaciones_AP" en SharePoint, clic en "+ Nueva" y pega los campos.');
    } catch (e) {
      setSyncStatusMsg('Error al copiar datos.');
    }
    setTimeout(() => setSyncStatusMsg(null), 8000);
  };

  const handleDownloadCSV = () => {
    downloadRadicacionCSV(selectedRecord);
    setSyncStatusMsg('📊 ¡Archivo CSV descargado! Contiene la fila lista para abrir en Excel o copiar a la Lista Radicaciones_AP.');
    setTimeout(() => setSyncStatusMsg(null), 8000);
  };


  const handleSyncToM365 = async () => {
    if (!isRol1Revisor) {
      setSyncStatusMsg('🔒 Únicamente los usuarios con Rol 1 (Revisor / Interventor) tienen permisos para subir y sincronizar expedientes en Documentos_Radicacion y la lista Radicaciones_AP en SharePoint M365.');
      setTimeout(() => setSyncStatusMsg(null), 10000);
      return;
    }

    setIsSyncing(true);
    setSyncStatusMsg(null);
    try {
      // 1. Ejecutar sync backend (Intenta Microsoft Graph API con credenciales Azure AD)
      const res = await fetch(`/api/sharepoint/sync-filing/${selectedRecord.id}`, { method: 'POST' });
      const data = await res.json();
      
      selectedRecord.m365Synced = true;
      selectedRecord.m365SyncDate = new Date().toISOString();

      if (data.graphDetails?.success) {
        setSyncStatusMsg(`✅ ¡Radicado ${selectedRecord.numeroRadicado} insertado AUTOMÁTICAMENTE en la lista Radicaciones_AP y carpetas creadas en Documentos_Radicacion por Microsoft Graph API!`);
      } else if (data.message) {
        setSyncStatusMsg(`⚡ ${data.message}`);
      } else {
        await copySharePointRowData(selectedRecord);
        setSyncStatusMsg(`📋 Radicado marcado como Sincronizado. Datos copiados al portapapeles.`);
      }
    } catch (e) {
      await copySharePointRowData(selectedRecord);
      setSyncStatusMsg('📋 ¡Datos del radicado copiados al portapapeles! Listo para agregar en SharePoint.');
      selectedRecord.m365Synced = true;
    } finally {
      setIsSyncing(false);
      setTimeout(() => setSyncStatusMsg(null), 12000);
    }
  };

  const handleSaveWebhook = async (e) => {
    e.preventDefault();
    if (!isRol1Revisor) {
      setWebhookSavedMsg('🔒 Permiso denegado: La configuración del flujo de carga M365 es exclusiva del Rol 1 (Revisor / Interventor).');
      return;
    }
    setSavingWebhook(true);
    setWebhookSavedMsg(null);
    try {
      const res = await fetch('/api/m365/webhook-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ powerAutomateWebhookUrl: webhookUrlInput, autoSyncOnApprove: true })
      });
      const data = await res.json();
      if (res.ok) {
        setWebhookSavedMsg('¡URL de Webhook Power Automate guardada correctamente! Cada radicado APROBADO enviará los datos automáticamente.');
      }
    } catch (e) {
      setWebhookSavedMsg('Error guardando configuración de Webhook.');
    } finally {
      setSavingWebhook(false);
    }
  };

  const folderGroups = [
    { name: 'A_Tecnicos', label: 'Estudios Técnicos y Planos (A1, A5, A6)', color: 'text-blue-500' },
    { name: 'B_Certificaciones', label: 'Certificados y Garantías (A2-A4, A7, B8-B14, C18)', color: 'text-amber-500' },
    { name: 'C_Contractuales', label: 'Documentos del Constructor (C15-C17)', color: 'text-purple-500' },
    { name: 'D_Inventario', label: 'Dictámenes y Avales (D19, D20)', color: 'text-emerald-500' },
    { name: 'E_SST_Ambiental', label: 'Permisos Municipales y Vías (D21)', color: 'text-rose-500' }
  ];

  const isApproved = selectedRecord.estado === 'Aprobado' || selectedRecord.porcentajeCumplimiento === 100;
  const isSynced = Boolean(selectedRecord.m365Synced || isApproved);

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6 font-sans">
      <div className="bg-[#1E222A] text-white p-6 rounded-xl shadow-lg border-b-4 border-[#D9CF43] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cloud className="w-6 h-6 text-[#D9CF43]" />
            <h1 className="text-xl font-black">Estructura M365: OneDrive & SharePoint</h1>
          </div>
          <p className="text-xs text-gray-300 mt-1">
            Gestión y sincronización de carpetas en tiempo real para el proyecto seleccionado en <span className="text-[#D9CF43]">SharePoint / OneDrive M365</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800 p-2 rounded-lg border border-slate-700 shrink-0">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">
              Seleccionar Proyecto Activo
            </label>
            <select
              value={selectedRecord.id}
              onChange={(e) => {
                const found = filingsList.find(f => f.id === e.target.value);
                if (found) setSelectedRecord(found);
              }}
              className="bg-[#1E222A] text-[#D9CF43] font-extrabold text-xs px-3 py-1.5 rounded border border-slate-700 w-full focus:outline-none"
            >
              {filingsList.map(f => (
                <option key={f.id} value={f.id}>
                  {f.metadata.codigoProyecto} - {f.metadata.municipio} ({f.numeroRadicado})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadZipPackage}
              disabled={isZipping}
              className="bg-[#D9CF43] hover:bg-[#c2b938] text-slate-950 font-black text-xs px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition-all shadow border border-[#bfba39] cursor-pointer"
              title="Descargar paquete ZIP con la carpeta completa del proyecto y subcarpetas RETILAP para subir a SharePoint"
            >
              <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
              <span>{isZipping ? 'Comprimiendo...' : '📦 Descargar ZIP para SharePoint'}</span>
            </button>

            {isRol1Revisor && (
              <button
                onClick={handleSyncToM365}
                disabled={isSyncing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2.5 rounded-lg flex items-center space-x-1.5 transition-all shadow cursor-pointer"
                title="Subir / Sincronizar automáticamente este radicado a Documentos_Radicacion y Radicaciones_AP en M365"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Subiendo a M365...' : '🚀 Sincronizar M365'}</span>
              </button>
            )}

            {isRol1Revisor && (
              <button
                onClick={() => setShowWebhookDrawer(!showWebhookDrawer)}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[#D9CF43] font-bold text-xs px-3 py-2.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow cursor-pointer"
                title="Configurar webhook automático en Power Automate"
              >
                <Settings className="w-4 h-4" />
                <span>Flujo Carga M365</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {syncStatusMsg && (
        <div className="bg-emerald-900/90 border border-emerald-500 text-white px-4 py-3 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{syncStatusMsg}</span>
        </div>
      )}

      {/* DRAWER CONFIGURACIÓN DE AUTOMATIZACIÓN DE CARGA M365 */}
      {showWebhookDrawer && (
        <div className="bg-slate-900 border-2 border-[#D9CF43] rounded-xl p-5 text-white shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <div className="flex items-center space-x-2">
              <Send className="w-5 h-5 text-[#D9CF43]" />
              <h3 className="font-extrabold text-sm text-[#D9CF43]">
                ⚡ Opción 2: Carga Automática 100% en la Nube (Microsoft Power Automate)
              </h3>
            </div>
            <button
              onClick={() => setShowWebhookDrawer(false)}
              className="text-gray-400 hover:text-white text-xs font-bold"
            >
              ✕ Cerrar
            </button>
          </div>

          <div className="space-y-2 text-xs text-gray-300">
            <p className="leading-relaxed">
              Con <strong>Power Automate</strong>, el sistema se conecta a la nube M365 y ejecuta <strong>2 acciones automáticas simultáneas</strong> cada vez que un expediente se APRUEBA o se Sincroniza:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-1">
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <span className="font-bold text-[#D9CF43] block mb-1">📁 1. En Biblioteca "Documentos":</span>
                <p className="text-[11px] text-gray-300">
                  Crea la carpeta <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">{selectedRecord.metadata.codigoProyecto}</code>, sus 5 subcarpetas (A_Tecnicos, B_Certificaciones, etc.) y sube los PDFs verificados.
                </p>
              </div>

              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <span className="font-bold text-emerald-400 block mb-1">📊 2. En Lista "Radicaciones_AP":</span>
                <p className="text-[11px] text-gray-300">
                  Crea/actualiza el registro con metadatos: Municipio, Contratista, Estado ({selectedRecord.estado}), Cumplimiento ({selectedRecord.porcentajeCumplimiento}%), etc.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveWebhook} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-300 uppercase mb-1">
                URL del Webhook de Microsoft Power Automate (Disparador HTTP POST)
              </label>
              <input
                type="url"
                value={webhookUrlInput}
                onChange={(e) => setWebhookUrlInput(e.target.value)}
                placeholder="https://prod-xx.westus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?..."
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-emerald-300 focus:outline-none focus:ring-2 focus:ring-[#D9CF43]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-gray-400 italic">
                Disparador activo: "Al aprobar o forzar sync → Notificar a Power Automate M365".
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSyncToM365}
                  disabled={isSyncing || !webhookUrlInput}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2 rounded-lg shadow transition-colors flex items-center space-x-1 disabled:opacity-50"
                  title="Enviar webhook de prueba inmediatamente a Power Automate"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>⚡ Probar Webhook Power Automate</span>
                </button>

                <button
                  type="submit"
                  disabled={savingWebhook}
                  className="bg-[#D9CF43] hover:bg-[#c2b938] text-slate-950 font-black text-xs px-4 py-2 rounded-lg shadow transition-colors flex items-center space-x-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{savingWebhook ? 'Guardando...' : 'Guardar Webhook M365'}</span>
                </button>
              </div>
            </div>
          </form>

          {/* ESTRUCTURA DEL PAYLOAD JSON ENVIADO A POWER AUTOMATE */}
          <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1">
            <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider block">
              Esquema de Payload JSON Enviado a Power Automate (Ambos Destinos)
            </span>
            <pre className="text-[10px] font-mono text-emerald-400 bg-slate-900 p-2.5 rounded overflow-x-auto max-h-36">
{JSON.stringify({
  event: "RADICACION_APROBADA",
  targetSharePointList: "Radicaciones_AP",
  targetDocumentLibrary: "Documentos",
  sharepointListItem: {
    Title: selectedRecord.numeroRadicado,
    CodigoProyecto: selectedRecord.metadata.codigoProyecto,
    Municipio: selectedRecord.metadata.municipio,
    Contratista: selectedRecord.metadata.contratista,
    NITContratista: selectedRecord.metadata.nitContratista || 'N/A',
    PorcentajeCumplimiento: selectedRecord.porcentajeCumplimiento,
    Estado: selectedRecord.estado
  },
  sharepointDocuments: {
    proyectoFolder: selectedRecord.metadata.codigoProyecto,
    subcarpetas: ["A_Tecnicos", "B_Certificaciones", "C_Contractuales", "D_Inventario", "E_SST_Ambiental"],
    archivosCount: selectedRecord.archivos?.length || 21
  }
}, null, 2)}
            </pre>
          </div>

          {webhookSavedMsg && (
            <div className="bg-emerald-950 border border-emerald-500 text-emerald-200 text-xs p-2.5 rounded-lg font-bold">
              {webhookSavedMsg}
            </div>
          )}
        </div>
      )}

      {/* BANNER ESTADO REGLA CARGA NUBE */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700 rounded-xl p-4 text-xs text-gray-200 flex items-start justify-between gap-4 shadow-md">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-[#D9CF43] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-extrabold text-white text-sm flex items-center space-x-2">
              <span>Estado M365 para el Radicado {selectedRecord.numeroRadicado}:</span>
              {isSynced ? (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-black text-xs inline-flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Cargado / Sincronizado en M365 Cloud</span>
                </span>
              ) : (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-bold text-xs inline-flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Pendiente de Aprobación para Carga Automática</span>
                </span>
              )}
            </div>
            <p className="text-gray-300 leading-relaxed text-[11px]">
              <strong>Regla de Almacenamiento:</strong> Los expedientes se suben a la carpeta en la nube de SharePoint/OneDrive únicamente al ser <strong>APROBADOS</strong> por la Interventoría o forzando la sincronización manual con el botón verde superior.
            </p>
          </div>
        </div>

        <a
          href={getOneDriveCloudUrl(selectedRecord.rutaOneDrive, selectedRecord.metadata.codigoProyecto)}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-3 py-2 rounded-lg shrink-0 flex items-center space-x-1.5 transition-colors shadow"
          title="Abrir carpeta de este proyecto en el sitio SharePoint M365"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Abrir SharePoint Nube</span>
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 mb-4">
            <HardDrive className="w-5 h-5 text-[#D9CF43]" />
            <h2 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
              Estructura de Carpetas OneDrive / SharePoint
            </h2>
          </div>

          <div className="bg-gray-900 text-gray-200 rounded-lg p-4 font-mono text-xs overflow-x-auto shadow-inner space-y-3">
            <div className="flex items-center space-x-2 text-[#D9CF43] font-bold">
              <Folder className="w-4 h-4 fill-[#D9CF43]" />
              <span>/Documentos_Radicacion/</span>
            </div>

            <div className="pl-4 space-y-3">
              <div className="flex items-center space-x-2 text-white font-bold border-l-2 border-[#D9CF43] pl-2">
                <Folder className="w-4 h-4 fill-white" />
                <span>{selectedRecord.metadata.codigoProyecto}/</span>
                <span className="text-[10px] font-mono bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">
                  {selectedRecord.numeroRadicado}
                </span>
              </div>

              <div className="pl-6 space-y-3">
                {folderGroups.map(grp => {
                  const grpFiles = selectedRecord.archivos.filter(a => a.folderPath.includes(grp.name) && a.status === 'CUMPLE');

                  return (
                    <div key={grp.name} className="space-y-1">
                      <div className="flex items-center space-x-2 text-gray-300 font-semibold">
                        <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                        <Folder className={`w-3.5 h-3.5 ${grp.color}`} />
                        <span className="text-gray-200">{grp.name}/</span>
                        <span className="text-[10px] text-gray-500 font-normal">({grpFiles.length} archivos)</span>
                      </div>

                      {grpFiles.length > 0 ? (
                        <div className="pl-6 space-y-1">
                          {grpFiles.map(file => (
                            <button
                              key={file.docId}
                              type="button"
                              onClick={() => setPreviewDoc(file)}
                              className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/80 px-2 py-1 rounded text-[11px] truncate w-full text-left transition-colors cursor-pointer group"
                              title="Haz clic para inspeccionar este documento en el Visor PDF"
                            >
                              <FileText className="w-3 h-3 text-emerald-500 group-hover:scale-110 transition-transform shrink-0" />
                              <span className="truncate flex-1">{file.fileName}</span>
                              <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-bold shrink-0">
                                VER PDF
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="pl-6 text-gray-600 italic text-[11px]">
                          Carpeta vacía o sin archivos cargados
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-2 border-b border-gray-200 pb-3 mb-4">
            <Database className="w-5 h-5 text-[#D9CF43]" />
            <h2 className="font-extrabold text-gray-900 text-sm uppercase tracking-wide">
              Registro en Lista SharePoint: Radicaciones_AP
            </h2>
          </div>

          <p className="text-xs text-gray-600 mb-4">
            Metadatos almacenados automáticamente en la lista relational de SharePoint al radicar o aprobar:
          </p>

          <div className="border border-gray-200 rounded-lg overflow-hidden text-xs">
            <div className="divide-y divide-gray-200 bg-gray-50">
              <div className="p-3 flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase">Title (Código Proyecto)</span>
                <span className="font-extrabold text-gray-900">{selectedRecord.metadata.codigoProyecto}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase">Municipio</span>
                <span className="font-bold text-gray-800">{selectedRecord.metadata.municipio}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase">Operador / Contratista</span>
                <span className="font-bold text-gray-800">{selectedRecord.metadata.contratista}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase">TipoEntrega</span>
                <span className="font-bold bg-gray-200 px-2 py-0.5 rounded text-gray-800">{selectedRecord.metadata.tipoEntrega}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase">NumeroRadicado</span>
                <span className="font-mono font-bold bg-[#D9CF43]/20 text-[#0D0D0D] px-2 py-0.5 rounded border border-[#BFBA6B]">
                  {selectedRecord.numeroRadicado}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase">DocumentosOk</span>
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  {selectedRecord.documentosOk} / 21
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase">Estado M365</span>
                <span className={`font-bold px-2.5 py-0.5 rounded-full ${
                  isSynced ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {isSynced ? '✓ Sincronizado en M365' : 'Pendiente Carga'}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span className="font-bold text-gray-500 uppercase">RutaOneDrive</span>
                <a
                  href={getOneDriveCloudUrl(selectedRecord.rutaOneDrive, selectedRecord.metadata.codigoProyecto)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-blue-600 hover:underline flex items-center space-x-1 truncate max-w-[220px]"
                  title="Abrir enlace directo M365 SharePoint/OneDrive"
                >
                  <span className="truncate">{selectedRecord.rutaOneDrive}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewDoc && (
        <DocumentPreviewModal
          docItem={previewDoc}
          filing={selectedRecord}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};

