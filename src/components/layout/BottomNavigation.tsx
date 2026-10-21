import React, { useState } from 'react';
import { RolePermissions, User } from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  LayoutDashboard,
  Mail,
  Shuffle,
  BarChart3,
  Menu,
  X,
  Calendar,
  Users,
  ShieldCheck,
  Lock,
  UserCheck,
  BellRing,
  Archive,
  Layers,
} from 'lucide-react';

interface BottomNavigationProps {
  activeView: string;
  onSelectView: (view: string) => void;
  currentUser?: User;
  permissions: RolePermissions;
  language: Language;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeView,
  onSelectView,
  currentUser,
  permissions,
  language,
}) => {
  const t = translations[language];
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const isCoordinator = (currentUser?.roleName || '').toLowerCase() === 'coordinator' || currentUser?.roleId === 'ROLE-COORD';

  const mainTabs = [
    { id: 'dashboard', label: t.nav.dashboard, icon: LayoutDashboard },
    { id: 'letters', label: t.nav.letters, icon: Mail },
    { id: 'reassign-sim', label: t.nav.reassignSim, icon: Shuffle, requires: permissions.RP },
    { id: 'reports', label: t.nav.reports, icon: BarChart3, requires: !isCoordinator },
  ];

  const moreItems = [
    { id: 'events', label: t.nav.events, icon: Calendar, requires: permissions.CE },
    { id: 'closing', label: t.nav.closing, icon: Lock, requires: permissions.NC },
    {
      id: 'volunteers',
      label:
        !permissions.CL && !permissions.CC
          ? (language === 'es' ? 'Padrinos Donantes' : 'Donor Sponsors')
          : t.nav.volunteers,
      icon: UserCheck,
      requires: permissions.CL || permissions.CC || permissions.CD,
    },
    {
      id: 'bulk-assign',
      label: language === 'es' ? 'Asignación Masiva' : 'Bulk Letter Assignment',
      icon: Layers,
      requires: !isCoordinator && (currentUser?.roleName === 'Admin' || currentUser?.roleName === 'Leader' || permissions.CLett),
    },
    { id: 'users', label: t.nav.users, icon: Users, requires: permissions.CL },
    { id: 'archive', label: t.nav.archive, icon: Archive, requires: !isCoordinator },
    { id: 'reminders', label: t.nav.reminders, icon: BellRing, requires: permissions.SER || permissions.SWR },
  ];

  const handleSelect = (viewId: string) => {
    onSelectView(viewId);
    setIsMoreMenuOpen(false);
  };

  return (
    <>
      {/* Fixed Bottom Navigation Bar (Visible on mobile cellphones) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1 shadow-lg flex items-center justify-around">
        {mainTabs.map((tab) => {
          if (tab.requires !== undefined && !tab.requires) return null;
          const isActive = activeView === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[60px] ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* More Button */}
        <button
          onClick={() => setIsMoreMenuOpen(true)}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors min-w-[60px] ${
            isMoreMenuOpen
              ? 'text-blue-600 dark:text-blue-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5 tracking-tight">
            {language === 'es' ? 'Más' : 'More'}
          </span>
        </button>
      </nav>

      {/* Mobile "More" Drawer Sheet */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-t-2xl p-4 border-t border-slate-200 dark:border-slate-800 shadow-2xl max-h-[75vh] overflow-y-auto space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
                {language === 'es' ? 'Todos los Módulos' : 'All Modules'}
              </span>
              <button
                onClick={() => setIsMoreMenuOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {moreItems.map((item) => {
                if (item.requires !== undefined && !item.requires) return null;
                const isActive = activeView === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold'
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
