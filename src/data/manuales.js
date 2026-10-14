/**
 * Manual de Usuario por rol, en palabras sencillas.
 * Versión del manual: 1.0 — Octubre 2026.
 */

export const MANUAL_META = {
  titulo: 'Manual de Usuario',
  producto: 'Portal de Radicación INTECOAL S.A.S.',
  version: '1.0',
  soporteCorreo: 'interventoriaapalborada@intecoalsas.com',
  soporteTelefono: '310 355 6449 / (602) 224 8763',
};

export const MANUAL_COMUN = {
  objetivo: [
    'Le enseña a usar el portal paso a paso, sin saber de sistemas.',
    'Aquí solo se explica el portal. Las normas técnicas se las da su ingeniero.',
  ],
  requisitos: [
    'Un computador con internet.',
    'Navegador Chrome o Edge actualizado.',
    'Su correo de Microsoft (si usa Gmail, regístrelo gratis como cuenta Microsoft).',
    'Sus documentos en PDF, foto o plano (cada uno de máximo 50 MB).',
  ],
  glosario: [
    ['Radicado', 'Su expediente subido al portal. Recibe un número único.'],
    ['N/A', 'Casilla para lo que no aplica a su proyecto.'],
    ['Subsanar', 'Corregir lo que le pidieron, sin cambiar el número.'],
    ['Interventoría', 'El equipo INTECOAL que revisa su expediente.'],
    ['Aprobado', 'Su expediente pasó la revisión.'],
  ],
  interfaz: [
    ['Barra de arriba', 'Logo, su cargo y los botones Manual y Salir.'],
    ['Menú de la izquierda', 'Los botones de cada cosa que puede hacer.'],
    ['Lista principal', 'Sus radicados con su estado y sus botones.'],
    ['Buscador', 'Para encontrar un radicado por número o nombre.'],
  ],
};

export const MANUAL_CONTRATISTA = {
  procedimientos: [
    {
      titulo: 'Subir un proyecto nuevo',
      pasos: [
        'Pulse Nueva Radicación.',
        'Paso 1: suba los 25 documentos. Marque N/A solo lo que no aplique.',
        'Paso 2: escriba los datos del proyecto y la lista de luminarias.',
        'Paso 3: ponga su firma y pulse Radicar.',
        'Espere el aviso verde con su número de radicado.',
      ],
      nota: 'Puede subirlo incompleto: lo que falte queda para revisión.',
    },
    {
      titulo: 'Ver cómo va mi radicado',
      pasos: [
        'Abra Mis Radicaciones.',
        'Lea el estado: Radicado, En Revisión, Con Observaciones o Aprobado.',
        'Pulse Informe para ver el documento de cada expediente.',
      ],
    },
    {
      titulo: 'Corregir lo que me pidieron',
      pasos: [
        'En el radicado observado pulse Editar.',
        'Lea el recuadro azul con lo que le piden.',
        'Vuelva a subir solo lo señalado (lo aprobado no se deja tocar).',
        'Pulse Guardar y Enviar a Revisión y espere el aviso verde.',
      ],
      alerta: 'No cierre la ventana mientras diga “Enviando…”.',
    },
    {
      titulo: 'Borrar un radicado',
      pasos: [
        'El botón Borrar solo sale en el último radicado, si es suyo y no está aprobado.',
        'Confirme. Esto no se puede deshacer.',
      ],
      alerta: 'Lo aprobado nunca se puede borrar.',
    },
  ],
  faq: [
    ['Me pide confirmar con documentos pendientes, ¿qué hago?', 'Es un aviso, no un error. Si le faltan archivos, súbalos; si no, acepte y continúe: quedarán para revisión.'],
    ['¿Por qué no veo el botón Borrar?', 'Solo sale en el último número, si es suyo y no está aprobado. Si otro radicó después, se quita solo.'],
    ['Un documento dice VERIFICADO y no me deja tocarlo, ¿por qué?', 'Porque ya pasó la revisión. Solo corrija los que dicen Pendiente o No cumple.'],
    ['Sale un mensaje rojo al enviar, ¿qué hago?', 'Lea qué archivo nombra y por qué (tamaño, tipo o conexión). Corríjalo e intente de nuevo sin salir.'],
  ],
  problemas: [
    ['"La firma es obligatoria"', 'Ponga su firma en el Paso 3 antes de radicar.'],
    ['"No se pudo conectar"', 'Revise su internet o espere un minuto si la página está despertando.'],
    ['"Me devolvió al inicio"', 'Se venció el permiso (dura 24 horas). Entre de nuevo.'],
    ['"Me rechaza el archivo"', 'Use PDF, foto o plano de máximo 50 MB.'],
  ],
};

export const MANUAL_REVISOR = {
  procedimientos: [
    {
      titulo: 'Revisar un radicado',
      pasos: [
        'Abra Revisión Radicaciones y pulse Evaluar.',
        'Abra cada documento con Ver y califique: Cumple, Pendiente, No cumple o N/A.',
        'Califique también cada archivo pequeño (anexos) uno por uno con su nota.',
        'Escriba qué debe corregir el contratista, con palabras claras.',
        'Guarde borrador con Guardar Avance, o elija el resultado y pulse Generar Informe.',
        'Espere el aviso de confirmación antes de salir.',
      ],
      alerta: 'Para dar Aprobado o Con Observaciones necesita su firma puesta.',
    },
    {
      titulo: 'Hacer el Formato 4.3.7 C',
      pasos: [
        'En un radicado aprobado pulse Formato C.',
        'Pulse Editar y llene los datos (número, municipio y fecha salen solos).',
        'Pulse Guardar y luego Subir para guardarlo en SharePoint.',
      ],
    },
    {
      titulo: 'Hacer el Recibo Técnico',
      pasos: [
        'En un radicado aprobado pulse Recibo Técnico y elija el radicado.',
        'Pulse Editar y escriba título, persona, asunto y cuerpo.',
        'Pulse Guardar y luego Subir para guardarlo en SharePoint.',
      ],
      nota: 'Ya subido se bloquea y no se puede cambiar.',
    },
    {
      titulo: 'Usar el Calendario',
      pasos: [
        'Abra Calendario en el menú.',
        'Cada bolita es una fecha clave: azul se creó, amarilla 8 días, roja 4 días, morada vencido, verde aprobado.',
        'Pulse una fecha para ver el radicado y saltar a Evaluar.',
      ],
    },
    {
      titulo: 'Volver a subir a SharePoint',
      pasos: [
        'En un aprobado que diga Pendiente de subida pulse Reintentar subida.',
        'Espere de 1 a 3 minutos y lea lo que dice.',
        'Si falla, el mensaje le dice el motivo.',
      ],
    },
  ],
  faq: [
    ['¿Cuándo sube a SharePoint?', 'Solo al aprobar. Los formatos solo con su botón Subir.'],
    ['Un aprobado dice Pendiente de subida, ¿qué hago?', 'Pulse Reintentar subida y lea el motivo si falla.'],
    ['¿Cómo sabe el contratista qué corregir?', 'Con las notas que usted escriba en cada documento y archivo pequeño.'],
    ['¿A quién le llegan los avisos de fechas?', 'Solo a usted: a los 8 y 4 días, y cada mañana si se vence.'],
  ],
  problemas: [
    ['"Falta la firma del revisor"', 'Ponga su firma antes de dar el resultado final.'],
    ['"No se pudo subir a SharePoint"', 'Lea el motivo, revise internet o permisos, y reintente.'],
    ['"Me devolvió al inicio"', 'Se venció el permiso (dura 24 horas). Entre de nuevo.'],
  ],
};

export const MANUAL_SOPORTE = [
  'Correo: interventoriaapalborada@intecoalsas.com',
  'Teléfonos: 310 355 6449 / (602) 224 8763',
  'Diga siempre su número de radicado y qué mensaje le salió.',
];
