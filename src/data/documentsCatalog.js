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

export const INITIAL_SEED_FILINGS = [];
