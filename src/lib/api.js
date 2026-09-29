/**
 * HTTP centralizado: inyecta el JWT; ante 401 limpia y vuelve al ingreso.
 */

const TOKEN_KEY = 'm365_jwt';

export function getToken() {
  try {
    return (
      sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''
    );
  } catch {
    return '';
  }
}

export function setToken(token) {
  try {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* almacenamiento no disponible */
  }
}

function sesionExpirada() {
  const teniaToken = Boolean(getToken());
  try {
    sessionStorage.removeItem('m365_user_session');
    localStorage.removeItem('m365_user_session');
    sessionStorage.removeItem('pending_msal_role');
    sessionStorage.removeItem('active_tab');
  } catch {
    /* ignora */
  }
  setToken('');
  // Solo recarga si había sesión (evita bucles en la pantalla de ingreso)
  if (teniaToken && typeof window !== 'undefined') {
    window.location.reload();
  }
}

export async function apiFetch(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const resp = await fetch(path, { ...options, headers });
  if (resp.status === 401) {
    sesionExpirada();
  }
  return resp;
}

/** JWT del backend para el usuario M365 (valida el rol). */
export async function obtenerJwt(email, role) {
  const resp = await fetch('/api/auth/msal-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: { username: (email || '').toLowerCase() }, role })
  });
  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    throw new Error(data?.detail || `No se pudo validar la sesión (${resp.status})`);
  }
  if (data?.token) {
    setToken(data.token);
  }
  return data;
}
