"""Pruebas caja blanca — Calendario de revisión (15 días hábiles + semáforo).

Cubre: cálculo de días/restantes, triggers de correo (8, 4, diario 8am),
idempotencia (sin bucles ni duplicados) y rutas HTTP con sus payloads.

Tiempo congelado solo con la librería estándar (sin freezegun).
"""
import asyncio
from datetime import datetime, timezone, timedelta, date

import pytest

from backend import main as M
from backend.modelos import (
    fecha_limite_revision,
    dias_restantes,
    dias_habiles_entre,
    es_dia_habil,
    sumar_dias_habiles,
    estado_semaforo,
    _solo_fecha,
)


# --------------------------------------------------------------------------
# Utilidades de tiempo congelado (solo stdlib)
# --------------------------------------------------------------------------
class _RelojFijo(datetime):
    _fija = None

    @classmethod
    def now(cls, tz=None):
        return cls._fija


def _hoy_utc(y, m, d, hh=15, mm=0):
    # 15:00 UTC = 10:00 Colombia (>= 8am, dispara la diaria)
    return datetime(y, m, d, hh, mm, tzinfo=timezone.utc)


def _radicado(numero, fecha_iso, estado="Radicado", flags=None):
    return {
        "id": "t-" + numero,
        "numeroRadicado": numero,
        "estado": estado,
        "fechaRadicacion": fecha_iso,
        "metadata": {"nombreProyecto": "P-" + numero, "municipio": "Tuluá",
                     "contratista": "C", "creadorEmail": "c@t.com"},
        "creadorEmail": "c@t.com",
        "notifVencimiento": dict(flags or {}),
    }


class _GraphFalso:
    def __init__(self):
        self.envios = []

    async def enviar_correo_vencimiento(self, rad, dias, limite):
        self.envios.append((rad.get("numeroRadicado"), dias, limite))
        return True


def _creacion_con_restantes(hoy, objetivo):
    """Fecha de creación tal que dias_restantes(limite) == objetivo en `hoy`."""
    d = hoy
    while True:
        lim = fecha_limite_revision(datetime(d.year, d.month, d.day, tzinfo=timezone.utc).isoformat())
        if dias_restantes(lim, hoy) == objetivo:
            return datetime(d.year, d.month, d.day, 10, 0, tzinfo=timezone.utc).isoformat()
        d -= timedelta(days=1)
        assert (hoy - d).days < 400, "no se encontró fecha"


# --------------------------------------------------------------------------
# 1. Cálculo de días hábiles y restantes
# --------------------------------------------------------------------------
def test_limite_salta_fin_de_semana():
    # Viernes -> el límite de 15 hábiles no puede caer en fin de semana
    limite = fecha_limite_revision("2026-09-04T10:00:00+00:00")  # viernes
    assert es_dia_habil(limite)
    assert dias_habiles_entre(date(2026, 9, 4), limite) == 15


def test_limite_lunes_arranca_bien():
    limite = fecha_limite_revision("2026-09-28T10:00:00+00:00")  # lunes
    assert limite == date(2026, 10, 19)
    assert dias_habiles_entre(date(2026, 9, 28), limite) == 15


def test_restantes_en_fecha_limite_y_vencido():
    assert dias_restantes(date(2026, 10, 12), date(2026, 9, 28)) == 14
    assert dias_restantes(date(2026, 10, 12), date(2026, 10, 12)) == 0
    assert dias_restantes(date(2026, 10, 12), date(2026, 10, 14)) == -2
    assert dias_restantes(None, date(2026, 10, 14)) is None


def test_solo_fecha_tolera_basura():
    assert _solo_fecha("no-fecha") is None
    assert _solo_fecha("") is None
    assert _solo_fecha(None) is None
    # Madrugada UTC no cambia de día (paridad backend/frontend)
    assert _solo_fecha("2026-09-04T02:00:00+00:00") == date(2026, 9, 4)


def test_puente_festivo_se_comporta_como_habil():
    """LIMITACIÓN CONOCIDA: los festivos (ej. lunes 2026-10-12) NO se
    descuentan; solo sábado/domingo. Si algún día se descuentan festivos,
    este test debe invertirse."""
    limite = fecha_limite_revision("2026-09-28T10:00:00+00:00")
    assert date(2026, 10, 12) <= limite  # el lunes festivo cuenta como hábil
    assert dias_habiles_entre(date(2026, 10, 11), date(2026, 10, 12)) == 1


@pytest.mark.xfail(reason="Festivos colombianos no descontados (solo lun-vie). Ver LIMITACIÓN.",
                   strict=False)
def test_puente_festivo_se_descuenta():
    # Comportamiento DESEADO si se implementan festivos oficiales
    assert dias_habiles_entre(date(2026, 10, 11), date(2026, 10, 12)) == 0


# --------------------------------------------------------------------------
# 2. Semáforo con fechas extremas
# --------------------------------------------------------------------------
@pytest.mark.parametrize("restantes,aprobado,esperado", [
    (None, False, "gris"),
    (None, True, "verde"),
    (-100, False, "morado"),
    (-1, False, "morado"),
    (0, False, "rojo"),
    (1, False, "rojo"),
    (4, False, "rojo"),
    (5, False, "amarillo"),
    (8, False, "amarillo"),
    (9, False, "azul"),
    (365, False, "azul"),
    (0, True, "verde"),  # aprobado manda sobre todo
])
def test_semaforo_extremos(restantes, aprobado, esperado):
    assert estado_semaforo(restantes, aprobado) == esperado


# --------------------------------------------------------------------------
# 3. Triggers de correo: 8, 4 y diaria 8am (una sola vez, sin bucles)
# --------------------------------------------------------------------------
def _entorno(monkeypatch, registros, ahora):
    _RelojFijo._fija = ahora
    monkeypatch.setattr(M, "datetime", _RelojFijo)
    monkeypatch.setattr(M, "radicaciones_db", registros)
    falso = _GraphFalso()
    monkeypatch.setattr(M, "graph_service", falso)
    guardados = []
    monkeypatch.setattr(M, "guardar_db", lambda: guardados.append(1))
    return falso, guardados


def test_aviso_8_exactamente_una_vez(monkeypatch):
    hoy = _hoy_utc(2026, 9, 28).date()
    creacion = _creacion_con_restantes(hoy, 8)
    regs = [_radicado("RAD-T-001", creacion)]
    falso, _ = _entorno(monkeypatch, regs, _hoy_utc(2026, 9, 28))
    primera = asyncio.run(M.revisar_vencimientos())
    assert [(n["numeroRadicado"], n["aviso"]) for n in primera] == [("RAD-T-001", "8 dias")]
    assert len(falso.envios) == 1
    assert regs[0]["notifVencimiento"].get("8")
    # Segunda pasada el mismo día: silencio total (sin bucle ni duplicado)
    assert asyncio.run(M.revisar_vencimientos()) == []
    assert len(falso.envios) == 1


def test_aviso_4_escala_y_marca_8(monkeypatch):
    hoy = _hoy_utc(2026, 9, 28).date()
    creacion = _creacion_con_restantes(hoy, 4)
    regs = [_radicado("RAD-T-004", creacion)]
    falso, _ = _entorno(monkeypatch, regs, _hoy_utc(2026, 9, 28))
    res = asyncio.run(M.revisar_vencimientos())
    assert [(n["numeroRadicado"], n["aviso"]) for n in res] == [("RAD-T-004", "4 dias")]
    assert regs[0]["notifVencimiento"].get("4")
    assert regs[0]["notifVencimiento"].get("8")  # el aviso 8 queda saldado
    assert asyncio.run(M.revisar_vencimientos()) == []


def test_diaria_8am_vencido_hasta_aprobar(monkeypatch):
    hoy = _hoy_utc(2026, 9, 28).date()  # 10:00 Colombia
    creacion = _creacion_con_restantes(hoy, -3)  # vencido hace 3
    viejo = "2026-09-20T15:00:00+00:00"
    regs = [_radicado("RAD-T-VEN", creacion, flags={"4": viejo, "8": viejo,
                                                   "diaria": "2026-09-27T15:00:00+00:00"})]
    falso, _ = _entorno(monkeypatch, regs, _hoy_utc(2026, 9, 28))
    assert [(n["numeroRadicado"], n["aviso"]) for n in asyncio.run(M.revisar_vencimientos())] == [("RAD-T-VEN", "diaria 8am")]
    assert asyncio.run(M.revisar_vencimientos()) == []  # mismo día: no repite
    # Al aprobarse se desactiva solo
    regs[0]["estado"] = "Aprobado"
    assert asyncio.run(M.revisar_vencimientos()) == []
    assert len(falso.envios) == 1


def test_diaria_no_dispara_antes_de_las_8(monkeypatch):
    # 12:00 UTC = 07:00 Colombia -> aún no son las 8
    ahora = datetime(2026, 9, 28, 12, 0, tzinfo=timezone.utc)
    hoy = ahora.date()
    creacion = _creacion_con_restantes(hoy, -3)
    regs = [_radicado("RAD-T-TEM", creacion, flags={"4": "2026-09-20T15:00:00+00:00",
                                                      "8": "2026-09-20T15:00:00+00:00"})]
    _entorno(monkeypatch, regs, ahora)
    assert asyncio.run(M.revisar_vencimientos()) == []


def test_vencido_sin_flag_8_recibe_4_no_8(monkeypatch):
    # Regresión: un vencido sin ningún flag debe recibir el aviso urgente
    # "4 dias", jamás la etiqueta "8 dias"
    hoy = _hoy_utc(2026, 9, 28).date()
    creacion = _creacion_con_restantes(hoy, -3)
    regs = [_radicado("RAD-T-REG", creacion)]
    falso, _ = _entorno(monkeypatch, regs, _hoy_utc(2026, 9, 28))
    res = asyncio.run(M.revisar_vencimientos())
    assert [(n["numeroRadicado"], n["aviso"]) for n in res] == [("RAD-T-REG", "4 dias")]
    assert regs[0]["notifVencimiento"].get("8")


def test_aprobado_nunca_avisa(monkeypatch):
    hoy = _hoy_utc(2026, 9, 28).date()
    creacion = _creacion_con_restantes(hoy, -31)
    regs = [_radicado("RAD-T-APR", creacion, estado="Aprobado")]
    falso, _ = _entorno(monkeypatch, regs, _hoy_utc(2026, 9, 28))
    assert asyncio.run(M.revisar_vencimientos()) == []
    assert falso.envios == []


# --------------------------------------------------------------------------
# 4. Rutas HTTP: códigos y payloads (lifespan solo lee: DB no vacía,
#    columnas 403 capturado; la escritura se neutraliza con mocks)
# --------------------------------------------------------------------------
def _cliente():
    from fastapi.testclient import TestClient
    from backend.main import app
    return TestClient(app)


def test_ruta_lista_exige_jwt():
    with _cliente() as c:
        r = c.get("/api/radicacion/lista")
        assert r.status_code == 401
        assert "detail" in r.json()


def test_ruta_verify_emite_jwt_y_lista_responde():
    with _cliente() as c:
        r = c.post("/api/auth/msal-verify",
                   json={"account": {"username": "nadie@t.com"}, "role": "contratista"})
        assert r.status_code == 200
        assert r.json()["user"]["role"] == "contratista"
        tok = r.json()["token"]
        r2 = c.get("/api/radicacion/lista", headers={"Authorization": "Bearer " + tok})
        assert r2.status_code == 200
        assert set(r2.json().keys()) >= {"data", "total", "ultimoGlobal"}


def test_ruta_revisar_vencimientos_segura():
    with _cliente() as c:
        assert c.post("/api/m365/revisar-vencimientos").status_code == 401
        r = c.post("/api/auth/msal-verify",
                   json={"account": {"username": "c@t.com"}, "role": "contratista"})
        tok = r.json()["token"]
        r2 = c.post("/api/m365/revisar-vencimientos",
                    headers={"Authorization": "Bearer " + tok})
        assert r2.status_code == 403


def test_ruta_revisar_notifica_con_payload(monkeypatch):
    import backend.main as M2
    hoy = _hoy_utc(2026, 9, 28).date()
    creacion = _creacion_con_restantes(hoy, 8)
    regs = [_radicado("RAD-T-RUTA", creacion)]
    with _cliente() as c:
        # Token con hora real (si se emite con el reloj congelado, nace expirado)
        r = c.post("/api/auth/msal-verify",
                   json={"account": {"username": "rev@intecoalsas.com"}, "role": "interventor"})
        assert r.json()["user"]["role"] == "interventor"
        tok = r.json()["token"]
        monkeypatch.setattr(M2, "radicaciones_db", regs)
        falso = _GraphFalso()
        monkeypatch.setattr(M2, "graph_service", falso)
        monkeypatch.setattr(M2, "guardar_db", lambda: None)
        _RelojFijo._fija = _hoy_utc(2026, 9, 28)
        monkeypatch.setattr(M2, "datetime", _RelojFijo)
        r2 = c.post("/api/m365/revisar-vencimientos",
                    headers={"Authorization": "Bearer " + tok})
        assert r2.status_code == 200
        cuerpo = r2.json()
        assert cuerpo["ok"] is True and cuerpo["total"] == 1
        assert cuerpo["notificados"][0]["numeroRadicado"] == "RAD-T-RUTA"
        assert cuerpo["notificados"][0]["aviso"] == "8 dias"
