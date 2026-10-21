import React, { useState, useMemo } from 'react';
import { Letter, Leader, RolePermissions, User } from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  Lock,
  Unlock,
  CheckSquare,
  Square,
  Filter,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  Gift,
} from 'lucide-react';

interface ClosingLettersViewProps {
  letters: Letter[];
  leaders: Leader[];
  currentUser: User;
  permissions: RolePermissions;
  language: Language;
  onBulkToggleLock: (letterIds: string[], lockStatus: boolean) => void;
}

export const ClosingLettersView: React.FC<ClosingLettersViewProps> = ({
  letters,
  leaders,
  currentUser,
  permissions,
  language,
  onBulkToggleLock,
}) => {
  const t = translations[language];

  const [selectedLeaderFilter, setSelectedLeaderFilter] = useState<string>(
    currentUser.assignedLeaderId || ''
  );
  const [search, setSearch] = useState('');
  const [selectedLetterIds, setSelectedLetterIds] = useState<string[]>([]);
  const [notification, setNotification] = useState<string | null>(null);

  if (!permissions.NC) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {language === 'es' ? 'Acceso Restringido' : 'Restricted Access'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'es'
            ? 'El cierre de captura de cartas requiere el permiso NC (disponible para Líderes y Administradores).'
            : 'Closing letters capture requires the NC privilege (available for Leaders and Admins).'}
        </p>
      </div>
    );
  }

  // Filter letters strictly under umbrella
  const umbrellaLetters = useMemo(() => {
    return letters.filter((l) => {
      if (l.isArchived) return false;

      // If Leader, scoped strictly to their assigned leader ID
      if (currentUser.roleName === 'Leader' && currentUser.assignedLeaderId) {
        return l.leaderId === currentUser.assignedLeaderId;
      }

      // If Admin, apply optional leader filter
      if (selectedLeaderFilter && l.leaderId !== selectedLeaderFilter) {
        return false;
      }

      return true;
    });
  }, [letters, currentUser, selectedLeaderFilter]);

  // Search filter
  const filteredLetters = useMemo(() => {
    return umbrellaLetters.filter((l) => {
      const q = search.toLowerCase();
      if (!q) return true;
      return (
        l.id.toLowerCase().includes(q) ||
        l.kidName.toLowerCase().includes(q)
      );
    });
  }, [umbrellaLetters, search]);

  const handleToggleSelect = (id: string) => {
    setSelectedLetterIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLetterIds.length === filteredLetters.length) {
      setSelectedLetterIds([]);
    } else {
      setSelectedLetterIds(filteredLetters.map((l) => l.id));
    }
  };

  const handleApplyLock = (lockStatus: boolean) => {
    if (selectedLetterIds.length === 0) return;
    onBulkToggleLock(selectedLetterIds, lockStatus);
    setNotification(
      language === 'es'
        ? `Se ha ${lockStatus ? 'bloqueado' : 'desbloqueado'} la captura para ${selectedLetterIds.length} cartas.`
        : `Successfully ${lockStatus ? 'locked' : 'unlocked'} capture for ${selectedLetterIds.length} letters.`
    );
    setSelectedLetterIds([]);
  };

  const lockedCount = umbrellaLetters.filter((l) => l.isLocked).length;
  const openCount = umbrellaLetters.filter((l) => !l.isLocked).length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Lock className="w-5 h-5 text-amber-600" />
            <span>{t.closing.title}</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              NC Privilege
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.closing.subtitle}</p>
        </div>

        {/* Bulk Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleApplyLock(true)}
            disabled={selectedLetterIds.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t.closing.lockSelected} ({selectedLetterIds.length})</span>
          </button>
          <button
            onClick={() => handleApplyLock(false)}
            disabled={selectedLetterIds.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs transition-colors"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>{t.closing.unlockSelected}</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs">
          <span className="text-slate-500 dark:text-slate-400 block font-medium">Total en tu Paraguas:</span>
          <span className="text-2xl font-bold font-mono text-slate-900 dark:text-white tabular-nums">
            {umbrellaLetters.length}
          </span>
        </div>
        <div className="bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 rounded-xl p-3 text-xs">
          <span className="text-amber-800 dark:text-amber-300 block font-medium">Bloqueadas / Cerradas:</span>
          <span className="text-2xl font-bold font-mono text-amber-900 dark:text-amber-200 tabular-nums">
            {lockedCount}
          </span>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-3 text-xs">
          <span className="text-emerald-800 dark:text-emerald-300 block font-medium">Abiertas para Edición:</span>
          <span className="text-2xl font-bold font-mono text-emerald-900 dark:text-emerald-200 tabular-nums">
            {openCount}
          </span>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.letters.searchPlaceholder}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
        </div>

        {/* If Admin, allow switching leader filter */}
        {currentUser.roleName === 'Admin' && (
          <div className="sm:w-64">
            <select
              value={selectedLeaderFilter}
              onChange={(e) => setSelectedLeaderFilter(e.target.value)}
              className="w-full p-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="">Todos los Líderes</option>
              {leaders.map((ld) => (
                <option key={ld.id} value={ld.id}>
                  {ld.firstName} {ld.lastName} ({ld.teamColor})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Letters Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px]">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredLetters.length > 0 &&
                      selectedLetterIds.length === filteredLetters.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                  />
                </th>
                <th className="p-3">Folio Carta</th>
                <th className="p-3">Niño / Edad</th>
                <th className="p-3">Juguete Solicitado</th>
                <th className="p-3">Líder</th>
                <th className="p-3">Coordinador</th>
                <th className="p-3 text-center">Estado de Cierre</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No hay cartas bajo tu paraguas con los filtros actuales.
                  </td>
                </tr>
              ) : (
                filteredLetters.map((l) => {
                  const isSelected = selectedLetterIds.includes(l.id);

                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(l.id)}
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        />
                      </td>

                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {l.id}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{l.kidName}</div>
                        <div className="text-[11px] text-slate-500">{l.age}a · {l.gender}</div>
                      </td>

                      <td className="p-3 text-slate-700 dark:text-slate-300">{l.toyRequest}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{l.leaderName || '—'}</td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{l.coordinatorName || '—'}</td>

                      <td className="p-3 text-center">
                        {l.isLocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                            <Lock className="w-3 h-3" />
                            <span>{t.closing.lockedStatus}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
                            <Unlock className="w-3 h-3" />
                            <span>{t.closing.unlockedStatus}</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
