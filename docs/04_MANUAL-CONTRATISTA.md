# Manual de Usuario — Contratista
## Portal de Radicación INTECOAL S.A.S.

| | |
|---|---|
| **Producto** | Portal de Radicación INTECOAL S.A.S. |
| **Versión** | 1.0 |
| **Perfil** | Contratista |

---

## Índice

1. [Objetivo y alcance](#1-objetivo-y-alcance)
2. [Prerrequisitos](#2-prerrequisitos)
3. [Glosario](#3-glosario)
4. [Acceso al portal](#4-acceso-al-portal)
5. [Conozca la pantalla](#5-conozca-la-pantalla)
6. [Crear una nueva radicación](#6-crear-una-nueva-radicación)
7. [Hacer seguimiento a mis radicados](#7-hacer-seguimiento-a-mis-radicados)
8. [Subsanar observaciones](#8-subsanar-observaciones)
9. [Eliminar un radicado](#9-eliminar-un-radicado)
10. [Preguntas frecuentes](#10-preguntas-frecuentes)
11. [Solución de problemas](#11-solución-de-problemas)
12. [Soporte y contacto](#12-soporte-y-contacto)

---

## 1. Objetivo y alcance

Este manual le enseña a radicar, firmar y hacer seguimiento a expedientes técnicos de alumbrado público. Cubre solo el uso del portal. No reemplaza la norma RETILAP ni la asesoría técnica.

## 2. Prerrequisitos

- Computador con Windows 10 (o superior), macOS o Linux.
- Navegador actualizado: Google Chrome o Microsoft Edge (recomendados).
- Conexión estable a internet.
- Cuenta de Microsoft 365. Si usa Gmail, regístrelo gratis como cuenta Microsoft en account.microsoft.com.
- Documentos en PDF, imagen o plano AutoCAD (máximo 50 MB por archivo).

## 3. Glosario

- **Radicado:** expediente que usted crea. Recibe un número único (ej. RAD-2026-021).
- **RETILAP:** reglamento técnico que exige los 25 documentos del expediente.
- **N/A:** marca para documentos que no aplican a su proyecto.
- **Subsanar:** corregir lo observado sin cambiar el número de radicado.
- **Interventoría:** equipo INTECOAL que revisa y aprueba su expediente.
- **SharePoint:** repositorio en la nube donde queda lo aprobado.
- **JWT / Sesión:** permiso temporal de acceso. Si vence, el sistema lo devuelve al ingreso.

## 4. Acceso al portal

1. Abra el portal en su navegador.
2. Elija el perfil **Contratista**.
3. Pulse Ingresar y autentíquese con su cuenta de Microsoft.
4. Si el sistema lo devuelve al ingreso, su sesión venció: entre de nuevo.

> **Nota:** un Gmail solo funciona si está registrado como cuenta Microsoft.

## 5. Conozca la pantalla

- **Encabezado superior:** logo INTECOAL, su rol y el botón Salir.
- **Menú lateral:** Nueva Radicación, Mis Radicaciones y Manual de Usuario.
- **Mis Radicaciones:** tabla con sus expedientes, estados y acciones.
- **Filtros y buscador:** encuentre radicados por número, proyecto, municipio o estado.

*[Captura: pantalla Mis Radicaciones]*

## 6. Crear una nueva radicación

1. Pulse **Nueva Radicación** en el menú o en el botón superior.
2. **Paso 1:** adjunte los 25 documentos (PDF, imagen o DWG/DXF). Marque N/A solo lo que no aplique.
3. Si aplica el documento 25 (CEAP), adjunte sus 4 sub-archivos uno por uno.
4. **Paso 2:** complete proyecto, municipio, contratista, NIT, responsable y correo. Registre el inventario de luminarias.
5. **Paso 3:** estampe su firma digital (dibújela, escríbala o suba imagen) y pulse **Radicar Documentación**.
6. Espere el mensaje verde de confirmación con su número de radicado.

> **Nota:** puede radicar con documentos pendientes: quedarán para observación de la interventoría.

*[Captura: paso 1 con lista de documentos]*

## 7. Hacer seguimiento a mis radicados

1. Abra **Mis Radicaciones** en el menú.
2. Lea la etiqueta de estado: Radicado, En Revisión, Con Observaciones o Aprobado.
3. Pulse **Informe** para ver el documento oficial de cada expediente.
4. Revise su correo: allí llegan la confirmación y el resultado.

## 8. Subsanar observaciones

1. En el radicado Con Observaciones pulse **Editar**.
2. Lea el recuadro celeste con lo que pidió la interventoría.
3. Vuelva a subir solo los documentos señalados (los verificados están bloqueados).
4. Pulse **Guardar y Enviar a Revisión** y espere el mensaje verde de confirmación.
5. El radicado vuelve a En Revisión con el mismo número.

> **Advertencia:** no cierre la ventana mientras dice “Enviando…”. Si algo falla, el mensaje rojo le dirá qué archivo y por qué.

## 9. Eliminar un radicado

1. Ubique su radicado en el Historial.
2. Solo verá **Eliminar** en el último consecutivo, si es suyo y no está aprobado.
3. Confirme la eliminación. Esta acción no se puede deshacer.

> **Advertencia:** los radicados aprobados nunca se pueden eliminar.

## 10. Preguntas frecuentes

**¿Por qué me pide confirmar con documentos pendientes?**
Porque radicar incompleto genera observaciones. Puede continuar o adjuntarlos primero.

**¿Por qué no veo el botón Eliminar?**
Solo aparece en el último consecutivo, si es suyo y no está aprobado.

**¿Por qué un documento no se deja cambiar?**
Si dice VERIFICADO, la interventoría ya lo aprobó y quedó bloqueado.

**¿Qué hago si dice “Error al guardar”?**
Lea el mensaje rojo: indica el archivo y el motivo. Verifique conexión y tamaño (máx. 50 MB).

## 11. Solución de problemas

| Mensaje o síntoma | Qué hacer |
|---|---|
| "La firma digital es obligatoria" | Estampe su firma en el Paso 3 antes de radicar. |
| "No se pudo conectar con el servidor" | El backend está apagado o la nube está despertando. Verifique http://localhost:8000/api/health o espere un minuto. |
| "Sesión expirada / vuelve al ingreso" | Su permiso venció (24 h). Ingrese de nuevo. |
| Archivo rechazado al subir | Use PDF, imagen o DWG/DXF de máximo 50 MB. |

## 12. Soporte y contacto

- Correo: interventoriaapalborada@intecoalsas.com
- Teléfonos: 310 355 6449 / (602) 224 8763
- Indique siempre su número de radicado y el mensaje exacto en pantalla.
