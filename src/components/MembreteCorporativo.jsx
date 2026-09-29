import React from 'react';

/**
 * Membrete y franja corporativos del Recibo Técnico
 * (logo, información de contacto y colores oficiales).
 * Se comparte entre Recibo Técnico y Formato 4.3.7 C para que
 * ambos documentos lleven exactamente el mismo encabezado y pie.
 *
 * NOTA impresión: los fondos/colores solo salen en papel con
 * print-color-adjust: exact (por defecto el navegador los omite).
 */

const printExact = {
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact'
};

// Dirección y teléfono del encabezado según municipio
const datosPorMunicipio = (municipio) => {
  const m = (municipio || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
  if (m.includes('villavicencio')) {
    return {
      direccion: 'Carrera. 33a #15-49 Conjunto Residencial El Oasis – Casa 23',
      ciudad: 'Villavicencio - Meta',
      telefono: '310 355 6449'
    };
  }
  return {
    direccion: 'Calle 41ª #24-38 Barrio Príncipe, Tuluá – Valle del Cauca',
    ciudad: '',
    telefono: '224 8763'
  };
};
const correoPorMunicipio = (municipio) => {
  const m = (municipio || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  if (m.includes('tulua')) return 'tulua@intecoalsas.com';
  if (m.includes('andalucia')) return 'andalucia@intecoalsas.com';
  if (m.includes('san pedro')) return 'sanpedro@intecoalsas.com';
  if (m.includes('calima')) return 'calima@intecoalsas.com';
  if (m.includes('villavicencio')) return 'villavicencio@intecoalsas.com';
  return 'andalucia@intecoalsas.com';
};

export const MembreteRecibo = ({ municipio }) => {
  const datos = datosPorMunicipio(municipio);
  return (
  <div className="pb-2" style={printExact}>
    <div className="flex items-center justify-start gap-4">
      <div className="flex flex-col items-start">
        <img
          src="/recibo-tecnico/logo.png"
          alt="INTECOAL S.A.S. Interventoría Alumbrado Público"
          style={{ width: '111px', height: '80px', objectFit: 'contain' }}
        />
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#000000', paddingLeft: '22px' }}>NIT: 901.582.227-1</span>
      </div>
      <div className="text-left space-y-1 pt-1" style={{ fontSize: '11px', color: '#595959' }}>
        <div className="flex items-center justify-start" style={{ gap: '4px' }}>
          <img src="/recibo-tecnico/dir.png" alt="" style={{ width: '13px', height: '13px' }} />
          <span>{datos.direccion}</span>
        </div>
        {datos.ciudad && (
          <div className="font-bold" style={{ color: '#000000', paddingLeft: '17px' }}>{datos.ciudad}</div>
        )}
        <div className="flex items-center justify-start" style={{ gap: '4px' }}>
          <img src="/recibo-tecnico/mail.png" alt="" style={{ width: '13px', height: '13px' }} />
          <span>{correoPorMunicipio(municipio)}</span>
        </div>
        <div className="flex items-center justify-start" style={{ gap: '4px' }}>
          <img src="/recibo-tecnico/tel.png" alt="" style={{ width: '13px', height: '13px' }} />
          <span>{datos.telefono}</span>
        </div>
      </div>
    </div>
    {/* Línea superior: abajo del encabezado, de margen a margen */}
    <hr style={{ border: 'none', height: '3px', backgroundColor: '#4E3629', margin: '20px 0', width: '100%', ...printExact }} />
  </div>
  );
};

export const FranjaCorporativa = () => (
  <footer style={{ width: '100%', boxSizing: 'border-box', fontFamily: 'sans-serif', marginTop: '60px', paddingBottom: '50px', ...printExact }}>

    {/* Contenedor principal que alinea perfectamente las dos secciones en el mismo nivel inferior */}
    <div style={{ display: 'flex', alignItems: 'flex-end', width: '100%' }}>

      {/* Bloque Izquierdo Sólido (Marrón + Dorado) con corte diagonal corregido */}
      <div style={{
        width: '35%',
        height: '44px',
        background: 'linear-gradient(to bottom, #4E3629 50%, #D9CF43 50%)',
        clipPath: 'polygon(0 0, 100% 0, 85% 100%, 0 100%)',
        flexShrink: 0,
        ...printExact
      }}></div>

      {/* Contenedor Derecho: Mueve el texto arriba y pega la línea justo en la base del bloque */}
      <div style={{
        width: '65%',
        display: 'flex',
        flexDirection: 'column',
        marginLeft: '-4.5%',
        marginBottom: '0px'
      }}>

        {/* Texto Web: Ahora se ubica exactamente arriba de la línea, sin estorbar a la diagonal */}
        <span style={{
          fontSize: '13px',
          color: '#4E3629',
          marginBottom: '4px',
          paddingLeft: '25px',
          fontWeight: 600,
          letterSpacing: '0.3px'
        }}>www.Intecoalsas.com</span>

        {/* Línea delgada horizontal perfectamente conectada a la base */}
        <div style={{ width: '100%', height: '3px', backgroundColor: '#4E3629', ...printExact }}></div>

      </div>
    </div>
  </footer>
);
