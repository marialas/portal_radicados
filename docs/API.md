# Referencia API REST

- **Base URL (desarrollo):** `http://localhost:8000` (el frontend de Vite proxifica `/api/*` a esta URL).
- **Base URL (producción):** `https://radicados-intecoal-sas.onrender.com`

Todos los endpoints de negocio viven bajo el prefijo `/api`.

---

## Autenticación

La autenticación es mediante **cuenta de Microsoft 365 (MSAL)**. El frontend obtiene el identificador de la cuenta M365 y lo verifica en el backend para generar un JWT de sesión.

Todas las peticiones autenticadas llevan el header:

```
Authorization: Bearer <jwt_token>
```

### POST /api/auth/token

Genera un token JWT a partir de identidad de sesión (flujo no-M365 / verificación de sesión).

```jsonc
// Request
{
  "email": "anyeli_cabezas@soy.sena.edu.co",
  "company": "SENA",
  "role": "contratista"
}

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "email": "...", "company": "SENA", "role": "contratista" }
}
```

### POST /api/auth/msal-verify

Verifica la sesión/cuenta de Microsoft 365 y devuelve el usuario autenticado con su rol.

```jsonc
// Request
{
  "email": "anyeli_cabezas@soy.sena.edu.co",
  "name": "Anyeli Cabezas",
  "role": "contratista"
}

// Response 200
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "user": { "isAuthenticated": true, "name": "...", "email": "...", "role": "contratista" }
}
```

> **Roles por dominio (validados en el backend y en `src/lib/msalConfig.js`):**
> - Revisor/Interventor: `@intecoalsas.com`, `@intecoal.com.co`
> - Contratista/Creador: cualquier correo M365

---

## Salud y Catálogo

### GET /api/health

```jsonc
// 200
{ "status": "ok", "timestamp": "2026-01-15T10:30:00Z" }
```

### GET /api/documentos/catalogo

Devuelve el catálogo de los 21 documentos RETILAP.

```jsonc
// 200
{
  "data": [
    {
      "id": 1,
      "code": "A.1",
      "name": "Planos de Luminotecnia",
      "description": "...",
      "category": "diseno",
      "folderGroup": "Diseno"
    }
  ],
  "total": 21
}
```

---

## Radicaciones

### GET /api/radicacion/lista

Lista radicaciones con filtros. El **contratista** solo ve sus propias radicaciones; el **revisor** ve todas.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `email` | string | Filtrar por correo del creador |
| `rol` | string | Rol del usuario (`interventor` o `contratista`) |
| `search` | string | Búsqueda por radicado, código, nombre, contratista, municipio |
| `municipio` | string | Filtrar por municipio |
| `estado` | string | Filtrar por estado (`Radicado`, `En Revisión`, `Con Observaciones`, `Aprobado`) |
| `tipo` | string | Filtrar por tipo de entrega (`Inicio`, `Subsanación`) |

```jsonc
// 200
{
  "data": [
    {
      "id": "abc-123",
      "numeroRadicado": "RAD-2026-0001",
      "estado": "Radicado",
      "documentosOk": 5,
      "porcentajeCumplimiento": 23,
      "metadata": { "..." },
      "archivos": [ "..." ],
      "historial": [ { "estado": "Radicado", "fecha": "...", "usuario": "..." } ]
    }
  ],
  "total": 3
}
```

### GET /api/radicacion/{identificador}

Obtiene una radicación por **ID** o por **número de radicado**.

```jsonc
// 200
{
  "data": {
    "id": "abc-123",
    "numeroRadicado": "RAD-2026-0001",
    "metadata": { "..." },
    "archivos": [ "..." ],
    "elementosEntregados": [ "..." ],
    "historial": [ "..." ]
  }
}
```

### GET /api/radicacion/{identificador}/historial

Devuelve el historial de cambios de estado de una radicación.

```jsonc
// 200
{
  "data": [
    { "estado": "Radicado", "fecha": "...", "usuario": "...", "usuarioNombre": "...", "observaciones": "" },
    { "estado": "Con Observaciones", "fecha": "...", "usuario": "...", "usuarioNombre": "...", "observaciones": "..." }
  ]
}
```

### POST /api/radicacion/nueva

Crea una nueva radicación (**multipart/form-data**).

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `metadatos` | string (JSON) | Sí | Metadata del proyecto (incluye `creadorEmail`, `creadorName`, `firmaContratista`). |
| `elementos` | string (JSON) | No | Array de elementos entregados. |
| `naDocs` | string (JSON) | No | Array de IDs de docs marcados N/A. |
| `docsAdicionales` | string (JSON) | No | Array de objetos para documentos manuales. |
| `archivo_*` | File[] | No | Archivos por código de documento (`archivo_A.1`, `archivo_B.2`, etc.). |

La radicación se crea con estado `Radicado` y notifica al revisor (`enviar_correo_nuevo_radicado_revisor`) y al contratista (`enviar_correo_nuevo_radicado_contratista`).

### POST /api/radicacion/{identificador}/archivo

Sube/reemplaza el archivo de un documento de una radicación existente.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `docId` | int | Sí | ID del documento (1–21 para estándar, mayor para manuales). |
| `archivo` | File | Sí | Archivo (PDF, imagen o DXF/DWG). |

### PATCH /api/radicacion/{identificador}/estado

Actualiza el estado y (opcionalmente) metadata/archivos de una radicación.

```jsonc
// Request
{
  "estado": "Aprobado",
  "observaciones": "Todos los documentos verificados",
  "archivos": [ "..." ],
  "metadata": { "firmaInterventoria": { "..." } },
  "usuarioEmail": "revisor@intecoalsas.com",
  "usuarioNombre": "Revisor de Obra"
}
```

**Efectos secundarios (automatizados por el backend):**
- Se registra la entrada en el **historial** de la radicación.
- Si `estado = "Aprobado"` → sincronización automática a SharePoint.
- Si `estado` cambia a `Aprobado`/`Con Observaciones` → correo de resultado al **contratista** (`enviar_correo_estado`).
- Si `estado` cambia **a `En Revisión`** (desde otro estado) → correo al **revisor** (`enviar_correo_reesubido_revisor`) y correo de confirmación de subida al **contratista** (`enviar_correo_reenvio_contratista`).

### PATCH /api/radicacion/{identificador}/metadata

Actualiza metadatos, archivos u observaciones de una radicación sin cambiar necesariamente el estado.

```jsonc
// Request
{
  "metadata": { "responsableRevision": "Nuevo Revisor" },
  "archivos": [ "..." ],
  "elementosEntregados": [ "..." ],
  "observacionesGenerales": "...",
  "soloAvance": false   // true → borrador del revisor (sin sync/historial/notificaciones)
}
```

> **`soloAvance: true`**: modo "Guardar Avance" del revisor. Se persisten los cambios **sin** sincronizar a SharePoint, **sin** registrar historial y **sin** enviar notificaciones.

### DELETE /api/radicacion/{identificador}

Elimina una radicación. Solo permite eliminar la **más reciente** (primera de la lista).

```jsonc
// 200
{ "ok": true, "message": "Radicación eliminada correctamente" }

// 400 si no es la más reciente
```

---

## Archivos (visor)

### GET /api/files/view/{radicacion_id}/{doc_id}

Devuelve el archivo de un documento para visualizarlo.

- **PDF e imágenes:** se sirven con `Content-Disposition: inline` para verse en el navegador.
- **DXF:** el frontend lo muestra con el visor CAD (`@cadview/react`).
- **DWG/DWF/DWT:** no visualizables en línea; el frontend ofrece descargar.

---

## Microsoft 365 / SharePoint

### GET /api/m365/status

Estado de la conexión con Microsoft 365 (llenado de `AZURE_*` / `SHAREPOINT_*`).

```jsonc
// 200
{
  "azureClientId": "...",
  "azureTenantId": "...",
  "sharepointSiteId": "...",
  "sharepointListId": "...",
  "isConnected": true
}
```

### GET /api/m365/list-columns

Columnas de la lista de SharePoint configurada.

### POST /api/m365/test-connection

Prueba la conexión con Microsoft Graph.

```jsonc
// 200
{ "ok": true, "conexion": "Exitosa", "usuario": "interventoriaapalborada@intecoalsas.com" }
```

### GET /api/m365/webhook-config

Obtiene la configuración del webhook (Power Automate).

### POST /api/m365/webhook-config

Actualiza la URL del webhook.

```jsonc
// Request
{ "webhookUrl": "https://prod-XX.logic.azure.com/..." }
```

### GET /api/sharepoint/schema

Devuelve el esquema/catálogo documental usado para SharePoint.

---

## Estados y Códigos de Respuesta

### Estados de radicación
| Estado | Significado |
|--------|-------------|
| `Radicado` | Creado por el contratista. |
| `En Revisión` | Reenviado / en evaluación. |
| `Con Observaciones` | Devuelto con correcciones. |
| `Aprobado` | Conforme y sincronizado a SharePoint. |

### Códigos HTTP
| Código | Significado |
|--------|-------------|
| 200 | Éxito |
| 400 | Solicitud inválida (datos faltantes, MIME no permitido) |
| 404 | Recurso no encontrado |
| 413 | Archivo supera el límite de 50 MB |
| 500 | Error interno del servidor |
| 503 | Servicio no disponible (GraphService offline) |

---

## Validación de Archivos (Backend)

- **MIME permitidos:** PDF, imágenes (JPEG, PNG, TIFF, BMP, GIF) y planos (DWG, DXF, ACAD). (`MIME_PERMITIDOS` en `backend/main.py`)
- **Límite:** 50 MB por archivo (`MAX_TAMANIO_BYTES`).
