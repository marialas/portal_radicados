import React, { useState } from 'react';
import { 
  Search, 
  FileCheck2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  FolderGit2, 
  Plus, 
  FileSpreadsheet,
  Edit3
} from 'lucide-react';

export const RadicacionesList = ({
  filings,
  onSelectFiling,
  onEvaluateFiling,
  onNewFiling,
  onSelectOneDrive,
  onUpdateStatus,
  userRole = 'interventor',
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('TODOS');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [selectedTipo, setSelectedTipo] = useState('TODOS');

  const userFilings = (userRole === 'contratista' && currentUser)
    ? filings.filter(f => {
        const userEmailClean = (currentUser.email || '').toLowerCase().trim();
        const respEmailClean = (f.metadata.correoResponsable || '').toLowerCase().trim();
        const userCompanyClean = (currentUser.company || '').toLowerCase().trim();
        const filingCompanyClean = (f.metadata.contratista || '').toLowerCase().trim();

        const emailMatch = Boolean(userEmailClean && respEmailClean && (userEmailClean === respEmailClean || respEmailClean.includes(userEmailClean) || userEmailClean.includes(respEmailClean)));
        const companyMatch = Boolean(userCompanyClean && filingCompanyClean && (filingCompanyClean.includes(userCompanyClean) || userCompanyClean.includes(filingCompanyClean)));

        return emailMatch || companyMatch;
      })
    : filings;

  const filtered = userFilings.filter(f => {
    const matchesSearch = 
      f.numeroRadicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.metadata.codigoProyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.metadata.nombreProyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.metadata.contratista.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.metadata.municipio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMuni = selectedMunicipio === 'TODOS' || f.metadata.municipio === selectedMunicipio;
    const matchesEstado = selectedEstado === 'TODOS' || f.estado === selectedEstado;
    const matchesTipo = selectedTipo === 'TODOS' || f.metadata.tipoEntrega === selectedTipo;

    return matchesSearch && matchesMuni && matchesEstado && matchesTipo;
  });

  const totalCount = userFilings.length;
  const aprobadasCount = userFilings.filter(f => f.estado === 'Aprobado' || f.porcentajeCumplimiento === 100).length;
  const conObsCount = userFilings.filter(f => f.estado === 'Con Observaciones' || f.estado === 'Subsanación Requerida').length;
  const avgCompliance = totalCount > 0 
    ? Math.round(userFilings.reduce((acc, f) => acc + f.porcentajeCumplimiento, 0) / totalCount) 
    : 0;

  const municipiosList = Array.from(new Set(userFilings.map(f => f.metadata.municipio)));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Total Radicaciones
            </span>
            <span className="text-3xl font-black text-gray-900 mt-1 block">
              {totalCount}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">Registradas en M365</span>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg text-[#0D0D0D]">
            <FileCheck2 className="w-6 h-6 text-[#D9CF43]" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Recibidos a Conformidad
            </span>
            <span className="text-3xl font-black text-emerald-600 mt-1 block">
              {aprobadasCount}
            </span>
            <span className="text-xs text-emerald-700 mt-1 block font-semibold">100% Documentos OK</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Con Observaciones
            </span>
            <span className="text-3xl font-black text-amber-600 mt-1 block">
              {conObsCount}
            </span>
            <span className="text-xs text-amber-700 mt-1 block font-semibold">Pendiente Subsanación</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Cumplimiento Promedio
            </span>
            <span className="text-3xl font-black text-[#1E222A] mt-1 block">
              {avgCompliance}%
            </span>
            <span className="text-xs text-gray-500 mt-1 block">RETILAP / RETIE</span>
          </div>
          <div className="bg-[#D9CF43]/20 p-3 rounded-lg text-[#1E222A]">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gray-50/50 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-gray-900">
                Histórico de Radicaciones Documentales
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Consulte el estado, lista de chequeo y carpeta de OneDrive de cada entrega de proyecto.
              </p>
            </div>

            {userRole === 'contratista' && (
              <button
                onClick={onNewFiling}
                className="bg-[#1E222A] hover:bg-slate-800 text-[#D9CF43] font-black text-xs px-4 py-2.5 rounded-lg shadow transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                title="Radicar nuevo expediente de alumbrado público (Rol 2)"
              >
                <Plus className="w-4 h-4 text-[#D9CF43]" />
                <span>NUEVA RADICACIÓN</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por radicado, proyecto, contratista..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-900 focus:ring-2 focus:ring-[#D9CF43]"
              />
            </div>

            <div>
              <select
                value={selectedMunicipio}
                onChange={(e) => setSelectedMunicipio(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#D9CF43]"
              >
                <option value="TODOS">Todos los Municipios</option>
                {municipiosList.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedEstado}
                onChange={(e) => setSelectedEstado(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#D9CF43]"
              >
                <option value="TODOS">Todos los Estados</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Radicado">Radicado</option>
                <option value="Con Observaciones">Con Observaciones</option>
                <option value="Subsanación Requerida">Subsanación Requerida</option>
              </select>
            </div>

            <div>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#D9CF43]"
              >
                <option value="TODOS">Todos los Tipos de Entrega</option>
                <option value="Inicial">Inicial</option>
                <option value="Parcial">Parcial</option>
                <option value="Final">Final</option>
                <option value="Subsanación">Subsanación</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#0D0D0D] text-white text-xs font-extrabold uppercase tracking-wider">
                <th className="py-3 px-4">N° Radicado</th>
                <th className="py-3 px-4">Código Proyecto</th>
                <th className="py-3 px-4">Municipio</th>
                <th className="py-3 px-4">Contratista</th>
                <th className="py-3 px-4 text-center">Tipo</th>
                <th className="py-3 px-4 text-center">Documentos OK</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-center">Fecha</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-gray-500">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-bold">No se encontraron radicaciones con los filtros seleccionados.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((filing) => {
                  let badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  if (filing.estado === 'Con Observaciones') badgeBg = 'bg-amber-100 text-amber-800 border-amber-300';
                  if (filing.estado === 'Subsanación Requerida') badgeBg = 'bg-red-100 text-red-800 border-red-300';
                  if (filing.estado === 'Radicado') badgeBg = 'bg-blue-100 text-blue-800 border-blue-300';

                  return (
                    <tr key={filing.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-black text-gray-900 whitespace-nowrap">
                        <span className="bg-gray-100 text-[#0D0D0D] px-2 py-1 rounded border border-gray-300 font-mono text-xs">
                          {filing.numeroRadicado}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-gray-800">
                        {filing.metadata.codigoProyecto}
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-700">
                        {filing.metadata.municipio}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-gray-800 max-w-[200px]">
                        <div className="truncate font-bold">{filing.metadata.contratista}</div>
                        {filing.metadata.nitContratista && (
                          <div className="text-[10px] text-gray-500 font-mono font-normal">NIT: {filing.metadata.nitContratista}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                          {filing.metadata.tipoEntrega}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="font-black text-xs text-gray-900">
                          {filing.documentosOk} / 21
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mx-auto mt-1">
                          <div 
                            className={`h-1.5 rounded-full ${filing.porcentajeCumplimiento === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                            style={{ width: `${filing.porcentajeCumplimiento}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {userRole === 'interventor' ? (
                          <div className="flex flex-col items-center gap-1">
                            <select
                              value={filing.estado}
                              onChange={(e) => onUpdateStatus(filing.id, e.target.value)}
                              className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border focus:outline-none cursor-pointer ${badgeBg}`}
                              title="Cambiar estado como Revisor de Interventoría"
                            >
                              <option value="Aprobado">✓ Aprobado</option>
                              <option value="Radicado">📋 Radicado</option>
                              <option value="Con Observaciones">⚠️ Con Observaciones</option>
                              <option value="Subsanación Requerida">❌ Subsanación Requerida</option>
                            </select>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              filing.estado === 'Aprobado' || filing.m365Synced
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {filing.estado === 'Aprobado' || filing.m365Synced ? '☁️ Sincronizado M365' : '⏳ Pendiente Carga'}
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${badgeBg}`}>
                              {filing.estado}
                            </span>
                            <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              filing.estado === 'Aprobado' || filing.m365Synced
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {filing.estado === 'Aprobado' || filing.m365Synced ? '☁️ Sincronizado M365' : '⏳ Pendiente Carga'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {new Date(filing.fechaRadicacion).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {userRole === 'interventor' && onEvaluateFiling && (
                            <button
                              onClick={() => onEvaluateFiling(filing)}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-extrabold text-xs px-2.5 py-1.5 rounded flex items-center space-x-1 transition-colors border border-amber-300 shadow-sm"
                              title="Realizar / Editar Evaluación de Interventoría"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-800" />
                              <span>Evaluar</span>
                            </button>
                          )}

                          <button
                            onClick={() => onSelectFiling(filing)}
                            className="bg-[#0D0D0D] hover:bg-gray-800 text-[#D9CF43] font-bold text-xs px-2.5 py-1.5 rounded flex items-center space-x-1 transition-colors shadow-sm"
                            title="Ver Informe de Recibido a Conformidad"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Informe</span>
                          </button>

                          <button
                            onClick={() => onSelectOneDrive(filing)}
                            className="bg-sky-50 hover:bg-sky-100 text-sky-900 font-bold text-xs px-2.5 py-1.5 rounded transition-colors border border-sky-300 flex items-center space-x-1"
                            title="Ver Visor Documental M365 / OneDrive / SharePoint"
                          >
                            <FolderGit2 className="w-3.5 h-3.5 text-sky-700" />
                            <span>M365 / Nube</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
