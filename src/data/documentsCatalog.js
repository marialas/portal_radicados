export const DOCUMENT_CATALOG = [
  // 1. Documentos de Diseño
  {
    id: 1,
    code: 'A1',
    name: 'Diseño fotométrico aprobado',
    category: 'diseno',
    categoryName: 'Documentos de Diseño',
    required: true,
    folderGroup: 'A_Tecnicos',
    description: 'Estudio y simulación de niveles de iluminancia y uniformidad según RETILAP.'
  },
  {
    id: 2,
    code: 'A2',
    name: 'Cédula de ciudadanía del diseñador',
    category: 'diseno',
    categoryName: 'Documentos de Diseño',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Copia legible de la cédula del ingeniero diseñador responsable.'
  },
  {
    id: 3,
    code: 'A3',
    name: 'Tarjeta profesional del diseñador',
    category: 'diseno',
    categoryName: 'Documentos de Diseño',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Matrícula o tarjeta profesional vigente expedida por la autoridad competente (COPNIA).'
  },
  {
    id: 4,
    code: 'A4',
    name: 'Diploma RETILAP del diseñador',
    category: 'diseno',
    categoryName: 'Documentos de Diseño',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Acreditación académica en diplomado o capacitación sobre norma RETILAP.'
  },
  {
    id: 5,
    code: 'A5',
    name: 'Plano Asbuilt georreferenciado y firmado',
    category: 'diseno',
    categoryName: 'Documentos de Diseño',
    required: true,
    folderGroup: 'A_Tecnicos',
    description: 'Planos finales de construcción en coordenadas reales firmados por diseñador y constructor.'
  },
  {
    id: 6,
    code: 'A6',
    name: 'Memoria descriptiva del proyecto',
    category: 'diseno',
    categoryName: 'Documentos de Diseño',
    required: true,
    folderGroup: 'A_Tecnicos',
    description: 'Documento técnico con detalles constructivos, cálculos eléctricos y alcance técnico.'
  },
  {
    id: 7,
    code: 'A7',
    name: 'Declaración de cumplimiento RETILAP del diseñador',
    category: 'diseno',
    categoryName: 'Documentos de Diseño',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Formato oficial de declaración firmada por el diseñador eléctrico.'
  },

  // 2. Luminarias y Materiales
  {
    id: 8,
    code: 'B8',
    name: 'Carta de garantía de luminarias',
    category: 'luminarias',
    categoryName: 'Luminarias y Materiales',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Garantía del fabricante por vida útil, fotometría y hermeticidad de luminarias.'
  },
  {
    id: 9,
    code: 'B9',
    name: 'Certificado de producto — Cable',
    category: 'luminarias',
    categoryName: 'Luminarias y Materiales',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Certificado de conformidad RETIE/RETILAP de los conductores eléctricos.'
  },
  {
    id: 10,
    code: 'B10',
    name: 'Certificado de producto — Fotocelda',
    category: 'luminarias',
    categoryName: 'Luminarias y Materiales',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Certificado RETILAP del elemento de control fotoeléctrico.'
  },
  {
    id: 11,
    code: 'B11',
    name: 'Certificado de producto — Brazo',
    category: 'luminarias',
    categoryName: 'Luminarias y Materiales',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Certificación mecánica y anticorrosiva de los soportes metálicos.'
  },
  {
    id: 12,
    code: 'B12',
    name: 'Certificado de producto — Herrajes',
    category: 'luminarias',
    categoryName: 'Luminarias y Materiales',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Certificados de conformidad de herrajes y accesorios de fijación.'
  },
  {
    id: 13,
    code: 'B13',
    name: 'Certificado de producto — Conectores',
    category: 'luminarias',
    categoryName: 'Luminarias y Materiales',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Certificados de conectores estancos y ponchados.'
  },
  {
    id: 14,
    code: 'B14',
    name: 'Certificado de producto — Postes',
    category: 'luminarias',
    categoryName: 'Luminarias y Materiales',
    required: false,
    folderGroup: 'B_Certificaciones',
    description: 'Certificación de postes de concreto o metálicos (si aplica en el alcance).'
  },

  // 3. Documentos del Constructor
  {
    id: 15,
    code: 'C15',
    name: 'Cédula de ciudadanía del constructor',
    category: 'constructor',
    categoryName: 'Documentos del Constructor',
    required: true,
    folderGroup: 'C_Contractuales',
    description: 'Documento de identidad del ingeniero residente o director de obra.'
  },
  {
    id: 16,
    code: 'C16',
    name: 'Matrícula profesional del constructor',
    category: 'constructor',
    categoryName: 'Documentos del Constructor',
    required: true,
    folderGroup: 'C_Contractuales',
    description: 'Matrícula profesional de la persona a cargo del montaje e instalación.'
  },
  {
    id: 17,
    code: 'C17',
    name: 'Diploma RETILAP del constructor',
    category: 'constructor',
    categoryName: 'Documentos del Constructor',
    required: true,
    folderGroup: 'C_Contractuales',
    description: 'Certificado de capacitación RETILAP del responsable de construcción.'
  },
  {
    id: 18,
    code: 'C18',
    name: 'Declaración de cumplimiento RETIE y RETILAP del constructor',
    category: 'constructor',
    categoryName: 'Documentos del Constructor',
    required: true,
    folderGroup: 'B_Certificaciones',
    description: 'Formato de declaración juramentada de la correcta ejecución de la obra.'
  },

  // 4. Dictámenes y Permisos
  {
    id: 19,
    code: 'D19',
    name: 'Dictamen RETIE (si aplica)',
    category: 'dictamenes',
    categoryName: 'Dictámenes y Permisos',
    required: false,
    folderGroup: 'D_Inventario',
    description: 'Dictamen de inspección de organismo acreditado ONAC (si el tipo de obra lo exige).'
  },
  {
    id: 20,
    code: 'D20',
    name: 'Dictamen RETILAP (si aplica)',
    category: 'dictamenes',
    categoryName: 'Dictámenes y Permisos',
    required: false,
    folderGroup: 'D_Inventario',
    description: 'Dictamen final de inspección de alumbrado público por organismo de tercera parte.'
  },
  {
    id: 21,
    code: 'D21',
    name: 'Recibo de vías por parte del Municipio',
    category: 'dictamenes',
    categoryName: 'Dictámenes y Permisos',
    required: false,
    folderGroup: 'E_SST_Ambiental',
    description: 'Paz y salvo o recibo oficial de intervención de espacio público emitido por la alcaldía.'
  }
];

export const INITIAL_SEED_FILINGS = [
  {
    id: 'rad-001',
    numeroRadicado: 'RAD-2026-001',
    creadorEmail: 'jcastro@electroingenieria.com.co',
    metadata: {
      codigoProyecto: 'INT-2026-045',
      nombreProyecto: 'MODERNIZACION ETAPA 1 FASE 1 - FASE 2',
      municipio: 'CALIMA-DARIEN',
      contratista: 'ELECTROINGENIERIA',
      nitContratista: '891903664',
      responsableRevision: 'John Fredy Castro',
      responsable: 'John Fredy Castro',
      correoResponsable: 'jcastro@electroingenieria.com.co',
      creadorEmail: 'jcastro@electroingenieria.com.co',
      tipoEntrega: 'Inicial',
      fechaEntrega: '2026-03-12',
      observaciones: 'Radicación completa correspondiente a la primera fase de reposición de luminarias led.'
    },
    estado: 'Aprobado',
    documentosOk: 17,
    fechaRadicacion: '2026-03-12T10:45:00-05:00',
    rutaOneDrive: 'https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP',
    porcentajeCumplimiento: 100,
    elementosEntregados: [
      { id: 1, elemento: 'Luminarias', cantidad: 75, especificacion: 'Referencia: LED-100W / Potencia: 100 W' },
      { id: 2, elemento: 'Brazos', cantidad: 75, especificacion: 'Galvanizado en caliente 1.5 pulgadas' },
      { id: 3, elemento: 'Fotoceldas', cantidad: 75, especificacion: 'Fotocelda electrónica 105-305V ANSI C136.10' }
    ],
    observacionesGenerales: 'Todos los documentos aplicables (17/17) fueron entregados a conformidad.',
    archivos: DOCUMENT_CATALOG.map(doc => {
      const isNA = [14, 19, 20, 21].includes(doc.id);
      return {
        docId: doc.id,
        docCode: doc.code,
        docName: doc.name,
        fileName: isNA ? 'N/A' : `${doc.code}_${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        fileSize: isNA ? 0 : Math.floor(Math.random() * 2000000) + 400000,
        fileType: 'application/pdf',
        uploadDate: '2026-03-12',
        status: isNA ? 'N/A' : 'CUMPLE',
        folderPath: `/Documentos_Radicacion/INT-2026-045/${doc.folderGroup}/${doc.code}_${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        notes: isNA ? 'No aplica según el alcance inicial del contrato' : 'Documento validado'
      };
    })
  },
  {
    id: 'rad-002',
    numeroRadicado: 'RAD-2026-002',
    creadorEmail: 'mrestrepo@ingenieria-energia.co',
    metadata: {
      codigoProyecto: 'INT-2026-046',
      nombreProyecto: 'EXPANSION RED ALUMBRADO SECTOR CAMPESTRE',
      municipio: 'YUMBO',
      contratista: 'INGENIERIA Y ENERGIA S.A.S.',
      nitContratista: '900458123',
      responsableRevision: 'Carlos Eduardo Ramírez',
      responsable: 'María Fernanda Restrepo',
      correoResponsable: 'mrestrepo@ingenieria-energia.co',
      creadorEmail: 'mrestrepo@ingenieria-energia.co',
      tipoEntrega: 'Subsanación',
      fechaEntrega: '2026-06-18',
      observaciones: 'Entrega de documentos de subsanación para memorias de cálculo y licencias.'
    },
    estado: 'Con Observaciones',
    documentosOk: 15,
    fechaRadicacion: '2026-06-18T14:20:00-05:00',
    rutaOneDrive: 'https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP',
    porcentajeCumplimiento: 88,
    elementosEntregados: [
      { id: 1, elemento: 'Luminarias', cantidad: 42, especificacion: 'LED 120W 5000K' },
      { id: 2, elemento: 'Postes', cantidad: 20, especificacion: 'Concreto 12 metros 510kg' }
    ],
    observacionesGenerales: 'Pendiente adjuntar tarjeta profesional actualizada del constructor.',
    archivos: DOCUMENT_CATALOG.map(doc => {
      const isMissing = doc.id === 16;
      const isNA = [19, 20].includes(doc.id);
      return {
        docId: doc.id,
        docCode: doc.code,
        docName: doc.name,
        fileName: isMissing ? '' : isNA ? 'N/A' : `${doc.code}_${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        fileSize: isMissing || isNA ? 0 : 850000,
        fileType: 'application/pdf',
        uploadDate: isMissing ? '' : '2026-06-18',
        status: isMissing ? 'PENDIENTE' : isNA ? 'N/A' : 'CUMPLE',
        folderPath: isMissing ? '' : `/Documentos_Radicacion/INT-2026-046/${doc.folderGroup}/${doc.code}_doc.pdf`,
        notes: isMissing ? 'Se requiere renovar vigencia de tarjeta COPNIA' : ''
      };
    })
  },
  {
    id: 'rad-003',
    numeroRadicado: 'RAD-2026-003',
    creadorEmail: 'anyeli_cabezas@soy.sena.edu.co',
    metadata: {
      codigoProyecto: 'INT-2026-088',
      nombreProyecto: 'OPTIMIZACION ILUMINACION AVENIDA PRINCIPAL Y PARQUES',
      municipio: 'BUGA',
      contratista: 'CONSORCIO ALUMBRADO SENA',
      nitContratista: '901234567',
      responsableRevision: 'John Fredy Castro',
      responsable: 'Anyeli Cabezas',
      correoResponsable: 'anyeli_cabezas@soy.sena.edu.co',
      creadorEmail: 'anyeli_cabezas@soy.sena.edu.co',
      tipoEntrega: 'Inicial',
      fechaEntrega: '2026-07-20',
      observaciones: 'Expediente técnico inicial con cumplimiento RETILAP cargado por Anyeli Cabezas.'
    },
    estado: 'Radicado',
    documentosOk: 18,
    fechaRadicacion: '2026-07-20T09:15:00-05:00',
    rutaOneDrive: 'https://interventoriayconsultoriaal.sharepoint.com/sites/VerificacinRETILAP',
    porcentajeCumplimiento: 92,
    elementosEntregados: [
      { id: 1, elemento: 'Luminarias', cantidad: 60, especificacion: 'Luminaria LED 150W 5000K IK08' },
      { id: 2, elemento: 'Brazos', cantidad: 60, especificacion: 'Brazo curvo 2 pulgadas x 2.0m' }
    ],
    observacionesGenerales: 'Expediente radicado correctamente. En proceso de verificación técnica.',
    archivos: DOCUMENT_CATALOG.map(doc => {
      const isNA = [19, 20].includes(doc.id);
      return {
        docId: doc.id,
        docCode: doc.code,
        docName: doc.name,
        fileName: isNA ? 'N/A' : `${doc.code}_${doc.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        fileSize: isNA ? 0 : 920000,
        fileType: 'application/pdf',
        uploadDate: '2026-07-20',
        status: isNA ? 'N/A' : 'CUMPLE',
        folderPath: `/Documentos_Radicacion/INT-2026-088/${doc.folderGroup}/${doc.code}_doc.pdf`,
        notes: isNA ? 'No aplica para esta fase' : 'Documento cargado conforme'
      };
    })
  }
];
