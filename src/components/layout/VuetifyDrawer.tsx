import React from 'react';
import { RolePermissions, User } from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  isReasignacionManualVisible,
  isSimularReasignacionVisible,
  isRecordatoriosVisible,
  isArchivoVisible,
} from '../../utils/env';
import {
  LayoutDashboard,
  Mail,
  Archive,
  UserCheck,
  HeartHandshake,
  Wand2,
  GitMerge,
  BarChart3,
  BellRing,
  FileCode2,
  ChevronRight,
  ShieldAlert,
  Calendar,
  School,
  Lock,
  Users,
  ShieldCheck,
  Layers,
} from 'lucide-react';

interface VuetifyDrawerProps {
  isOpen: boolean;
  activeView: string;
  onSelectView: (view: string) => void;
  currentUser: User;
  permissions: RolePermissions;
  language: Language;
  stats: {
    totalLetters: number;
    noDonorCount: number;
    noPresentCount: number;
  };
}

export const VuetifyDrawer: React.FC<VuetifyDrawerProps> = ({
  isOpen,
  activeView,
  onSelectView,
  currentUser,
  permissions,
  language,
  stats,
}) => {
  const t = translations[language];

  const isCoordinator = (currentUser.roleName || '').toLowerCase() === 'coordinator' || currentUser.roleId === 'ROLE-COORD';

  // All menu options filtered strictly based on permissions
  const navItems = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard, visible: true },
    { id: 'letters', label: t.nav.letters, icon: Mail, visible: permissions.CLett },
    { id: 'closing', label: t.nav.closing, icon: Lock, visible: permissions.NC },
    { id: 'events', label: t.nav.events, icon: Calendar, visible: permissions.CE },
    { 
      id: 'volunteers', 
      label: (
        (currentUser.roleName || '').toLowerCase() === 'coordinator' || currentUser.roleId === 'ROLE-COORD' 
          ? (language === 'es' ? 'Padrinos Donantes' : 'Donor Sponsors') 
          : ((currentUser.roleName || '').toLowerCase() === 'leader'
              ? (language === 'es' ? 'Coordinadores y Donantes' : 'Coordinators and Donors')
              : (language === 'es' ? 'Líderes, Coordinadores y Donantes' : 'Leaders, Coordinators and Donors')
            )
      ), 
      icon: UserCheck, 
      visible: permissions.CL || permissions.CC || permissions.CD 
    },    { id: 'bulk-assign', label: language === 'es' ? 'Asignación Masiva' : 'Bulk Letter Assignment', icon: Layers, visible: (currentUser.roleName || '').toLowerCase() !== 'coordinator' && currentUser.roleId !== 'ROLE-COORD' && (currentUser.roleName === 'Admin' || currentUser.roleName === 'Leader' || permissions.CLett) },
    { id: 'reassign-sim', label: t.nav.reassignSim, icon: Wand2, visible: permissions.RP && isSimularReasignacionVisible() && (currentUser.roleName || '').toLowerCase() === 'admin' },
    { id: 'reassign-manual', label: t.nav.reassignManual, icon: GitMerge, visible: permissions.RP && isReasignacionManualVisible() },
    { id: 'reports', label: t.nav.reports, icon: BarChart3, visible: (currentUser.roleName || '').toLowerCase() !== 'coordinator' && currentUser.roleId !== 'ROLE-COORD' },
    { id: 'archive', label: t.nav.archive, icon: Archive, visible: (currentUser.roleName || '').toLowerCase() === 'admin' && isArchivoVisible() },
    { id: 'reminders', label: t.nav.reminders, icon: BellRing, visible: (permissions.SER || permissions.SWR) && isRecordatoriosVisible() },
    { id: 'users', label: t.nav.users, icon: Users, visible: permissions.CL },
  ];

  if (!isOpen) return null;

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)] transition-all">
      {/* Drawer Header / Active User Badge */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1">
          {language === 'es' ? 'Usuario Autenticado' : 'Authenticated User'}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
            {currentUser.name[0]}
          </div>
          <div className="truncate">
            <div className="text-xs font-semibold text-white truncate">{currentUser.name}</div>
            <div className="text-[10px] text-emerald-400 font-mono">{currentUser.roleName}</div>
          </div>
        </div>
      </div>

      {/* Navigation List - Only visible permitted options */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          {language === 'es' ? 'Menú por Permisos' : 'Permitted Options'}
        </div>

        {navItems
          .filter((item) => item.visible)
          .map((item) => {
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                data-testid={`nav-${item.id}`}
                onClick={() => onSelectView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all text-left group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <item.icon
                    className={`w-4 h-4 shrink-0 transition-transform ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-white translate-x-0.5' : 'text-slate-600'
                    }`}
                  />
                </div>
              </button>
            );
          })}
      </nav>

    </aside>
  );
};
