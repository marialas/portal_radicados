import React, { useState } from 'react';
import { 
  Search, 
  FileCheck2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye, 
  Plus, 
  Edit3,
  Pencil,
  History,
  X,
  User
} from 'lucide-react';

export const RadicacionesList = ({
  filings,
  onSelectFiling,
  onEvaluateFiling,
  onEditFiling,
  onNewFiling,
  userRole = 'interventor',
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMunicipio, setSelectedMunicipio] = useState('TODOS');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [selectedTipo, setSelectedTipo] = useState('TODOS');
  const [historialFiling, setHistorialFiling] = useState(null);

  const filtered = filings.filter(f => {
    const matchesSearch = 
      f.numeroRadicado.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.metadata.nombreProyecto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.metadata.contratista.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.metadata.municipio.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMuni = selectedMunicipio === 'TODOS' || f.metadata.municipio === selectedMunicipio;
    const matchesEstado = selectedEstado === 'TODOS' || f.estado === selectedEstado;
    const matchesTipo = selectedTipo === 'TODOS' || f.metadata.tipoEntrega === selectedTipo;

    return matchesSearch && matchesMuni && matchesEstado && matchesTipo;
  });

  const totalCount = filings.length;
  const aprobadasCount = filings.filter(f => f.estado === 'Aprobado').length;
  const enRevisionCount = filings.filter(f => f.estado === 'En Revisión').length;
  const conObsCount = filings.filter(f => f.estado === 'Con Observaciones').length;
  const pendientesCount = filings.filter(f => f.estado === 'Radicado').length;

  const municipiosList = Array.from(new Set(filings.map(f => f.metadata.municipio)));

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 font-sans">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Total
            </span>
            <span className="text-3xl font-black text-gray-900 mt-1 block">
              {totalCount}
            </span>
            <span className="text-xs text-gray-400 mt-1 block">Radicaciones</span>
          </div>
          <div className="bg-gray-100 p-3 rounded-lg text-[#0D0D0D]">
            <FileCheck2 className="w-6 h-6 text-[#D9CF43]" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Aprobados
            </span>
            <span className="text-3xl font-black text-emerald-600 mt-1 block">
              {aprobadasCount}
            </span>
            <span className="text-xs text-emerald-700 mt-1 block font-semibold">Recibidos a Conformidad</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              En Revisión
            </span>
            <span className="text-3xl font-black text-blue-600 mt-1 block">
              {enRevisionCount}
            </span>
            <span className="text-xs text-blue-700 mt-1 block font-semibold">En Proceso</span>
          </div>
          <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
            <Clock className="w-6 h-6" />
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
            <span className="text-xs text-amber-700 mt-1 block font-semibold">Requiere Revisión</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Pendientes
            </span>
            <span className="text-3xl font-black text-gray-500 mt-1 block">
              {pendientesCount}
            </span>
            <span className="text-xs text-gray-500 mt-1 block font-semibold">Sin Evaluar</span>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg text-gray-400">
            <FileCheck2 className="w-6 h-6" />
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
                Consulte el estado y la lista de chequeo de cada entrega de proyecto.
              </p>
            </div>

            {userRole === 'contratista' && (
              <button
                onClick={onNewFiling}
                className="bg-[#1E222A] hover:bg-slate-800 text-[#D9CF43] font-black text-xs px-4 py-2.5 rounded-lg shadow transition-all flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
                title="Radicar nuevo expediente de alumbrado público"
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
                <option value="Radicado">Radicado</option>
                <option value="En Revisión">En Revisión</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Con Observaciones">Con Observaciones</option>
              </select>
            </div>

            <div>
              <select
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-xs font-semibold text-gray-800 focus:ring-2 focus:ring-[#D9CF43]"
              >
                <option value="TODOS">Todos los Tipos de Entrega</option>
                <option value="Inicio">Inicio</option>
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
                <th className="py-3 px-4">Proyecto</th>
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
                  let badgeBg = 'bg-blue-100 text-blue-800 border-blue-300';
                  if (filing.estado === 'En Revisión') badgeBg = 'bg-blue-100 text-blue-800 border-blue-300';
                  if (filing.estado === 'Aprobado') badgeBg = 'bg-emerald-100 text-emerald-800 border-emerald-300';
                  if (filing.estado === 'Con Observaciones') badgeBg = 'bg-amber-100 text-amber-800 border-amber-300';

                  return (
                    <tr key={filing.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-3 px-4 font-black text-gray-900 whitespace-nowrap">
                        <span className="bg-gray-100 text-[#0D0D0D] px-2 py-1 rounded border border-gray-300 font-mono text-xs">
                          {filing.numeroRadicado}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-extrabold text-gray-800">
                        {filing.metadata.nombreProyecto}
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
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${badgeBg}`}>
                            {filing.estado}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                            filing.estado === 'Aprobado'
                              ? 'bg-emerald-100 text-emerald-800'
                              : filing.estado === 'En Revisión'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}>
                            {filing.estado === 'Aprobado' ? 'Cargado en SharePoint' : filing.estado === 'En Revisión' ? 'En Revisión' : 'Pendiente de Aprobación'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center text-xs font-semibold text-gray-500 whitespace-nowrap">
                        {new Date(filing.fechaRadicacion).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center space-x-1.5">
                          {userRole === 'interventor' && onEvaluateFiling && filing.estado !== 'Aprobado' && (
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

                          {userRole === 'contratista' && onEditFiling && filing.estado === 'Con Observaciones' && (
                            <button
                              onClick={() => onEditFiling(filing)}
                              className="bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs px-2.5 py-1.5 rounded flex items-center space-x-1 transition-colors border border-amber-300 shadow-sm"
                              title="Editar este radicado para subsanar las observaciones"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Editar</span>
                            </button>
                          )}

                          <button
                            onClick={() => setHistorialFiling(filing)}
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs px-2.5 py-1.5 rounded flex items-center space-x-1 transition-colors border border-indigo-200 shadow-sm"
                            title="Ver historial de cambios de estado"
                          >
                            <History className="w-3.5 h-3.5" />
                            <span>Historial</span>
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

      {historialFiling && (
        <HistorialModal
          filing={historialFiling}
          onClose={() => setHistorialFiling(null)}
        />
      )}
    </div>
  );
};

const HistorialModal = ({ filing, onClose }) => {
  const historial = filing.historial?.length ? filing.historial : [
    {
      estado: filing.estado,
      fecha: filing.fechaRadicacion,
      usuario: filing.creadorEmail,
      usuarioNombre: filing.creadorName,
      observaciones: filing.observacionesGenerales,
    }
  ];

  const badgeColor = (estado) => {
    if (estado === 'Aprobado') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (estado === 'Con Observaciones') return 'bg-amber-100 text-amber-800 border-amber-300';
    if (estado === 'En Revisión') return 'bg-blue-100 text-blue-800 border-blue-300';
    return 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const formatFecha = (iso) => {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0D0D0D] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-white font-black flex items-center space-x-2">
              <History className="w-5 h-5 text-[#D9CF43]" />
              <span>Historial del Radicado</span>
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5 font-mono">
              {filing.numeroRadicado} - {filing.metadata.nombreProyecto}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {historial.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Sin movimientos registrados.</p>
          ) : (
            <ol className="relative border-l-2 border-gray-200 ml-3 space-y-6">
              {historial.map((h, idx) => (
                <li key={idx} className="pl-6 relative">
                  <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-[#D9CF43] border-2 border-white ring-2 ring-[#D9CF43]/30"></span>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${badgeColor(h.estado)}`}>
                        {h.estado}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500">
                        {formatFecha(h.fecha || h.fechaActualizacion)}
                      </span>
                    </div>
                    {(h.usuario || h.usuarioNombre) && (
                      <span className="text-[11px] text-gray-600 flex items-center space-x-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span>
                          {h.usuarioNombre || h.usuario || 'Usuario'}
                          {h.usuario && h.usuario !== h.usuarioNombre ? ` (${h.usuario})` : ''}
                        </span>
                      </span>
                    )}
                    {h.observaciones && (
                      <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-3 py-2 mt-1">
                        {h.observaciones}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};
