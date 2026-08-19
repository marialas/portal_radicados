# Referencia API REST

Base URL: `http://localhost:8000` (desarrollo) / `https://tu-app.onrender.com` (producción)

## Autenticación

Todas las peticiones autenticadas llevan el header:
```
Authorization: Bearer <jwt_token>
```

### POST /api/auth/token

Generar token JWT con credenciales manuales.

```json
// Request
{
    "email": "anyeli_cabezas@soy.sena.edu.co",
    "company": "SENA",
    "role": "contratista"
}

// Response 200
{
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
        "email": "anyeli_cabezas@soy.sena.edu.co",
        "company": "SENA",
        "role": "contratista"
    }
}
```

### POST /api/auth/msal-verify

Verificar cuenta Azure AD y generar JWT.

```json
// Request
{
    "account": {
        "username": "anyeli_cabezas@soy.sena.edu.co",
        "localAccountId": "abc123"
    }
}

// Response 200
{
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "user": {
        "isAuthenticated": true,
        "name": "Anyeli Cabezas",
        "email": "anyeli_cabezas@soy.sena.edu.co",
        "role": "contratista",
        "company": "SENA"
    }
}
```

## Catálogo

### GET /api/documentos/catalogo

Obtener los 21 documentos RETILAP.

```json
// Response 200
{
    "data": [
        {
            "id": 1,
            "code": "A.1",
            "name": "Planos de Luminotecnia",
            "description": "Planos a escala con distribución de luminarias",
            "category": "diseno",
            "folderGroup": "Diseno"
        }
    ],
    "total": 21
}
```

## Radicaciones

### GET /api/radicacion/lista

Listar radicaciones con filtros opcionales. Contratistas solo ven sus propias radicaciones; interventores ven todas.

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `email` | string | Filtrar por correo del creador (contratista: solo sus radicaciones) |
| `rol` | string | Rol del usuario (`interventor` o `contratista`) |
| `search` | string | Búsqueda por radicado, código, nombre, contratista, municipio |
| `municipio` | string | Filtrar por municipio |
| `estado` | string | Filtrar por estado (Radicado, Aprobado, Con Observaciones) |
| `tipo` | string | Filtrar por tipo entrega (Inicial, Parcial, Final) |

```json
// Response 200
{
    "data": [
        {
            "id": "abc-123",
            "numeroRadicado": "INT-AP-2026-0001",
            "estado": "Radicado",
            "documentosOk": 5,
            "porcentajeCumplimiento": 23,
            "metadata": { "..." },
            "archivos": [ "..." ]
        }
    ],
    "total": 3
}
```

### GET /api/radicacion/{identificador}

Obtener una radicación por ID o número de radicado.

```json
// Response 200
{
    "data": {
        "id": "abc-123",
        "numeroRadicado": "INT-AP-2026-0001",
        "metadata": { "..." },
        "archivos": [ "..." ],
        "elementosEntregados": [ "..." ]
    }
}
```

**Validaciones:**
- MIME: solo PDF (`application/pdf`)
- Tamaño máximo: 50 MB

```json
// Response 200
{
    "data": {
        "id": "nuevo-id",
        "numeroRadicado": "INT-AP-2026-0001",
        "estado": "Radicado",
        "archivos": [ "..." ]
    },
    "ok": true
}
```

### POST /api/radicacion/{identificador}/archivo

Subir un archivo para un documento específico.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `docId` | int | Sí | ID del documento (1-21+ para manuales) |
| `archivo` | File | Sí | Archivo a subir (solo PDF) |

```json
// Response 200
{
    "ok": true,
    "data": { "..." }
}
```

### PATCH /api/radicacion/{identificador}/estado

Actualizar estado de una radicación.

```json
// Request
{
    "estado": "Aprobado",
    "observaciones": "Todos los documentos verificados",
    "archivos": [ "..." ],
    "metadata": { "firmaInterventoria": { "..." } }
}
```

```json
// Response 200
{
    "ok": true,
    "data": { "..." }
}
```

**Efectos secundarios:**
- Si `estado = "Aprobado"` → sincronización automática a SharePoint
- Si el estado cambia → envío de correo de notificación

### PATCH /api/radicacion/{identificador}/metadata

Actualizar metadatos, archivos u observaciones de una radicación.

```json
// Request
{
    "metadata": { "responsableRevision": "Nuevo Revisor" },
    "archivos": [ "..." ],
    "estado": "Aprobado",
    "observacionesGenerales": "..."
}
```

### DELETE /api/radicacion/{identificador}

Eliminar una radicación. Solo permite eliminar la más reciente (la primera de la lista).

```json
// Response 200
{
    "ok": true,
    "message": "Radicación eliminada correctamente"
}
```

**Validaciones:**
- Solo se puede eliminar la radicación más reciente (primera de la lista)
- Si no es la más reciente, retorna 400 con mensaje de error

### POST /api/radicacion/nueva

Crear nueva radicación (multipart/form-data). Soporta documentos adicionales manuales.

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `metadatos` | string (JSON) | Sí | Objeto con metadata del proyecto (incluye `creadorEmail`, `creadorName`) |
| `elementos` | string (JSON) | No | Array de elementos entregados |
| `naDocs` | string (JSON) | No | Array de IDs de docs marcados N/A |
| `docsAdicionales` | string (JSON) | No | Array de objetos `{nombre, categoria}` para documentos manuales |
| `archivos` | File[] | No | Archivos adjuntos (solo PDF) |

## Microsoft 365

### GET /api/m365/status

Estado de la conexión con M365.

```json
// Response 200
{
    "azureClientId": "...",
    "azureTenantId": "...",
    "sharepointSiteId": "...",
    "sharepointListId": "...",
    "isConnected": true
}
```

### POST /api/m365/test-connection

Probar conexión con Microsoft Graph.

```json
// Response 200
{
    "ok": true,
    "conexion": "Exitosa",
    "usuario": "interventoriaapalborada@intecoalsas.com"
}
```

### GET /api/m365/webhook-config

Obtener configuración de webhook.

### POST /api/m365/webhook-config

Actualizar URL de webhook.

```json
// Request
{
    "webhookUrl": "https://prod-XX.logic.azure.com/..."
}
```

## Archivos

### GET /api/files/view/{radicacion_id}/{doc_id}

Obtener información de un archivo subido.

```json
// Response 200
{
    "fileName": "planos.pdf",
    "fileType": "application/pdf",
    "fileSize": 1048576,
    "folderPath": "/Documentos_Radicacion/RETILAP-001/Diseno/",
    "status": "CUMPLE"
}
```

## Salud

### GET /api/health

Health check del servidor.

```json
// Response 200
{
    "status": "ok",
    "timestamp": "2026-01-15T10:30:00Z"
}
```

## Códigos de Respuesta

| Código | Significado |
|--------|-------------|
| 200 | Éxito |
| 400 | Solicitud inválida (datos faltantes, MIME no permitido) |
| 404 | Recurso no encontrado |
| 413 | Archivo supera límite de 50 MB |
| 500 | Error interno del servidor |
| 503 | Servicio no disponible (GraphService offline) |
