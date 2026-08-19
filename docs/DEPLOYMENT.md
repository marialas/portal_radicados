# Guía de Despliegue

## Despliegue en Render.com (Backend)

### 1. Crear Servicio Web

1. Ir a [render.com](https://render.com) → **New Web Service**
2. Conectar repositorio GitHub
3. Configurar:
   - **Name:** `portal-intecoal-api`
   - **Region:** Oregon (o la más cercana)
   - **Runtime:** Python 3
   - **Build Command:**
     ```bash
     cd backend && pip install -r requirements.txt
     ```
   - **Start Command:**
     ```bash
     cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
     ```

### 2. Variables de Entorno

Agregar en **Environment** → **Env Variables**:

```bash
SECRET_KEY=generar-con-python-secrets
FRONTEND_URL=https://tu-sitio.netlify.app
AZURE_CLIENT_ID=tu-client-id
AZURE_TENANT_ID=tu-tenant-id
AZURE_CLIENT_SECRET=tu-client-secret
SHAREPOINT_SITE_ID=tu-site-id
SHAREPOINT_LIST_ID=tu-list-id
SHAREPOINT_LIBRARY_ID=Documentos_Radicacion
M365_SENDER_EMAIL=interventoriaapalborada@intecoalsas.com
M365_NOTIFICATION_RECIPIENT=anyeli_cabezas@soy.sena.edu.co
```

### 3. Generar SECRET_KEY

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### 4. Verificar

```bash
# Health check
curl https://portal-intecoal-api.onrender.com/api/health

# Response: {"status":"ok","timestamp":"..."}
```

---

## Despliegue en Netlify (Frontend)

### 1. Preparar Archivos

Asegurar que `frontend/` contiene:
```
frontend/
├── index.html
├── radicaciones.html
├── nueva-radicacion.html
├── evaluacion.html
├── informe.html
└── js/
    ├── comun.js
    ├── firma.js
    └── zip.js
```

### 2. Configurar API_URL

En `frontend/js/comun.js`, configurar la URL del backend:

```javascript
// Opción 1: Variable global (agregar antes de comun.js en cada HTML)
window.__API_URL__ = 'https://portal-intecoal-api.onrender.com';

// Opción 2: Meta tag (agregar en <head> de cada HTML)
// <meta name="api-url" content="https://portal-intecoal-api.onrender.com">

// Opción 3: Detectar automáticamente (ya implementado)
const API_URL = window.__API_URL__
    || document.querySelector('meta[name="api-url"]')?.content
    || (window.location.hostname === 'localhost' ? 'http://localhost:8000' : '');
```

**Recomendado:** Usar meta tag en cada HTML:
```html
<head>
    <meta name="api-url" content="https://portal-intecoal-api.onrender.com">
</head>
```

### 3. Crear Sitio en Netlify

1. Ir a [app.netlify.com](https://app.netlify.com) → **Add new site**
2. **Deploy manually** → Arrastrar carpeta `frontend/`
3. O **Import from Git** → Conectar repositorio

### 4. Configurar Dominio

1. **Site settings** → **Domain management**
2. Agregar dominio personalizado: `portal.intecoalsas.com`
3. Configurar DNS:
   ```
   CNAME  portal  →  tu-sitio.netlify.app
   ```

### 5. Headers de Seguridad

Crear `frontend/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Content-Security-Policy: default-src 'self' https://cdn.tailwindcss.com https://alcdn.msauth.net https://cdnjs.cloudflare.com; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://alcdn.msauth.net https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com; img-src 'self' data: blob:; connect-src 'self' https://portal-intecoal-api.onrender.com
```

### 6. Redirects (SPA-like)

Crear `frontend/_redirects`:

```
/radicaciones.html  /radicaciones.html  200
/nueva-radicacion.html  /nueva-radicacion.html  200
/evaluacion.html  /evaluacion.html  200
/informe.html  /informe.html  200
```

---

## Desarrollo Local

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Editar .env con credenciales de pruebas
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
# Opción A: VS Code Live Server
# Opción B: Python
python -m http.server 5500

# Abrir http://localhost:5500
```

### Verificar Conexión

```bash
# Backend
curl http://localhost:8000/api/health

# Frontend (abrir en navegador)
# http://localhost:5500 → Login → Radicaciones
```

---

## Troubleshooting

### Error CORS

**Síntoma:** `Blocked by CORS policy: No 'Access-Control-Allow-Origin' header`

**Solución:** Verificar que `FRONTEND_URL` en Render coincide exactamente con la URL de Netlify (incluyendo `https://`).

### Error 403 SharePoint

**Síntoma:** `403 Forbidden` al crear carpetas o subir archivos

**Solución:** Verificar permisos `Sites.ReadWrite.All` y `Files.ReadWrite.All` en Azure AD App con admin consent.

### Error JWT

**Síntoma:** `401 Unauthorized` en peticiones autenticadas

**Solución:** Verificar que `SECRET_KEY` está configurado y es el mismo en todas las instancias del backend.

### Archivos No Suben

**Síntoma:** Error 413 o 400 al subir archivos

**Solución:** Verificar tamaño (máx 50 MB) y MIME type (solo PDF, JPEG, PNG, Word, Excel).

### Frontend No Conecta al Backend

**Síntoma:** `Failed to fetch` o errores de red

**Solución:** Verificar `api-url` meta tag o `window.__API_URL__` apunta al backend correcto con `/api/` al final.
