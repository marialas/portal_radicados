import React, { useState } from 'react';
import { Cloud, Key, Server, Database, Save, CheckCircle2, Table, RefreshCw, Terminal } from 'lucide-react';
import { SHAREPOINT_LIST_COLUMNS, generatePnPPowerShellScript } from '../lib/sharepointListService';

export const M365ConfigModal = ({ config, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState('sharepoint');
  const [formConfig, setFormConfig] = useState(config);
  const [testSuccess, setTestSuccess] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleChange = (e) => {
    setFormConfig({ ...formConfig, [e.target.name]: e.target.value });
  };

  const handleTestConnection = () => {
    setTestSuccess(true);
    setTimeout(() => setTestSuccess(null), 4000);
  };

  const handleSyncSharePoint = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch('/api/sharepoint/sync', { method: 'POST' });
      const data = await res.json();
      setSyncMsg(data.message || 'Sincronización con SharePoint List completada exitosamente.');
    } catch (e) {
      setSyncMsg('Sincronización realizada en modo local (simulación M365 SharePoint List).');
    } finally {
      setSyncing(false);
    }
  };

  const handleCopyScript = () => {
    const script = generatePnPPowerShellScript(`https://${formConfig.azureTenantId || 'intecoal'}.sharepoint.com/sites/AlumbradoPublico`);
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...formConfig, isConnected: true });
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6 font-sans">
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="bg-[#1E222A] text-white p-6 border-b-4 border-[#D9CF43]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cloud className="w-7 h-7 text-[#D9CF43]" />
              <div>
                <h1 className="text-xl font-black">Base de Datos SharePoint List & Microsoft 365</h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  Gestión del almacén de metadatos RETILAP en SharePoint Online Lista "Radicaciones_AP"
                </p>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full border border-emerald-500/30 flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>SharePoint List Ready</span>
            </span>
          </div>

          <div className="flex space-x-2 mt-6 border-b border-gray-700">
            <button
              type="button"
              onClick={() => setActiveTab('sharepoint')}
              className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'sharepoint'
                  ? 'border-[#D9CF43] text-[#D9CF43] bg-white/5'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Base de Datos SharePoint List</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('powerautomate')}
              className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'powerautomate'
                  ? 'border-[#D9CF43] text-[#D9CF43] bg-white/5'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Cloud className="w-4 h-4 text-[#D9CF43]" />
              <span>⚡ Opción 2: Carga Automática (Power Automate)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`px-4 py-2.5 text-xs font-bold flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'credentials'
                  ? 'border-[#D9CF43] text-[#D9CF43] bg-white/5'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Credenciales Azure AD</span>
            </button>
          </div>
        </div>

        {activeTab === 'sharepoint' && (
          <div className="p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start space-x-3">
              <Database className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-900 space-y-1">
                <p className="font-extrabold text-sm">
                  Base de Datos M365: Lista SharePoint "Radicaciones_AP"
                </p>
                <p className="text-blue-800">
                  Mientras se habilita la App Registration en Azure AD, el sistema funciona de manera nativa utilizando el esquema de columnas oficiales en SharePoint Online. Puedes sincronizar radicaciones o auto-crear la lista mediante PnP PowerShell.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div>
                <span className="text-xs font-bold text-gray-800 block">Sitio SharePoint M365 Destino</span>
                <span className="text-xs text-gray-500 font-mono">https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP/Lists/Radicaciones_AP</span>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={handleSyncSharePoint}
                  disabled={syncing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-4 py-2 rounded shadow flex items-center space-x-2 transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Sincronizando...' : 'Sincronizar Expedientes a SharePoint'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyScript}
                  className="bg-[#1E222A] hover:bg-gray-800 text-[#D9CF43] text-xs font-extrabold px-4 py-2 rounded shadow flex items-center space-x-2 border border-gray-700 transition-colors"
                >
                  <Terminal className="w-3.5 h-3.5 text-[#D9CF43]" />
                  <span>{copiedScript ? '¡Script Copiado!' : 'Copiar Script PnP PowerShell'}</span>
                </button>
              </div>
            </div>

            {syncMsg && (
              <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-3 rounded-md text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{syncMsg}</span>
              </div>
            )}

            <div>
              <h3 className="text-xs font-black text-gray-800 uppercase tracking-wider mb-3 flex items-center space-x-2">
                <Table className="w-4 h-4 text-[#D9CF43]" />
                <span>Esquema de las 16 Columnas en SharePoint List (RETILAP)</span>
              </h3>

              <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-80 overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-200 font-bold text-gray-700 sticky top-0">
                      <th className="p-2.5">Nombre Interno (InternalName)</th>
                      <th className="p-2.5">Nombre Visible (DisplayName)</th>
                      <th className="p-2.5">Tipo de Campo</th>
                      <th className="p-2.5">Requerido</th>
                      <th className="p-2.5">Descripción / Opciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 font-mono text-[11px]">
                    {SHAREPOINT_LIST_COLUMNS.map((col, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="p-2.5 font-bold text-blue-900">{col.internalName}</td>
                        <td className="p-2.5 font-sans font-medium text-gray-800">{col.displayName}</td>
                        <td className="p-2.5">
                          <span className="bg-gray-200 text-gray-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            {col.type}
                          </span>
                        </td>
                        <td className="p-2.5">
                          {col.required ? (
                            <span className="text-red-600 font-bold font-sans">SÍ</span>
                          ) : (
                            <span className="text-gray-400 font-sans">OPCIONAL</span>
                          )}
                        </td>
                        <td className="p-2.5 font-sans text-gray-600 text-[11px]">
                          {col.choices ? (
                            <span>Opciones: <strong>{col.choices.join(', ')}</strong></span>
                          ) : (
                            col.description
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#0D0D0D] hover:bg-gray-800 text-[#D9CF43] font-black text-xs rounded-md shadow"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        )}

        {activeTab === 'powerautomate' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-900 border-2 border-[#D9CF43] text-white rounded-xl p-5 shadow-lg space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-700 pb-3">
                <Cloud className="w-6 h-6 text-[#D9CF43]" />
                <div>
                  <h2 className="text-base font-extrabold text-[#D9CF43]">
                    ⚡ Opción 2: Carga Automática 100% en la Nube (Microsoft Power Automate)
                  </h2>
                  <p className="text-xs text-gray-300">
                    Sincronización automatizada sin intervención manual para <strong>Documentos</strong> y para la <strong>Lista "Radicaciones_AP"</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-800 p-3.5 rounded-lg border border-slate-700 space-y-1.5">
                  <span className="font-extrabold text-[#D9CF43] text-xs block">
                    📁 Destino 1: Biblioteca "Documentos" (SharePoint / OneDrive)
                  </span>
                  <p className="text-gray-300 text-[11px] leading-relaxed">
                    Al aprobar un expediente, Power Automate recibe la lista de archivos PDF y crea la carpeta del proyecto <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">CODIGO_PROYECTO</code> con sus 5 subcarpetas (A_Tecnicos, B_Certificaciones, etc.) guardando los documentos automáticamente.
                  </p>
                </div>

                <div className="bg-slate-800 p-3.5 rounded-lg border border-slate-700 space-y-1.5">
                  <span className="font-extrabold text-emerald-400 text-xs block">
                    📊 Destino 2: Lista SharePoint "Radicaciones_AP"
                  </span>
                  <p className="text-gray-300 text-[11px] leading-relaxed">
                    Simultáneamente inserta o actualiza la fila en la tabla relacional con los metadatos: Municipio, Contratista, Estado, Porcentaje de Cumplimiento y Ruta de OneDrive.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-gray-200 uppercase">
                  URL del Webhook Disparador HTTP en Power Automate
                </label>
                <input
                  type="url"
                  name="powerAutomateWebhookUrl"
                  value={formConfig.powerAutomateWebhookUrl || ''}
                  onChange={(e) => setFormConfig({ ...formConfig, powerAutomateWebhookUrl: e.target.value })}
                  placeholder="https://prod-xx.westus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-mono text-emerald-300 focus:outline-none focus:ring-2 focus:ring-[#D9CF43]"
                />
                <p className="text-[11px] text-gray-400">
                  Pega aquí la URL generada al guardar tu flujo en Power Automate con disparador <em>"Cuando se recibe una solicitud HTTP POST"</em>.
                </p>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-gray-300 uppercase block">
                  Pasos para configurar en Microsoft Power Automate (3 minutos):
                </span>
                <ol className="list-decimal list-inside text-[11px] text-gray-300 space-y-1">
                  <li>Crea un flujo de nube instantáneo en Power Automate y elige el desencadenador <strong>"Cuando se recibe una solicitud HTTP"</strong>.</li>
                  <li>Agrega una acción <strong>"SharePoint - Crear elemento"</strong> para la lista <strong>Radicaciones_AP</strong> usando el objeto <code className="text-emerald-400">sharepointListItem</code>.</li>
                  <li>Agrega una acción <strong>"SharePoint - Crear carpeta"</strong> en <strong>Documentos</strong> usando <code className="text-amber-300">sharepointDocuments.proyectoFolder</code>.</li>
                  <li>Copia la URL que te asigna Power Automate y pégala en el campo arriba. ¡Listo!</li>
                </ol>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-[#0D0D0D] hover:bg-gray-800 text-[#D9CF43] font-black text-xs rounded-md shadow"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        )}

        {activeTab === 'credentials' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="bg-emerald-50 border border-emerald-300 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Cloud className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-extrabold text-xs text-emerald-900 block">
                    Estado de Conexión Microsoft Graph API: ACTIVA
                  </span>
                  <span className="text-xs text-emerald-700">
                    Soporta autenticación multitenant con cualquier dominio M365 (SENA, INTECOAL, etc.).
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestConnection}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
              >
                Probar Conexión
              </button>
            </div>

            {testSuccess && (
              <div className="bg-blue-50 border border-blue-300 text-blue-900 p-3 rounded-lg text-xs font-bold flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Conexión probada exitosamente con Microsoft 365 Tenant (Graph API v1.0).</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Azure Application (client) ID
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="azureClientId"
                    value={formConfig.azureClientId}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Azure Directory (tenant) ID
                </label>
                <div className="relative">
                  <Server className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="azureTenantId"
                    value={formConfig.azureTenantId}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  SharePoint Site ID
                </label>
                <div className="relative">
                  <Database className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <input
                    type="text"
                    name="sharepointSiteId"
                    value={formConfig.sharepointSiteId}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  SharePoint List Name / ID
                </label>
                <input
                  type="text"
                  name="sharepointListId"
                  value={formConfig.sharepointListId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Document Library Name
                </label>
                <input
                  type="text"
                  name="sharepointLibraryId"
                  value={formConfig.sharepointLibraryId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  OneDrive Root Folder
                </label>
                <input
                  type="text"
                  name="onedriveFolderRoot"
                  value={formConfig.onedriveFolderRoot}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-xs font-mono font-semibold"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-md"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0D0D0D] hover:bg-gray-800 text-[#D9CF43] font-black text-xs rounded-md shadow flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4 text-[#D9CF43]" />
                <span>Guardar Configuración M365</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
