# Portal INTECOAL — Radicación Técnica RETILAP

Sistema integral de radicación, evaluación y certificación de expedientes técnicos de alumbrado público bajo la Resolución 40150 de 2024 (RETILAP) y RETIE.

## Arquitectura

```
┌─────────────────────────────────────────────────┐
│  FRONTEND (Netlify)                             │
│  HTML + Tailwind CDN + JavaScript Vanilla       │
│  index │ radicaciones │ nueva-radicacion │ ...  │
└───────────────────┬─────────────────────────────┘
                    │ REST API (fetch)
┌───────────────────▼─────────────────────────────┐
│  BACKEND (Render.com)                           │
│  Python FastAPI + httpx + python-jose           │
│  main.py │ modelos.py │ grafos.py              │
└───────────────────┬─────────────────────────────┘
                    │ Microsoft Graph API
┌───────────────────▼─────────────────────────────┐
│  SERVICIOS M365                                 │
│  SharePoint Online │ Correo Outlook │ Azure AD  │
└─────────────────────────────────────────────────┘
```

## Inicio Rápido

### Requisitos
- Python 3.10+
- Node.js (solo para desarrollo local del frontend)

### Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env          # Editar con credenciales reales
uvicorn main:app --reload     # http://localhost:8000
```

### Frontend

```bash
cd frontend
# Opción A: Live Server (VS Code)
# Opción B: Python
python -m http.server 5500    # http://localhost:5500
```

## Estructura del Proyecto

```
portal_intecoal/
├── backend/
│   ├── main.py               # API FastAPI, endpoints, CORS, JWT
│   ├── modelos.py             # Catálogo 21 documentos RETILAP, estados
│   ├── grafos.py              # GraphService: SharePoint, correo, Graph API
│   ├── requirements.txt       # Dependencias Python
│   └── .env.example           # Plantilla de variables de entorno
├── frontend/
│   ├── index.html             # Login M365 + acceso directo
│   ├── radicaciones.html      # Lista principal con filtros
│   ├── nueva-radicacion.html  # Wizard 3 pasos: docs → metadatos → firma
│   ├── evaluacion.html        # Evaluación item por item (interventor)
│   ├── informe.html           # Informe de conformidad imprimible
│   └── js/
│       ├── comun.js           # API helper, JWT, utilidades compartidas
│       ├── firma.js           # Canvas firma digital (dibujar/texto/imagen)
│       └── zip.js             # Generación ZIP client-side del expediente
├── src/                       # [Referencia] Código React original
├── server.ts                  # [Referencia] Express original
└── docs/
    ├── README.md              # Este archivo
    ├── ARCHITECTURE.md        # Arquitectura técnica detallada
    ├── API.md                 # Referencia de endpoints
    ├── SECURITY.md            # Seguridad y autenticación
    └── DEPLOYMENT.md          # Guía de despliegue
```

## Tecnologías

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Frontend | HTML + Tailwind CSS (CDN) | UI responsiva sin build step |
| Frontend | JavaScript Vanilla | Lógica de cliente, firma, ZIP |
| Backend | Python FastAPI | API REST, CORS, JWT |
| Backend | httpx | Cliente HTTP async para Graph API |
| Backend | python-jose | JWT tokens (HS256) |
| Infra | Netlify | Hosting frontend estático |
| Infra | Render.com | Hosting backend Python |
| Servicios | Microsoft Graph API | SharePoint, correo, Azure AD |
| Servicios | MSAL (CDN) | Autenticación Azure AD |

## Funcionalidades

### Contratista
- Crear nueva radicación con 21 documentos RETILAP + documentos adicionales manuales
- Subir archivos (solo PDF) — máx. 50 MB
- Nombre auto-enlazado desde correo de autenticación
- Solo ve sus propias radicaciones
- Firmar declaración juramentada (firma libre)
- Marcar documentos N/A
- Descargar ZIP del expediente

### Interventor (Revisión)
- Evaluar cada documento: Cumple / No Cumple / Pendiente / N/A
- Asignar dictamen general y observaciones
- Generar informe de conformidad (imprimir PDF)
- Aprobado → sincronización automática a SharePoint
- Eliminar solo la radicación más reciente
- Enviar notificación por correo (general al interventor, al contratista al evaluar)

### Seguridad
- JWT (HS256) con expiración de 24h
- CORS restringido al dominio Netlify
- Validación MIME (solo PDF)
- Límite de 50 MB por archivo
- Autenticación Azure AD vía MSAL
- Roles: interventor / contratista
- Sin datos de prueba en producción

## Credenciales

El usuario por defecto de pruebas es:
- **Correo:** `anyeli_cabezas@soy.sena.edu.co`
- **Remitente fijo:** `interventoriaapalborada@intecoalsas.com`

Todas las notificaciones de correo van a `M365_NOTIFICATION_RECIPIENT` en modo pruebas.

## Licencia

Proyecto privado — INTECOAL S.A.S. / SENA
