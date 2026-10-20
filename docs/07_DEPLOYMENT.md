# Guía de Despliegue

El portal se compone de dos piezas desplegadas por separado:
- **Backend (Render.com):** Python FastAPI + GraphService.
- **Frontend (Netlify):** React + Vite (build estático → `dist/`).

El repositorio ya incluye los archivos de despliegue:
- `render.yaml` → backend en Render.
- `netlify.toml` → frontend en Netlify (build + proxy `/api`).

## URLs de producción

| Pieza | URL |
|-------|-----|
| Frontend (Netlify) | `https://entregadeproyectos.netlify.app` |
| Backend (Render) | `https://radicados-intecoal-sas.onrender.com` |
| Proxy de API | `https://entregadeproyectos.netlify.app/api/*` → Render (redirect con `force = true` en `netlify.toml`) |

> Si cambias el nombre del sitio en Netlify, actualiza **a la vez**: `VITE_MSAL_REDIRECT_URI` (Netlify), la URI de redirección registrada en la app de Azure AD y `FRONTEND_URL` / `ALLOWED_ORIGINS` (Render). Un cambio solo de CORS hace fallar `/api/*` en el navegador.

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
SHAREPOINT_LIBRARY_ID=Documents   # nombre de la librería (se resuelve por nombre; si no existe usa la primera)

M365_SENDER_EMAIL=coord.tecnico@intecoalsas.com
M365_NOTIFICATION_RECIPIENT=coord.tecnico@intecoalsas.com  # revisor: avisos de nuevo radicado y vencimientos

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

### 4. Redirect del SPA (opcional)

El portal **no usa rutas con path** (es una sola pantalla con pestañas), así que no hace falta regla de SPA: todas las visitas caen en `/`. Solo añade el fallback si en algún momento incorporas rutas profundas:

```
/*  /index.html  200
```

Se puede añadir en un archivo `public/_redirects` o como redirect en Netlify. Si la añades, colócala **después** de la regla de `/api/*` (que lleva `force = true`).

### 5. Custom Domain (opcional)

1. **Site settings** → **Domain management**.
2. Agregar dominio: `portal.intecoalsas.com`.
3. DNS:
   ```
   CNAME  portal  →  <tu-sitio>.netlify.app
   ```

---

> Para el desarrollo **local**, ver [02_INICIO-RAPIDO.md](02_INICIO-RAPIDO.md). Este documento cubre únicamente el despliegue en **producción**.

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

> Nota: la creación automática de columnas de lista (`RawJson`, `NombreProyecto`, `CreadorEmail`) exige permiso de escritura de esquema. Sin él verás `403` en el arranque (`[GRAPH] Error creando columna...`); la app sigue funcionando pero omite esas columnas (créalas manualmente como texto si las necesitas).

### Error JWT / sesión
**Síntoma:** `401 Unauthorized`.
**Solución:** Verificar `SECRET_KEY` configurado y consistente entre instancias.

### Archivos no suben
**Síntoma:** 413/400 al subir.
**Solución:** Tamaño ≤ 50 MB y extensión permitida (PDF, imágenes, DWG/DXF; la validación acepta por MIME o por extensión).

### Render en frío (plan gratuito)
**Síntoma:** la primera petición tras inactividad falla o tarda ~1 min.
**Solución:** reintentar pasado un minuto. El frontend espera hasta 3 min en la radicación y el reintento de SharePoint hasta 3 min; si falla, muestra el motivo real en lugar de un error genérico.

### Login M365 falla
**Síntoma:** `timed_out` / `block_nested_popups`.
**Solución:** `VITE_MSAL_REDIRECT_URI` debe coincidir con la URI registrada en Azure AD; MSAL usa `loginRedirect` con timeout de 3 min para MFA.

### La lista de radicaciones aparece vacía
**Diagnóstico (F12 → Network → `lista`):**

| Estado de `lista` | Causa | Acción |
|---|---|---|
| `200` con datos | El filtro por correo del rol **Contratista** solo muestra los radicados que ese usuario creó (`creadorEmail`) | Entrar con el mismo correo con el que se radicó (el rol Revisor ve todo) |
| `401` con cuerpo HTML | La **contraseña de Access control de Netlify** está interceptando el proxy a `/api/*` (sin cookie de sesión devuelve `401 text/html`) | Volver a autenticarse en el sitio o quitar la protección en **Site settings → Access control** |
| `401` con JSON | JWT ausente/expirado | Cerrar sesión y volver a entrar |
| `500` / `502` | Backend caído o reiniciando (plan gratuito en frío) | Esperar ~1 min y recargar |

Comprobación rápida de CORS desde la consola del navegador: si `lista` está bloqueado por CORS, revisa `FRONTEND_URL`/`ALLOWED_ORIGINS` en Render.

### Se perdieron radicados creados en producción
**Causa:** Render (plan gratuito) **no tiene disco persistente** — `render.yaml` no declara `disks`, así que el archivo `backend/data/radicaciones.json` vuelve al estado del repositorio en **cada redespliegue o reinicio**.
**Solución:** respaldar/crear los radicados donde sí persisten (SharePoint, que es la fuente oficial al aprobar), o montar un disco persistente en Render y mover `DATA_FILE` ahí.

### Subidas grandes fallan (DWG/DXF de varios MB)
**Síntoma:** la subida se corta sin mensaje claro.
**Causas reales:** el proxy de Netlify corta peticiones **> 26 s** y hay un límite de tamaño en el POST que atraviesa el proxy; el backend acepta **≤ 50 MB** (PDF, imágenes, DWG/DXF).
**Solución:** no reducir `MAX_TAMANIO_BYTES`; si el archivo es muy grande, subirlo con la conexión estable o servir la subida directa contra Render para diagnóstico.
