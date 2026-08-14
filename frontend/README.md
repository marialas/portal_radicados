# Frontend Vanilla HTML / JavaScript - INTECOAL SAS

Aplicación de interfaz de usuario desacoplada construida en **HTML5, JavaScript (Vanilla ES6) y Tailwind CSS**, conservando el **100% de la experiencia de usuario, diseño de interfaz e interactividad** del portal de radicación documental e interventoría de Alumbrado Público (RETILAP/RETIE).

## 🌟 Características
- **Multi-Vista SPA**: Listado de Radicaciones, Nueva Radicación con Carga de Archivos, Evaluación de Interventoría de 21 ítems RETILAP, Informe de Recibido a Conformidad con Firma Digital y Visor OneDrive.
- **Firma Digital Eletrónica integrada (Ley 527)**: Canvas táctil para firma dibujada a mano, estampa tipográfica y carga de archivos con hash de verificación.
- **Informe Oficial Impresurable**: Generación de acta oficial en formato carta para impresión/exportación a PDF con logo e imágenes.
- **Totalmente desacoplado**: Diseñado para conectarse al backend independiente en **Python · FastAPI** (`http://localhost:8000/api`).

## 🛠️ Despliegue

Puedes alojar este frontend en cualquier proveedor de contenido estático (Jamstack / CDN):
- **Vercel / Netlify / Cloudflare Pages**: Sube la carpeta `/frontend`
- **GitHub Pages**: Configura la rama `gh-pages` apuntando a `/frontend`
- **Servidor Nginx / Apache**: Copia los archivos dentro de `/var/www/html/`

## ⚙️ Configuración del Backend API
Por defecto, `frontend/js/api.js` apunta a `http://localhost:8000/api` en desarrollo local. Para producción, actualiza la constante `API_BASE_URL` en `frontend/js/api.js` con la URL de tu backend FastAPI en Cloud Run / Render / Railway.
