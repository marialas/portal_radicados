const DOCUMENT_CATALOG = [
  { id: 1, code: "A1", name: "Planos de Alumbrado Público As-Built", description: "Planos definitivos de la instalación eléctrica y luminarias según construido en formato CAD/PDF.", folderGroup: "A_Tecnicos", required: true },
  { id: 2, code: "A2", name: "Memorias de Cálculo Fotométrico", description: "Simulaciones Dialux/Relux comprobando niveles de lux e uniformidad RETILAP.", folderGroup: "A_Tecnicos", required: true },
  { id: 3, code: "A3", name: "Memorias de Cálculo Eléctrico", description: "Cálculos de caída de tensión, regulación y capacidad de conductores.", folderGroup: "A_Tecnicos", required: true },
  { id: 4, code: "A4", name: "Cálculos de Puesta a Tierra y Apantallamiento", description: "Medición de resistividad de terreno y diseño del sistema de puesta a tierra (SPT).", folderGroup: "A_Tecnicos", required: true },
  { id: 5, code: "A5", name: "Diagrama Unifilar y Cuadro de Cargas", description: "Esquema eléctrico unifilar de tableros de control y circuitos.", folderGroup: "A_Tecnicos", required: true },
  { id: 6, code: "A6", name: "Especificaciones Técnicas de Equipos", description: "Fichas técnicas de luminarias LED, fotoceldas, postes, brazos y cables.", folderGroup: "A_Tecnicos", required: true },
  { id: 7, code: "A7", name: "Certificado RETILAP del Diseñador", description: "Matrícula profesional y certificado de competencia del ingeniero diseñador.", folderGroup: "A_Tecnicos", required: true },
  
  { id: 8, code: "B8", name: "Certificados de Producto RETILAP (Luminarias)", description: "Certificado de conformidad de producto expedido por organismo acreditado (ONAC).", folderGroup: "B_Certificaciones", required: true },
  { id: 9, code: "B9", name: "Certificados de Producto RETIE (Postes, Cables, Protecciones)", description: "Certificados RETIE de transformación, protecciones y soportes.", folderGroup: "B_Certificaciones", required: true },
  { id: 10, code: "B10", name: "Garantías de Fábrica (Luminarias >= 10 Años)", description: "Documento de garantía expedido por fabricante con vigencia exigida.", folderGroup: "B_Certificaciones", required: true },
  { id: 11, code: "B11", name: "Protocolos de Ensayos de Laboratorio", description: "Pruebas de hermeticidad IP, impacto IK y fotometría de laboratorio.", folderGroup: "B_Certificaciones", required: true },
  { id: 12, code: "B12", name: "Certificado de Inspección de Primera Parte", description: "Dictamen previo firmado por el director de obra del contratista.", folderGroup: "B_Certificaciones", required: false },

  { id: 13, code: "C13", name: "Actas de Inicio y Modificatorios Contractuales", description: "Copia del acta de inicio y sus extensiones o adicionales legalizados.", folderGroup: "C_Contractuales", required: true },
  { id: 14, code: "C14", name: "Poliza de Cumplimiento y Calidad de Bienes", description: "Pólizas vigentes con aprobación de la entidad contratante.", folderGroup: "C_Contractuales", required: true },
  { id: 15, code: "C15", name: "PAGO de Seguridad Social y Parafiscales", description: "Paz y salvo del revisor fiscal o contador sobre aportes al sistema.", folderGroup: "C_Contractuales", required: true },
  { id: 16, code: "C16", name: "Certificado de Cámara de Comercio y RUT", description: "Documentación legal del contratista con vigencia inferior a 30 días.", folderGroup: "C_Contractuales", required: true },

  { id: 17, code: "D17", name: "Inventario Georreferenciado en Excel/GIS", description: "Formato estandarizado INTECOAL con coordenadas GPS de cada punto.", folderGroup: "D_Inventario", required: true },
  { id: 18, code: "D18", name: "Registro Fotográfico de Puntos Instalados", description: "Fotografías antes/después de luminarias, transformadores y medidores.", folderGroup: "D_Inventario", required: true },
  { id: 19, code: "D19", name: "Acta de Recibo Físico de Elementos", description: "Acta de entrega en bodega o sitio firmada por la supervisión.", folderGroup: "D_Inventario", required: true },

  { id: 20, code: "E20", name: "Plan de Manejo Ambiental y Gestión de Residuos", description: "Disposición final de luminarias retiradas (Sodio/Mercurio) con gestor autorizado.", folderGroup: "E_SST_Ambiental", required: true },
  { id: 21, code: "E21", name: "Bitácora de Obra y Registro de Novedades SST", description: "Copia de la bitácora de obra con firmas de la residencia e interventoría.", folderGroup: "E_SST_Ambiental", required: true }
];
