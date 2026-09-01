# Flujo de Trabajo — Roles, Estados y Funcionalidades

## Roles y acceso

El login es **exclusivamente con cuenta de Microsoft 365** (no hay "Ingreso Directo").

| Rol | Dominio permitido | Permisos |
|-----|-------------------|----------|
| **Revisor / Interventor** | `@intecoalsas.com`, `@intecoal.com.co` | Evaluar documentos, dictaminar (Aprobado / Con Observaciones), firmar el informe, sincronizar a SharePoint. Su correo recibe la notificación de radicado por revisar. |
| **Contratista / Creador** | Cualquier correo M365 | Crear radicaciones, subir/corregir archivos, firmar declaración, ver sus radicaciones. Recibe confirmación de subida y resultado de evaluación. |

> Los correos de notificación al **revisor** van a `M365_NOTIFICATION_RECIPIENT`; los del **contratista** van a su correo registrado en la metadata del radicado (`creadorEmail`/`correoResponsable`).

## Flujo de trabajo

```
Contratista            Revisor (Interventoría)
   │                        │
   ├─ Crea radicación ─────▶│  Notificación: "Nuevo Radicado por Revisar"
   │  (firma obligatoria)   │
   │                        ├─ Evalúa (Guardar Avance o Finalizar)
   │                        │  → Aprobado / Con Observaciones
   │  ◀─ Resultado ─────────┤  (correo al contratista)
   │                        │
   ├─ (Si obs.) Edita y     │
   │  reenvía ─────────────▶│  Notificación al revisor + confirmación al contratista
   │                        ├─ Re-evalúa…
   │                        │  Aprobado → sincroniza a SharePoint
   │                        └─ Genera Informe (firma del revisor obligatoria)
```

## Estados de una radicación

| Estado | Descripción |
|--------|-------------|
| **Radicado** | Creado por el contratista. |
| **En Revisión** | Reenviado/almacenado para evaluación. |
| **Con Observaciones** | El revisor devolvió con correcciones. |
| **Aprobado** | Dictaminado conforme y sincronizado a SharePoint. |

## Funcionalidades por rol

### Contratista
- Crear nueva radicación con los 21 requisitos RETILAP + documentos adicionales manuales.
- Subir archivos (PDF, imágenes y planos DXF/DWG) — máx. 50 MB por archivo.
- **Firma electrónica obligatoria al radicar** (no se permite crear sin firmar).
- Marcar documentos como N/A.
- Ver solo sus propias radicaciones.
- **Editar/re-subir** un radicado con observaciones.
- Descargar ZIP del expediente.

### Revisor (Interventoría)
- Evaluar cada documento: Cumple / No Cumple / Pendiente / N/A.
- Asignar dictamen general y observaciones.
- Guardar avance (borrador) o finalizar la evaluación.
- **Firma de interventoría obligatoria** para finalizar con Aprobado o Con Observaciones.
- Generar informe de conformidad (imprimible) sin numeración en títulos.
- Aprobado → sincronización automática a SharePoint.
- Ver historial de cambios de estado de cada radicación.

### Visor de documentos
- **PDF e imágenes:** se muestran en línea (Content-Disposition: inline).
- **DXF:** vista previa en el navegador vía `@cadview/react`.
- **DWG/DWF/DWT:** panel de descarga (no visualizable en navegador; se abre en AutoCAD).

## Notificaciones por correo

| Evento | Destinatario | Función backend |
|--------|--------------|-----------------|
| Nuevo radicado | Revisor | `enviar_correo_nuevo_radicado_revisor` |
| Radicado creado | Contratista | `enviar_correo_nuevo_radicado_contratista` |
| Resultado de evaluación (Aprobado/Con Observaciones) | Contratista | `enviar_correo_estado` |
| Radicado reenviado/editado | Revisor | `enviar_correo_reesubido_revisor` |
| Confirmación de reenvío | Contratista | `enviar_correo_reenvio_contratista` |

---

Documentación relacionada: [API.md](API.md) · [SECURITY.md](SECURITY.md)
