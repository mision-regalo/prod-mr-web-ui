import React, { useState, useMemo } from 'react';
import { Letter, Leader, Coordinator, User, Role } from '../../types';
import { Language } from '../../i18n/translations';
import {
  Layers,
  UserCheck,
  Users,
  CheckSquare,
  Square,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Info,
  Calendar,
  X,
} from 'lucide-react';

interface BulkLettersAssignViewProps {
  letters: Letter[];
  leaders: Leader[];
  coordinators: Coordinator[];
  currentUser: User;
  currentRole: Role;
  language: Language;
  onBulkAssign: (
    letterIds: string[],
    assignType: 'leader' | 'coordinator',
    targetId: string
  ) => void;
}

export const BulkLettersAssignView: React.FC<BulkLettersAssignViewProps> = ({
  letters,
  leaders,
  coordinators,
  currentUser,
  currentRole,
  language,
  onBulkAssign,
}) => {
  // If user is a Coordinator, bulk letter assignment option is forbidden/hidden
  const isCoordinator =
    currentRole === 'Coordinator' ||
    currentUser.roleName.toLowerCase() === 'coordinator';

  const isAdmin =
    currentRole === 'Admin' ||
    currentUser.roleName.toLowerCase() === 'admin';

  const isLeader =
    !isAdmin &&
    (currentRole === 'Leader' || currentUser.roleName.toLowerCase() === 'leader');

  // Identify current leader object if logged in as Leader
  const matchedLeader = useMemo(() => {
    if (!isLeader) return null;
    if (currentUser.assignedLeaderId) {
      const found = leaders.find((l) => l.id === currentUser.assignedLeaderId);
      if (found) return found;
    }
    return (
      leaders.find(
        (l) => l.email.toLowerCase() === currentUser.email.toLowerCase()
      ) || null
    );
  }, [isLeader, currentUser, leaders]);

  // Coordinators available for assignment:
  // - If Leader: only coordinators assigned to this Leader
  // - If Admin: all coordinators
  const availableCoordinators = useMemo(() => {
    if (isLeader) {
      if (!matchedLeader) return [];
      return coordinators.filter((c) => c.leaderId === matchedLeader.id);
    }
    return coordinators;
  }, [isLeader, matchedLeader, coordinators]);

  // Assignment Target Mode:
  // - Leader can only assign to Coordinator
  // - Admin can assign to 'leader' or 'coordinator'
  const [assignTargetType, setAssignTargetType] = useState<'leader' | 'coordinator'>(
    'coordinator'
  );

  // Selected Target ID
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');

  // Selected Letter IDs
  const [selectedLetterIds, setSelectedLetterIds] = useState<string[]>([]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'no-coord' | 'no-leader'>('all');
  const [selectedEventFilter, setSelectedEventFilter] = useState<string>('');

  // Alert / Toast
  const [alert, setAlert] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Base pool of letters available to assign:
  // - If Leader: letters assigned to this Leader
  // - If Admin: all unarchived letters
  const scopedLetters = useMemo(() => {
    const unarchived = letters.filter((l) => !l.isArchived);
    if (isLeader) {
      if (!matchedLeader) return [];
      return unarchived.filter(
        (l) =>
          l.leaderId === matchedLeader.id ||
          (matchedLeader.teamCode && l.folioType === matchedLeader.teamCode)
      );
    }
    return unarchived;
  }, [letters, isLeader, matchedLeader]);

  // Filtered Letters
  const filteredLetters = useMemo(() => {
    return scopedLetters.filter((l) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          l.id.toLowerCase().includes(q) ||
          String(l.folio).includes(q) ||
          l.kidName.toLowerCase().includes(q) ||
          l.toyRequest.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Event / Folio type
      if (selectedEventFilter && l.folioType !== selectedEventFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'no-coord' && !!l.coordinatorId) {
        return false;
      }
      if (statusFilter === 'no-leader' && !!l.leaderId) {
        return false;
      }

      return true;
    });
  }, [scopedLetters, searchQuery, selectedEventFilter, statusFilter]);

  // Bulk selection helpers
  const handleToggleLetter = (id: string) => {
    setSelectedLetterIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    const filteredIds = filteredLetters.map((l) => l.id);
    const allSelected = filteredIds.every((id) => selectedLetterIds.includes(id));
    if (allSelected) {
      setSelectedLetterIds((prev) => prev.filter((id) => !filteredIds.includes(id)));
    } else {
      setSelectedLetterIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  const handleSelectBatch = (count: number) => {
    const idsToSelect = filteredLetters.slice(0, count).map((l) => l.id);
    setSelectedLetterIds((prev) => Array.from(new Set([...prev, ...idsToSelect])));
  };

  const handleClearSelection = () => {
    setSelectedLetterIds([]);
  };

  // Execution
  const handleExecuteAssignment = () => {
    if (selectedLetterIds.length === 0) {
      setAlert({
        type: 'error',
        message:
          language === 'es'
            ? 'Por favor selecciona al menos una carta para asignar.'
            : 'Please select at least one letter to assign.',
      });
      return;
    }

    if (!selectedTargetId) {
      setAlert({
        type: 'error',
        message:
          language === 'es'
            ? 'Por favor selecciona el destinatario de la asignación.'
            : 'Please select the assignment recipient.',
      });
      return;
    }

    let targetName = '';
    if (assignTargetType === 'leader') {
      const targetLeader = leaders.find((l) => l.id === selectedTargetId);
      targetName = targetLeader
        ? `${targetLeader.firstName} ${targetLeader.lastName}`
        : selectedTargetId;
    } else {
      const targetCoord = coordinators.find((c) => c.id === selectedTargetId);
      targetName = targetCoord
        ? `${targetCoord.firstName} ${targetCoord.lastName}`
        : selectedTargetId;
    }

    onBulkAssign(selectedLetterIds, assignTargetType, selectedTargetId);

    setAlert({
      type: 'success',
      message:
        language === 'es'
          ? `¡Éxito! Se asignaron ${selectedLetterIds.length} carta(s) a ${targetName}.`
          : `Success! Assigned ${selectedLetterIds.length} letter(s) to ${targetName}.`,
    });

    setSelectedLetterIds([]);
  };

  // If user is a Coordinator, block view
  if (isCoordinator) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-center">
        <ShieldAlert className="w-12 h-12 mx-auto text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">
          {language === 'es' ? 'Acceso Restringido' : 'Restricted Access'}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {language === 'es'
            ? 'La pantalla de asignación masiva de cartas está reservada únicamente para Líderes de Equipo y Administradores.'
            : 'The bulk letter assignment screen is reserved exclusively for Team Leaders and Administrators.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {language === 'es'
                  ? 'Asignación Masiva de Cartas'
                  : 'Bulk Letter Assignment'}
              </h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {isAdmin
                  ? language === 'es'
                    ? 'Modo Administrador'
                    : 'Admin Mode'
                  : language === 'es'
                  ? `Líder: ${matchedLeader ? matchedLeader.firstName + ' ' + matchedLeader.lastName : currentUser.name}`
                  : `Leader: ${matchedLeader ? matchedLeader.firstName + ' ' + matchedLeader.lastName : currentUser.name}`}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isAdmin
                ? language === 'es'
                  ? 'Los Administradores pueden asignar cartas en lote tanto a Líderes de Equipo como a Coordinadores.'
                  : 'Administrators can assign letters in bulk to both Team Leaders and Coordinators.'
                : language === 'es'
                ? 'Como Líder, puedes asignar paquetes de cartas directamente a tus Coordinadores a cargo.'
                : 'As a Leader, you can assign batches of letters directly to your assigned Coordinators.'}
            </p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium">
            <span className="text-slate-400 mr-1.5">{language === 'es' ? 'Disponibles:' : 'Available:'}</span>
            <span className="font-bold text-slate-900 dark:text-white">{scopedLetters.length}</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 font-medium">
            <span className="text-blue-500 mr-1.5">{language === 'es' ? 'Seleccionadas:' : 'Selected:'}</span>
            <span className="font-bold">{selectedLetterIds.length}</span>
          </div>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {alert && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
            alert.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {alert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{alert.message}</span>
          </div>
          <button
            onClick={() => setAlert(null)}
            className="p-1 hover:bg-black/5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STEP 1: DESTINATION CONFIGURATION */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">1</span>
          <span>{language === 'es' ? 'Selecciona el Destinatario de las Cartas' : 'Select Assignment Target'}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Type selector (Only Admin can choose between Leader and Coordinator) */}
          {isAdmin ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'es' ? 'Tipo de Asignación' : 'Assignment Type'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAssignTargetType('coordinator');
                    setSelectedTargetId('');
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    assignTargetType === 'coordinator'
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100 ring-2 ring-blue-600/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-950 dark:text-slate-200'
                  }`}
                >
                  <Users className="w-4 h-4 text-blue-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {language === 'es' ? 'A Coordinador' : 'To Coordinator'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'es' ? 'Meta: 10 a 15 cartas' : 'Goal: 10 to 15 letters'}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAssignTargetType('leader');
                    setSelectedTargetId('');
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                    assignTargetType === 'leader'
                      ? 'border-blue-600 bg-blue-50/80 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100 ring-2 ring-blue-600/20'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-950 dark:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold">
                      {language === 'es' ? 'A Líder de Equipo' : 'To Team Leader'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {language === 'es' ? 'Meta: ~150 cartas' : 'Goal: ~150 letters'}
                    </div>
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                {language === 'es' ? 'Tipo de Asignación' : 'Assignment Type'}
              </label>
              <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 flex items-center gap-2.5">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <div>
                  <div className="text-xs font-bold">
                    {language === 'es' ? 'A tus Coordinadores' : 'To Your Coordinators'}
                  </div>
                  <div className="text-[10px] text-blue-700 dark:text-blue-300">
                    {language === 'es'
                      ? 'Solo puedes asignar a los coordinadores bajo tu liderazgo.'
                      : 'You can only assign to coordinators under your leadership.'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recipient Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              {assignTargetType === 'leader'
                ? language === 'es'
                  ? 'Seleccionar Líder de Equipo *'
                  : 'Select Team Leader *'
                : language === 'es'
                ? 'Seleccionar Coordinador *'
                : 'Select Coordinator *'}
            </label>

            {assignTargetType === 'leader' ? (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {language === 'es' ? '-- Selecciona un Líder --' : '-- Select a Leader --'}
                </option>
                {leaders.map((ld) => {
                  const currentLettersCount = letters.filter(
                    (l) => !l.isArchived && l.leaderId === ld.id
                  ).length;
                  return (
                    <option key={ld.id} value={ld.id}>
                      {ld.firstName} {ld.lastName} ({ld.teamColor} - Equipo {ld.teamCode}) • {currentLettersCount} cartas
                    </option>
                  );
                })}
              </select>
            ) : (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500"
              >
                <option value="">
                  {language === 'es' ? '-- Selecciona un Coordinador --' : '-- Select a Coordinator --'}
                </option>
                {availableCoordinators.map((c) => {
                  const currentLettersCount = letters.filter(
                    (l) => !l.isArchived && l.coordinatorId === c.id
                  ).length;
                  return (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.grade}) • {c.leaderName ? `Líder: ${c.leaderName} • ` : ''}{currentLettersCount} cartas
                    </option>
                  );
                })}
              </select>
            )}

            {availableCoordinators.length === 0 && assignTargetType === 'coordinator' && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                {language === 'es'
                  ? 'No tienes coordinadores registrados bajo tu equipo aún.'
                  : 'You do not have coordinators registered under your team yet.'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* STEP 2: LETTERS FILTER & MULTI-SELECTION */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">2</span>
            <span>{language === 'es' ? 'Selecciona las Cartas' : 'Select Letters'}</span>
            <span className="text-slate-400 font-normal">({filteredLetters.length})</span>
          </div>

          {/* Quick selection batches */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-slate-400 text-[11px] mr-1">
              {language === 'es' ? 'Atajos:' : 'Quick Select:'}
            </span>
            <button
              type="button"
              onClick={() => handleSelectBatch(5)}
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              +5
            </button>
            <button
              type="button"
              onClick={() => handleSelectBatch(10)}
              className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              +10
            </button>
            <button
              type="button"
              onClick={() => handleSelectBatch(15)}
              className="px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 font-semibold text-[11px] border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
              title={language === 'es' ? 'Meta estándar por Coordinador (15 cartas)' : 'Standard quota per Coordinator (15 letters)'}
            >
              +15 ({language === 'es' ? 'Meta Coord' : 'Coord Quota'})
            </button>
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition-colors cursor-pointer"
            >
              {language === 'es' ? 'Todas las filtradas' : 'All filtered'}
            </button>
            {selectedLetterIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-2 py-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 font-semibold text-[11px] transition-colors cursor-pointer"
              >
                {language === 'es' ? 'Limpiar selección' : 'Clear selection'}
              </button>
            )}
          </div>
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                language === 'es'
                  ? 'Buscar por folio, niño, juguete...'
                  : 'Search folio, child, toy...'
              }
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            />
          </div>

          {/* Status filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">
                {language === 'es' ? 'Estado de Asignación: Todos' : 'Assignment Status: All'}
              </option>
              <option value="no-coord">
                {language === 'es' ? 'Solo cartas SIN Coordinador' : 'Only letters WITHOUT Coordinator'}
              </option>
              {isAdmin && (
                <option value="no-leader">
                  {language === 'es' ? 'Solo cartas SIN Líder' : 'Only letters WITHOUT Leader'}
                </option>
              )}
            </select>
          </div>

          {/* Event / Folio Type filter */}
          <div>
            <select
              value={selectedEventFilter}
              onChange={(e) => setSelectedEventFilter(e.target.value)}
              className="w-full p-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="">
                {language === 'es' ? 'Día de Entrega / Folio: Todos' : 'Event / Folio Type: All'}
              </option>
              <option value="A">Equipo / Evento A</option>
              <option value="B">Equipo / Evento B</option>
              <option value="C">Equipo / Evento C</option>
              <option value="X">Equipo / Evento X</option>
              <option value="G">Equipo / Evento G</option>
            </select>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10 text-slate-700 dark:text-slate-300 font-semibold text-[11px] uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="cursor-pointer text-slate-600 dark:text-slate-300 hover:text-blue-600"
                    >
                      {filteredLetters.length > 0 &&
                      filteredLetters.every((l) => selectedLetterIds.includes(l.id)) ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">{language === 'es' ? 'Folio ID' : 'Letter ID'}</th>
                  <th className="p-3">{language === 'es' ? 'Niño / Edad' : 'Child / Age'}</th>
                  <th className="p-3">{language === 'es' ? 'Juguete Solicitado' : 'Toy Request'}</th>
                  <th className="p-3">{language === 'es' ? 'Líder Actual' : 'Current Leader'}</th>
                  <th className="p-3">{language === 'es' ? 'Coordinador Actual' : 'Current Coordinator'}</th>
                  <th className="p-3">{language === 'es' ? 'Padrino' : 'Donor'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLetters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      {language === 'es'
                        ? 'No se encontraron cartas que coincidan con los filtros actuales.'
                        : 'No letters match the current filters.'}
                    </td>
                  </tr>
                ) : (
                  filteredLetters.map((l) => {
                    const isSelected = selectedLetterIds.includes(l.id);
                    return (
                      <tr
                        key={l.id}
                        onClick={() => handleToggleLetter(l.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-blue-50/80 dark:bg-blue-950/40 hover:bg-blue-100/60 dark:hover:bg-blue-900/50'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleToggleLetter(l.id)}
                            className="cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            {l.id}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {l.kidName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {l.age} {language === 'es' ? 'años' : 'yrs'} · {l.gender}
                          </div>
                        </td>
                        <td className="p-3 text-slate-800 dark:text-slate-200 font-medium max-w-[220px] truncate">
                          {l.toyRequest}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {l.leaderName ? (
                            <span className="inline-flex items-center gap-1 font-medium">
                              <UserCheck className="w-3 h-3 text-indigo-500" />
                              {l.leaderName}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">
                              {language === 'es' ? 'Sin líder' : 'Unassigned'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-700 dark:text-slate-300">
                          {l.coordinatorName ? (
                            <span className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300">
                              <Users className="w-3 h-3 text-blue-500" />
                              {l.coordinatorName}
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                              {language === 'es' ? 'Sin coordinador' : 'Unassigned'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {l.donorName || (
                            <span className="text-slate-400">
                              {language === 'es' ? 'Sin padrino' : 'No donor'}
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

      {/* FLOATING / STICKY ACTION CONFIRMATION BAR */}
      <div className="sticky bottom-4 z-20 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-base shrink-0">
            {selectedLetterIds.length}
          </div>
          <div>
            <div className="text-sm font-bold flex items-center gap-2">
              <span>
                {language === 'es'
                  ? `${selectedLetterIds.length} carta(s) seleccionadas`
                  : `${selectedLetterIds.length} letter(s) selected`}
              </span>
              {selectedTargetId && (
                <>
                  <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-blue-300 font-semibold">
                    {assignTargetType === 'leader'
                      ? leaders.find((l) => l.id === selectedTargetId)?.firstName + ' ' + leaders.find((l) => l.id === selectedTargetId)?.lastName
                      : coordinators.find((c) => c.id === selectedTargetId)?.firstName + ' ' + coordinators.find((c) => c.id === selectedTargetId)?.lastName}
                  </span>
                </>
              )}
            </div>
            <div className="text-xs text-slate-400">
              {!selectedTargetId
                ? language === 'es'
                  ? 'Selecciona un destinatario en el Paso 1 para proceder.'
                  : 'Select a recipient in Step 1 to proceed.'
                : selectedLetterIds.length === 0
                ? language === 'es'
                  ? 'Marca al menos una carta con los checkboxes para asignar.'
                  : 'Check at least one letter with the checkboxes to assign.'
                : language === 'es'
                ? 'Listo para asignar en lote.'
                : 'Ready to assign in bulk.'}
            </div>
          </div>
        </div>

        <button
          type="button"
          disabled={selectedLetterIds.length === 0 || !selectedTargetId}
          onClick={handleExecuteAssignment}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white shadow-md transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>
            {language === 'es'
              ? `Confirmar Asignación (${selectedLetterIds.length})`
              : `Confirm Assignment (${selectedLetterIds.length})`}
          </span>
        </button>
      </div>
    </div>
  );
};
