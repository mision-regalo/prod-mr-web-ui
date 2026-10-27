/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Language } from '../../i18n/translations';
import { ShieldCheck, Globe, Sun, Moon, Loader2 } from 'lucide-react';

interface LoginRequiredViewProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onGoogleSignIn: () => void;
  isSigningIn?: boolean;
}

// Shown when DEPLOYED_ENV requires Google authentication and no user is signed in yet.
// Unlike AccessDeniedView, this does not imply the user was rejected—just that they
// have not authenticated at all.
export const LoginRequiredView: React.FC<LoginRequiredViewProps> = ({
  language,
  onLanguageChange,
  isDarkMode,
  onToggleDarkMode,
  onGoogleSignIn,
  isSigningIn,
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white leading-none">
              MISIÓN PRESENTE
            </div>
            <div className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
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
        </div>
      </header>

      {/* Main Center Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="w-20 h-20 rounded-full bg-blue-100 dark:bg-blue-950/80 border-4 border-blue-200 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
              <ShieldCheck className="w-10 h-10 stroke-[2.2]" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isEs ? 'Inicia sesión para continuar' : 'Sign in to continue'}
            </h1>

            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-sm leading-relaxed">
              {isEs
                ? 'Este entorno requiere autenticación con Google para acceder al sistema de Misión Presente.'
                : 'This environment requires Google authentication to access the Misión Presente system.'}
            </p>
          </div>

          <button
            onClick={onGoogleSignIn}
            disabled={isSigningIn}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm text-slate-800 dark:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 active:scale-[0.99] transition-all shadow-lg disabled:opacity-50 cursor-pointer"
          >
            {isSigningIn ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{isEs ? 'Continuar con Google' : 'Continue with Google'}</span>
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 dark:text-slate-600 border-t border-slate-200 dark:border-slate-800">
        Misión Presente A.C. — {isEs ? 'Seguridad y Control de Acceso' : 'Security & Access Control'}
      </footer>
    </div>
  );
};
