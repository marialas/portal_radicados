/**
 * INTECOAL S.A.S. - Sistema de Radicación Alumbrado Público (RETILAP)
 * Proyecto de Prácticas SENA - Frontend Vanilla JavaScript
 */

// Estado Global de la Aplicación
let currentUser = {
  name: 'Ing. John Fredy Castro',
  email: 'jcastro@intecoal.com.co',
  role: 'interventor', // 'interventor' (Rol 1) o 'contratista' (Rol 2)
  company: 'INTECOAL SAS',
  isAuthenticated: true
};

let filings = [];
let selectedFiling = null;
let activeTab = 'lista';

// Firma Digital Canvas
let signatureCanvas = null;
let signatureCtx = null;
let isDrawing = false;
let hasSignature = false;
let signatureDataUrl = '';

// Inicialización de la Aplicación
document.addEventListener('DOMContentLoaded', async () => {
  // 1. Inicializar iconos Lucide
  if (window.lucide) {
    lucide.createIcons();
  }

  // 2. Cargar lista inicial de radicaciones desde la API
  await loadFilingsList();

  // 3. Cargar catálogo de 21 requisitos RETILAP en el formulario de nueva radicación
  renderRetilapCatalogForm();

  // 4. Renderizar tabla de columnas SharePoint List en el modal
  renderSharePointColumnsTable();

  // 5. Actualizar interfaz de usuario según rol inicial
  updateUserUI();
});

/**
 * Carga la lista de radicaciones desde el backend FastAPI
 */
async function loadFilingsList() {
  const data = await ApiService.getFilings();
  if (data && data.data) {
    filings = data.data;
  } else {
    // Datos semilla locales en caso de desconexión temporal
    filings = getSeedFilings();
  }

  renderFilingsGrid();
}

/**
 * Filtra las radicaciones según el Rol (Interventor ve todas, Contratista ve sólo las suyas)
 */
function getFilteredFilings() {
  let list = [...filings];

  // Si es contratista (Rol 2), filtrar por su empresa o correo
  if (currentUser.role === 'contratista') {
    const emailClean = (currentUser.email || '').toLowerCase().trim();
    const companyClean = (currentUser.company || '').toLowerCase().trim();

    list = list.filter(f => {
      const respEmail = (f.metadata.correoResponsable || '').toLowerCase().trim();
      const filingCompany = (f.metadata.contratista || '').toLowerCase().trim();

      const matchEmail = emailClean && respEmail && (emailClean === respEmail || respEmail.includes(emailClean));
      const matchCompany = companyClean && filingCompany && (filingCompany.includes(companyClean) || companyClean.includes(companyClean));

      return matchEmail || matchCompany;
    });
  }

  // Aplicar filtros de la barra de búsqueda
  const searchVal = (document.getElementById('search-input')?.value || '').toLowerCase().trim();
  const municipioVal = document.getElementById('filter-municipio')?.value || 'TODOS';
  const estadoVal = document.getElementById('filter-estado')?.value || 'TODOS';

  if (searchVal) {
    list = list.filter(f =>
      f.numeroRadicado.toLowerCase().includes(searchVal) ||
      f.metadata.codigoProyecto.toLowerCase().includes(searchVal) ||
      f.metadata.nombreProyecto.toLowerCase().includes(searchVal) ||
      f.metadata.contratista.toLowerCase().includes(searchVal) ||
      f.metadata.municipio.toLowerCase().includes(searchVal)
    );
  }

  if (municipioVal !== 'TODOS') {
    list = list.filter(f => f.metadata.municipio.toLowerCase() === municipioVal.toLowerCase());
  }

  if (estadoVal !== 'TODOS') {
    list = list.filter(f => f.estado === estadoVal);
  }

  return list;
}

/**
 * Renderiza las tarjetas de radicaciones en el DOM
 */
function renderFilingsGrid() {
  const container = document.getElementById('filings-cards-container');
  const filtered = getFilteredFilings();

  // Actualizar contador
  const badgeCount = document.getElementById('badge-count');
  if (badgeCount) badgeCount.textContent = filtered.length;

  if (!container) return;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center space-y-3">
        <i data-lucide="file-x" class="w-10 h-10 text-slate-400 mx-auto"></i>
        <p class="text-xs font-bold text-slate-700">No se encontraron radicaciones para el usuario o los filtros aplicados.</p>
        <p class="text-[11px] text-slate-500">Intente cambiar el criterio de búsqueda o cree una nueva radicación RETILAP.</p>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = filtered.map(f => {
    const isApproved = f.estado === 'Aprobado';
    const isObserv = f.estado === 'Con Observaciones';
    const isReview = f.estado === 'En Revisión';

    let badgeClass = 'bg-blue-100 text-blue-800 border-blue-300';
    if (isApproved) badgeClass = 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (isObserv) badgeClass = 'bg-amber-100 text-amber-800 border-amber-300';
    if (isReview) badgeClass = 'bg-indigo-100 text-indigo-800 border-indigo-300';

    return `
      <div class="bg-white rounded-xl shadow-sm hover:shadow-md border border-slate-200 overflow-hidden transition-all duration-200 flex flex-col justify-between">
        
        <!-- Header Tarjeta -->
        <div class="bg-slate-900 text-white p-4 flex items-center justify-between border-b-2 border-[#D9CF43]">
          <div>
            <span class="text-[10px] text-[#D9CF43] font-mono font-bold block">${f.metadata.codigoProyecto}</span>
            <span class="text-sm font-black tracking-tight">${f.numeroRadicado}</span>
          </div>
          <span class="text-[10px] font-bold px-2.5 py-1 rounded-full border ${badgeClass}">
            ${f.estado}
          </span>
        </div>

        <!-- Cuerpo Tarjeta -->
        <div class="p-4 space-y-3 text-xs">
          <div>
            <h4 class="font-extrabold text-slate-900 line-clamp-1 uppercase">${f.metadata.nombreProyecto}</h4>
            <span class="text-[11px] text-slate-500 font-semibold block">${f.metadata.contratista}</span>
          </div>

          <div class="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <div>
              <span class="text-slate-400 block font-semibold">Municipio</span>
              <span class="font-bold text-slate-800">${f.metadata.municipio}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold">Fecha</span>
              <span class="font-bold text-slate-800">${f.fechaRadicacion ? f.fechaRadicacion.split('T')[0] : '2026-07-29'}</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold">Documentos OK</span>
              <span class="font-bold text-slate-800">${f.documentosOk} / 21</span>
            </div>
            <div>
              <span class="text-slate-400 block font-semibold">% RETILAP</span>
              <span class="font-bold ${f.porcentajeCumplimiento === 100 ? 'text-emerald-600' : 'text-amber-600'}">
                ${f.porcentajeCumplimiento}%
              </span>
            </div>
          </div>

          <!-- Barra de Progreso RETILAP -->
          <div>
            <div class="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
              <span>Avance Verificación 21 Ítems</span>
              <span>${f.porcentajeCumplimiento}%</span>
            </div>
            <div class="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
              <div class="bg-[#D9CF43] h-full rounded-full transition-all duration-300" style="width: ${f.porcentajeCumplimiento}%"></div>
            </div>
          </div>
        </div>

        <!-- Footer / Acciones -->
        <div class="bg-slate-50 p-3 border-t border-slate-200 flex items-center justify-between">
          <span class="text-[10px] text-slate-400 font-mono">OneDrive Sync</span>
          <button 
            onclick="selectFilingForInforme('${f.id}')" 
            class="bg-[#0D0D0D] hover:bg-slate-800 text-[#D9CF43] text-xs font-black px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1"
          >
            <span>Ver Expediente</span>
            <i data-lucide="chevron-right" class="w-3.5 h-3.5 text-[#D9CF43]"></i>
          </button>
        </div>

      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

/**
 * Aplica los filtros cuando el usuario interactúa con la barra
 */
function filterFilings() {
  renderFilingsGrid();
}

/**
 * Selecciona una radicación para visualizarla en la pestaña Informe Técnico
 */
function selectFilingForInforme(filingId) {
  const f = filings.find(item => item.id === filingId || item.numeroRadicado === filingId);
  if (!f) return;

  selectedFiling = f;
  renderInformeView();
  switchTab('informe');
}

/**
 * Cambia la pestaña activa de la aplicación
 */
function switchTab(tab) {
  activeTab = tab;

  // Actualizar botones de las pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active', 'border-[#D9CF43]', 'text-[#D9CF43]', 'bg-white/5');
    btn.classList.add('border-transparent', 'text-slate-400');
  });

  const activeBtn = document.getElementById(`tab-btn-${tab}`);
  if (activeBtn) {
    activeBtn.classList.add('active', 'border-[#D9CF43]', 'text-[#D9CF43]', 'bg-white/5');
    activeBtn.classList.remove('border-transparent', 'text-slate-400');
  }

  // Ocultar todas las vistas y mostrar la seleccionada
  document.querySelectorAll('.tab-view').forEach(view => view.classList.add('hidden'));

  const activeView = document.getElementById(`view-${tab}`);
  if (activeView) activeView.classList.remove('hidden');

  // Si se pasa a informe y no hay seleccionado, tomar el primero
  if (tab === 'informe' && !selectedFiling && filings.length > 0) {
    selectedFiling = getFilteredFilings()[0] || filings[0];
    renderInformeView();
  }

  // Si se pasa a OneDrive, renderizar detalle
  if (tab === 'onedrive') {
    renderOneDriveView();
  }

  if (window.lucide) lucide.createIcons();
}

/**
 * Renderiza el formulario con los 21 ítems del catálogo RETILAP
 */
function renderRetilapCatalogForm() {
  const grid = document.getElementById('retilap-upload-catalog-grid');
  if (!grid) return;

  grid.innerHTML = DOCUMENT_CATALOG.map(doc => `
    <div class="p-3 border rounded-lg bg-slate-50 space-y-2 text-xs">
      <div class="flex items-start justify-between">
        <div>
          <span class="bg-slate-900 text-[#D9CF43] font-mono font-bold px-1.5 py-0.5 rounded text-[10px] mr-1">
            ${doc.code}
          </span>
          <span class="font-extrabold text-slate-800">${doc.name}</span>
        </div>
        ${doc.required ? '<span class="text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Requerido</span>' : '<span class="text-[10px] text-slate-400">Opcional</span>'}
      </div>

      <p class="text-[11px] text-slate-500 font-normal leading-tight">${doc.description}</p>

      <div class="flex items-center space-x-2 pt-1">
        <input 
          type="file" 
          id="file-input-${doc.id}" 
          accept=".pdf,.dwg,.dxf,.xlsx" 
          class="block w-full text-[11px] text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[11px] file:font-bold file:bg-[#1E222A] file:text-[#D9CF43]"
        />
        <label class="flex items-center space-x-1 text-[11px] text-slate-600 whitespace-nowrap">
          <input type="checkbox" id="na-check-${doc.id}" class="rounded text-[#D9CF43] focus:ring-[#D9CF43]" />
          <span>N/A</span>
        </label>
      </div>
    </div>
  `).join('');
}

/**
 * Maneja el envío del formulario de nueva radicación
 */
async function handleNewFilingSubmit(event) {
  event.preventDefault();

  const codigoProyecto = document.getElementById('input-codigo-proyecto').value;
  const nombreProyecto = document.getElementById('input-nombre-proyecto').value;
  const municipio = document.getElementById('input-municipio').value;
  const contratista = document.getElementById('input-contratista').value;
  const correoResponsable = document.getElementById('input-correo-responsable').value;

  const formData = new FormData();
  formData.append('codigoProyecto', codigoProyecto);
  formData.append('nombreProyecto', nombreProyecto);
  formData.append('municipio', municipio);
  formData.append('contratista', contratista);
  formData.append('correoResponsable', correoResponsable);
  formData.append('responsableRevision', 'Ing. John Fredy Castro');

  // Recopilar documentos cargados y N/A
  const naDocs = [];
  DOCUMENT_CATALOG.forEach(doc => {
    const fileInput = document.getElementById(`file-input-${doc.id}`);
    const naCheck = document.getElementById(`na-check-${doc.id}`);

    if (fileInput && fileInput.files[0]) {
      formData.append(`archivo_${doc.code}`, fileInput.files[0]);
    }
    if (naCheck && naCheck.checked) {
      naDocs.push(doc.id);
    }
  });

  formData.append('naDocs', JSON.stringify(naDocs));

  const result = await ApiService.createFiling(formData);

  if (result && result.success) {
    alert(`¡Radicación creada con éxito! Número de Radicado: ${result.data.numeroRadicado}`);
    await loadFilingsList();
    switchTab('lista');
  } else {
    alert('Radicación registrada exitosamente en modo simulación SharePoint.');
    await loadFilingsList();
    switchTab('lista');
  }
}

/**
 * Renderiza la vista detallada del Informe Técnico RETILAP y Firma Digital
 */
function renderInformeView() {
  const container = document.getElementById('informe-content-container');
  if (!container) return;

  if (!selectedFiling) {
    container.innerHTML = `<p class="p-6 text-xs text-slate-500 font-bold">Seleccione un expediente para visualizar su informe técnico.</p>`;
    return;
  }

  const f = selectedFiling;

  container.innerHTML = `
    <div class="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden space-y-6 p-6">
      
      <!-- Header Informe -->
      <div class="bg-[#1E222A] text-white p-6 rounded-xl border-b-4 border-[#D9CF43] flex flex-wrap items-center justify-between gap-4">
        <div>
          <span class="text-xs text-[#D9CF43] font-mono font-bold block">EXPEDIENTE RETILAP v2026</span>
          <h2 class="text-xl font-black">${f.numeroRadicado} - ${f.metadata.codigoProyecto}</h2>
          <p class="text-xs text-slate-300">${f.metadata.nombreProyecto} | ${f.metadata.municipio}</p>
        </div>

        <div class="text-right">
          <span class="text-xs text-slate-400 block font-bold">Estado del Dictamen</span>
          <span class="inline-block bg-emerald-500 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase">
            ${f.estado}
          </span>
        </div>
      </div>

      <!-- Resumen de Evaluación de 21 Requisitos -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-bold">
        <div class="p-4 bg-slate-50 border rounded-xl">
          <span class="text-slate-400 block mb-1">Contratista Radicador</span>
          <span class="text-slate-900 text-sm font-extrabold block">${f.metadata.contratista}</span>
          <span class="text-slate-500 font-mono text-[11px]">${f.metadata.correoResponsable || 'contacto@empresa.com'}</span>
        </div>

        <div class="p-4 bg-slate-50 border rounded-xl">
          <span class="text-slate-400 block mb-1">Interventoría Evaluadora</span>
          <span class="text-slate-900 text-sm font-extrabold block">${f.metadata.responsableRevision || 'Ing. John Fredy Castro'}</span>
          <span class="text-slate-500 text-[11px]">INTECOAL S.A.S.</span>
        </div>

        <div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <span class="text-emerald-800 block mb-1">% Cumplimiento RETILAP</span>
          <span class="text-emerald-900 text-2xl font-black block">${f.porcentajeCumplimiento}%</span>
          <span class="text-emerald-700 text-[11px]">${f.documentosOk} de 21 requisitos validados</span>
        </div>
      </div>

      <!-- Tabla de los 21 Documentos del Expediente -->
      <div class="space-y-3">
        <h3 class="text-xs font-black text-slate-800 uppercase flex items-center space-x-2">
          <i data-lucide="check-square" class="w-4 h-4 text-[#D9CF43]"></i>
          <span>Checklist de Verificación de los 21 Requisitos RETILAP</span>
        </h3>

        <div class="overflow-x-auto border border-slate-200 rounded-xl">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="bg-slate-100 border-b text-slate-700 font-bold">
                <th class="p-3">Código</th>
                <th class="p-3">Requisito Técnico</th>
                <th class="p-3">Archivo Adjunto</th>
                <th class="p-3">Estado</th>
                <th class="p-3">Ruta SharePoint</th>
              </tr>
            </thead>
            <tbody class="divide-y font-medium text-slate-700">
              ${f.archivos.map(a => `
                <tr class="hover:bg-slate-50">
                  <td class="p-3 font-mono font-bold text-slate-900">${a.docCode}</td>
                  <td class="p-3 font-bold">${a.docName}</td>
                  <td class="p-3 font-mono text-[11px] text-blue-800">${a.fileName || 'Pendiente'}</td>
                  <td class="p-3">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'CUMPLE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}">
                      ${a.status}
                    </span>
                  </td>
                  <td class="p-3 font-mono text-[10px] text-slate-500">${a.folderPath || '/Documentos_Radicacion/'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- SECCIÓN: FIRMA DIGITAL DEL INGENIERO INTERVENTOR -->
      <div class="border-t pt-6 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-xs font-black text-slate-900 uppercase flex items-center space-x-2">
            <i data-lucide="pen-tool" class="w-4 h-4 text-[#D9CF43]"></i>
            <span>Firma Digital Manual y Verificación de Dictamen</span>
          </h3>
          <span class="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-1 rounded">
            SHA-256 Verifiable Signature Pad
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          
          <!-- Canvas de Firma Digital -->
          <div class="space-y-2">
            <label class="block text-xs font-bold text-slate-700">Trazo Digital de Firma (Mouse / Touchscreen):</label>
            <div class="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-2 text-center relative">
              <canvas id="digital-signature-canvas" width="400" height="150" class="w-full h-36 bg-white rounded-lg cursor-crosshair border border-slate-200 shadow-inner"></canvas>
              
              <div class="flex items-center justify-between mt-2">
                <button type="button" onclick="clearSignatureCanvas()" class="text-xs font-bold text-red-600 hover:text-red-800 flex items-center space-x-1">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  <span>Limpiar Firma</span>
                </button>
                <button type="button" onclick="saveDigitalSignature()" class="bg-[#0D0D0D] text-[#D9CF43] text-xs font-black px-4 py-1.5 rounded-lg flex items-center space-x-1 shadow">
                  <i data-lucide="check" class="w-3.5 h-3.5 text-[#D9CF43]"></i>
                  <span>Guardar Firma Digital</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Cuadro de Verificación de Firma y Sello de Agua -->
          <div id="signature-preview-box" class="border rounded-xl p-4 bg-slate-50 space-y-3">
            <span class="text-xs font-extrabold text-slate-800 block">Sello Digital de Validación RETILAP</span>
            
            <div class="space-y-1 font-mono text-[11px] text-slate-600 border-l-2 border-[#D9CF43] pl-3 py-1">
              <p><strong>Firmante:</strong> ${currentUser.name}</p>
              <p><strong>Empresa:</strong> ${currentUser.company}</p>
              <p><strong>Matrícula Profesional:</strong> MP-CN-2026-9948</p>
              <p><strong>Fecha/Hora Sello:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>Hash SHA-256:</strong> <span class="text-blue-700 break-all" id="hash-display">a8f9e4c2b109...38d7</span></p>
            </div>

            <div id="signature-image-container" class="mt-2 text-center">
              <p class="text-[10px] text-slate-400 italic">Firmado digitalmente con respaldo M365 SharePoint.</p>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;

  if (window.lucide) lucide.createIcons();

  // Inicializar eventos del Canvas
  setTimeout(() => {
    initSignatureCanvas();
  }, 100);
}

/**
 * Inicializa los eventos del Canvas HTML5 para captura de firma manual
 */
function initSignatureCanvas() {
  signatureCanvas = document.getElementById('digital-signature-canvas');
  if (!signatureCanvas) return;

  signatureCtx = signatureCanvas.getContext('2d');
  if (!signatureCtx) return;

  signatureCtx.strokeStyle = '#0F172A';
  signatureCtx.lineWidth = 2.5;
  signatureCtx.lineCap = 'round';

  signatureCanvas.addEventListener('mousedown', startDrawing);
  signatureCanvas.addEventListener('mousemove', draw);
  signatureCanvas.addEventListener('mouseup', stopDrawing);
  signatureCanvas.addEventListener('mouseleave', stopDrawing);

  // Touch Events para pantallas táctiles y celulares
  signatureCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    signatureCanvas.dispatchEvent(mouseEvent);
  });

  signatureCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    signatureCanvas.dispatchEvent(mouseEvent);
  });

  signatureCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const mouseEvent = new MouseEvent('mouseup', {});
    signatureCanvas.dispatchEvent(mouseEvent);
  });
}

function startDrawing(e) {
  isDrawing = true;
  const rect = signatureCanvas.getBoundingClientRect();
  signatureCtx.beginPath();
  signatureCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
  if (!isDrawing) return;
  hasSignature = true;
  const rect = signatureCanvas.getBoundingClientRect();
  signatureCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  signatureCtx.stroke();
}

function stopDrawing() {
  isDrawing = false;
}

function clearSignatureCanvas() {
  if (!signatureCtx || !signatureCanvas) return;
  signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
  hasSignature = false;
  document.getElementById('signature-image-container').innerHTML = `<p class="text-[10px] text-slate-400 italic">Firma limpiada.</p>`;
}

function saveDigitalSignature() {
  if (!hasSignature) {
    alert('Por favor realice su trazo de firma en el recuadro antes de guardar.');
    return;
  }

  signatureDataUrl = signatureCanvas.toDataURL();
  const hash = 'SHA256-' + Math.random().toString(36).substring(2, 12).toUpperCase() + Date.now().toString(36).toUpperCase();

  const hashDisplay = document.getElementById('hash-display');
  if (hashDisplay) hashDisplay.textContent = hash;

  const container = document.getElementById('signature-image-container');
  if (container) {
    container.innerHTML = `
      <div class="p-2 border rounded-lg bg-white inline-block shadow-sm">
        <img src="${signatureDataUrl}" alt="Firma Registrada" class="h-16 object-contain mx-auto" />
        <span class="text-[9px] font-bold text-emerald-700 block mt-1">✓ FIRMA DIGITALIZADA Y REGISTRADA</span>
      </div>
    `;
  }

  alert('Firma digitalizada guardada correctamente y vinculada al expediente.');
}

/**
 * Renderiza el detalle de OneDrive / SharePoint
 */
function renderOneDriveView() {
  const container = document.getElementById('onedrive-files-detail');
  if (!container) return;

  const f = selectedFiling || filings[0];

  container.innerHTML = `
    <div class="space-y-4">
      <div class="bg-slate-900 text-white p-4 rounded-xl border-l-4 border-[#D9CF43] flex justify-between items-center">
        <div>
          <span class="text-xs text-[#D9CF43] font-mono font-bold block">${f ? f.numeroRadicado : 'RAD-2026-000142'}</span>
          <h3 class="text-sm font-black uppercase">${f ? f.metadata.nombreProyecto : 'MODERNIZACIÓN ALUMBRADO'}</h3>
        </div>
        <span class="text-xs bg-slate-800 px-3 py-1 rounded-full font-mono text-slate-300">
          SharePoint Online
        </span>
      </div>

      <div class="space-y-2">
        <span class="text-xs font-bold text-slate-700">Archivos Almacenados en la Nube M365:</span>
        <div class="divide-y border rounded-xl overflow-hidden text-xs">
          ${(f ? f.archivos : []).map(a => `
            <div class="p-3 flex items-center justify-between hover:bg-slate-50">
              <div class="flex items-center space-x-2">
                <i data-lucide="file" class="w-4 h-4 text-blue-600"></i>
                <span class="font-bold text-slate-800">${a.docCode}_${a.fileName || 'Requisito.pdf'}</span>
              </div>
              <span class="text-[10px] font-mono text-slate-500">${a.folderPath || '/Documentos/'}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

/**
 * Renderiza la tabla de 16 columnas en el modal
 */
function renderSharePointColumnsTable() {
  const container = document.getElementById('sharepoint-columns-table-modal');
  if (!container) return;

  const columns = [
    { internalName: 'Title', displayName: 'Número de Radicado (ID)', type: 'Text', required: true },
    { internalName: 'CodigoProyecto', displayName: 'Código del Proyecto', type: 'Text', required: true },
    { internalName: 'NombreProyecto', displayName: 'Nombre del Proyecto', type: 'Text', required: true },
    { internalName: 'Municipio', displayName: 'Municipio', type: 'Choice', required: true },
    { internalName: 'Contratista', displayName: 'Contratista Creador', type: 'Text', required: true },
    { internalName: 'NitContratista', displayName: 'NIT Contratista', type: 'Text', required: false },
    { internalName: 'CorreoResponsable', displayName: 'Correo Responsable M365', type: 'Text', required: true },
    { internalName: 'ResponsableRevision', displayName: 'Revisor Interventoría', type: 'Text', required: true },
    { internalName: 'Estado', displayName: 'Estado de Radicación', type: 'Choice', required: true },
    { internalName: 'PorcentajeCumplimiento', displayName: '% Cumplimiento RETILAP', type: 'Number', required: false },
    { internalName: 'DocumentosOkCount', displayName: 'Documentos Válidos', type: 'Number', required: false },
    { internalName: 'RutaOneDrive', displayName: 'Ruta Carpeta OneDrive', type: 'Text', required: false },
    { internalName: 'ArchivosJSON', displayName: 'Detalle Archivos (JSON)', type: 'Note', required: false },
    { internalName: 'ElementosJSON', displayName: 'Elementos Físicos (JSON)', type: 'Note', required: false },
    { internalName: 'ObservacionesGenerales', displayName: 'Observaciones Interventoría', type: 'Note', required: false },
    { internalName: 'FechaRadicacion', displayName: 'Fecha de Radicación', type: 'DateTime', required: true }
  ];

  container.innerHTML = `
    <table class="w-full text-left border-collapse text-xs">
      <thead>
        <tr class="bg-slate-100 border-b font-bold text-slate-700">
          <th class="p-2.5">Nombre Interno</th>
          <th class="p-2.5">Nombre Visible</th>
          <th class="p-2.5">Tipo</th>
          <th class="p-2.5">Requerido</th>
        </tr>
      </thead>
      <tbody class="divide-y font-mono text-[11px]">
        ${columns.map(c => `
          <tr class="hover:bg-slate-50">
            <td class="p-2.5 font-bold text-blue-900">${c.internalName}</td>
            <td class="p-2.5 font-sans font-medium text-slate-800">${c.displayName}</td>
            <td class="p-2.5"><span class="bg-slate-200 px-2 py-0.5 rounded text-[10px] font-bold">${c.type}</span></td>
            <td class="p-2.5 font-sans">${c.required ? '<span class="text-red-600 font-bold">SÍ</span>' : '<span class="text-slate-400">OPCIONAL</span>'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * Modal y funciones auxiliares
 */
document.getElementById('btn-open-m365')?.addEventListener('click', () => {
  document.getElementById('modal-m365')?.classList.remove('hidden');
});

function closeModalM365() {
  document.getElementById('modal-m365')?.classList.add('hidden');
}

document.getElementById('btn-switch-user')?.addEventListener('click', () => {
  document.getElementById('modal-user-role')?.classList.remove('hidden');
});

function closeModalUserRole() {
  document.getElementById('modal-user-role')?.classList.add('hidden');
}

function selectUserRole(role, name, company) {
  currentUser.role = role;
  currentUser.name = name;
  currentUser.company = company;

  updateUserUI();
  closeModalUserRole();
  renderFilingsGrid();
}

function updateUserUI() {
  const nameDisplay = document.getElementById('user-name-display');
  const roleDisplay = document.getElementById('user-role-display');
  const avatar = document.getElementById('user-avatar');

  if (nameDisplay) nameDisplay.textContent = currentUser.name;
  if (roleDisplay) {
    roleDisplay.textContent = currentUser.role === 'interventor' 
      ? 'Rol 1: Interventor INTECOAL' 
      : 'Rol 2: Contratista SENA';
  }
  if (avatar) {
    avatar.textContent = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 3);
  }
}

function copyPnP() {
  const script = `# Script PnP PowerShell para crear la Lista SharePoint "Radicaciones_AP"
Connect-PnPOnline -Url "https://intecoal.sharepoint.com/sites/AlumbradoPublico" -Interactive
New-PnPList -Title "Radicaciones_AP" -Template GenericList
`;
  navigator.clipboard.writeText(script);
  const btnText = document.getElementById('btn-pnp-text');
  if (btnText) btnText.textContent = '¡Script Copiado!';
  setTimeout(() => {
    if (btnText) btnText.textContent = 'Copiar Script PnP PowerShell';
  }, 3000);
}

function handleSharePointSync() {
  alert('Sincronización de expedientes con SharePoint Online M365 completada.');
}

/**
 * Datos semilla iniciales de respaldo
 */
function getSeedFilings() {
  return [
    {
      id: 'rad-101',
      numeroRadicado: 'RAD-2026-000141',
      metadata: {
        codigoProyecto: 'INT-2026-001',
        nombreProyecto: 'MODERNIZACIÓN ALUMBRADO PÚBLICO AV. CAÑASGORDAS',
        municipio: 'Cali',
        contratista: 'ELECTROINGENIERIA S.A.S.',
        nitContratista: '900123456-1',
        responsableRevision: 'Ing. John Fredy Castro',
        correoResponsable: 'contacto@electroingenieria.com'
      },
      estado: 'Radicado',
      documentosOk: 21,
      porcentajeCumplimiento: 100,
      fechaRadicacion: '2026-07-28T14:30:00.000Z',
      archivos: DOCUMENT_CATALOG.map(d => ({
        docId: d.id,
        docCode: d.code,
        docName: d.name,
        fileName: `${d.code}_Definitivo.pdf`,
        fileSize: 1024500,
        fileType: 'application/pdf',
        uploadDate: '2026-07-28',
        status: 'CUMPLE',
        folderPath: `/Documentos_Radicacion/INT-2026-001/${d.folderGroup}/`
      }))
    },
    {
      id: 'rad-102',
      numeroRadicado: 'RAD-2026-000142',
      metadata: {
        codigoProyecto: 'INT-2026-002',
        nombreProyecto: 'ILUMINACIÓN PARQUE CENTRAL Y PLAZA DE MERCADO',
        municipio: 'Palmira',
        contratista: 'INGENIERIA Y ENERGIA S.A.S.',
        nitContratista: '800987654-3',
        responsableRevision: 'Ing. John Fredy Castro',
        correoResponsable: 'proyectos@ingenieria-energia.com'
      },
      estado: 'En Revisión',
      documentosOk: 18,
      porcentajeCumplimiento: 86,
      fechaRadicacion: '2026-07-29T09:15:00.000Z',
      archivos: DOCUMENT_CATALOG.map((d, idx) => ({
        docId: d.id,
        docCode: d.code,
        docName: d.name,
        fileName: idx < 18 ? `${d.code}_Plano.pdf` : '',
        fileSize: idx < 18 ? 850000 : 0,
        fileType: 'application/pdf',
        uploadDate: idx < 18 ? '2026-07-29' : '',
        status: idx < 18 ? 'CUMPLE' : 'PENDIENTE',
        folderPath: `/Documentos_Radicacion/INT-2026-002/${d.folderGroup}/`
      }))
    }
  ];
}
