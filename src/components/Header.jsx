import React, { useState } from 'react';
import { 
  Menu, 
  X, 
  Settings, 
  ShieldCheck, 
  LogOut
} from 'lucide-react';
import { IntecoalLogo } from './IntecoalLogo';

export const Header = ({
  user,
  m365Config,
  onOpenLogin,
  onOpenM365,
  onLogout,
  filingCount
}) => {
  const [isM365DrawerOpen, setIsM365DrawerOpen] = useState(false);

  return (
    <>
      <header className="bg-[#1E222A] text-white border-b-4 border-[#D9CF43] shadow-lg sticky top-0 z-40 print:hidden">
        <div className="w-full px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <IntecoalLogo size="46px" className="shrink-0" />

            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-xl tracking-tight text-white">INTECOAL SAS</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <div className="hidden md:flex items-center space-x-2 bg-slate-800/90 border border-slate-700/90 px-3 py-1.5 rounded-xl text-xs">
              <span className={`w-2 h-2 rounded-full ${user.role === 'interventor' ? 'bg-[#D9CF43]' : 'bg-amber-400'}`} />
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold leading-none">
                  {user.role === 'interventor' ? 'Responsable de Revisión' : 'Contratista'}
                </span>
                {user.role === 'interventor' && (
                  <span className="text-[#D9CF43] font-extrabold text-xs leading-none mt-0.5">
                    Interventoría
                  </span>
                )}
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center space-x-1.5 bg-slate-800/80 hover:bg-red-950/60 text-gray-300 hover:text-red-300 border border-slate-700 hover:border-red-800/80 px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                title="Cerrar Sesión"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsM365DrawerOpen(true)}
              className="flex items-center space-x-2 bg-slate-800 hover:bg-[#1E222A] text-[#D9CF43] hover:text-white border border-[#D9CF43]/40 hover:border-[#D9CF43] px-3.5 py-2 rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
              title="Abrir Opciones de Cuenta"
            >
              <Menu className="w-5 h-5 stroke-[2.5]" />
              <span className="text-xs font-black uppercase tracking-wider hidden xs:inline">
                Opciones y Cuenta
              </span>
            </button>
          </div>
        </div>
      </header>

      {isM365DrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsM365DrawerOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-[#1E222A] text-white border-l-4 border-[#D9CF43] shadow-2xl flex flex-col justify-between p-6">
              <div>
                <div className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
                  <div className="flex items-center space-x-2.5">
                    <IntecoalLogo size="38px" />
                    <div>
                      <h2 className="text-base font-black text-white tracking-wide">
                        Opciones de Cuenta
                      </h2>
                      <p className="text-xs text-gray-400">
                        Sesión y perfil del usuario
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsM365DrawerOpen(false)}
                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 space-y-3">
                    <span className="text-xs font-black uppercase tracking-wider text-gray-400 block border-b border-slate-700 pb-2">
                      Usuario Activo en el Portal
                    </span>

                    <div className="flex items-center space-x-3 pt-1">
                      <div className="w-10 h-10 rounded-xl bg-[#D9CF43] text-[#1E222A] font-black flex items-center justify-center text-sm shadow shrink-0">
                        {(user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-black text-white">
                          {user.name}
                        </div>
                        <div className="text-xs text-gray-300 font-semibold">
                          {user.role === 'interventor' ? 'Responsable de Revisión' : ''}
                        </div>
                        {user.role === 'interventor' && (
                          <div className="text-[10px] font-bold text-[#D9CF43] uppercase tracking-wider mt-0.5">
                            Interventoría
                          </div>
                        )}
                      </div>
                    </div>

                    {onLogout && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsM365DrawerOpen(false);
                          onLogout();
                        }}
                        className="w-full py-2.5 px-3 bg-red-950/80 hover:bg-red-900 text-red-200 font-extrabold text-xs rounded-xl transition-all border border-red-800/80 flex items-center justify-center space-x-2 mt-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 stroke-[2.5]" />
                        <span>Cerrar Sesión</span>
                      </button>
                    )}
                  </div>

                  <div className="bg-slate-800/40 border border-slate-700/80 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Cumplimiento RETILAP & RETIE</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      Los 21 documentos del expediente se clasifican e indexan automáticamente en el repositorio documental cuando el Responsable de Revisión aprueba el radicado.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-700 pt-4 text-center">
                <p className="text-[11px] text-gray-400">
                  INTECOAL SAS · Versión 2.5
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
