import React, { useState } from 'react';
import { User, Role } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { User as FirebaseUser } from 'firebase/auth';
import {
  Menu,
  Moon,
  Sun,
  Globe,
  LogOut,
  UserCheck,
  ShieldCheck,
  Users,
  Database,
  CheckCircle2,
} from 'lucide-react';

interface VuetifyAppBarProps {
  currentUser: User;
  onSwitchUser: (user: User) => void;
  availableUsers: User[];
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onOpenDocSpec?: () => void;
  onToggleDrawer: () => void;
  onLogout: () => void;
  firebaseUser?: FirebaseUser | null;
  onGoogleSignIn?: () => void;
  onSyncCollections?: () => void;
  isSyncing?: boolean;
}

export const VuetifyAppBar: React.FC<VuetifyAppBarProps> = ({
  currentUser,
  onSwitchUser,
  availableUsers,
  isDarkMode,
  onToggleDarkMode,
  language,
  onLanguageChange,
  onOpenDocSpec,
  onToggleDrawer,
  onLogout,
  firebaseUser,
  onGoogleSignIn,
  onSyncCollections,
  isSyncing,
}) => {
  const t = translations[language];
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  // Compute text avatar initials
  const initials = currentUser.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between px-3 sm:px-6 gap-3 transition-colors">
      {/* Zone 1: Hamburger Menu & Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Hamburger button for desktop/tablet drawer */}
        <button
          onClick={onToggleDrawer}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Alternar menú lateral"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="w-9 h-9 rounded-lg overflow-hidden bg-emerald-50 dark:bg-emerald-950 border border-emerald-200/80 dark:border-emerald-800 flex items-center justify-center shrink-0">
          <img
            src="/src/assets/images/mision_presentes_logo_1791611048130.jpg"
            alt="Logo Misión regalo"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col">
          <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base sm:text-lg leading-tight whitespace-nowrap">
            {t.appTitle}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:inline-block leading-none mt-0.5">
            {t.tagline}
          </span>
        </div>
      </div>

      {/* Zone 2: Controls (Google Sign-In, Role Switcher, Dark Mode, Language, UI Spec) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Google Authentication Pill */}
        {firebaseUser ? (
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="truncate max-w-[130px] font-mono">{firebaseUser.email}</span>
            <span className="text-[9px] px-1 py-0.2 bg-emerald-200/60 dark:bg-emerald-900 rounded font-semibold">Firebase Live</span>
          </div>
        ) : (
          onGoogleSignIn && (
            <button
              onClick={onGoogleSignIn}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-xs border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-all hover:border-blue-400"
              title="Iniciar sesión con Google"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
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
              <span>{language === 'es' ? 'Acceder con Google' : 'Sign in'}</span>
            </button>
          )
        )}

        {/* Quick User/Role Switcher Dropdown */}
        <div className="hidden sm:flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1 hidden xl:inline">
            {language === 'es' ? 'Simular Rol:' : 'Role:'}
          </span>
          <select
            value={currentUser.id}
            onChange={(e) => {
              const u = availableUsers.find((usr) => usr.id === e.target.value);
              if (u) onSwitchUser(u);
            }}
            className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded px-2 py-1 text-slate-800 dark:text-slate-200 font-medium"
          >
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.roleName})
              </option>
            ))}
          </select>
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Language Switcher */}
        <button
          onClick={() => onLanguageChange(language === 'es' ? 'en' : 'es')}
          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          title="Cambiar idioma / Switch language"
        >
          <Globe className="w-3.5 h-3.5 text-slate-500" />
          <span>{language.toUpperCase()}</span>
        </button>

        {/* Zone 3: Text Avatar with Hover Tooltip & Logout Popover */}
        <div className="relative pl-2 border-l border-slate-200 dark:border-slate-700">
          <div
            className="relative"
            onMouseEnter={() => setIsHoveringAvatar(true)}
            onMouseLeave={() => setIsHoveringAvatar(false)}
          >
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-9 h-9 rounded-full bg-slate-900 dark:bg-blue-600 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-200 dark:ring-slate-700 hover:ring-blue-500 transition-all cursor-pointer font-mono"
            >
              {initials}
            </button>

            {/* Hover Tooltip displaying user's full name */}
            {isHoveringAvatar && !isUserMenuOpen && (
              <div className="absolute right-0 top-11 z-50 px-2.5 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[11px] font-medium rounded-lg shadow-lg whitespace-nowrap pointer-events-none transition-all">
                {currentUser.name} ({currentUser.roleName})
              </div>
            )}
          </div>

          {/* User Menu Popover with Log-out option */}
          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 text-xs space-y-2">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-900 dark:text-white leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                  {firebaseUser ? firebaseUser.email : currentUser.email}
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {currentUser.roleName}
                  </span>
                  {firebaseUser && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Google Auth
                    </span>
                  )}
                </div>
              </div>

              {!firebaseUser && onGoogleSignIn && (
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onGoogleSignIn();
                  }}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 font-semibold transition-colors text-left"
                >
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
                  <span>{language === 'es' ? 'Conectar con Google' : 'Sign in with Google'}</span>
                </button>
              )}

              {onSyncCollections && (
                <button
                  onClick={() => {
                    onSyncCollections();
                  }}
                  disabled={isSyncing}
                  className="w-full flex items-center gap-2 p-2 rounded-lg text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 font-semibold transition-colors text-left disabled:opacity-50"
                  title="Poblar o sincronizar todas las colecciones a Firestore"
                >
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>
                    {isSyncing
                      ? language === 'es'
                        ? 'Sincronizando...'
                        : 'Syncing...'
                      : language === 'es'
                        ? 'Poblar Colecciones Firestore'
                        : 'Populate Firestore Collections'}
                  </span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 p-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 font-semibold transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>{language === 'es' ? 'Cerrar Sesión (Log-out)' : 'Log out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
