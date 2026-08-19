# Seguridad

## Autenticación

### JWT (JSON Web Token)

- **Algoritmo:** HS256 (HMAC-SHA256)
- **Expiración:** 24 horas
- **Almacenamiento:** `sessionStorage` del navegador
- **Header:** `Authorization: Bearer <token>`

#### Payload del Token

```json
{
    "sub": "anyeli_cabezas@soy.sena.edu.co",
    "email": "anyeli_cabezas@soy.sena.edu.co",
    "role": "contratista",
    "company": "SENA",
    "exp": 1705312200,
    "iat": 1705225800
}
```

#### Variables Requeridas

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SECRET_KEY` | Clave secreta para firmar JWT (mín. 32 chars) | `mi-clave-secreta-super-larga-123` |
| `ALGORITHM` | Algoritmo de firma | `HS256` |
| `TOKEN_EXPIRE_HOURS` | Horas hasta expiración | `24` |

### MSAL (Microsoft Authentication Library)

- **CDN:** `https://alcdn.msauth.net/browser/2.38.0/js/msal-browser.min.js`
- **Flujo:** `loginPopup` → `account` → backend verify → JWT
- **Tenant ID:** `e21e342d-3685-40e3-b423-68e9e26f3f62`
- **Client ID:** `c2b52f20-4e2c-4e26-bf20-8ab36a82e3d9`

#### Dominios Permitidos

| Dominio | Rol | Empresa |
|---------|-----|---------|
| `intecoalsas.com` | interventor | INTECOAL S.A.S. |
| `intecoal.com` | interventor | INTECOAL S.A.S. |
| `soy.sena.edu.co` | contratista | SENA |
| `sena.edu.co` | contratista | SENA |
| `electroingenieria.com.co` | contratista | ELECTROINGENIERIA S.A.S. |

## Autorización

### Roles

| Rol | Permisos |
|-----|----------|
| `interventor` | Evaluar documentos, aprobar/rechazar, generar informe, sincronizar SharePoint |
| `contratista` | Crear radicaciones, subir archivos, firmar declaración |

### Control de Acceso en Frontend

```javascript
// Verificar rol en cada página
if (!verificarAcceso('interventor')) throw new Error('No autorizado');

// Botones condicionales por rol
if (esInterventor()) {
    // Mostrar panel de evaluación
}
```

## CORS (Cross-Origin Resource Sharing)

```python
# Backend: solo permitir origen Netlify
FRONTEND_URL = os.getenv("FRONTEND_URL")  # https://tu-sitio.netlify.app
cors_origins = [FRONTEND_URL, "http://localhost:5500"]

# Métodos permitidos
allow_methods = ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
```

**Nunca usar `allow_origins=["*"]` en producción.**

## Validación de Archivos

### MIME Types Permitidos

Solo se permite PDF en todo el módulo de radicación:

```
application/pdf
```

### Límites

| Parámetro | Valor |
|-----------|-------|
| Tamaño máximo | 50 MB (52,428,800 bytes) |
| Tipos permitidos | Solo PDF |
| Validación | Server-side en `POST /api/radicacion/{id}/archivo` y `POST /api/radicacion/nueva` |

## Firma Digital

### Canvas de Firma

- **Formato:** PNG (data:image/png;base64,...)
- **Hash:** SHA-256 del contenido + timestamp
- **Almacenamiento:** En metadata de la radicación

```javascript
// Firma generada
{
    "dataUrl": "data:image/png;base64,iVBORw0KGgo...",
    "hashVerificacion": "a1b2c3d4e5f6...",
    "nombreSignatario": "Anyeli Cabezas",
    "fechaFirma": "2026-01-15T10:30:00Z"
}
```

### Verificación de Integridad

El hash se genera con:
```
SHA256(dataUrl + fechaFirma + nombreSignatario)
```

## SharePoint

### Permisos Azure AD App

| Permiso | Tipo | Descripción |
|---------|------|-------------|
| `Sites.ReadWrite.All` | Application | Leer/escribir en SharePoint |
| `Files.ReadWrite.All` | Application | Subir archivos a OneDrive/SharePoint |
| `Mail.Send` | Application | Enviar correos vía Outlook |

### Estructura de Carpetas

```
Documentos_Radicacion/
├── {CODIGO_PROYECTO}/
│   ├── Diseno/          (docs A.1-A.5)
│   ├── Luminarias/      (docs B.1-B.5)
│   ├── Constructora/    (docs C.1-C.5)
│   └── Dictamenes/      (docs D.1-D.6)
```

## Variables de Entorno (Producción)

```bash
# Seguridad
SECRET_KEY=<clave-aleatoria-32+ caracteres>
FRONTEND_URL=https://tu-sitio.netlify.app

# Azure AD
AZURE_CLIENT_ID=<client-id>
AZURE_TENANT_ID=<tenant-id>
AZURE_CLIENT_SECRET=<client-secret>

# SharePoint
SHAREPOINT_SITE_ID=<site-id>
SHAREPOINT_LIST_ID=<list-id>
SHAREPOINT_LIBRARY_ID=Documentos_Radicacion

# Correo
M365_SENDER_EMAIL=interventoriaapalborada@intecoalsas.com
M365_NOTIFICATION_RECIPIENT=anyeli_cabezas@soy.sena.edu.co

# Power Automate
POWER_AUTOMATE_WEBHOOK_URL=<webhook-url>
```

## Recomendaciones

1. **Generar SECRET_KEY aleatorio:**
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

2. **No commitear `.env`:** Agregar a `.gitignore`

3. **HTTPS obligatorio:** Netlify y Render usan HTTPS por defecto

4. **Rotar secrets:** Renovar `AZURE_CLIENT_SECRET` cada 6-12 meses

5. **Auditoría:** Revisar logs de acceso periódicamente
