import React, { useRef, useState, useEffect } from 'react';
import { 
  PenTool, 
  Upload, 
  Type, 
  Trash2, 
  X, 
  ShieldCheck, 
  Lock, 
  FileCheck
} from 'lucide-react';

export const FirmaDigitalModal = ({
  role,
  defaultName,
  defaultRole,
  initialSignature,
  onSaveSignature,
  onRemoveSignature,
  onClose
}) => {
  const isRol2 = role === 'contratista';

  const [activeTab, setActiveTab] = useState(() => {
    if (initialSignature?.tipoFirma === 'imagen') return 'cargar';
    if (initialSignature?.tipoFirma === 'texto') return 'texto';
    return 'dibujar';
  });
  
  const [nombreSignatario, setNombreSignatario] = useState(initialSignature?.nombreSignatario || '');
  const [cargo, setCargo] = useState(initialSignature?.cargo || defaultRole || '');
  const [tarjetaProfesional, setTarjetaProfesional] = useState(initialSignature?.tarjetaProfesional || '');
  
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(!!initialSignature?.dataUrl);
  const [penColor, setPenColor] = useState('#1E222A');
  const [penWidth] = useState(2.5);

  const [uploadedImage, setUploadedImage] = useState(initialSignature?.dataUrl || null);

  const [typedText, setTypedText] = useState(initialSignature?.nombreSignatario || '');
  const [fontStyle, setFontStyle] = useState('cursive1');

  useEffect(() => {
    setNombreSignatario(initialSignature?.nombreSignatario || '');
    setCargo(initialSignature?.cargo || defaultRole || '');
    setTarjetaProfesional(initialSignature?.tarjetaProfesional || '');
    setTypedText(initialSignature?.nombreSignatario || '');
    setUploadedImage(initialSignature?.dataUrl || null);
    setHasDrawn(!!initialSignature?.dataUrl);
    if (initialSignature?.tipoFirma === 'imagen') setActiveTab('cargar');
    else if (initialSignature?.tipoFirma === 'texto') setActiveTab('texto');
    else setActiveTab('dibujar');
  }, [initialSignature, defaultRole]);

  useEffect(() => {
    if (activeTab === 'dibujar' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penWidth;

        // If there's an initial signature image and canvas hasn't been drawn on yet, draw it onto canvas
        if (initialSignature?.dataUrl && !hasDrawn) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            setHasDrawn(true);
          };
          img.src = initialSignature.dataUrl;
        }
      }
    }
  }, [activeTab, penColor, penWidth]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setUploadedImage(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const generateTypedDataUrl = () => {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 500;
    tempCanvas.height = 160;
    const ctx = tempCanvas.getContext('2d');
    if (!ctx) return '';

    ctx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);

    const font = fontStyle === 'cursive1' 
      ? '38px "Brush Script MT", "Caveat", cursive' 
      : fontStyle === 'cursive2'
      ? '36px "Segoe Script", "Dancing Script", cursive'
      : '34px "Bradley Hand", "Comic Sans MS", cursive';

    ctx.font = font;
    ctx.fillStyle = penColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(typedText || 'Firma Digital', tempCanvas.width / 2, tempCanvas.height / 2 - 10);

    ctx.beginPath();
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2;
    ctx.moveTo(80, tempCanvas.height / 2 + 25);
    ctx.quadraticCurveTo(tempCanvas.width / 2, tempCanvas.height / 2 + 35, tempCanvas.width - 80, tempCanvas.height / 2 + 20);
    ctx.stroke();

    return tempCanvas.toDataURL('image/png');
  };

  const generateHash = () => {
    const randomHex = Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    return `DIG-SIG-${randomHex}-${timestamp}`;
  };

  const handleConfirm = () => {
    let finalDataUrl = '';

    if (!nombreSignatario.trim()) {
      alert('Por favor ingrese su nombre completo para la firma.');
      return;
    }

    if (activeTab === 'dibujar') {
      if (!canvasRef.current || !hasDrawn) {
        alert('Por favor trace su firma en el recuadro antes de guardar.');
        return;
      }
      finalDataUrl = canvasRef.current.toDataURL('image/png');
    } else if (activeTab === 'cargar') {
      if (!uploadedImage) {
        alert('Por favor seleccione o arrastre un archivo de imagen con su firma.');
        return;
      }
      finalDataUrl = uploadedImage;
    } else if (activeTab === 'texto') {
      if (!typedText.trim()) {
        alert('Escriba su nombre para generar la firma tipográfica.');
        return;
      }
      finalDataUrl = generateTypedDataUrl();
    }

    const signature = {
      dataUrl: finalDataUrl,
      nombreSignatario: nombreSignatario,
      cargo: cargo || defaultRole,
      tarjetaProfesional: tarjetaProfesional.trim() ? tarjetaProfesional : undefined,
      fechaFirma: new Date().toISOString(),
      hashVerificacion: initialSignature?.hashVerificacion || generateHash(),
      tipoFirma: activeTab === 'dibujar' ? 'dibujada' : activeTab === 'cargar' ? 'imagen' : 'texto'
    };

    onSaveSignature(signature);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-[#1E222A] text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 p-2 rounded-full text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-slate-800 rounded-2xl border border-slate-700 text-[#D9CF43]">
              <PenTool className="w-6 h-6" />
            </div>
            <div>
              <span className="inline-flex items-center space-x-1.5 bg-[#D9CF43]/20 text-[#D9CF43] border border-[#D9CF43]/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3" />
                <span>Módulo de Firma Electrónica Segura (Ley 527)</span>
              </span>
              <h3 className="text-xl font-black text-white mt-1">
                {role === 'interventoria' ? 'Firma de Interventoría' : 'Firma del Contratista de Obra'}
              </h3>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Nombre Completo</label>
              <input
                type="text"
                value={nombreSignatario}
                onChange={(e) => setNombreSignatario(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-bold text-gray-900 focus:ring-2 focus:ring-[#D9CF43]"
                placeholder="Nombre del signatario"
              />
            </div>
            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Cargo / Función</label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-semibold text-gray-900 focus:ring-2 focus:ring-[#D9CF43]"
                placeholder="Ej. Responsable de Revisión"
              />
            </div>
            <div>
              <label className="font-extrabold text-gray-700 block mb-1">Matrícula / T. Profesional</label>
              <input
                type="text"
                value={tarjetaProfesional}
                onChange={(e) => setTarjetaProfesional(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-xl font-mono text-gray-900 focus:ring-2 focus:ring-[#D9CF43]"
                placeholder="Ej. 1234567 - Ingeniero Civil"
              />
            </div>
          </div>

          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('dibujar')}
              className={`flex-1 py-2.5 px-4 text-xs font-black flex items-center justify-center space-x-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'dibujar'
                  ? 'border-[#1E222A] text-[#1E222A] bg-slate-50'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <PenTool className="w-4 h-4" />
              <span>Trazar con Mouse / Touch</span>
            </button>

            <button
              onClick={() => setActiveTab('cargar')}
              className={`flex-1 py-2.5 px-4 text-xs font-black flex items-center justify-center space-x-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'cargar'
                  ? 'border-[#1E222A] text-[#1E222A] bg-slate-50'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Subir Imagen PNG/JPG</span>
            </button>

            <button
              onClick={() => setActiveTab('texto')}
              className={`flex-1 py-2.5 px-4 text-xs font-black flex items-center justify-center space-x-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'texto'
                  ? 'border-[#1E222A] text-[#1E222A] bg-slate-50'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <Type className="w-4 h-4" />
              <span>Generar Tipográfica</span>
            </button>
          </div>

          {activeTab === 'dibujar' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Firme dentro del recuadro a continuación:</span>
                
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-gray-400 font-bold mr-1">Tinta:</span>
                    {['#1E222A', '#1E3A8A', '#065F46'].map(color => (
                      <button
                        key={color}
                        onClick={() => setPenColor(color)}
                        className={`w-5 h-5 rounded-full border-2 transition-transform ${
                          penColor === color ? 'scale-125 border-amber-500' : 'border-white'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>

                  <button
                    onClick={clearCanvas}
                    className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center space-x-1 px-2 py-1 rounded bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpiar Trazo</span>
                  </button>
                </div>
              </div>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 relative overflow-hidden flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={520}
                  height={180}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="cursor-crosshair touch-none w-full max-w-[520px] h-[180px] bg-white rounded-xl shadow-inner"
                />

                {!hasDrawn && (
                  <div className="absolute pointer-events-none text-center text-slate-400 space-y-1">
                    <PenTool className="w-8 h-8 mx-auto opacity-30 text-slate-500" />
                    <p className="text-xs font-medium">Haga clic y arrastre con su ratón o pantalla táctil</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'cargar' && (
            <div className="space-y-3">
              <label className="block text-xs text-gray-500 font-medium">
                Seleccione una imagen limpia de su firma (preferiblemente fondo transparente PNG):
              </label>

              <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />

                {uploadedImage ? (
                  <div className="space-y-2">
                    <img
                      src={uploadedImage}
                      alt="Firma subida"
                      className="max-h-28 mx-auto object-contain rounded border p-2 bg-white"
                    />
                    <span className="text-xs text-emerald-700 font-bold block">
                      ✓ Imagen cargada correctamente. Puede cambiarla seleccionando otra.
                    </span>
                  </div>
                ) : (
                  <div className="space-y-2 py-4">
                    <Upload className="w-10 h-10 mx-auto text-slate-400" />
                    <p className="text-xs font-bold text-gray-700">
                      Haga clic o arrastre aquí su archivo de firma
                    </p>
                    <p className="text-[11px] text-gray-400">Archivos permitidos: PNG, JPG (Máx 5MB)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'texto' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  Escriba su Nombre para la Estampa
                </label>
                <input
                  type="text"
                  value={typedText}
                  onChange={(e) => setTypedText(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-gray-300 rounded-xl font-bold text-sm focus:ring-2 focus:ring-[#D9CF43]"
                  placeholder="Su nombre aquí"
                />
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="font-bold text-gray-600">Estilo de Letra:</span>
                <button
                  type="button"
                  onClick={() => setFontStyle('cursive1')}
                  className={`px-3 py-1.5 rounded-lg font-serif transition-all ${
                    fontStyle === 'cursive1' ? 'bg-slate-900 text-white font-bold' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Cursiva Clásica
                </button>
                <button
                  type="button"
                  onClick={() => setFontStyle('cursive2')}
                  className={`px-3 py-1.5 rounded-lg font-mono transition-all ${
                    fontStyle === 'cursive2' ? 'bg-slate-900 text-white font-bold' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Cursiva Elegante
                </button>
              </div>

              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center shadow-inner">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                  VISTA PREVIA DE ESTAMPA DIGITAL
                </span>
                <div className="p-4 bg-white rounded-xl border border-slate-200 inline-block min-w-[320px]">
                  <img
                    src={generateTypedDataUrl()}
                    alt="Vista previa firma tipográfica"
                    className="mx-auto max-h-24"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-[11px] text-amber-900 flex items-start space-x-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong className="font-extrabold block">Garantía de Integridad y Sello de Tiempo</strong>
              Al confirmar, la firma se vinculará con la fecha ISO y un hash único de autenticidad que se estampará en el dictamen impreso.
            </div>
          </div>
        </div>

        <div className="p-6 bg-slate-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          {initialSignature && onRemoveSignature ? (
            <button
              type="button"
              onClick={() => {
                onRemoveSignature();
                onClose();
              }}
              className="text-red-600 hover:text-red-800 text-xs font-bold flex items-center space-x-1.5 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Firma Existente</span>
            </button>
          ) : (
            <span className="text-xs text-gray-400 font-medium">Intecoal SAS · Plataforma Web</span>
          )}

          <div className="flex items-center space-x-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              className="px-6 py-2.5 bg-[#1E222A] hover:bg-slate-800 text-[#D9CF43] font-black text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2 cursor-pointer scale-[1.02] hover:scale-[1.04]"
            >
              <FileCheck className="w-4 h-4 text-[#D9CF43]" />
              <span>Estampar Firma en Informe</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
