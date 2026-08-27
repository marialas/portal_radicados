import os
from pathlib import Path
import httpx


class GraphService:
    def __init__(self):
        self.tenant_id = os.getenv("AZURE_TENANT_ID", "")
        self.client_id = os.getenv("AZURE_CLIENT_ID", "")
        self.client_secret = os.getenv("AZURE_CLIENT_SECRET", "")
        self.site_id = os.getenv("SHAREPOINT_SITE_ID", "")
        self.list_id = os.getenv("SHAREPOINT_LIST_ID", "")
        self.library_name = os.getenv("SHAREPOINT_LIBRARY_ID", "Documents")
        self.sender_email = os.getenv("M365_SENDER_EMAIL", "interventoriaapalborada@intecoalsas.com")
        self.notification_recipient = os.getenv("M365_NOTIFICATION_RECIPIENT", "")
        self._token = None
        self._token_expiry = 0
        self._resolved_drive_id = None

    def _sanitizar_codigo(self, codigo):
        return "".join(c for c in codigo if c.isalnum())

    async def _obtener_token(self):
        import time
        ahora = time.time()
        if self._token and ahora < self._token_expiry:
            return self._token

        if not self.client_id or not self.client_secret or not self.tenant_id:
            raise Exception("Faltan credenciales Azure AD (AZURE_CLIENT_ID, AZURE_CLIENT_SECRET, AZURE_TENANT_ID)")

        url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "scope": "https://graph.microsoft.com/.default",
        }

        async with httpx.AsyncClient() as cliente:
            resp = await cliente.post(url, data=data)
            resp.raise_for_status()
            resultado = resp.json()

        self._token = resultado["access_token"]
        self._token_expiry = ahora + resultado.get("expires_in", 3600) - 120
        return self._token

    async def _headers(self):
        token = await self._obtener_token()
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    async def _obtener_drive_id(self):
        if self._resolved_drive_id:
            return self._resolved_drive_id

        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}"}

        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drives"
        async with httpx.AsyncClient() as cliente:
            resp = await cliente.get(url, headers=headers)
            resp.raise_for_status()
            drives = resp.json().get("value", [])

        for drive in drives:
            name = drive.get("name", "")
            if name.lower() == self.library_name.lower():
                self._resolved_drive_id = drive["id"]
                print(f"[GRAPH] Drive '{name}' resuelto: {self._resolved_drive_id}")
                return self._resolved_drive_id

        if drives:
            self._resolved_drive_id = drives[0]["id"]
            print(f"[GRAPH] Drive '{self.library_name}' no encontrado, usando '{drives[0].get('name', '?')}' ({self._resolved_drive_id})")
        else:
            raise Exception(f"No se encontraron drives en el sitio {self.site_id}")

        return self._resolved_drive_id

    async def _drive_url(self):
        drive_id = await self._obtener_drive_id()
        return f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drives/{drive_id}"

    async def sincronizar_a_sharepoint(self, radicacion):
        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        meta = radicacion["metadata"]
        numero = radicacion["numeroRadicado"]
        estado = radicacion.get("estado", "Radicado")

        estado_map = {
            "Aprobado": "Aprobado",
            "Con Observaciones": "Revision",
            "Radicado": "Pendiente_Firma",
            "En Revisión": "En_Revision",
        }
        estado_sp = estado_map.get(estado, "Pendiente_Firma")

        from datetime import datetime, timezone
        contador = int(datetime.now(timezone.utc).timestamp())

        campos_todos = {
            "Title": f"{numero} - {estado} - {contador}",
            "NumeroRadicado": numero,
            "Municipio": meta.get("municipio", ""),
            "Operador": meta.get("contratista", ""),
            "NIT": meta.get("nitContratista", ""),
            "Responsable": meta.get("responsable", ""),
            "CorreoResponsable": meta.get("correoResponsable", ""),
            "TipoEntrega": meta.get("tipoEntrega", ""),
            "Estado": estado_sp,
            "DocumentosOk": f"{radicacion.get('documentosOk', 0)}/{radicacion.get('totalDocumentos', 21)}",
            "PorcentajeConformidad": radicacion.get("porcentajeCumplimiento", 0),
            "FechaRadicacion": radicacion.get("fechaRadicacion", "")[:10],
            "RutaOneDrive": f"/Documentos_Radicacion/{numero}/",
        }

        try:
            cols_existentes = await self._columnas_lista()
            campos = {k: v for k, v in campos_todos.items() if k in cols_existentes}
            col_faltantes = [k for k in campos_todos if k not in cols_existentes]
            if col_faltantes:
                print(f"[GRAPH] Columnas no encontradas en la lista (se omiten): {col_faltantes}")
        except Exception as e:
            print(f"[GRAPH] No se pudieron consultar columnas, se envían todos: {e}")
            campos = campos_todos

        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/lists/{self.list_id}/items"
        async with httpx.AsyncClient() as cliente:
            resp = await cliente.post(url, headers=headers, json={"fields": campos})
            print(f"[GRAPH] POST item nuevo ({numero} / {estado}): status={resp.status_code} body={resp.text[:300]}")
            resp.raise_for_status()
            print(f"[GRAPH] SharePoint item nuevo creado OK")

        await self._crear_carpeta_proyecto(numero)
        await self._subir_archivos(radicacion, numero)

        return {"ok": True}

    async def _buscar_por_titulo(self, titulo):
        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}"}

        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/lists/{self.list_id}/items"
        params = {
            "$filter": f"fields/Title eq '{titulo}'",
            "$top": 1,
            "$expand": "fields",
            "$select": "id",
        }

        async with httpx.AsyncClient() as cliente:
            resp = await cliente.get(url, headers=headers, params=params)
            if resp.status_code == 200:
                items = resp.json().get("value", [])
                if items:
                    return items[0]
        return None

    async def _crear_carpeta_proyecto(self, codigo):
        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}"}
        base = await self._drive_url()

        subcarpetas = [
            "A_Tecnicos", "B_Certificaciones", "C_Contractuales",
            "D_Inventario", "E_SST_Ambiental", "Documentos_Adicionales",
        ]

        async with httpx.AsyncClient(timeout=30.0) as cliente:
            for sub in subcarpetas:
                folder_path = f"{codigo}/{sub}"
                url = f"{base}/root:/{folder_path}"
                try:
                    resp = await cliente.get(url, headers=headers)
                    if resp.status_code == 200:
                        print(f"[GRAPH] Carpeta ya existe: {folder_path}")
                        continue
                except Exception:
                    pass

                url_create = f"{base}/root:/{codigo}:/children"
                try:
                    resp = await cliente.post(
                        url_create,
                        headers=headers,
                        json={
                            "name": sub,
                            "folder": {},
                            "@microsoft.graph.conflictBehavior": "rename",
                        },
                    )
                    if resp.status_code in (200, 201):
                        print(f"[GRAPH] Carpeta creada: {folder_path}")
                    else:
                        print(f"[GRAPH] Error creando carpeta {sub}: {resp.status_code} {resp.text[:200]}")
                except Exception as e:
                    print(f"[GRAPH] Excepcion creando carpeta {sub}: {e}")

    async def _subir_archivos(self, radicacion, codigo):
        token = await self._obtener_token()
        headers_auth = {"Authorization": f"Bearer {token}"}
        base = await self._drive_url()

        archivos = radicacion.get("archivos", [])
        async with httpx.AsyncClient(timeout=120.0) as cliente:
            for a in archivos:
                if a.get("fileName") and a.get("status") == "CUMPLE":
                    local_path = a.get("localPath", "")
                    if not local_path:
                        continue
                    file_path = Path(local_path)
                    if not file_path.exists():
                        print(f"[GRAPH] Archivo local no encontrado: {local_path}")
                        continue

                    contenido = file_path.read_bytes()
                    subcarpeta = a.get("folderPath", "").split("/")[-2] if a.get("folderPath") else "A_Tecnicos"
                    path = f"{codigo}/{subcarpeta}/{a['fileName']}"
                    url = f"{base}/root:/{path}:/content"
                    try:
                        resp = await cliente.put(url, headers=headers_auth, content=contenido)
                        if resp.status_code in (200, 201):
                            print(f"[GRAPH] Archivo subido a SharePoint: {path}")
                        else:
                            print(f"[GRAPH] Error subiendo {path}: {resp.status_code} {resp.text[:200]}")
                    except Exception as e:
                        print(f"[GRAPH] Excepcion subiendo {path}: {e}")

    async def enviar_correo_confirmacion(self, radicacion, destino=None):
        meta = radicacion["metadata"]
        if not destino:
            destino = meta.get("correoResponsable", "") or self.notification_recipient

        if not destino:
            return

        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        asunto = f"Nuevo Radicado {radicacion['numeroRadicado']} — {meta.get('nombreProyecto', '')}"
        cuerpo = f"""
        <html><body style="font-family:Arial,sans-serif;color:#1E222A;">
        <div style="background:#1E222A;color:#D9CF43;padding:16px 24px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:16px;">INTECOAL SAS — Nuevo Radicado para Revisar</h2>
        </div>
        <div style="padding:20px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <p>Se ha registrado un nuevo radicado y requiere su revisión:</p>
            <table style="width:100%;font-size:13px;border-collapse:collapse;margin:12px 0;">
                <tr><td style="padding:6px 0;font-weight:bold;width:140px;">Radicado:</td><td>{radicacion['numeroRadicado']}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;">Proyecto:</td><td>{meta.get('nombreProyecto', '')}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;">Municipio:</td><td>{meta.get('municipio', '')}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;">Contratista:</td><td>{meta.get('contratista', '')}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;">Responsable:</td><td>{meta.get('responsable', '')}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;">Tipo Entrega:</td><td>{meta.get('tipoEntrega', '')}</td></tr>
            </table>
            <p style="font-size:12px;color:#666;">Acceda al portal para revisar y evaluar la documentación.</p>
            <p style="font-size:11px;color:#999;margin-top:20px;">INTECOAL SAS — Interventoría Técnica</p>
        </div>
        </body></html>
        """

        mensaje = {
            "message": {
                "subject": asunto,
                "body": {"contentType": "HTML", "content": cuerpo},
                "from": {"emailAddress": {"address": self.sender_email}},
                "toRecipients": [{"emailAddress": {"address": destino}}],
            }
        }

        url = f"https://graph.microsoft.com/v1.0/users/{self.sender_email}/sendMail"
        async with httpx.AsyncClient() as cliente:
            try:
                resp = await cliente.post(url, headers=headers, json=mensaje)
                print(f"[GRAPH] Correo confirmacion enviado a {destino} | status={resp.status_code}")
            except Exception as e:
                print(f"[GRAPH] Error enviando correo confirmacion: {e}")

    async def enviar_correo_estado(self, radicacion, estado_anterior, observaciones):
        meta = radicacion["metadata"]
        destino = (
            radicacion.get("creadorEmail", "")
            or meta.get("creadorEmail", "")
            or self.notification_recipient
        )

        if not destino:
            return

        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        estado_final = radicacion.get("estado", "")
        emoji = "\u2713" if estado_final == "Aprobado" else "\u26a0"

        asunto = f"{emoji} Radicado {radicacion['numeroRadicado']} — {estado_final}"
        cuerpo = f"""
        <html><body style="font-family:Arial,sans-serif;color:#1E222A;">
        <div style="background:#1E222A;color:#D9CF43;padding:16px 24px;border-radius:8px 8px 0 0;">
            <h2 style="margin:0;font-size:16px;">INTECOAL SAS — Resultado de Evaluación</h2>
        </div>
        <div style="padding:20px 24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;">
            <p>Su radicado ha sido evaluado por la Interventoría Técnica.</p>
            <table style="width:100%;font-size:13px;border-collapse:collapse;margin:12px 0;">
                <tr><td style="padding:6px 0;font-weight:bold;width:140px;">Radicado:</td><td>{radicacion['numeroRadicado']}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;">Proyecto:</td><td>{meta.get('nombreProyecto', '')}</td></tr>
                <tr><td style="padding:6px 0;font-weight:bold;">Estado:</td><td><strong style="font-size:14px;">{estado_final}</strong></td></tr>
            </table>
            <p style="font-size:12px;color:#666;">Acceda al portal para revisar los detalles completos.</p>
            <p style="font-size:11px;color:#999;margin-top:20px;">INTECOAL SAS — Interventoría Técnica</p>
        </div>
        </body></html>
        """

        mensaje = {
            "message": {
                "subject": asunto,
                "body": {"contentType": "HTML", "content": cuerpo},
                "from": {"emailAddress": {"address": self.sender_email}},
                "toRecipients": [{"emailAddress": {"address": destino}}],
            }
        }

        url = f"https://graph.microsoft.com/v1.0/users/{self.sender_email}/sendMail"
        async with httpx.AsyncClient() as cliente:
            try:
                await cliente.post(url, headers=headers, json=mensaje)
                print(f"[GRAPH] Correo estado enviado a {destino} | estado={estado_final}")
            except Exception as e:
                print(f"[GRAPH] Error enviando correo estado: {e}")

    def obtener_config(self):
        return {
            "azureClientId": self.client_id,
            "azureTenantId": self.tenant_id,
            "sharepointSiteId": self.site_id,
            "sharepointListId": self.list_id,
            "sharepointLibrary": self.library_name,
            "senderEmail": self.sender_email,
            "notificationRecipient": self.notification_recipient,
            "isConnected": bool(self.client_id and self.client_secret and self.tenant_id),
        }

    async def _columnas_lista(self):
        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}"}
        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/lists/{self.list_id}/columns"
        async with httpx.AsyncClient() as cliente:
            resp = await cliente.get(url, headers=headers)
            resp.raise_for_status()
            cols = resp.json().get("value", [])
            return {c["name"]: c.get("displayName", c["name"]) for c in cols}

    async def probar_conexion(self):
        resultados = {"pasos": []}

        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}"}

        async with httpx.AsyncClient() as cliente:
            resultados["pasos"].append({"paso": "Token OAuth2", "ok": True})

            url_site = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}"
            resp = await cliente.get(url_site, headers=headers)
            resultados["pasos"].append({
                "paso": "Acceso al sitio",
                "ok": resp.status_code == 200,
                "status": resp.status_code,
                "detalle": resp.json().get("displayName", resp.json().get("error", {}).get("message", "")) if resp.status_code == 200 else resp.text[:200],
            })

            try:
                drive_id = await self._obtener_drive_id()
                url_drives = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drives"
                resp_d = await cliente.get(url_drives, headers=headers)
                drives_nombres = [d.get("name", "?") for d in resp_d.json().get("value", [])]
                resultados["pasos"].append({
                    "paso": "Resolver drive/librería",
                    "ok": True,
                    "driveId": drive_id,
                    "drivesDisponibles": drives_nombres,
                })
            except Exception as e:
                resultados["pasos"].append({"paso": "Resolver drive/librería", "ok": False, "error": str(e)})

            url_list = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/lists/{self.list_id}"
            resp_l = await cliente.get(url_list, headers=headers)
            resultados["pasos"].append({
                "paso": "Acceso a lista SharePoint",
                "ok": resp_l.status_code == 200,
                "status": resp_l.status_code,
                "detalle": resp_l.json().get("displayName", resp_l.json().get("error", {}).get("message", "")) if resp_l.status_code == 200 else resp_l.text[:300],
            })

            if resp_l.status_code == 200:
                url_items = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/lists/{self.list_id}/items?$top=1&$select=id,fields"
                resp_items = await cliente.get(url_items, headers=headers)
                items_count = len(resp_items.json().get("value", []))
                resultados["pasos"].append({
                    "paso": "Listar items de la lista",
                    "ok": resp_items.status_code == 200,
                    "status": resp_items.status_code,
                    "itemsEncontrados": items_count,
                })

            try:
                drive_id = await self._obtener_drive_id()
                url_root = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/drives/{drive_id}/root/children"
                resp_r = await cliente.get(url_root, headers=headers)
                carpetas = [i.get("name", "?") for i in resp_r.json().get("value", [])[:5]]
                resultados["pasos"].append({
                    "paso": "Listar contenido raíz del drive",
                    "ok": resp_r.status_code == 200,
                    "status": resp_r.status_code,
                    "primerosElementos": carpetas,
                })
            except Exception as e:
                resultados["pasos"].append({"paso": "Listar contenido raíz del drive", "ok": False, "error": str(e)})

        todos_ok = all(p.get("ok", False) for p in resultados["pasos"])
        resultados["ok"] = todos_ok
        resultados["message"] = "Todos los pasos OK" if todos_ok else "Algunos pasos fallaron - revisa los detalles"

        return resultados

    async def cargar_radicaciones_desde_sharepoint(self):
        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}"}
        radicaciones = []
        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/lists/{self.list_id}/items"
        params = {"$expand": "fields", "$top": 500}

        async with httpx.AsyncClient(timeout=30.0) as cliente:
            try:
                resp = await cliente.get(url, headers=headers, params=params)
                if resp.status_code != 200:
                    print(f"[GRAPH] Error leyendo lista: {resp.status_code}")
                    return []

                items = resp.json().get("value", [])
                print(f"[GRAPH] {len(items)} items encontrados en lista SharePoint")

                for item in items:
                    fields = item.get("fields", {})
                    raw_json = fields.get("RawJson", "")
                    if raw_json:
                        try:
                            import json
                            rad = json.loads(raw_json)
                            rad["m365Synced"] = True
                            if not rad.get("creadorEmail"):
                                rad["creadorEmail"] = rad.get("metadata", {}).get("creadorEmail", "") or fields.get("CreadorEmail", "")
                            radicaciones.append(rad)
                            continue
                        except Exception as e:
                            print(f"[GRAPH] RawJson parse error para {fields.get('Title', '?')}: {e}")

                    numero = fields.get("NumeroRadicado", fields.get("Title", ""))
                    if not numero:
                        continue

                    estado_sp = fields.get("Estado", "Pendiente_Firma")
                    estado_map = {"Aprobado": "Aprobado", "Revision": "Con Observaciones", "Pendiente_Firma": "Radicado", "En_Revision": "En Revisión"}
                    estado = estado_map.get(estado_sp, "Radicado")

                    docs_str = fields.get("DocumentosOk", "0/21")
                    try:
                        docs_ok = int(docs_str.split("/")[0])
                    except Exception:
                        docs_ok = 0

                    try:
                        pct = int(fields.get("PorcentajeConformidad", 0))
                    except Exception:
                        pct = 0

                    rad = {
                        "id": item.get("id", ""),
                        "numeroRadicado": numero,
                        "metadata": {
                            "nombreProyecto": fields.get("NombreProyecto", numero),
                            "municipio": fields.get("Municipio", ""),
                            "contratista": fields.get("Operador", ""),
                            "nitContratista": fields.get("NIT", ""),
                            "responsable": fields.get("Responsable", ""),
                            "correoResponsable": fields.get("CorreoResponsable", ""),
                            "tipoEntrega": fields.get("TipoEntrega", "Inicial"),
                            "creadorEmail": fields.get("CreadorEmail", ""),
                        },
                        "estado": estado,
                        "documentosOk": docs_ok,
                        "totalDocumentos": 21,
                        "fechaRadicacion": fields.get("FechaRadicacion", ""),
                        "fechaActualizacion": fields.get("FechaRadicacion", ""),
                        "porcentajeCumplimiento": pct,
                        "archivos": [],
                        "elementosEntregados": [],
                        "observacionesGenerales": "",
                        "creadorEmail": fields.get("CreadorEmail", ""),
                        "creadorName": "",
                        "m365Synced": True,
                    }
                    radicaciones.append(rad)

                print(f"[GRAPH] {len(radicaciones)} filas encontradas desde SharePoint, deduplicando por radicado...")
                unicos = {}
                for rad in radicaciones:
                    num = rad.get("numeroRadicado", "")
                    if not num:
                        continue
                    fecha = rad.get("fechaActualizacion") or rad.get("fechaRadicacion") or ""
                    existente = unicos.get(num)
                    if not existente or (fecha or "") > (existente.get("fechaActualizacion") or existente.get("fechaRadicacion") or ""):
                        unicos[num] = rad
                radicaciones = list(unicos.values())
                print(f"[GRAPH] {len(radicaciones)} radicaciones únicas reconstruidas desde SharePoint")
                return radicaciones

            except Exception as e:
                print(f"[GRAPH] Error cargando radicaciones: {e}")
                return []

    async def guardar_radicacion_en_sharepoint(self, radicacion):
        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        meta = radicacion["metadata"]
        numero = radicacion["numeroRadicado"]
        estado = radicacion.get("estado", "Radicado")

        estado_map = {
            "Aprobado": "Aprobado",
            "Con Observaciones": "Revision",
            "Radicado": "Pendiente_Firma",
            "En Revisión": "En_Revision",
        }
        estado_sp = estado_map.get(estado, "Pendiente_Firma")

        docs_str = f"{radicacion.get('documentosOk', 0)}/{radicacion.get('totalDocumentos', 21)}"

        import json

        rad_clean = {k: v for k, v in radicacion.items() if k != "archivos" or not v}
        if "archivos" in radicacion and radicacion["archivos"]:
            rad_clean["archivos"] = []
            for a in radicacion["archivos"]:
                rad_clean["archivos"].append({
                    "docId": a.get("docId"),
                    "docCode": a.get("docCode", ""),
                    "docName": a.get("docName", ""),
                    "fileName": a.get("fileName", ""),
                    "status": a.get("status", ""),
                    "notes": a.get("notes", ""),
                    "esManual": a.get("esManual", False),
                })

        raw_json = json.dumps(rad_clean, ensure_ascii=False, default=str)

        from datetime import datetime, timezone
        ahora = datetime.now(timezone.utc)
        contador = int(ahora.timestamp())

        campos_todos = {
            "Title": f"{numero} - {estado} - {contador}",
            "NumeroRadicado": numero,
            "NombreProyecto": meta.get("nombreProyecto", numero),
            "Municipio": meta.get("municipio", ""),
            "Operador": meta.get("contratista", ""),
            "NIT": meta.get("nitContratista", ""),
            "Responsable": meta.get("responsable", ""),
            "CorreoResponsable": meta.get("correoResponsable", ""),
            "TipoEntrega": meta.get("tipoEntrega", ""),
            "Estado": estado_sp,
            "DocumentosOk": docs_str,
            "PorcentajeConformidad": radicacion.get("porcentajeCumplimiento", 0),
            "FechaRadicacion": radicacion.get("fechaRadicacion", "")[:10],
            "RutaOneDrive": f"/Documentos_Radicacion/{numero}/",
            "CreadorEmail": radicacion.get("creadorEmail", "") or meta.get("creadorEmail", ""),
            "RawJson": raw_json[:64000] if len(raw_json) > 64000 else raw_json,
        }

        try:
            cols_existentes = await self._columnas_lista()
            campos = {k: v for k, v in campos_todos.items() if k in cols_existentes}
            col_faltantes = [k for k in campos_todos if k not in cols_existentes]
            if col_faltantes:
                print(f"[GRAPH] Columnas no encontradas (se omiten): {col_faltantes}")
        except Exception:
            campos = campos_todos

        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/lists/{self.list_id}/items"
        async with httpx.AsyncClient(timeout=30.0) as cliente:
            resp = await cliente.post(url, headers=headers, json={"fields": campos})
            print(f"[GRAPH] Item {numero} ({estado}) creado en SharePoint: {resp.status_code}")

    async def eliminar_radicacion_de_sharepoint(self, numero):
        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}"}

        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/lists/{self.list_id}/items"
        params = {
            "$filter": f"fields/NumeroRadicado eq '{numero}'",
            "$expand": "fields",
            "$select": "id",
        }

        async with httpx.AsyncClient(timeout=30.0) as cliente:
            resp = await cliente.get(url, headers=headers, params=params)
            if resp.status_code != 200:
                print(f"[GRAPH] Error buscando items a eliminar para {numero}: {resp.status_code}")
                return
            items = resp.json().get("value", [])
            for item in items:
                del_url = f"{url}/{item['id']}"
                del_resp = await cliente.delete(del_url, headers=headers)
                print(f"[GRAPH] Item {item['id']} de {numero} eliminado de SharePoint: {del_resp.status_code}")

    async def asegurar_columna_rawjson(self):
        token = await self._obtener_token()
        headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

        try:
            cols = await self._columnas_lista()
            if "RawJson" in cols:
                print("[GRAPH] Columna RawJson ya existe")
                return
        except Exception:
            pass

        url = f"https://graph.microsoft.com/v1.0/sites/{self.site_id}/lists/{self.list_id}/columns"
        columna = {
            "name": "RawJson",
            "text": {"maxLength": 65535},
            "displayName": "RawJson",
        }
        async with httpx.AsyncClient(timeout=30.0) as cliente:
            resp = await cliente.post(url, headers=headers, json=columna)
            if resp.status_code in (200, 201):
                print("[GRAPH] Columna RawJson creada OK")
            else:
                print(f"[GRAPH] Error creando columna RawJson: {resp.status_code} {resp.text[:200]}")

        for col_name in ["NombreProyecto", "CreadorEmail"]:
            if col_name not in cols:
                col_data = {"name": col_name, "text": {"maxLength": 255}, "displayName": col_name}
                async with httpx.AsyncClient(timeout=30.0) as cliente:
                    resp = await cliente.post(url, headers=headers, json=col_data)
                    print(f"[GRAPH] Columna {col_name}: {resp.status_code}")
