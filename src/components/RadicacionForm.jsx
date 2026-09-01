import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { formatNameFromEmail } from '../lib/msalConfig';
import { DOCUMENT_CATALOG } from '../data/documentsCatalog';
import { 
  FileUp, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  Building2, 
  User, 
  Mail, 
  MapPin, 
  Hash, 
  FolderDown,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  FileText,
  PenTool,
  ShieldCheck,
  Edit3
} from 'lucide-react';
import { FirmaDigitalModal } from './FirmaDigitalModal';

export const RadicacionForm = ({ onSuccess, onCancel, currentUser, filingToEdit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);

  const [selectedFiles, setSelectedFiles] = useState({});
  const [naDocs, setNaDocs] = useState(
    filingToEdit
      ? (filingToEdit.archivos || [])
          .filter(a => a.status === 'N/A')
          .map(a => a.docId)
      : []
  );
  const [archivosPrevios, setArchivosPrevios] = useState(
    filingToEdit
      ? Object.fromEntries(
          (filingToEdit.archivos || [])
            .filter(a => a.status === 'CUMPLE' || a.status === 'N/A')
            .map(a => [a.docId, a])
        )
      : {}
  );
  const [activeCategory, setActiveCategory] = useState('todos');

  const [metadata, setMetadata] = useState(
    filingToEdit
      ? {
          nombreProyecto: filingToEdit.metadata?.nombreProyecto || '',
          municipio: filingToEdit.metadata?.municipio || '',
          contratista: filingToEdit.metadata?.contratista || '',
          nitContratista: filingToEdit.metadata?.nitContratista || '',
          responsableRevision: filingToEdit.metadata?.responsableRevision || '',
          responsable: filingToEdit.metadata?.responsable || '',
          correoResponsable: filingToEdit.metadata?.correoResponsable || currentUser?.email || '',
          tipoEntrega: filingToEdit.metadata?.tipoEntrega || '',
          fechaEntrega: filingToEdit.metadata?.fechaEntrega || '',
          observaciones: filingToEdit.observacionesGenerales || ''
        }
      : {
          nombreProyecto: '',
          municipio: '',
          contratista: '',
          nitContratista: '',
          responsableRevision: '',
          responsable: '',
          correoResponsable: currentUser?.email || '',
          tipoEntrega: '',
          fechaEntrega: '',
          observaciones: ''
        }
  );

  const [elementos, setElementos] = useState(
    filingToEdit && filingToEdit.elementosEntregados?.length
      ? filingToEdit.elementosEntregados
      : [{ id: 1, elemento: '', cantidad: 0, especificacion: '' }]
  );

  const [firmaContratista, setFirmaContratista] = useState(
    filingToEdit?.metadata?.firmaContratista || null
  );
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customDocs, setCustomDocs] = useState([]);
  const [showAddDocModal, setShowAddDocModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ code: '', name: '', category: 'diseno', description: '' });

  const steps = [
    { 
      number: 1, 
      id: 'archivos', 
      title: 'Paso 1: Carga de Archivos', 
      subtitle: 'Pliego técnico y 21 documentos RETILAP',
      icon: FileUp
    },
    { 
      number: 2, 
      id: 'contratista', 
      title: 'Paso 2: Datos de Contratista', 
      subtitle: 'Metadatos del contrato e inventario físico',
      icon: Building2
    },
    { 
      number: 3, 
      id: 'firma', 
      title: 'Paso 3: Firma Digital', 
      subtitle: 'Declaración de conformidad y radicación',
      icon: PenTool
    }
  ];

  const goToStep = (newStep) => {
    if (newStep < 1 || newStep > 3) return;
    setDirection(newStep > currentStep ? 1 : -1);
    setCurrentStep(newStep);
  };

  const handleMetaChange = (e) => {
    setMetadata({ ...metadata, [e.target.name]: e.target.value });
  };

  const handleAddElement = () => {
    const newId = elementos.length > 0 ? Math.max(...elementos.map(e => e.id)) + 1 : 1;
    setElementos([...elementos, { id: newId, elemento: '', cantidad: 1, especificacion: '' }]);
  };

  const handleRemoveElement = (id) => {
    setElementos(elementos.filter(e => e.id !== id));
  };

  const handleElementChange = (id, field, value) => {
    setElementos(elementos.map(e => e.id === id ? { ...e, [field]: value } : e));
  };

  const handleFileChange = (docId, e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFiles(prev => ({ ...prev, [docId]: file }));
      setNaDocs(prev => prev.filter(id => id !== docId));
      setArchivosPrevios(prev => { const n = { ...prev }; delete n[docId]; return n; });
    }
  };

  const handleToggleNA = (docId) => {
    if (naDocs.includes(docId)) {
      setNaDocs(naDocs.filter(id => id !== docId));
      if (filingToEdit) {
        const prev = archivosPrevios[docId];
        if (prev) {
          setArchivosPrevios({ ...archivosPrevios, [docId]: { ...prev, status: 'CUMPLE' } });
        }
      }
    } else {
      setNaDocs([...naDocs, docId]);
      const updatedFiles = { ...selectedFiles };
      delete updatedFiles[docId];
      setSelectedFiles(updatedFiles);
      setArchivosPrevios(prev => { const n = { ...prev }; delete n[docId]; return n; });
    }
  };

  const handleAddCustomDoc = () => {
    if (!newDoc.code.trim() || !newDoc.name.trim()) {
      alert('Debe ingresar el código y nombre del documento.');
      return;
    }
    const allDocs = [...DOCUMENT_CATALOG, ...customDocs];
    if (allDocs.some(d => d.code.toUpperCase() === newDoc.code.trim().toUpperCase())) {
      alert(`El código "${newDoc.code.trim()}" ya existe. Use uno diferente.`);
      return;
    }
    const catLabels = { diseno: 'Documentos de Diseño', luminarias: 'Luminarias y Materiales', constructor: 'Documentos del Constructor', dictamenes: 'Dictámenes y Permisos' };
    const id = 100 + customDocs.length;
    setCustomDocs([...customDocs, {
      id,
      code: newDoc.code.trim().toUpperCase(),
      name: newDoc.name.trim(),
      category: newDoc.category,
      categoryName: catLabels[newDoc.category] || 'Documento Adicional',
      required: false,
      folderGroup: 'Documentos_Adicionales',
      description: newDoc.description.trim() || 'Documento adicional agregado manualmente.',
      esManual: true
    }]);
    setNewDoc({ code: '', name: '', category: 'diseno', description: '' });
    setShowAddDocModal(false);
  };

  const handleRemoveCustomDoc = (docId) => {
    setCustomDocs(customDocs.filter(d => d.id !== docId));
    const updatedFiles = { ...selectedFiles };
    delete updatedFiles[docId];
    setSelectedFiles(updatedFiles);
    setNaDocs(naDocs.filter(id => id !== docId));
    setArchivosPrevios(prev => { const n = { ...prev }; delete n[docId]; return n; });
  };

  const allDocs = [...DOCUMENT_CATALOG, ...customDocs];
  const totalDocs = allDocs.length;
  const previosCount = Object.keys(archivosPrevios).length;
  const attachedCount = Object.keys(selectedFiles).length;
  const naCount = naDocs.length;
  const totalCompleted = attachedCount + naCount + previosCount;
  const percentage = Math.round((totalCompleted / totalDocs) * 100);

  const missingMandatory = allDocs.filter(d => d.required && !selectedFiles[d.id] && !naDocs.includes(d.id) && !archivosPrevios[d.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!filingToEdit && !firmaContratista) {
      alert('La firma digital del contratista es obligatoria para crear el radicado. Estampe su firma antes de continuar.');
      return;
    }

    if (missingMandatory.length > 0) {
      if (!confirm(`Atención: Hay ${missingMandatory.length} documentos obligatorios pendientes de carga. ¿Desea continuar radicando con observaciones de interventoría?`)) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const userEmail = (currentUser?.email || metadata.correoResponsable || '').toLowerCase().trim();

      if (filingToEdit) {
        // ====== MODO EDICIÓN: subsanar observaciones sin crear nuevo radicado ======
        const archivos = (filingToEdit.archivos || []).map(a => ({ ...a }));

        // 1. Subir archivos nuevos/corregidos
        for (const [docIdStr, file] of Object.entries(selectedFiles)) {
          const docId = parseInt(docIdStr, 10);
          const fd = new FormData();
          fd.append('docId', String(docId));
          fd.append('archivo', file);
          const up = await fetch(`/api/radicacion/${filingToEdit.id}/archivo`, {
            method: 'POST',
            body: fd
          });
          if (up.ok) {
            const upJson = await up.json().catch(() => null);
            const updated = upJson?.data?.archivos || archivos;
            updated.forEach(a => {
              if (a.docId === docId) {
                const existing = archivos.find(x => x.docId === docId);
                if (existing) Object.assign(existing, a);
              }
            });
          }
        }

        // 2. Actualizar estado de archivos locales según selección
        Object.entries(selectedFiles).forEach(([docIdStr]) => {
          const docId = parseInt(docIdStr, 10);
          const found = archivos.find(a => a.docId === docId);
          if (found) found.status = 'CUMPLE';
        });
        naDocs.forEach(docId => {
          const found = archivos.find(a => a.docId === docId);
          if (found) found.status = 'N/A';
        });

        // 3. Actualizar metadata + archivos del radicado (mantiene el mismo número)
        const metadataWithSignature = {
          ...metadata,
          creadorEmail: userEmail,
          creadorName: currentUser?.name || metadata.responsable,
          correoResponsable: metadata.correoResponsable || userEmail,
          firmaContratista: firmaContratista || undefined
        };
        const metaRes = await fetch(`/api/radicacion/${filingToEdit.id}/metadata`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metadata: metadataWithSignature,
            archivos,
            elementosEntregados: elementos
          })
        });

        // 4. Reiniciar estado a "En Revisión" para nueva evaluación
        await fetch(`/api/radicacion/${filingToEdit.id}/estado`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            estado: 'En Revisión',
            observaciones: '',
            usuarioEmail: userEmail,
            usuarioNombre: currentUser?.name || ''
          })
        });

        const res = await fetch(`/api/radicacion/${filingToEdit.id}`);
        const result = await res.json();
        if (res.ok && result.data) {
          onSuccess(result.data);
        } else {
          alert('Error al guardar los cambios del radicado.');
        }
        return;
      }

      // ====== MODO CREACIÓN: nuevo radicado consecutivo ======
      const formData = new FormData();
      const metadataWithSignature = {
        ...metadata,
        creadorEmail: userEmail,
        creadorName: currentUser?.name || metadata.responsable,
        correoResponsable: metadata.correoResponsable || userEmail,
        firmaContratista: firmaContratista || undefined
      };
      formData.append('metadatos', JSON.stringify(metadataWithSignature));
      formData.append('elementos', JSON.stringify(elementos));
      formData.append('naDocs', JSON.stringify(naDocs));

      const docsAdicionales = customDocs.map(doc => ({
        docId: doc.id,
        docCode: doc.code,
        docName: doc.name,
        category: doc.category,
        description: doc.description,
        esManual: true
      }));
      formData.append('docsAdicionales', JSON.stringify(docsAdicionales));

      Object.entries(selectedFiles).forEach(([docId, file]) => {
        const docDef = allDocs.find(d => d.id === parseInt(docId, 10));
        const fieldName = docDef?.esManual ? `archivo_custom_${docId}` : docDef ? `archivo_${docDef.code}` : `archivo_${docId}`;
        formData.append(fieldName, file);
      });

      const sessionEmail = currentUser?.email || 'usuario@intecoal.com.co';

      const response = await fetch('/api/radicacion/nueva', {
        method: 'POST',
        headers: {
          'x-intecoal-session': sessionEmail,
          'Authorization': `Bearer ${sessionEmail}`
        },
        body: formData
      });

      const result = await response.json();

      if (response.ok && result.data) {
        onSuccess(result.data);
      } else {
        alert(result.error || 'Error al guardar la radicación');
      }
    } catch (err) {
      console.error('Error enviando formulario:', err);
      alert('Error de conexión al guardar la radicación');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'todos', label: `Todos (${allDocs.length})` },
    { id: 'diseno', label: `1. Diseño (${allDocs.filter(d => d.category === 'diseno').length})` },
    { id: 'luminarias', label: `2. Luminarias (${allDocs.filter(d => d.category === 'luminarias').length})` },
    { id: 'constructor', label: `3. Constructor (${allDocs.filter(d => d.category === 'constructor').length})` },
    { id: 'dictamenes', label: `4. Dictámenes (${allDocs.filter(d => d.category === 'dictamenes').length})` }
  ];

  const filteredDocs = activeCategory === 'todos' 
    ? allDocs 
    : allDocs.filter(d => d.category === activeCategory);

  const stepVariants = {
    enter: (dir) => ({
      x: dir > 0 ? 150 : -150,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: { duration: 0.3, ease: 'easeOut' }
    },
    exit: (dir) => ({
      x: dir < 0 ? 150 : -150,
      opacity: 0,
      transition: { duration: 0.2, ease: 'easeIn' }
    })
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">
            <span className="bg-[#1E222A] text-[#D9CF43] px-2.5 py-0.5 rounded font-black">INTECOAL SAS</span>
            <span>· Portal de Radicación Digital</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E222A] tracking-tight">
            {filingToEdit 
              ? 'Subsanar Observaciones del Expediente'
              : 'Asistente de Radicación de Expediente Técnico'}
          </h1>
          {filingToEdit && (
            <p className="text-xs text-amber-700 font-semibold mt-0.5">
              Edición del radicado {filingToEdit.numeroRadicado} - mantiene el mismo número. Corrija los documentos señalados y vuelva a enviar para revisión.
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="self-start md:self-auto px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-xs font-extrabold transition-all border border-gray-300"
        >
          Cancelar / Volver a la Lista
        </button>
      </div>

      <div className="bg-[#1E222A] text-white rounded-2xl p-6 shadow-xl mb-8 border-b-4 border-[#D9CF43] relative overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative">
            <div className="hidden md:block absolute top-6 left-12 right-12 h-1 bg-slate-700 z-0">
              <div 
                className="h-full bg-[#D9CF43] transition-all duration-500" 
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
              />
            </div>

            {steps.map((st) => {
              const StepIcon = st.icon;
              const isActive = currentStep === st.number;
              const isDone = st.number < currentStep;

              return (
                <button
                  key={st.number}
                  type="button"
                  onClick={() => goToStep(st.number)}
                  className={`relative z-10 flex md:flex-col items-center text-left md:text-center p-3.5 rounded-xl transition-all ${
                    isActive 
                      ? 'bg-[#D9CF43]/15 border border-[#D9CF43]/50 shadow-lg scale-[1.02]' 
                      : isDone
                      ? 'bg-slate-800/80 hover:bg-slate-800 text-gray-200 border border-slate-700'
                      : 'bg-slate-900/40 text-gray-400 border border-transparent'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 mb-0 md:mb-2 mr-3 md:mr-0 font-black text-sm transition-all ${
                    isActive 
                      ? 'bg-[#D9CF43] text-[#1E222A] shadow-md shadow-[#D9CF43]/20 ring-4 ring-[#D9CF43]/20' 
                      : isDone 
                      ? 'bg-[#BFBA6B] text-[#1E222A]' 
                      : 'bg-slate-700 text-gray-300'
                  }`}>
                    {isDone ? <Check className="w-6 h-6 stroke-[3]" /> : <StepIcon className="w-5 h-5" />}
                  </div>

                  <div>
                    <span className={`text-[11px] font-black uppercase tracking-wider block ${
                      isActive ? 'text-[#D9CF43]' : isDone ? 'text-[#BFBA6B]' : 'text-gray-500'
                    }`}>
                      {st.title}
                    </span>
                    <span className={`text-xs font-semibold block mt-0.5 ${
                      isActive ? 'text-white' : 'text-gray-400'
                    }`}>
                      {st.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-[#F8F9FA] rounded-2xl shadow-xl border border-[#BFBFBF] p-6 sm:p-8 min-h-[500px] flex flex-col justify-between relative">
          
          <div className="overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={stepVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="w-full"
              >
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#BFBFBF]/60 pb-4 gap-2">
                      <div>
                        <span className="text-xs font-black text-[#0D0D0D] bg-[#D9CF43] px-2.5 py-1 rounded uppercase tracking-wider">
                          PASO 1 DE 3
                        </span>
                        <h2 className="text-xl font-black text-[#0D0D0D] tracking-tight mt-1.5">
                          Expediente Técnico del Proyecto
                        </h2>
                      </div>

                      <div className="flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-xl border border-gray-300 shadow-sm shrink-0">
                        <span className="text-xs font-bold text-gray-600">Archivos:</span>
                        <span className="text-sm font-black text-[#0D0D0D]">{totalCompleted} / {totalDocs}</span>
                        <span className="text-xs font-extrabold text-[#0D0D0D] bg-[#D9CF43] px-2 py-0.5 rounded">
                          {percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h3 className="text-sm font-black text-[#0D0D0D] uppercase tracking-wide flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#BFBA6B]" />
                          Lista de Verificación Documental
                        </h3>

                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex flex-wrap gap-1 bg-white p-1 rounded-xl border border-gray-300">
                            {categories.map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                                  activeCategory === cat.id
                                    ? 'bg-[#0D0D0D] text-[#D9CF43] shadow-md'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                              >
                                {cat.label}
                              </button>
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowAddDocModal(true)}
                            className="inline-flex items-center space-x-1.5 bg-[#0D0D0D] hover:bg-gray-800 text-[#D9CF43] font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Agregar Documento</span>
                          </button>
                        </div>
                      </div>

                      {missingMandatory.length > 0 && (
                        <div className="bg-amber-50 border-l-4 border-amber-500 p-3.5 rounded-r-xl flex items-start space-x-3 text-xs text-amber-900 shadow-sm">
                          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-black uppercase">Obligatorios pendientes: </span>
                            <span>{missingMandatory.map(d => d.code).join(', ')}</span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-3">
                        {filteredDocs.map((doc) => {
                          const file = selectedFiles[doc.id];
                          const isNA = naDocs.includes(doc.id);
                          const previo = archivosPrevios[doc.id];

                          let cardBorder = 'border-gray-200 bg-white';
                          let statusBadge = (
                            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-lg border border-amber-300 flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              <span>PENDIENTE</span>
                            </span>
                          );

                          if (file) {
                            cardBorder = 'border-emerald-300 bg-emerald-50/50';
                            statusBadge = (
                              <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>NUEVO</span>
                              </span>
                            );
                          } else if (previo) {
                            cardBorder = 'border-emerald-200 bg-emerald-50/40';
                            statusBadge = (
                              <span className="bg-emerald-100 text-emerald-900 text-xs font-bold px-2.5 py-1 rounded-lg border border-emerald-300 flex items-center space-x-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>CARGADO</span>
                              </span>
                            );
                          } else if (isNA) {
                            cardBorder = 'border-gray-300 bg-gray-100';
                            statusBadge = (
                              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-gray-300">
                                N/A
                              </span>
                            );
                          }

                          return (
                            <div
                              key={doc.id}
                              className={`border rounded-xl p-3.5 transition-all duration-200 hover:shadow-md ${cardBorder}`}
                            >
                              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                                <div className="flex items-start space-x-3 max-w-xl">
                                  <div className="bg-[#0D0D0D] text-[#D9CF43] font-black text-xs px-2.5 py-1 rounded shrink-0 mt-0.5 shadow-sm">
                                    #{doc.id} {doc.code}
                                  </div>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <h4 className="font-extrabold text-[#0D0D0D] text-sm">
                                        {doc.name}
                                      </h4>
                                      {doc.required ? (
                                        <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">
                                          OBLIGATORIO
                                        </span>
                                      ) : (
                                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                                          SI APLICA
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                      {doc.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  {statusBadge}

                                  {doc.esManual && (
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveCustomDoc(doc.id)}
                                      className="text-red-500 hover:text-red-700 p-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-all"
                                      title="Eliminar documento adicional"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}

                                  {!doc.required && (
                                    <label className="flex items-center space-x-1.5 text-xs font-bold text-gray-700 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 shadow-sm">
                                      <input
                                        type="checkbox"
                                        checked={isNA}
                                        onChange={() => handleToggleNA(doc.id)}
                                        className="rounded border-gray-300 text-[#0D0D0D] focus:ring-[#D9CF43]"
                                      />
                                      <span>N/A</span>
                                    </label>
                                  )}

                                  {!isNA && (
                                    <label className="cursor-pointer bg-[#0D0D0D] hover:bg-gray-800 text-[#D9CF43] text-xs font-bold px-3.5 py-1.5 rounded-lg shadow transition-all flex items-center space-x-1.5 active:scale-95">
                                      <FolderDown className="w-3.5 h-3.5 text-[#D9CF43]" />
                                      <span>{file ? 'Cambiar PDF' : 'Adjuntar PDF'}</span>
                                      <input
                                        type="file"
                                        accept=".pdf,.dwg,.dxf,.jpeg,.jpg,.png,.tiff,.tif,.bmp,.gif"
                                        onChange={(e) => handleFileChange(doc.id, e)}
                                        className="hidden"
                                      />
                                    </label>
                                  )}
                                </div>
                              </div>

                              {file && (
                                <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex items-center justify-between text-xs text-emerald-950 bg-emerald-100/60 px-3 py-1.5 rounded-lg">
                                  <div className="flex items-center space-x-2 truncate">
                                    <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                                    <span className="font-bold truncate">{file.name}</span>
                                    <span className="text-gray-500 font-medium">
                                      ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedFiles = { ...selectedFiles };
                                      delete updatedFiles[doc.id];
                                      setSelectedFiles(updatedFiles);
                                    }}
                                    className="text-red-500 hover:text-red-700 font-bold ml-2 p-0.5 rounded hover:bg-red-50"
                                    title="Quitar archivo"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-[#BFBFBF]/60 pb-4">
                      <div>
                        <span className="text-xs font-black text-[#0D0D0D] bg-[#D9CF43] px-2.5 py-1 rounded uppercase tracking-wider">
                          PASO 2 DE 3
                        </span>
                        <h2 className="text-xl font-black text-[#0D0D0D] tracking-tight mt-1.5">
                          Información del Contratista e Inventario Físico
                        </h2>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 hidden sm:inline-block bg-white px-3 py-1.5 rounded-lg border border-gray-300">
                        Metadatos del Contrato
                      </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-300 shadow-sm space-y-4">
                      <h3 className="text-xs font-black uppercase text-[#0D0D0D] tracking-wider border-b border-gray-200 pb-2">
                        1. Metadatos del Contrato de Obra
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 uppercase">
                            Nombre Completo del Proyecto / Obra *
                          </label>
                          <input
                            type="text"
                            name="nombreProyecto"
                            required
                            value={metadata.nombreProyecto}
                            onChange={handleMetaChange}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 uppercase">
                            Municipio *
                          </label>
                          <div className="relative">
                            <MapPin className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <select
                              name="municipio"
                              value={metadata.municipio}
                              onChange={handleMetaChange}
                              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                            >
                              <option value="CALIMA-DARIEN">CALIMA-DARIEN</option>
                              <option value="YUMBO">YUMBO</option>
                              <option value="CALI">CALI</option>
                              <option value="PALMIRA">PALMIRA</option>
                              <option value="JAMUNDI">JAMUNDÍ</option>
                              <option value="BUENAVENTURA">BUENAVENTURA</option>
                              <option value="BUGA">BUGA</option>
                              <option value="CARTAGO">CARTAGO</option>
                              <option value="OTRO">OTRO MUNICIPIO</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 uppercase">
                            Empresa Contratista *
                          </label>
                          <input
                            type="text"
                            name="contratista"
                            required
                            value={metadata.contratista}
                            onChange={handleMetaChange}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 uppercase">
                            NIT del Contratista *
                          </label>
                          <input
                            type="text"
                            name="nitContratista"
                            required
                            value={metadata.nitContratista}
                            onChange={handleMetaChange}
                            placeholder="Ej: 891903664-1"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 uppercase">
                            Responsable de Revisión - Interventoría / Contratista *
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input
                              type="text"
                              name="responsable"
                              required
                              value={metadata.responsable}
                              onChange={handleMetaChange}
                              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 uppercase">
                            Correo de Contacto *
                          </label>
                          <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                            <input
                              type="email"
                              name="correoResponsable"
                              required
                              value={metadata.correoResponsable}
                              onChange={handleMetaChange}
                              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-gray-700 uppercase">
                            Tipo de Entrega *
                          </label>
                          <select
                            name="tipoEntrega"
                            value={metadata.tipoEntrega}
                            onChange={handleMetaChange}
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                          >
                            <option value="Inicio">Inicio</option>
                            <option value="Subsanación">Subsanación</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-300 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <h3 className="text-xs font-black uppercase text-[#0D0D0D] tracking-wider">
                          2. Inventario Físico de Luminarias y Componentes
                        </h3>
                        <button
                          type="button"
                          onClick={handleAddElement}
                          className="inline-flex items-center space-x-1.5 bg-[#0D0D0D] hover:bg-gray-800 text-[#D9CF43] font-extrabold text-xs px-3 py-1.5 rounded-lg transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar Ítem</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-gray-200 rounded-xl">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#0D0D0D] text-[#D9CF43] text-xs font-extrabold uppercase">
                              <th className="py-2.5 px-3 w-10 text-center">#</th>
                              <th className="py-2.5 px-3 w-1/3">Componente Físico</th>
                              <th className="py-2.5 px-3 w-24 text-center">Cantidad</th>
                              <th className="py-2.5 px-3">Especificación Técnica</th>
                              <th className="py-2.5 px-3 w-10 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 text-xs">
                            {elementos.map((elem, idx) => (
                              <tr key={elem.id} className="hover:bg-gray-50">
                                <td className="py-2 px-3 text-center font-bold text-gray-400">{idx + 1}</td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={elem.elemento}
                                    onChange={(e) => handleElementChange(elem.id, 'elemento', e.target.value)}
                                    className="w-full px-2.5 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-semibold"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="number"
                                    min="1"
                                    value={elem.cantidad}
                                    onChange={(e) => handleElementChange(elem.id, 'cantidad', parseInt(e.target.value, 10) || 1)}
                                    className="w-full text-center px-2 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs font-bold"
                                  />
                                </td>
                                <td className="py-2 px-3">
                                  <input
                                    type="text"
                                    value={elem.especificacion}
                                    onChange={(e) => handleElementChange(elem.id, 'especificacion', e.target.value)}
                                    className="w-full px-2.5 py-1 bg-gray-50 border border-gray-300 rounded-lg text-xs"
                                  />
                                </td>
                                <td className="py-2 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveElement(elem.id)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-[#BFBFBF]/60 pb-4">
                      <div>
                        <span className="text-xs font-black text-[#0D0D0D] bg-[#D9CF43] px-2.5 py-1 rounded uppercase tracking-wider">
                          PASO 3 DE 3
                        </span>
                        <h2 className="text-xl font-black text-[#0D0D0D] tracking-tight mt-1.5">
                          Firma Digital & Declaración de Radicación
                        </h2>
                      </div>
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300">
                        Paso Final
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-white p-5 rounded-2xl border border-gray-300 shadow-sm space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                          <span className="text-xs font-black uppercase text-gray-600">Resumen del Expediente</span>
                          <span className="text-xs font-bold text-[#0D0D0D] bg-[#D9CF43] px-2 py-0.5 rounded">
                            {metadata.numeroRadicado || 'Se asigna al crear'}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <p><strong className="text-gray-600">Proyecto:</strong> <span className="font-bold text-[#0D0D0D]">{metadata.nombreProyecto}</span></p>
                          <p><strong className="text-gray-600">Municipio:</strong> {metadata.municipio}</p>
                          <p><strong className="text-gray-600">Contratista:</strong> {metadata.contratista} ({metadata.nitContratista})</p>
                          <p><strong className="text-gray-600">Responsable:</strong> {metadata.responsable}</p>
                        </div>
                      </div>

                      <div className="bg-[#0D0D0D] text-white p-5 rounded-2xl border border-gray-800 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
                            <span className="text-xs font-black uppercase text-[#D9CF43]">Estado de Verificación</span>
                            <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                              {percentage}% RETILAP
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-gray-900 p-2 rounded-xl">
                              <span className="text-lg font-black text-emerald-400">{attachedCount}</span>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Archivos</p>
                            </div>
                            <div className="bg-gray-900 p-2 rounded-xl">
                              <span className="text-lg font-black text-gray-300">{naCount}</span>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">N/A</p>
                            </div>
                            <div className="bg-gray-900 p-2 rounded-xl">
                              <span className="text-lg font-black text-amber-400">{21 - totalCompleted}</span>
                              <p className="text-[10px] text-gray-400 font-bold uppercase">Pendientes</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-[11px] text-gray-400 border-t border-gray-800 pt-2 flex items-center justify-between">
                          <span>Ítems Físicos: <strong className="text-white">{elementos.length}</strong></span>
                          <span>Carga en SharePoint: <strong className="text-[#D9CF43]">al aprobar el radicado</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-300 shadow-sm space-y-4">
                      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                        <h3 className="text-xs font-black uppercase text-[#0D0D0D] tracking-wider flex items-center gap-2">
                          <PenTool className="w-4 h-4 text-[#BFBA6B]" />
                          Firma Digital del Contratista
                        </h3>
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          Ley 527 de 1999
                        </span>
                      </div>

                      {firmaContratista ? (
                        <div className="p-4 bg-emerald-50/70 border border-emerald-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-lg border border-emerald-200 shadow-sm">
                              {firmaContratista.dataUrl ? (
                                <img
                                  src={firmaContratista.dataUrl}
                                  alt="Firma del Contratista"
                                  className="h-12 max-w-[140px] object-contain"
                                />
                              ) : (
                                <PenTool className="w-6 h-6 text-emerald-600" />
                              )}
                            </div>
                            <div>
                              <span className="text-xs font-black text-emerald-950 block">
                                {firmaContratista.nombreSignatario || metadata.responsable}
                              </span>
                              <span className="text-[11px] text-emerald-800 font-semibold block">
                                {firmaContratista.cargo || 'Representante Técnico Contratista'}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono block">
                                Hash: {(firmaContratista.hashIntegridad || 'CERT-OK').slice(0, 18)}...
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => setShowSignatureModal(true)}
                              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Modificar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setFirmaContratista(null)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center space-x-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 text-xs text-gray-600">
                            <PenTool className="w-5 h-5 text-gray-400 shrink-0" />
                            <div>
                              <p className="font-bold text-gray-800">Estampar Firma Digital en el Expediente</p>
                              <p className="text-[11px] text-gray-500">Puede trazarla con el mouse/touch, cargar una imagen PNG o generarla tipográficamente.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowSignatureModal(true)}
                            className="px-4 py-2 bg-[#1E222A] hover:bg-slate-800 text-[#D9CF43] font-bold text-xs rounded-xl shadow transition-all shrink-0 flex items-center space-x-1.5"
                          >
                            <PenTool className="w-4 h-4" />
                            <span>Crear / Subir Firma</span>
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-6 border-t border-[#BFBFBF]/60 flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              disabled={currentStep === 1}
              onClick={() => goToStep(currentStep - 1)}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-extrabold text-xs bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Atrás</span>
            </button>

            <div className="flex items-center space-x-2">
              {[1, 2, 3].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => goToStep(s)}
                  className={`h-2.5 rounded-full transition-all ${
                    currentStep === s
                      ? 'w-8 bg-[#D9CF43]'
                      : s < currentStep
                      ? 'w-2.5 bg-[#0D0D0D]'
                      : 'w-2.5 bg-gray-300'
                  }`}
                  title={`Paso ${s}`}
                />
              ))}
              <span className="text-xs font-black text-gray-500 ml-2">
                Paso {currentStep} de 3
              </span>
            </div>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => goToStep(currentStep + 1)}
                className="w-full sm:w-auto px-7 py-3 rounded-xl font-black text-xs bg-[#D9CF43] hover:bg-amber-400 text-[#0D0D0D] transition-all shadow-lg flex items-center justify-center space-x-2 active:scale-95 uppercase tracking-wider"
              >
                <span>Siguiente Paso</span>
                <ChevronRight className="w-4 h-4 text-[#0D0D0D]" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 rounded-xl font-black text-xs bg-[#D9CF43] hover:bg-amber-400 text-[#0D0D0D] transition-all shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50 active:scale-95 uppercase tracking-wider"
              >
                <FileUp className="w-4 h-4 text-[#0D0D0D]" />
                <span>{isSubmitting ? (filingToEdit ? 'Guardando...' : 'Radicando...') : (filingToEdit ? 'GUARDAR Y ENVIAR A REVISIÓN' : 'RADICAR DOCUMENTACIÓN')}</span>
              </button>
            )}
          </div>
        </div>
      </form>

      {showAddDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-[#0D0D0D]">Agregar Documento Adicional</h3>
              <button type="button" onClick={() => setShowAddDocModal(false)} className="text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase">Código del Documento *</label>
                <input
                  type="text"
                  maxLength={10}
                  value={newDoc.code}
                  onChange={(e) => setNewDoc({ ...newDoc, code: e.target.value })}
                  placeholder="Ej: X1, ADD-01"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase">Nombre del Documento *</label>
                <input
                  type="text"
                  value={newDoc.name}
                  onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                  placeholder="Ej: Certificado de calibration"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase">Categoría</label>
                <select
                  value={newDoc.category}
                  onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                >
                  <option value="diseno">Documentos de Diseño</option>
                  <option value="luminarias">Luminarias y Materiales</option>
                  <option value="constructor">Documentos del Constructor</option>
                  <option value="dictamenes">Dictámenes y Permisos</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700 uppercase">Descripción (opcional)</label>
                <textarea
                  rows={2}
                  value={newDoc.description}
                  onChange={(e) => setNewDoc({ ...newDoc, description: e.target.value })}
                  placeholder="Breve descripción del documento"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#D9CF43]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddDocModal(false)}
                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAddCustomDoc}
                className="px-5 py-2 bg-[#0D0D0D] hover:bg-gray-800 text-[#D9CF43] text-xs font-black rounded-xl shadow transition-all"
              >
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}

      {showSignatureModal && (
        <FirmaDigitalModal
          role="contratista"
          defaultName={metadata.responsable || currentUser?.name || 'Director de Obra'}
          defaultRole="Representante Técnico Contratista"
          initialSignature={firmaContratista}
          onSaveSignature={(sig) => setFirmaContratista(sig)}
          onRemoveSignature={() => setFirmaContratista(null)}
          onClose={() => setShowSignatureModal(false)}
        />
      )}
    </div>
  );
};
