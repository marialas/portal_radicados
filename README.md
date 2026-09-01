# Portal de Radicación INTECOAL S.A.S.

Sistema de gestión de radicación de expedientes técnicos para la **verificación RETILAP** (Alumbrado Público) bajo la Resolución 40150 de 2024 y RETIE.

El portal permite al **contratista** radicar los 21 requisitos RETILAP, y al **revisor (interventoría)** evaluarlos, emitir dictamen y generar el **Informe de Recibido a Conformidad**, con firma electrónica, notificaciones por correo y persistencia en **SharePoint** de Microsoft 365.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS 4 + MSAL + `@cadview/react` (visor CAD).
- **Backend:** Python FastAPI + httpx + python-jose + python-dotenv.
- **Servicios:** Microsoft Graph API (SharePoint Online + correo Outlook).

## 📚 Documentación

Todo el detalle está organizado por tema en la carpeta [`docs/`](docs/README.md):

| Documento | Contenido |
|-----------|-----------|
| [docs/README.md](docs/README.md) | Índice central de la documentación |
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Arquitectura, estructura y stack técnico |
| [docs/INICIO-RAPIDO.md](docs/INICIO-RAPIDO.md) | Requisitos y puesta en marcha local |
| [docs/FLUJO.md](docs/FLUJO.md) | Roles, flujo de trabajo, estados y notificaciones |
| [docs/API.md](docs/API.md) | Referencia de endpoints REST |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Despliegue en Netlify y Render.com |
| [docs/SECURITY.md](docs/SECURITY.md) | Seguridad y autenticación |

## Instalación rápida

```bash
# 1. Backend (lee el .env desde la raíz del proyecto)
copy .env.example .env          # Windows (Linux/Mac: cp .env.example .env)
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000

# 2. Frontend
npm install
npm run dev                     # http://localhost:5173
```

Para el detalle completo, ver [docs/INICIO-RAPIDO.md](docs/INICIO-RAPIDO.md).

---
Proyecto privado — INTECOAL S.A.S. / SENA
