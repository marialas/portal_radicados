# Guía de Despliegue

El portal se compone de dos piezas desplegadas por separado:
- **Backend (Render.com):** Python FastAPI + GraphService.
- **Frontend (Netlify):** React + Vite (build estático → `dist/`).

El repositorio ya incluye los archivos de despliegue:
- `render.yaml` → backend en Render.
- `netlify.toml` → frontend en Netlify (build + proxy `/api`).

---

## Despliegue del Backend en Render.com

### Opción A — Blueprint (`render.yaml`)

El archivo `render.yaml` ya describe el servicio `portal-intecoal-api`:

```yaml
buildCommand: pip install -r backend/requirements.txt
startCommand: cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
```

Para usarlo: en Render → **New** → **Blueprint** → conectar el repo de GitHub que contiene `render.yaml`.

### Opción B — Servicio web manual

1. **New** → **Web Service** → conectar el repo.
2. Configurar:
   - **Name:** `portal-intecoal-api`
   - **Runtime:** Python 3
   - **Build Command:**
     ```bash
     pip install -r backend/requirements.txt
     ```
   - **Start Command:**
     ```bash
     cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
     ```

### Variables de Entorno

Agregar en **Environment**:

```bash
SECRET_KEY=<generar-con-python-secrets>
FRONTEND_URL=https://<tu-sitio>.netlify.app
ALLOWED_ORIGINS=<origenes separados por coma o *>

AZURE_CLIENT_ID=<client-id>
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_SECRET=<client-secret>

SHAREPOINT_SITE_ID=<site-id>
SHAREPOINT_LIST_ID=<list-id>
SHAREPOINT_LIBRARY_ID=Documentos_Radicacion

M365_SENDER_EMAIL=interventoriaapalborada@intecoalsas.com
M365_NOTIFICATION_RECIPIENT=<correo-del-revisor>

POWER_AUTOMATE_WEBHOOK_URL=   # opcional
```

> `SECRET_KEY` se genera automáticamente si usas el Blueprint (`generateValue: true`).

### Generar SECRET_KEY manualmente

```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Correos (Microsoft Graph)

- Remitente fijo: `M365_SENDER_EMAIL` (debe tener permiso `Mail.Send`).
- Destinatario del revisor: `M365_NOTIFICATION_RECIPIENT`.
- httpx usa timeouts de `connect=30s` / `total=60s` (evita `ConnectTimeout`). No reducir.

### Verificar

```bash
curl https://<tu-app>.onrender.com/api/health
# {"status":"ok","timestamp":"..."}
```

---

## Despliegue del Frontend en Netlify

El `netlify.toml` ya define el build y el proxy de la API. La URL de producción del backend es **`https://radicados-intecoal-sas.onrender.com`** (es el `to` del redirect del `netlify.toml`).

### 1. Config (en `netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/api/*"
  to = "https://radicados-intecoal-sas.onrender.com/api/:splat"
  status = 200
  force = true

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
```

### 2. Configuración Netlify

| Parámetro | Valor |
|-----------|-------|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Environment | `VITE_MSAL_CLIENT_ID`, `VITE_MSAL_TENANT_ID`, `VITE_MSAL_REDIRECT_URI` |

### 3. Variables de entorno del frontend

```bash
VITE_MSAL_CLIENT_ID=<client-id-de-azure-ad>
VITE_MSAL_TENANT_ID=common
VITE_MSAL_REDIRECT_URI=https://<tu-sitio>.netlify.app
```

> `VITE_MSAL_REDIRECT_URI` en producción debe coincidir exactamente con la URI de redirección registrada en la app de Azure AD.

### 4. Redirect del SPA

Asegurar que exista la regla de SPA (todas las rutas → `index.html`):

```
/*  /index.html  200
```

Se puede añadir en un archivo `public/_redirects` o como redirect en Netlify.

### 5. Custom Domain (opcional)

1. **Site settings** → **Domain management**.
2. Agregar dominio: `portal.intecoalsas.com`.
3. DNS:
   ```
   CNAME  portal  →  <tu-sitio>.netlify.app
   ```

---

> Para el desarrollo **local**, ver [INICIO-RAPIDO.md](INICIO-RAPIDO.md). Este documento cubre únicamente el despliegue en **producción**.

## Troubleshooting

### El correo de notificación no llega
- Confirma que el backend desplegado tenga el código más reciente (notificaciones de reenvío y confirmación).
- En logs de Render busca:
  ```
  [MAIN] Correo de radicado corregido enviado al revisor para RAD-XXX
  [MAIN] Correo de confirmación de subida enviado al contratista para RAD-XXX
  ```
- Verifica `M365_NOTIFICATION_RECIPIENT` (revisor) y el correo del contratista en la metadata.

### Error CORS
**Síntoma:** `Blocked by CORS policy: No 'Access-Control-Allow-Origin' header`.
**Solución:** Verificar `FRONTEND_URL`/`ALLOWED_ORIGINS` en Render coinciden con la URL de Netlify (incluyendo `https://`).

### Error 403 en SharePoint
**Síntoma:** `403 Forbidden` al crear carpetas o subir archivos.
**Solución:** Verificar permisos `Sites.ReadWrite.All`, `Files.ReadWrite.All`, `Mail.Send` en la app Azure AD (Application) con consentimiento de administrador.

### Error JWT / sesión
**Síntoma:** `401 Unauthorized`.
**Solución:** Verificar `SECRET_KEY` configurado y consistente entre instancias.

### Archivos no suben
**Síntoma:** 413/400 al subir.
**Solución:** Tamaño ≤ 50 MB y MIME permitido (PDF, imágenes, DXF/DWG).

### Login M365 falla
**Síntoma:** `timed_out` / `block_nested_popups`.
**Solución:** `VITE_MSAL_REDIRECT_URI` debe coincidir con la URI registrada en Azure AD; MSAL usa `loginRedirect` con timeout de 3 min para MFA.
