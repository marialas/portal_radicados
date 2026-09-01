# Documentación — Portal de Radicación INTECOAL

Índice central de toda la documentación técnica del proyecto. Organizada por tema para que encuentres rápido lo que necesitas.

> Resumen general del proyecto: [`README.md`](../README.md)

---

## Mapa de documentación

| Tema | Documento | Para qué sirve |
|------|-----------|----------------|
| 🧠 **Visión general** | [ARQUITECTURA.md](ARQUITECTURA.md) | Cómo funciona el sistema por dentro: componentes, stack, persistencia |
| 🚀 **Puesta en marcha** | [INICIO-RAPIDO.md](INICIO-RAPIDO.md) | Requisitos e instalación local (backend + frontend) |
| 🔄 **Cómo se trabaja** | [FLUJO.md](FLUJO.md) | Roles, estados, flujo de trabajo, funcionalidades y correos |
| 🔌 **Backend** | [API.md](API.md) | Todos los endpoints REST, payloads y efectos secundarios |
| ☁️ **Producción** | [DEPLOYMENT.md](DEPLOYMENT.md) | Despliegue en Render (API) y Netlify (frontend) |
| 🔐 **Protección** | [SECURITY.md](SECURITY.md) | Autenticación MSAL, roles, JWT y buenas prácticas |

---

## Guías rápidas

### ¿Quieres correr el proyecto en local?
Ir a [INICIO-RAPIDO.md](INICIO-RAPIDO.md).

### ¿Buscas a quién le toca qué?
Revisar [FLUJO.md](FLUJO.md) → sección **Roles y Acceso**.

### ¿Necesitas un endpoint del backend?
Consultar [API.md](API.md), con los endpoints agrupados por dominio de uso.

### ¿Vas a desplegar a producción?
Seguir [DEPLOYMENT.md](DEPLOYMENT.md).

### ¿Preocupado por la seguridad?
Leer [SECURITY.md](SECURITY.md).

---

## Startup rápido (receta de 2 pasos)

```bash
copy .env.example .env                      # Windows
pip install -r backend/requirements.txt
uvicorn backend.main:app --reload --port 8000    # terminal 1

npm install
npm run dev                                     # terminal 2 → http://localhost:5173
```

Detalle completo: [INICIO-RAPIDO.md](INICIO-RAPIDO.md).
