// API Service module to communicate with Python FastAPI Backend
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:8000/api' 
  : '/api';

const ApiService = {
  async getHealth() {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      return await res.json();
    } catch (e) {
      console.warn('Backend not reached, using local mode:', e);
      return { status: 'offline' };
    }
  },

  async getFilings(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE_URL}/radicacion/lista?${query}`);
      if (!res.ok) throw new Error('Error al cargar expedientes');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async getFilingDetail(id) {
    try {
      const res = await fetch(`${API_BASE_URL}/radicacion/${id}`);
      if (!res.ok) throw new Error('Radicación no encontrada');
      return await res.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async createFiling(formData) {
    try {
      const res = await fetch(`${API_BASE_URL}/radicacion/nueva`, {
        method: 'POST',
        body: formData
      });
      if (!res.ok) throw new Error('Error al crear radicación');
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  },

  async updateFilingStatus(id, payload) {
    try {
      const res = await fetch(`${API_BASE_URL}/radicacion/${id}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Error al actualizar estado');
      return await res.json();
    } catch (e) {
      console.error(e);
      return { success: false, error: e.message };
    }
  },

  async login(email, company, role) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, company, role })
      });
      return await res.json();
    } catch (e) {
      return {
        token: 'local-demo-token',
        user: { name: email ? email.split('@')[0].toUpperCase() : 'JOHN CASTRO', role: role || 'interventor', company: company || 'INTECOAL SAS' }
      };
    }
  },

  async verifyMsalToken(accountData) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/msal-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ account: accountData })
      });
      return await res.json();
    } catch (e) {
      const email = accountData.username || 'estudiante@soy.sena.edu.co';
      const domain = email.includes('@') ? email.split('@')[1].toLowerCase() : '';
      let company = 'INTECOAL SAS';
      if (domain.includes('sena')) company = 'SENA - Servicio Nacional de Aprendizaje';
      else if (domain.includes('electroingenieria')) company = 'ELECTROINGENIERIA S.A.S.';
      else if (domain.includes('ingenieria-energia')) company = 'INGENIERIA Y ENERGIA S.A.S.';
      else if (domain) company = `${domain.split('.')[0].toUpperCase()} S.A.S.`;

      return {
        verified: true,
        token: 'msal-local-jwt',
        user: {
          name: accountData.name || email.split('@')[0].toUpperCase(),
          email: email,
          role: domain.includes('intecoal') ? 'interventor' : 'contratista',
          company: company
        }
      };
    }
  }
};
