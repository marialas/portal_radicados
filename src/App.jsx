/**
 * ============================================================================
 * INTECOAL S.A.S. - SISTEMA DE RADICACIÓN DE EXPEDIENTES ALUMBRADO PÚBLICO
 * PROYECTO DE ETAPA PRÁCTICA SENA
 * ============================================================================
 * Componente Principal de la Aplicación en React + JavaScript.
 * Controla la navegación, estados de usuarios (Revisor / Contratista)
 * y la visualización de los 21 requisitos RETILAP.
 * ----------------------------------------------------------------------------
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { RadicacionForm } from './components/RadicacionForm';
import { RadicacionesList } from './components/RadicacionesList';
import { InformeRecibidoConformidad } from './components/InformeRecibidoConformidad';
import { EvaluacionRadicacion } from './components/EvaluacionRadicacion';
import { LoginForm } from './components/LoginForm';
import { ErrorBoundary } from './components/ErrorBoundary';

import { logoutM365User, ensureMsalInit, extractCompanyFromEmail, formatNameFromEmail, msalInstance } from './lib/msalConfig';

export default function App() {
  // Pestaña activa del sistema: lista, nueva, informe o evaluacion
  const [activeTab, setActiveTab] = useState('lista');
  
  // Lista de radicaciones cargadas en memoria o backend
  const [filings, setFilings] = useState([]);
  const [selectedFiling, setSelectedFiling] = useState(null);
  const [editingFiling, setEditingFiling] = useState(null);

  // Estado de sesión del usuario SENA / INTECOAL (restaurado de sessionStorage o localStorage si existe)
  const [user, setUser] = useState({
    isAuthenticated: false,
    name: '',
    email: '',
    role: 'interventor',
    company: ''
  });

  // Estado para mensajes de error de autenticación MSAL/Azure AD
  const [msalAuthError, setMsalAuthError] = useState(null);

  // Estado para indicar si se está procesando la redirección de M365 en la URL
  const [isProcessingMsal, setIsProcessingMsal] = useState(() => {
    if (typeof window !== 'undefined' && window.location.hash && (window.location.hash.includes('code=') || window.location.hash.includes('id_token=') || window.location.hash.includes('error='))) {
      return true;
    }
    return false;
  });

  // M365 Config state (loaded from backend /api/m365/status)
  const [m365Config, setM365Config] = useState({
    azureClientId: import.meta.env.VITE_MSAL_CLIENT_ID || '',
    azureTenantId: '',
    sharepointSiteUrl: '',
    sharepointSiteId: '',
    sharepointListId: '',
    sharepointLibraryId: '',
    onedriveFolderRoot: '',
    senderEmail: '',
    isConnected: false
  });

  useEffect(() => {
    fetch('/api/m365/status')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.config) {
          setM365Config(prev => ({
            ...prev,
            ...data.config
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Filtrar radicados por la cuenta del Contratista (solo los creados por ese usuario).
  // El Responsable de Revisión ve todos los radicados.
  const userFilings = React.useMemo(() => {
    if (user.role === 'contratista' && user.isAuthenticated) {
      const userEmailClean = (user.email || '').toLowerCase().trim();
      if (!userEmailClean) return [];

      return filings.filter(f => {
        const creatorEmailClean = (f.creadorEmail || f.metadata?.creadorEmail || '').toLowerCase().trim();

        return creatorEmailClean === userEmailClean;
      });
    }
    return filings;
  }, [filings, user]);

  // Keep selectedFiling valid for the active user context
  useEffect(() => {
    if (user.role === 'contratista') {
      if (userFilings.length > 0) {
        if (!selectedFiling || !userFilings.some(f => f.id === selectedFiling.id)) {
          setSelectedFiling(userFilings[0]);
        }
      } else {
        setSelectedFiling(null);
      }
    } else {
      if (filings.length > 0 && !selectedFiling) {
        setSelectedFiling(filings[0]);
      }
    }
  }, [userFilings, user.role, filings, selectedFiling]);

  // Enforce role restrictions on activeTab
  useEffect(() => {
    if (user.role === 'interventor' && activeTab === 'nueva') {
      setActiveTab('lista');
    }
    if (user.role === 'contratista' && activeTab === 'evaluacion') {
      setActiveTab('informe');
    }
  }, [user.role, activeTab]);

  // Fetch filings from backend API on mount & process MSAL redirect response
  useEffect(() => {
    fetchFilings();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user.isAuthenticated) {
        fetchFilings();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const urlHash = typeof window !== 'undefined' ? window.location.hash : '';
    const hasMsalHash = urlHash && (urlHash.includes('code=') || urlHash.includes('id_token=') || urlHash.includes('error='));

    ensureMsalInit().then((res) => {
      const redirectResponse = res?.redirectResponse;
      const msalError = res?.error;

      // Read active MSAL attempt flags BEFORE cleaning
      const wasAttemptingMsal = typeof window !== 'undefined' && (
        sessionStorage.getItem('is_msal_login_attempt') === 'true' || 
        localStorage.getItem('is_msal_login_attempt') === 'true'
      );

      const savedRole = typeof window !== 'undefined' ? (
        sessionStorage.getItem('pending_msal_role') || 
        localStorage.getItem('pending_msal_role')
      ) : null;

      const pendingEmail = typeof window !== 'undefined' ? (
        sessionStorage.getItem('pending_msal_email') || 
        localStorage.getItem('pending_msal_email')
      ) : null;

      const cleanPendingMsalStorage = () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem('pending_msal_role');
          localStorage.removeItem('pending_msal_role');
          sessionStorage.removeItem('is_msal_login_attempt');
          localStorage.removeItem('is_msal_login_attempt');
          sessionStorage.removeItem('pending_msal_email');
          localStorage.removeItem('pending_msal_email');
        }
      };

      // Limpiar fragmentos de código o tokens en la URL para dejar la dirección limpia
      if (hasMsalHash && typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      }

      // Determinar si realmente se completó un redirect desde Microsoft 365 con tokens o respuesta válida
      const isCompletedRedirect = Boolean(redirectResponse || (hasMsalHash && !urlHash.includes('error=')));

      if (isCompletedRedirect) {
        let account = redirectResponse?.account || res?.account;
        if (!account && msalInstance && typeof msalInstance.getAllAccounts === 'function') {
          try {
            const accounts = msalInstance.getAllAccounts();
            if (accounts && accounts.length > 0) {
              account = accounts[0];
            }
          } catch (e) {
            console.warn('Error reading accounts from msalInstance:', e);
          }
        }

        const roleToAssign = savedRole || 'contratista';

        if (account) {
          const email = (account?.username || '').toLowerCase();
          const nameFormatted = formatNameFromEmail(email, account?.name);
          const company = extractCompanyFromEmail(email);

          const newUser = {
            isAuthenticated: true,
            name: nameFormatted,
            email: email,
            role: roleToAssign,
            company: company
          };

          cleanPendingMsalStorage();
          setUser(newUser);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('m365_user_session', JSON.stringify(newUser));
            localStorage.setItem('m365_user_session', JSON.stringify(newUser));
          }
          setActiveTab('lista');
        } else if (wasAttemptingMsal && pendingEmail) {
          const userEmailToUse = pendingEmail.toLowerCase();
          const company = extractCompanyFromEmail(userEmailToUse);
          const nameFormatted = formatNameFromEmail(userEmailToUse);

          const newUser = {
            isAuthenticated: true,
            name: nameFormatted,
            email: userEmailToUse,
            role: roleToAssign,
            company: company
          };

          cleanPendingMsalStorage();
          setUser(newUser);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('m365_user_session', JSON.stringify(newUser));
            localStorage.setItem('m365_user_session', JSON.stringify(newUser));
          }
          setActiveTab('lista');
        } else {
          cleanPendingMsalStorage();
        }
      } else {
        // Si el usuario se devolvió en el navegador o canceló en Microsoft, NO iniciar sesión.
        if (wasAttemptingMsal) {
          cleanPendingMsalStorage();
        }
        if (msalError && !wasAttemptingMsal) {
          setMsalAuthError(`Respuesta de Microsoft 365: ${msalError.message || msalError}`);
        }
      }

      setIsProcessingMsal(false);
    }).catch(err => {
      console.warn('MSAL redirect check warning:', err);
      setIsProcessingMsal(false);
    });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchFilings = async (retryCount = 0) => {
    try {
      const params = new URLSearchParams();
      if (user.email && user.isAuthenticated) {
        params.set('email', user.email);
        params.set('rol', user.role);
      }
      const qs = params.toString();
      const res = await fetch(`/api/radicacion/lista${qs ? '?' + qs : ''}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setFilings(json.data);
          if (json.data.length > 0 && !selectedFiling) {
            setSelectedFiling(json.data[0]);
          }
        }
      } else if (retryCount < 3) {
        await new Promise(r => setTimeout(r, 3000));
        fetchFilings(retryCount + 1);
      }
    } catch (err) {
      if (retryCount < 3) {
        await new Promise(r => setTimeout(r, 3000));
        fetchFilings(retryCount + 1);
      } else {
        console.warn('Backend no disponible después de reintentos', err);
      }
    }
  };

  const handleLoginSuccess = (newUser, defaultTab = 'lista') => {
    setUser(newUser);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('m365_user_session', JSON.stringify(newUser));
    }
    setActiveTab(defaultTab);
  };

  const handleLogout = async () => {
    await logoutM365User();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('m365_user_session');
      sessionStorage.removeItem('pending_msal_role');
    }
    setUser({
      isAuthenticated: false,
      name: '',
      email: '',
      role: 'interventor',
      company: ''
    });
  };

  const handleFilingCreated = (newRecord) => {
    if (editingFiling) {
      setFilings(prev => prev.map(f => f.id === newRecord.id ? newRecord : f));
      setEditingFiling(null);
      setSelectedFiling(newRecord);
      setActiveTab('informe');
    } else {
      setFilings([newRecord, ...filings]);
      setSelectedFiling(newRecord);
      setActiveTab('informe');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/radicacion/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          estado: newStatus,
          usuarioEmail: user?.email || '',
          usuarioNombre: user?.name || ''
        })
      });
      if (res.ok) {
        const json = await res.json();
        setFilings(filings.map(f => f.id === id ? json.data : f));
        if (selectedFiling && selectedFiling.id === id) {
          setSelectedFiling(json.data);
        }
      }
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  const handleSaveEvaluation = async (updatedFiling) => {
    setFilings(prev => prev.map(f => f.id === updatedFiling.id ? updatedFiling : f));
    setSelectedFiling(updatedFiling);

    try {
      await fetch(`/api/radicacion/${updatedFiling.id}/metadata`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedFiling.metadata })
      });
    } catch (e) {
      console.warn('Could not sync metadata to backend:', e);
    }
  };

  return (
    <div className={`bg-[#F2F2F2] font-sans text-gray-900 flex flex-col selection:bg-[#D9CF43] selection:text-[#0D0D0D] ${
      user.isAuthenticated ? 'h-screen overflow-hidden print:h-auto print:overflow-visible' : 'min-h-screen'
    }`}>
      {/* Main Container */}
      {isProcessingMsal ? (
        <main className="flex-1 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#1A1D24]">
          <div className="bg-[#212631] border border-gray-700/60 rounded-xl p-8 max-w-md w-full text-center shadow-xl">
            <div className="w-12 h-12 border-4 border-[#0078D4] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-xl font-bold text-white mb-2">Autenticando con Microsoft 365...</h2>
            <p className="text-sm text-gray-400">Verificando credenciales institucionales y redirigiendo al portal.</p>
          </div>
        </main>
      ) : !user.isAuthenticated ? (
        /* Formulario de Autenticación Principal (Sin Header Superior) */
        <main className="flex-1 min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#1A1D24] sm:bg-[#EAEAEA]">
          <LoginForm onLoginSuccess={handleLoginSuccess} externalError={msalAuthError} />
        </main>
      ) : (
        /* Workspace Main Area with Top Header and Sidebar */
        <>
          {/* Top Header - Appears after login */}
          <Header
            user={user}
            m365Config={m365Config}
            onOpenLogin={() => {}}
            onLogout={handleLogout}
            filingCount={userFilings.length}
          />

          <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden print:h-auto print:overflow-visible">
            {/* Left Vertical Navigation Sidebar */}
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => setActiveTab(tab)}
              filingCount={userFilings.length}
              userRole={user.role}
            />

          {/* Workspace Content Area */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto print:p-0 print:overflow-visible print:h-auto">
            <ErrorBoundary>
              {activeTab === 'nueva' && (
                <RadicacionForm
                  filingToEdit={editingFiling}
                  onSuccess={handleFilingCreated}
                  onCancel={() => {
                    setEditingFiling(null);
                    setActiveTab('lista');
                  }}
                  currentUser={user}
                />
              )}

              {activeTab === 'lista' && (
                <RadicacionesList
                  filings={userFilings}
                  onSelectFiling={(record) => {
                    setSelectedFiling(record);
                    setActiveTab('informe');
                  }}
                  onEvaluateFiling={(record) => {
                    setSelectedFiling(record);
                    setActiveTab('evaluacion');
                  }}
                  onNewFiling={() => {
                    setEditingFiling(null);
                    setActiveTab('nueva');
                  }}
                  onUpdateStatus={handleUpdateStatus}
                  onEditFiling={(record) => {
                    setEditingFiling(record);
                    setActiveTab('nueva');
                  }}
                  userRole={user.role}
                  currentUser={user}
                />
              )}

              {activeTab === 'evaluacion' && selectedFiling && (
                <EvaluacionRadicacion
                  filing={selectedFiling}
                  onSaveEvaluation={handleSaveEvaluation}
                  onViewReport={(filing) => {
                    setSelectedFiling(filing);
                    setActiveTab('informe');
                  }}
                  onBack={() => setActiveTab('lista')}
                  currentUser={user}
                  userRole={user.role}
                />
              )}

              {activeTab === 'informe' && selectedFiling && (
                <InformeRecibidoConformidad
                  filing={selectedFiling}
                  onBack={() => setActiveTab('lista')}
                  onEditEvaluation={(filing) => {
                    setSelectedFiling(filing);
                    setActiveTab('evaluacion');
                  }}
                  onUpdateFiling={handleSaveEvaluation}
                  currentUser={user}
                  userRole={user.role}
                />
              )}
            </ErrorBoundary>
          </main>
        </div>
      </>
      )}
    </div>
  );
}
