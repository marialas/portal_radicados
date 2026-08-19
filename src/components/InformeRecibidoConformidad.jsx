import React, { useRef, useState } from 'react';
import { DOCUMENT_CATALOG } from '../data/documentsCatalog';
import { 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  XCircle,
  FileCheck2,
  Building2,
  MapPin,
  Calendar,
  Layers,
  ShieldCheck,
  Check,
  Edit3,
  PenTool,
  Phone,
  Mail,
  Zap,
  Cpu,
  FileText,
  Award,
  BookOpen,
  CheckCheck,
  Hash
} from 'lucide-react';
import { IntecoalLogo } from './IntecoalLogo';
import { FirmaDigitalModal } from './FirmaDigitalModal';

export const InformeRecibidoConformidad = ({ 
  filing, 
  onBack, 
  onEditEvaluation,
  onUpdateFiling,
  currentUser,
  userRole
}) => {
  const printRef = useRef(null);
  const [signingRole, setSigningRole] = useState(null);

  const effectiveRole = userRole || currentUser?.role || 'interventor';
  const isRol1Revisor = effectiveRole === 'interventor'; // Rol 1: Revisor / Interventor
  const isRol2Contratista = effectiveRole === 'contratista'; // Rol 2: Contratista / Operador

  // Additional technical photometics/electric state for full RETILAP report completeness
  const [techParams, setTechParams] = useState(() => ({
    dpcp: filing.metadata.dpcp || '1.85 W/m²',
    eficiencia: filing.metadata.eficiencia || '142 lm/W',
    factorPotencia: filing.metadata.factorPotencia || '0.97',
    thd: filing.metadata.thd || '6.2%',
    gradoProteccion: filing.metadata.gradoProteccion || 'IP66 / IK09',
    dps: filing.metadata.dps || '10 kV / 10 kA (IEC 61643-11)',
    vidaUtil: filing.metadata.vidaUtil || '100,000 h (L90/B10)',
    normaAplicable: 'Resolución 40150 de 2024 (RETILAP) & Res. 90708 (RETIE)'
  }));

  const [isEditingTech, setIsEditingTech] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSignature = (role, signature) => {
    const updatedMetadata = { ...filing.metadata };
    if (role === 'interventoria') {
      updatedMetadata.firmaInterventoria = signature;
      updatedMetadata.responsableRevision = signature.nombreSignatario;
    } else {
      updatedMetadata.firmaContratista = signature;
      updatedMetadata.responsable = signature.nombreSignatario;
    }

    const updatedFiling = {
      ...filing,
      metadata: updatedMetadata,
      fechaActualizacion: new Date().toISOString()
    };

    if (onUpdateFiling) {
      onUpdateFiling(updatedFiling);
    }
  };

  const handleRemoveSignature = (role) => {
    const updatedMetadata = { ...filing.metadata };
    if (role === 'interventoria') {
      delete updatedMetadata.firmaInterventoria;
    } else {
      delete updatedMetadata.firmaContratista;
    }

    const updatedFiling = {
      ...filing,
      metadata: updatedMetadata,
      fechaActualizacion: new Date().toISOString()
    };

    if (onUpdateFiling) {
      onUpdateFiling(updatedFiling);
    }
  };

  const handleSaveTechParams = () => {
    setIsEditingTech(false);
    const updatedFiling = {
      ...filing,
      metadata: {
        ...filing.metadata,
        ...techParams
      }
    };
    if (onUpdateFiling) {
      onUpdateFiling(updatedFiling);
    }
  };

  const cumpleCount = filing.archivos.filter(a => a.status === 'CUMPLE').length;
  const pendienteCount = filing.archivos.filter(a => a.status === 'PENDIENTE').length;
  const noCumpleCount = filing.archivos.filter(a => a.status === 'NO CUMPLE').length;
  const naCount = filing.archivos.filter(a => a.status === 'N/A').length;
  const aplicablesCount = 21 - naCount;

  const isApproved = (cumpleCount + naCount) === 21 && noCumpleCount === 0;

  const categories = [
    {
      id: 'diseno',
      code: 'A',
      title: 'A. DOCUMENTOS TÉCNICOS DE DISEÑO Y CÁLCULOS FOTOMÉTRICOS/ELÉCTRICOS',
      subtitle: 'Diseños fotométricos IES, memorias de cálculo, planos as-built y licencias',
      retilapRef: 'Capítulo 4 - Sección 400 a 415 (Diseño de Alumbrado Público)',
      docs: DOCUMENT_CATALOG.filter(d => d.category === 'diseno')
    },
    {
      id: 'luminarias',
      code: 'B',
      title: 'B. LUMINARIAS, MATERIALES Y ENSAYOS DE LABORATORIO CERTIFICADOS',
      subtitle: 'Certificados de conformidad RETILAP, fotometrías IES, IP66, IK08 y ensayos',
      retilapRef: 'Capítulo 3 - Sección 300 (Requisitos de Productos y Componentes)',
      docs: DOCUMENT_CATALOG.filter(d => d.category === 'luminarias')
    },
    {
      id: 'constructor',
      code: 'C',
      title: 'C. DOCUMENTACIÓN DEL CONSTRUCTOR, MATRÍCULAS Y SEGUROS',
      subtitle: 'Matrículas CONALTEL/COPNIA, RETIE, memorias de montaje y plan de calidad',
      retilapRef: 'Capítulo 5 - Sección 500 (Demostración de la Conformidad)',
      docs: DOCUMENT_CATALOG.filter(d => d.category === 'constructor')
    },
    {
      id: 'dictamenes',
      code: 'D',
      title: 'D. DICTÁMENES DE INSPECCIÓN, PRUEBAS EN CAMPO Y PERMISOS AMBIENTALES',
      subtitle: 'Dictamen de inspección de tercera parte, mediciones luxométricas y permisos',
      retilapRef: 'Capítulo 6 - Sección 600 (Inspección, Pruebas y Certificación Final)',
      docs: DOCUMENT_CATALOG.filter(d => d.category === 'dictamenes')
    }
  ];

  const getDocStatus = (docId) => {
    const item = filing.archivos.find(a => a.docId === docId);
    return item ? item.status : 'PENDIENTE';
  };

  const getDocNotes = (docId) => {
    const item = filing.archivos.find(a => a.docId === docId);
    return item && item.notes ? item.notes : null;
  };

  const getDocFileName = (docId) => {
    const item = filing.archivos.find(a => a.docId === docId);
    return item && item.fileName ? item.fileName : null;
  };

  const formattedDate = new Date(filing.fechaRadicacion || Date.now()).toLocaleDateString('es-CO', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const verificationUrl = `${window.location.origin}/verificar?radicado=${encodeURIComponent(filing.numeroRadicado)}`;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 font-sans">
      {/* Print Styles for Official Executive Letterhead */}
      <style>{`
        @media print {
          @page {
            size: letter portrait;
            margin: 0;
          }
          header, aside, nav, .print\\:hidden {
            display: none !important;
          }
          html, body, #root, main, div, section, article {
            overflow: visible !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            background-color: #ffffff !important;
            color: #0f172a !important;
          }
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-size: 11px !important;
          }
          .print-canvas {
            margin: 0 !important;
            padding: 12mm 12mm 12mm 12mm !important;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            font-family: Georgia, 'Times New Roman', serif !important;
            font-size: 12px !important;
          }
          .print-canvas > * + * {
            margin-top: 1rem !important;
          }
          .page-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          h1, h2, h3, h4 {
            break-after: avoid !important;
            page-break-after: avoid !important;
          }
          .print-border-clean {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            border-radius: 4px !important;
          }
          .print-bg-slate {
            background-color: #f8fafc !important;
          }
          table {
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }
          .print-justify {
            text-align: justify !important;
          }
        }
      `}</style>

      {/* Screen Action Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 bg-white p-4 rounded-2xl shadow-lg border border-gray-200 print:hidden">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-700 hover:text-black font-extrabold text-xs uppercase tracking-wider bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl transition-all cursor-pointer self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4 text-gray-800" />
          <span>Volver al Listado</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-xs font-mono bg-slate-900 text-[#D9CF43] px-3.5 py-2 rounded-xl font-black border border-slate-700 shadow-inner">
            {filing.numeroRadicado}
          </span>

          <button
            onClick={() => setSigningRole(isRol2Contratista ? 'contratista' : 'interventoria')}
            className="flex items-center space-x-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-emerald-300 transition-all cursor-pointer shadow-sm"
            title={isRol2Contratista ? "Gestionar Firma Digital del Contratista" : "Gestionar Firma Digital de Interventoría"}
          >
            <PenTool className="w-4 h-4 text-emerald-800" />
            <span>
              {isRol2Contratista
                ? (filing.metadata.firmaContratista ? '✓ Firma Contratista' : 'Firmar Digitalmente')
                : (filing.metadata.firmaInterventoria ? '✓ Firma Revisor' : 'Firmar Digitalmente')
              }
            </span>
          </button>

          {isRol1Revisor && onEditEvaluation && (
            <button
              onClick={() => onEditEvaluation(filing)}
              className="flex items-center space-x-1.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl border border-amber-300 transition-all cursor-pointer"
              title="Realizar o Modificar la Evaluación del Expediente"
            >
              <Edit3 className="w-4 h-4 text-amber-800" />
              <span>Modificar Evaluación</span>
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 bg-[#1E222A] hover:bg-slate-800 text-[#D9CF43] font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
          >
            <Printer className="w-4 h-4 text-[#D9CF43]" />
            <span>Imprimir / PDF</span>
          </button>
        </div>
      </div>

      {/* Helper notice for PDF printing */}
      <div className="mb-6 bg-slate-100 border border-slate-300 text-slate-700 p-3 rounded-xl text-xs flex items-center space-x-2 print:hidden shadow-sm">
        <span className="font-extrabold text-slate-900 text-sm">💡 Tip de Impresión PDF:</span>
        <span>El informe se imprime con formato carta y sin las marcas del navegador (URL, fecha, páginas). En la ventana de impresión, selecciona <strong>"Guardar como PDF"</strong> y elige <strong>Letter</strong> como tamaño si no viene preseleccionado.</span>
      </div>

      {/* Main Corporate Report Canvas (Official Letterhead Format) */}
      <div 
        ref={printRef}
        className="print-canvas bg-white p-6 sm:p-10 shadow-2xl rounded-2xl border border-gray-200 text-slate-900 font-sans space-y-7 print:shadow-none print:border-none print:rounded-none"
      >
        {/* OFFICIAL INTECOAL LETTERHEAD HEADER */}
        <div className="border-b-2 border-slate-800 pb-5 space-y-4 page-break-avoid">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <IntecoalLogo size="82px" />
            </div>

            {/* Address & Contact Information from official letterhead */}
            <div className="text-left sm:text-right text-[11px] text-slate-700 space-y-0.5 font-sans leading-snug">
              <div className="font-black text-slate-900 text-xs uppercase tracking-wide">INTECOAL S.A.S.</div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Interventoría Técnica Especializada</div>
              <div className="flex items-center sm:justify-end space-x-1.5 pt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>Carrera. 33a #15-49 Conjunto Residencial El Oasis – Casa 23</span>
              </div>
              <div className="font-bold text-slate-900 pl-5 sm:pl-0">Villavicencio - Meta</div>
              <div className="flex items-center sm:justify-end space-x-3">
                <span className="flex items-center space-x-1">
                  <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                  <strong className="text-slate-800">310 355 6449</strong>
                </span>
                <span className="flex items-center space-x-1">
                  <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                  <strong className="text-slate-800">interventoriaapalborada@intecoalsas.com</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENT HEADER & FORMAL EXECUTIVE HEADING */}
        <div className="space-y-4 page-break-avoid">
          {/* CONTROL DE DOCUMENTO OFICIAL */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-700 border border-slate-300 rounded-lg px-3 py-2 bg-slate-50 page-break-avoid print-border-clean">
            <div className="space-y-0.5">
              <span className="block text-slate-500 text-[8px]">N° Radicado</span>
              <span className="font-black text-slate-900">{filing.numeroRadicado}</span>
            </div>
            <div className="space-y-0.5">
              <span className="block text-slate-500 text-[8px]">Versión</span>
              <span className="font-black text-slate-900">1.0</span>
            </div>
            <div className="space-y-0.5">
              <span className="block text-slate-500 text-[8px]">Referencia Radicado</span>
              <span className="font-black text-slate-900">{filing.numeroRadicado}</span>
            </div>
            <div className="space-y-0.5">
              <span className="block text-slate-500 text-[8px]">Fecha de Emisión</span>
              <span className="font-black text-slate-900">{formattedDate}</span>
            </div>
            <div className="space-y-0.5">
              <span className="block text-slate-500 text-[8px]">Clasificación</span>
              <span className="font-black text-slate-900">Público · Interventoría</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200 print-border-clean">
            <div className="space-y-1">
              <div><strong className="text-slate-900">CIUDAD Y FECHA:</strong> Villavicencio (Meta), {formattedDate}</div>
              <div><strong className="text-slate-900">OFICIO N°:</strong> INT-AP-2026-{filing.numeroRadicado}</div>
              <div><strong className="text-slate-900">DESTINATARIO:</strong> Empresa de Tecnología y Servicios ALBORADA E.I.C.E.</div>
              <div><strong className="text-slate-900">ATENCIÓN:</strong> Dirección Técnica / Supervisión de Alumbrado Público</div>
            </div>

            <div className="space-y-1">
              <div><strong className="text-slate-900">CONTRATISTA DE OBRA:</strong> {filing.metadata.contratista} {filing.metadata.nitContratista ? `(NIT: ${filing.metadata.nitContratista})` : ''}</div>
              <div><strong className="text-slate-900">PROYECTO:</strong> {filing.metadata.nombreProyecto}</div>
              <div><strong className="text-slate-900">N° RADICADO:</strong> {filing.numeroRadicado}</div>
              <div><strong className="text-slate-900">TIPO DE RADICACIÓN:</strong> {filing.metadata.tipoEntrega || 'Entrega Inicial de Proyecto'}</div>
            </div>
          </div>

          <div className="pt-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">
              SISTEMA INTEGRAL DE INTERVENTORÍA Y AUDITORÍA RETILAP / RETIE
            </span>
            <h1 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-tight mt-1 leading-snug">
              INFORME DE RECIBIDO A CONFORMIDAD Y DICTAMEN TÉCNICO DE INTERVENTORÍA
            </h1>
            <p className="text-xs text-slate-800 mt-1 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200 print-border-clean">
              <strong className="text-slate-900 uppercase font-black">ASUNTO:</strong> Evaluación técnica, fotométrica, eléctrica y documental para la certificación de recibido a conformidad del expediente de Alumbrado Público conforme a la Resolución 40150 de 2024 del Ministerio de Minas y Energía (RETILAP) y RETIE (Res. 90708).
            </p>
          </div>
        </div>

        {/* SECTION 1: DATOS GENERALES Y CONTRACTUALES */}
        <div className="space-y-3 page-break-avoid">
          <div className="flex items-center space-x-2 border-b-2 border-slate-900 pb-1.5">
            <Building2 className="w-4 h-4 text-slate-900" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              1. DATOS GENERALES Y CONTRACTUALES DEL EXPEDIENTE
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 print-border-clean">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Denominación Oficial del Proyecto de Alumbrado Público
              </span>
              <div className="text-sm font-black text-slate-900 leading-snug">
                {filing.metadata.nombreProyecto}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="bg-slate-900 text-[#D9CF43] text-[10px] font-mono font-bold px-2.5 py-0.5 rounded border border-slate-700">
                  Radicado: {filing.numeroRadicado}
                </span>
                <span className="bg-slate-100 text-slate-900 text-[10px] font-bold px-2.5 py-0.5 rounded border border-slate-300">
                  Ubicación: {filing.metadata.municipio} (Meta)
                </span>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 print-border-clean">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Empresa Contratista Ejecutora
              </span>
              <div className="text-xs font-black text-slate-900">{filing.metadata.contratista}</div>
              {filing.metadata.nitContratista && (
                <div className="text-[11px] font-bold text-slate-700">NIT: {filing.metadata.nitContratista}</div>
              )}
              <div className="text-[11px] text-slate-600">Director de Obra: <strong className="text-slate-900">{filing.metadata.responsable}</strong></div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 print-border-clean">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Entidad Interventora Especializada
              </span>
              <div className="text-xs font-black text-slate-900">INTECOAL S.A.S.</div>
              <div className="text-[11px] text-slate-600">Responsable de Revisión: <strong className="text-slate-900">{filing.metadata.responsableRevision || 'Responsable de Revisión'}</strong></div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 print-border-clean">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Trazabilidad Documental
              </span>
              <div className="text-xs font-black text-slate-900">Repositorio Documental (SharePoint)</div>
              <div className="text-[11px] text-slate-600 truncate">Ruta: <span className="font-mono text-[10px]">/Documentos_Radicacion/{filing.numeroRadicado}/</span></div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 print-border-clean">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Fechas del Trámite
              </span>
              <div className="text-[11px] text-slate-600">Radicación: <strong className="text-slate-900">{formattedDate}</strong></div>
              <div className="text-[11px] text-slate-600">Dictamen: <strong className="text-slate-900">{new Date().toLocaleDateString('es-CO')}</strong></div>
            </div>
          </div>
        </div>

        {/* SECTION 2: MARCO LEGAL Y FUNDAMENTO NORMATIVO */}
        <div className="space-y-2 page-break-avoid">
          <div className="flex items-center space-x-2 border-b-2 border-slate-900 pb-1.5">
            <BookOpen className="w-4 h-4 text-slate-900" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              2. MARCO LEGAL Y FUNDAMENTO REGULATORIO APLICABLE
            </h2>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-[11px] text-slate-700 leading-relaxed space-y-1.5 print-border-clean print-justify">
            <p>
              El presente informe técnico de interventoría se emite bajo el riguroso cumplimiento del marco legal colombiano vigente para infraestructura de iluminación pública:
            </p>
            <ul className="list-disc pl-5 space-y-0.5 text-slate-800">
              <li><strong>Resolución 40150 de 2024 (MINMINAS):</strong> Reglamento Técnico de Iluminación y Alumbrado Público (RETILAP), especificando eficiencia fotométrica, grado de protección y diseño.</li>
              <li><strong>Resolución 90708 / 40117 (RETIE):</strong> Reglamento Técnico de Instalaciones Eléctricas en redes de baja y media tensión.</li>
              <li><strong>Código Eléctrico Nacional NTC 2050:</strong> Especificaciones de canalización, protecciones y puesta a tierra.</li>
              <li><strong>Manuales y Guías Técnicas ALBORADA E.I.C.E.:</strong> Estándares de recepción y mantenimiento de activos de alumbrado público.</li>
            </ul>
          </div>
        </div>

        {/* SECTION 3: RESUMEN DE EVALUACIÓN Y SCORE */}
        <div className="space-y-3 page-break-avoid">
          <div className="flex items-center space-x-2 border-b-2 border-slate-900 pb-1.5">
            <ShieldCheck className="w-4 h-4 text-slate-900" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              3. MATRIZ RESUMEN DE EVALUACIÓN Y CONFORMIDAD RETILAP
            </h2>
          </div>

          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-3 print-border-clean">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  PORCENTAJE GENERAL DE CONFORMIDAD REGULATORIA
                </span>
                <div className="text-2xl font-black text-slate-900 flex items-baseline space-x-2 mt-0.5">
                  <span>{filing.porcentajeCumplimiento}%</span>
                  <span className="text-xs font-bold text-slate-600">DOCUMENTACIÓN VÁLIDA</span>
                </div>
              </div>

              <div className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-center border ${
                isApproved 
                  ? 'bg-emerald-100 border-emerald-400 text-emerald-950' 
                  : 'bg-amber-100 border-amber-400 text-amber-950'
              }`}>
                {isApproved ? (
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>DICTAMEN: APROBADO A CONFORMIDAD</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-800 shrink-0" />
                    <span>DICTAMEN: CON OBSERVACIONES PENDIENTES</span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center">
              <div className="bg-white border border-slate-200 rounded-lg p-2">
                <span className="text-lg font-black block text-slate-900">21</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase">REQUISITOS TOTALES</span>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                <span className="text-lg font-black block text-emerald-800">{cumpleCount}</span>
                <span className="text-[9px] font-bold text-emerald-800 uppercase flex items-center justify-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>CUMPLE</span>
                </span>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                <span className="text-lg font-black block text-amber-800">{pendienteCount}</span>
                <span className="text-[9px] font-bold text-amber-800 uppercase flex items-center justify-center space-x-1">
                  <Clock className="w-3 h-3" />
                  <span>PENDIENTES</span>
                </span>
              </div>

              <div className="bg-slate-100 border border-slate-200 rounded-lg p-2">
                <span className="text-lg font-black block text-slate-700">{naCount}</span>
                <span className="text-[9px] font-bold text-slate-600 uppercase">NO APLICA</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: AUDITORÍA DOCUMENTAL Y CHECKLIST EXHAUSTIVO (21 REQUISITOS NORMATIVOS) */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2 border-b-2 border-slate-900 pb-1.5">
            <FileCheck2 className="w-4 h-4 text-slate-900" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              4. AUDITORÍA DOCUMENTAL Y CHECKLIST EXHAUSTIVO (21 REQUISITOS NORMATIVOS)
            </h2>
          </div>

          <div className="space-y-4">
            {categories.map((cat) => {
              const catCumple = cat.docs.filter(d => getDocStatus(d.id) === 'CUMPLE').length;
              const catTotal = cat.docs.length;

              return (
                <div key={cat.id} className="border border-slate-300 rounded-xl overflow-hidden page-break-avoid print-border-clean">
                  <div className="bg-slate-900 text-white px-3.5 py-2 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-black uppercase tracking-wider text-white">
                        {cat.title}
                      </h3>
                      <p className="text-[10px] text-slate-300">{cat.retilapRef}</p>
                    </div>

                    <div className="text-[10px] font-mono font-bold bg-[#D9CF43] text-slate-900 px-2.5 py-0.5 rounded shrink-0">
                      Válidos: {catCumple} / {catTotal}
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 bg-white">
                    {cat.docs.map(doc => {
                      const st = getDocStatus(doc.id);
                      const notes = getDocNotes(doc.id);
                      const fileName = getDocFileName(doc.id);

                      return (
                        <div key={doc.id} className="p-3 text-xs space-y-1">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                            <div className="space-y-1">
                              <div className="flex items-start space-x-2">
                                <span className="text-[10px] font-bold font-mono text-slate-900 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded shrink-0">
                                  {doc.code}
                                </span>
                                <div>
                                  <h4 className="font-bold text-slate-900 leading-snug">
                                    {doc.name}
                                  </h4>
                                  <p className="text-[11px] text-slate-500">{doc.description}</p>
                                </div>
                              </div>

                              {fileName && (
                                <div className="pl-8 text-[10px] font-mono text-slate-600 flex items-center space-x-1">
                                  <FileText className="w-3 h-3 text-slate-500 shrink-0" />
                                  <span>Archivo Aportado: <strong>{fileName}</strong></span>
                                </div>
                              )}
                            </div>

                            <div className="shrink-0 self-start">
                              {st === 'CUMPLE' && (
                                <span className="inline-flex items-center space-x-1 bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-0.5 rounded">
                                  <Check className="w-3 h-3" />
                                  <span>CUMPLE</span>
                                </span>
                              )}
                              {st === 'PENDIENTE' && (
                                <span className="inline-flex items-center space-x-1 bg-amber-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded">
                                  <Clock className="w-3 h-3" />
                                  <span>PENDIENTE</span>
                                </span>
                              )}
                              {st === 'NO CUMPLE' && (
                                <span className="inline-flex items-center space-x-1 bg-red-700 text-white font-bold text-[10px] px-2.5 py-0.5 rounded">
                                  <XCircle className="w-3 h-3" />
                                  <span>NO CUMPLE</span>
                                </span>
                              )}
                              {st === 'N/A' && (
                                <span className="inline-flex items-center space-x-1 bg-slate-400 text-white font-bold text-[10px] px-2 py-0.5 rounded">
                                  <span>N/A</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {notes && notes !== '—' && (
                            <div className="ml-8 bg-slate-50 p-2 rounded border border-slate-200 text-[11px] text-slate-700 mt-1">
                              <strong className="text-slate-900">Anotación de Interventoría:</strong> {notes}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 5: INVENTARIO DE ELEMENTOS Y MATERIALES ENTREGADOS */}
        {filing.elementosEntregados && filing.elementosEntregados.length > 0 && (
          <div className="space-y-3 page-break-avoid">
            <div className="flex items-center space-x-2 border-b-2 border-slate-900 pb-1.5">
              <Layers className="w-4 h-4 text-slate-900" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
                5. INVENTARIO FÍSICO DE MATERIALES Y EQUIPOS ENTREGADOS EN CAMPO
              </h2>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden print-border-clean">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-900 font-black uppercase text-[10px] border-b border-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">Ítem</th>
                    <th className="py-2.5 px-3">Elemento / Equipo de Alumbrado</th>
                    <th className="py-2.5 px-3">Especificación Técnica Certificada</th>
                    <th className="py-2.5 px-3 text-right">Cantidad</th>
                    <th className="py-2.5 px-3 text-center">Estado RETILAP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filing.elementosEntregados.map((elem, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-slate-500">#{idx + 1}</td>
                      <td className="py-2 px-3 font-bold text-slate-900">{elem.elemento}</td>
                      <td className="py-2 px-3 text-slate-600">{elem.especificacion || 'Según ficha técnica aprobada'}</td>
                      <td className="py-2 px-3 font-mono font-black text-right text-slate-900">{elem.cantidad}</td>
                      <td className="py-2 px-3 text-center"><span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">VERIFICADO</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 6: DICTAMEN FINAL Y OBSERVACIONES GENERALES */}
        <div className="space-y-2 page-break-avoid">
          <div className="flex items-center space-x-2 border-b-2 border-slate-900 pb-1.5">
            <Award className="w-4 h-4 text-slate-900" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900">
              6. CONCEPTO TÉCNICO DE INTERVENTORÍA Y DICTAMEN DE CONFORMIDAD
            </h2>
          </div>

          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 text-xs text-slate-800 font-medium leading-relaxed space-y-2 print-border-clean print-justify">
            <p className="font-semibold text-slate-900">
              {filing.observacionesGenerales || 'En calidad de Interventoría Técnica Especializada INTECOAL S.A.S., previa revisión minuciosa del expediente digital radicado, se emite el presente dictamen técnico de conformidad.'}
            </p>
            <p className="text-[11px] text-slate-600">
              El contratista emisor declara bajo la gravedad del juramento que la información técnica y los planos as-built aportados corresponden a la obra físicamente instalada. Toda modificación futura o ampliación deberá contar con la previa autorización de la Interventoría y ALBORADA E.I.C.E.
            </p>
          </div>
        </div>

        {/* SECTION 7: FIRMAS OFICIALES, HASH Y CÓDIGO QR */}
        <div className="pt-6 border-t-2 border-slate-900 space-y-6 page-break-avoid">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
            {/* Signature Box 1: Interventoría INTECOAL SAS (Exclusiva Rol 1: Revisor / Interventor) */}
            <div className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 print-border-clean transition-all ${isRol1Revisor ? 'bg-slate-50 border-slate-300' : 'bg-slate-100/70 border-slate-200'}`}>
              <div className="space-y-0.5 text-center border-b border-slate-200 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">ENTIDAD REVISORA Y AUTORIZADORA</span>
                <span className="font-black text-slate-900 text-sm block">INTECOAL S.A.S.</span>
                <span className="text-[10px] text-slate-600 font-semibold block">Interventoría Alumbrado Público</span>
              </div>

              {/* Signature Display Container */}
              <div className="my-1 text-center min-h-[85px] flex flex-col items-center justify-center">
                {filing.metadata.firmaInterventoria ? (
                  <div className="space-y-1.5 w-full">
                    <img
                      src={filing.metadata.firmaInterventoria.dataUrl}
                      alt="Firma Interventoría"
                      className="max-h-20 mx-auto object-contain"
                    />
                    <div className="pt-1 border-t border-slate-300 w-4/5 mx-auto text-center space-y-1">
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>FIRMADO DIGITALMENTE</span>
                      </span>
                      <p className="text-[9px] font-mono text-slate-600 block truncate">
                        HASH: {filing.metadata.firmaInterventoria.hashVerificacion}
                      </p>
                      {filing.metadata.firmaInterventoria.tarjetaProfesional && (
                        <p className="text-[9px] font-bold text-slate-800 block">
                          T.P.: {filing.metadata.firmaInterventoria.tarjetaProfesional}
                        </p>
                      )}

                      {/* Control de Edición/Creación/Subida por Rol 1 */}
                      {isRol1Revisor && (
                        <div className="print:hidden pt-1 flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSigningRole('interventoria')}
                            className="bg-slate-900 hover:bg-slate-800 text-[#D9CF43] font-bold text-[9px] px-2.5 py-1 rounded shadow transition-all inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar / Cambiar Firma</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSignature('interventoria')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[9px] px-2 py-1 rounded border border-rose-200 transition-all inline-flex items-center space-x-1 cursor-pointer"
                            title="Eliminar Firma de Revisor"
                          >
                            <span>Eliminar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {isRol1Revisor ? (
                      <div className="print:hidden py-3 space-y-1.5 border-2 border-dashed border-slate-300 rounded-xl w-full bg-white/60 p-2 text-center">
                        <PenTool className="w-4 h-4 text-slate-400 mx-auto" />
                        <span className="text-[10px] font-extrabold text-slate-600 block">Firma Digital Interventoría Pendiente</span>
                        <button
                          type="button"
                          onClick={() => setSigningRole('interventoria')}
                          className="bg-slate-900 hover:bg-slate-800 text-[#D9CF43] font-black text-[10px] px-3 py-1.5 rounded-lg shadow transition-all inline-flex items-center space-x-1 cursor-pointer scale-105"
                        >
                          <PenTool className="w-3 h-3" />
                          <span>Crear / Subir Firma Digital</span>
                        </button>
                      </div>
                    ) : (
                      <div className="print:hidden py-3 space-y-1 border border-slate-200 rounded-xl w-full bg-slate-50/70 p-2 text-center">
                        <PenTool className="w-4 h-4 text-slate-400 mx-auto" />
                        <span className="text-[10px] font-bold text-slate-500 block">Firma de Interventoría Pendiente</span>
                      </div>
                    )}

                    <div className="hidden print:block w-full text-center py-5">
                      <div className="border-b-2 border-slate-800 w-48 mx-auto mb-1"></div>
                      <span className="text-[9px] font-bold text-slate-600 uppercase">Firma Autógrafa / Responsable de Revisión</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-1 border-t border-slate-200">
                <p className="font-extrabold text-slate-900 text-xs">
                  {filing.metadata.firmaInterventoria?.nombreSignatario || filing.metadata.responsableRevision || 'Responsable de Revisión'}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  {filing.metadata.firmaInterventoria?.cargo || 'Responsable de Revisión'}
                </p>
              </div>
            </div>

            {/* Signature Box 2: Contratista (Exclusiva Rol 2: Contratista / Operador) */}
            <div className={`border rounded-xl p-4 flex flex-col justify-between space-y-3 print-border-clean transition-all ${isRol2Contratista ? 'bg-slate-50 border-slate-300' : 'bg-slate-100/70 border-slate-200'}`}>
              <div className="space-y-0.5 text-center border-b border-slate-200 pb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">CONTRATISTA EMISOR DEL EXPEDIENTE</span>
                <span className="font-black text-slate-900 text-sm block">{filing.metadata.contratista}</span>
              </div>

              {/* Signature Display Container */}
              <div className="my-1 text-center min-h-[85px] flex flex-col items-center justify-center">
                {filing.metadata.firmaContratista ? (
                  <div className="space-y-1.5 w-full">
                    <img
                      src={filing.metadata.firmaContratista.dataUrl}
                      alt="Firma Contratista"
                      className="max-h-20 mx-auto object-contain"
                    />
                    <div className="pt-1 border-t border-slate-300 w-4/5 mx-auto text-center space-y-1">
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>FIRMADO DIGITALMENTE</span>
                      </span>
                      <p className="text-[9px] font-mono text-slate-600 block truncate">
                        HASH: {filing.metadata.firmaContratista.hashVerificacion}
                      </p>
                      {filing.metadata.firmaContratista.tarjetaProfesional && (
                        <p className="text-[9px] font-bold text-slate-800 block">
                          T.P.: {filing.metadata.firmaContratista.tarjetaProfesional}
                        </p>
                      )}

                      {/* Control de Edición/Creación/Subida por Rol 2 */}
                      {isRol2Contratista && (
                        <div className="print:hidden pt-1 flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSigningRole('contratista')}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[9px] px-2.5 py-1 rounded shadow transition-all inline-flex items-center space-x-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar / Cambiar Firma</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSignature('contratista')}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[9px] px-2 py-1 rounded border border-rose-200 transition-all inline-flex items-center space-x-1 cursor-pointer"
                            title="Eliminar Firma del Contratista"
                          >
                            <span>Eliminar</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <>
                    {isRol2Contratista ? (
                      <div className="print:hidden py-3 space-y-1.5 border-2 border-dashed border-slate-300 rounded-xl w-full bg-white/60 p-2 text-center">
                        <PenTool className="w-4 h-4 text-slate-400 mx-auto" />
                        <span className="text-[10px] font-extrabold text-slate-600 block">Firma Digital Contratista Pendiente</span>
                        <button
                          type="button"
                          onClick={() => setSigningRole('contratista')}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-black text-[10px] px-3 py-1.5 rounded-lg shadow transition-all inline-flex items-center space-x-1 cursor-pointer scale-105"
                        >
                          <PenTool className="w-3 h-3" />
                          <span>Crear / Subir Firma Digital</span>
                        </button>
                      </div>
                    ) : (
                      <div className="print:hidden py-3 space-y-1 border border-slate-200 rounded-xl w-full bg-slate-50/70 p-2 text-center">
                        <PenTool className="w-4 h-4 text-slate-400 mx-auto" />
                        <span className="text-[10px] font-bold text-slate-500 block">Firma del Contratista Pendiente</span>
                      </div>
                    )}

                    <div className="hidden print:block w-full text-center py-5">
                      <div className="border-b-2 border-slate-800 w-48 mx-auto mb-1"></div>
                      <span className="text-[9px] font-bold text-slate-600 uppercase">Firma Autógrafa / Representante Contratista</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-1 border-t border-slate-200">
                <p className="font-extrabold text-slate-900 text-xs">
                  {filing.metadata.firmaContratista?.nombreSignatario || filing.metadata.responsable}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase">
                  {filing.metadata.firmaContratista?.cargo || 'Representante Técnico Contratista'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* OFFICIAL INTECOAL LETTERHEAD FOOTER */}
        <div className="pt-6 page-break-avoid">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200 pt-3">
            {/* Geometric Yellow and Dark Gray Ribbon Strip matching official letterhead */}
            <div className="flex items-center w-full sm:w-auto">
              <div className="h-4 bg-[#D9CF43] w-28 sm:w-36 transform -skew-x-12 -ml-2 rounded-sm shadow-sm"></div>
              <div className="h-4 bg-[#383b42] w-10 sm:w-12 transform -skew-x-12 -ml-2 rounded-sm shadow-sm"></div>
            </div>

            {/* Center Official Web Domain */}
            <div className="text-center font-bold text-xs text-slate-800 font-mono tracking-wide">
              www.<span className="text-slate-900 font-extrabold">Intecoalsas</span>.com
            </div>

            {/* Right Entity Information */}
            <div className="text-right flex items-center space-x-2">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-slate-900 tracking-tight leading-none uppercase">
                  INTECOAL S.A.S.
                </span>
                <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                  Interventoría Técnica de Alumbrado Público
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {signingRole && (
        <FirmaDigitalModal
          role={signingRole}
          defaultName={
            signingRole === 'interventoria'
              ? (currentUser?.role === 'interventor' ? currentUser?.name : filing.metadata.responsableRevision) || filing.metadata.responsableRevision || 'Responsable de Revisión'
              : (currentUser?.role === 'contratista' ? currentUser?.name : filing.metadata.responsable) || filing.metadata.responsable || 'Director de Obra'
          }
          defaultRole={
            signingRole === 'interventoria'
              ? 'Responsable de Revisión (INTECOAL S.A.S.)'
              : 'Representante Técnico Contratista'
          }
          initialSignature={
            signingRole === 'interventoria'
              ? filing.metadata.firmaInterventoria
              : filing.metadata.firmaContratista
          }
          onSaveSignature={(sig) => handleSaveSignature(signingRole, sig)}
          onRemoveSignature={() => handleRemoveSignature(signingRole)}
          onClose={() => setSigningRole(null)}
        />
      )}
    </div>
  );
};
