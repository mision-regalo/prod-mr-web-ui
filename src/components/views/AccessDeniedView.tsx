import React from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { Language } from '../../i18n/translations';
import {
  ShieldAlert,
  LogOut,
  RefreshCw,
  Globe,
  Sun,
  Moon,
  Mail,
  UserX,
  AlertCircle,
} from 'lucide-react';

interface AccessDeniedViewProps {
  firebaseUser: FirebaseUser;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onLogout: () => void;
  onRetry?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  firebaseUser,
  language,
  onLanguageChange,
  onLogout,
  onRetry,
  isDarkMode,
  onToggleDarkMode,
}) => {
  const isEs = language === 'es';

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      } flex flex-col font-sans transition-colors`}
    >
      {/* Top Minimal Bar */}
      <header className="h-16 px-4 md:px-8 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
              MISIÓN PRESENTE
            </div>
            <div className="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
              {isEs ? 'Portal de Gestión de Cartas' : 'Letters Management Portal'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dark Mode Switcher */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isEs ? 'Cambiar Tema' : 'Toggle Theme'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Language Switcher */}
          <button
            onClick={() => onLanguageChange(isEs ? 'en' : 'es')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language.toUpperCase()}</span>
          </button>

          {/* Quick Sign Out */}
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEs ? 'Cerrar Sesión' : 'Sign Out'}</span>
          </button>
        </div>
      </header>

      {/* Main Center Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-950/80 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Warning Icon Banner */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/80 border-4 border-rose-200 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-inner">
              <UserX className="w-10 h-10 stroke-[2.2]" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
              <span>{isEs ? 'Acceso No Autorizado' : 'Access Denied / Unauthorized'}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEs ? 'Cuenta no registrada en el sistema' : 'Account not registered in system'}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
              {isEs
                ? 'Tu autenticación con Google fue exitosa, pero este correo electrónico no está registrado en la colección de usuarios de Misión Presente.'
                : 'Your Google sign-in was verified, but this email address is not registered in the Misión Presente users collection.'}
            </p>
          </div>

          {/* Account Details Card */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {isEs ? 'Datos de la cuenta autenticada' : 'Authenticated Google Account'}
            </div>

            <div className="flex items-center gap-3">
              {firebaseUser.photoURL ? (
                <img
                  src={firebaseUser.photoURL}
                  alt={firebaseUser.displayName || 'Google User'}
                  className="w-12 h-12 rounded-full border-2 border-rose-400 dark:border-rose-600 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center font-mono">
                  {firebaseUser.email?.slice(0, 2).toUpperCase() || 'GU'}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-900 dark:text-white truncate">
                  {firebaseUser.displayName || (isEs ? 'Usuario de Google' : 'Google User')}
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 truncate">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{firebaseUser.email}</span>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900 shrink-0">
                {isEs ? 'Sin Rol Asignado' : 'No Role Assigned'}
              </span>
            </div>
          </div>

          {/* Instructions Box */}
          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5">
              <span>{isEs ? '¿Cómo obtener acceso?' : 'How to obtain access?'}</span>
            </div>
            <p className="leading-relaxed text-amber-800 dark:text-amber-300">
              {isEs
                ? 'Un Administrador o Líder de equipo debe dar de alta tu correo electrónico (@gmail.com) registrándote como Líder o Coordinador en la sección de Voluntarios. Una vez que tu cuenta sea registrada, podrás ingresar de forma inmediata.'
                : 'An Administrator or Team Leader must register your @gmail.com email as a Leader or Coordinator in the Volunteers module. Once added, you will gain access immediately.'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 active:scale-[0.99] transition-all shadow-lg shadow-rose-600/25 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isEs ? 'Cerrar Sesión / Salir' : 'Sign Out / Exit'}</span>
            </button>

            {onRetry && (
              <button
                onClick={onRetry}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isEs ? 'Reintentar Verificación' : 'Retry Verification'}</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800">
        Misión Presente A.C. — {isEs ? 'Seguridad y Control de Acceso' : 'Security & Access Control'}
      </footer>
    </div>
  );
};
