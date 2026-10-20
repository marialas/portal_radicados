import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiFetch, obtenerJwt, getToken, setToken } from '../api';

function respuesta(status, cuerpo = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => cuerpo };
}

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('apiFetch — JWT y expiración (caja blanca)', () => {
  it('inyecta Authorization cuando hay token y no lo pisa si ya viene', async () => {
    setToken('JWT-123');
    fetch.mockResolvedValue(respuesta(200));
    await apiFetch('/api/x');
    expect(fetch.mock.calls[0][1].headers['Authorization']).toBe('Bearer JWT-123');
    await apiFetch('/api/x', { headers: { Authorization: 'Bearer OTRO' } });
    expect(fetch.mock.calls[1][1].headers['Authorization']).toBe('Bearer OTRO');
  });

  it('sin token no envía Authorization', async () => {
    fetch.mockResolvedValue(respuesta(200));
    await apiFetch('/api/x');
    expect(fetch.mock.calls[0][1].headers['Authorization']).toBeUndefined();
  });

  it('401 destruye la sesión de forma segura (sin exponer nada más)', async () => {
    sessionStorage.setItem('m365_user_session', JSON.stringify({ email: 'c@t.com' }));
    sessionStorage.setItem('active_tab', 'lista');
    setToken('JWT-VIEJO');
    fetch.mockResolvedValue(respuesta(401, { detail: 'expirada' }));
    await apiFetch('/api/radicacion/lista').catch(() => null);
    expect(getToken()).toBe('');
    expect(sessionStorage.getItem('m365_user_session')).toBeNull();
    expect(sessionStorage.getItem('active_tab')).toBeNull();
  });

  it('obtenerJwt guarda el token y propaga el 403 de rol inválido', async () => {
    fetch.mockResolvedValueOnce(respuesta(200, { token: 'JWT-N', user: { role: 'contratista' } }));
    await obtenerJwt('c@t.com', 'contratista');
    expect(getToken()).toBe('JWT-N');
    fetch.mockResolvedValueOnce(respuesta(403, { detail: 'Solo INTECOAL' }));
    await expect(obtenerJwt('x@gmail.com', 'interventor')).rejects.toThrow('Solo INTECOAL');
  });
});
