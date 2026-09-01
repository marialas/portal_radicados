# Arquitectura y Stack Técnico

## Visión general

```
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Netlify) — React 19 + Vite + Tailwind CSS 4  │
│  src/  (SPA de una sola página, MSAL auth M365)         │
└──────────────────────────┬──────────────────────────────┘
                           │ REST API (/api/*)
                           │ (en dev: proxy de Vite → localhost:8000)
┌──────────────────────────▼──────────────────────────────┐
│  BACKEND (Render.com) — Python FastAPI                  │
│  backend/main.py │ modelos.py │ grafos.py               │
│  Persistencia local: backend/data/radicaciones.json     │
└──────────────────────────┬──────────────────────────────┘
                           │ Microsoft Graph API
┌──────────────────────────▼──────────────────────────────┐
│  SERVICIOS M365 (SharePoint Online)                     │
│  Lista de radicaciones │ Drive de documentos │ Outlook  │
└─────────────────────────────────────────────────────────┘
```

- **Frontend (SPA):** React 19, Vite, Tailwind CSS 4, MSAL `@azure/msal-browser`, `lucide-react`, `motion`, `jszip`, `@cadview/react` (visor DXF).
- **Backend:** FastAPI con httpx (Graph API), python-jose (JWT), python-dotenv.
- **Persistencia:** JSON local (`backend/data/radicaciones.json`) + **sincronización a SharePoint Online** como respaldo persistente.

## Estructura del proyecto

```
portal_intecoal/
├── backend/
│   ├── main.py               # API FastAPI (endpoints, CORS, JWT, MIME, archivado)
│   ├── modelos.py            # Catálogo de 21 docs RETILAP, estados, helpers
│   ├── grafos.py             # GraphService: SharePoint + correo + Graph API
│   ├── requirements.txt      # Dependencias Python
│   ├── .env.example          # Plantilla de variables de entorno
│   ├── data/radicaciones.json# Persistencia local de radicaciones
│   └── uploads/              # Archivos subidos por radicado
├── src/                      # Frontend React (SPA)
│   ├── App.jsx               # Enrutador de pestañas, estado global, manejo de errores
│   ├── main.jsx / index.css  # Punto de entrada y estilos
│   ├── types.ts              # Tipos TypeScript
│   ├── components/
│   │   ├── LoginForm.jsx     # Login M365 (MSAL)
│   │   ├── Sidebar.jsx / Header.jsx
│   │   ├── RadicacionForm.jsx        # Wizard de radicación / edición
│   │   ├── RadicacionesList.jsx      # Histórico de radicaciones
│   │   ├── EvaluacionRadicacion.jsx  # Evaluación item por item (revisor)
│   │   ├── InformeRecibidoConformidad.jsx  # Informe digital imprimible
│   │   ├── DocumentPreviewModal.jsx  # Visor PDF/imagen/DXF/DWG
│   │   ├── CadViewerLazy.jsx         # Visor CAD (DXF) vía @cadview/react
│   │   ├── FirmaDigitalModal.jsx     # Firma electrónica (dibujar/texto/imagen)
│   │   ├── ErrorBoundary.jsx         # Captura de errores de render
│   │   └── IntecoalLogo.jsx
│   ├── data/documentsCatalog.js      # Catálogo de documentos (frontend)
│   └── lib/
│       ├── msalConfig.js     # Cliente MSAL, roles por dominio, helpers
│       └── zipExporter.js    # Exportar ZIP del expediente
├── vite.config.ts            # Config Vite + proxy /api
├── package.json              # Dependencias y scripts Node
├── .env.local                # Variables de entorno del frontend (gitignored)
├── docs/                     # Documentación (este índice)
└── dist/                     # Build de producción (generado)
```

## Tabla de tecnologías

| Capa | Tecnología | Propósito |
|------|-----------|-----------|
| Frontend | React 19 + Vite | SPA, desarrollo y build |
| Frontend | Tailwind CSS 4 | Estilos utilitarios |
| Frontend | @azure/msal-browser | Autenticación M365 |
| Frontend | @cadview/react | Visor CAD (DXF) |
| Backend | Python FastAPI | API REST, CORS, JWT |
| Backend | httpx | Cliente HTTP async para Graph API |
| Backend | python-jose | JWT tokens (HS256) |
| Infra | Netlify | Hosting frontend estático |
| Infra | Render.com | Hosting backend Python |
| Servicios | Microsoft Graph API | SharePoint, correo, Azure AD |

---

Siguiente: [INICIO-RAPIDO.md](INICIO-RAPIDO.md) — puesta en marcha local.
