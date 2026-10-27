import React, { useMemo, useState } from 'react';
import {
  Letter,
  GiftGivingEvent,
  Leader,
  Role,
  User,
  Simulation,
  PresentItem,
  AgeRange,
  MatchingGrade,
} from '../../types';
import { Language, translations } from '../../i18n/translations';
import { PERMISSIONS_TABLE } from '../../data/mockData';
import {
  saveSimulationToDb,
  deleteSimulationsByUser,
} from '../../services/dbSync';
import {
  Wand2,
  Sparkles,
  CheckCircle2,
  Shuffle,
  Gift,
  AlertTriangle,
  Loader2,
  Clock,
  Check,
} from 'lucide-react';

interface ReassignSimulationViewProps {
  letters: Letter[];
  events: GiftGivingEvent[];
  leaders: Leader[];
  simulations: Simulation[];
  currentUser: User;
  currentRole: Role;
  language: Language;
  onExecuteSimulations: (
    selectedIds: string[]
  ) => { executed: number; failed: { id: string; reason: string }[] };
}

const BATCH_SIZE_MAX = 30;
const BATCH_SIZE_DEFAULT = 10;
const STALE_AFTER_MS = 2 * 60 * 60 * 1000; // 2 hours

// Lower number = higher priority to be reassigned away from its current letter
// (mismatch/vague presents move first, keeping well-matched "specific" gifts with the
// original kid whenever possible).
const MATCHING_PRIORITY: Record<MatchingGrade, number> = { mismatch: 0, vague: 1, specific: 2 };

const MATCHING_LABEL: Record<MatchingGrade, string> = {
  specific: 'Específico',
  vague: 'Vago',
  mismatch: 'No coincide',
};

// Age ranges are stored as "n1-n2"; parse defensively (don't assume n1 <= n2) and
// check the target's exact age falls within the resulting [min, max] bounds, inclusive.
function isAgeInRange(age: number, range: AgeRange): boolean {
  const [a, b] = range.split('-').map(Number);
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  return age >= min && age <= max;
}

interface ProposedPairing {
  originLetter: Letter;
  present: PresentItem;
  targetLetter: Letter;
}

// Heuristic:
// Origin: letters with more than 1 present; prefer suggesting mismatch/vague presents
// over specific ones (keeping the best-matching gift with the original kid).
// Pairing: same folioType (hard), prefer same Leader (soft), compatible gender (hard),
// target's age within the present's age range (hard); mismatches are suggested first.
function generateProposedPairings(
  letters: Letter[],
  batchSize: number,
  filterFolioType: string,
  filterLeaderName: string
): ProposedPairing[] {
  const activeLetters = letters.filter((l) => !l.isArchived);
  const targetPool = activeLetters.filter((l) => l.presents.length === 0);

  type Candidate = { letter: Letter; present: PresentItem };
  const candidates: Candidate[] = [];

  activeLetters.forEach((l) => {
    if (l.presents.length <= 1) return;
    if (filterFolioType && l.folioType !== filterFolioType) return;
    if (filterLeaderName && l.leaderName !== filterLeaderName) return;

    const sortedByPriority = [...l.presents].sort(
      (a, b) => MATCHING_PRIORITY[a.matching] - MATCHING_PRIORITY[b.matching]
    );
    // Only (count - 1) presents are ever eligible, so the letter always keeps at least one.
    sortedByPriority.slice(0, l.presents.length - 1).forEach((present) => {
      candidates.push({ letter: l, present });
    });
  });

  // Suggest mismatches first across all origin letters.
  candidates.sort(
    (a, b) => MATCHING_PRIORITY[a.present.matching] - MATCHING_PRIORITY[b.present.matching]
  );

  const usedTargetIds = new Set<string>();
  const results: ProposedPairing[] = [];

  for (const candidate of candidates) {
    if (results.length >= batchSize) break;

    const eligibleTargets = targetPool.filter((t) => {
      if (usedTargetIds.has(t.id)) return false;
      if (t.id === candidate.letter.id) return false;
      if (t.folioType !== candidate.letter.folioType) return false;
      // A 'Unisex' present fits any target; a 'Unisex' target (if ever present in
      // data) accepts any present gender too — otherwise genders must match exactly.
      const genderOk =
        candidate.present.gender === 'Unisex' ||
        (t.gender as string) === 'Unisex' ||
        candidate.present.gender === t.gender;
      if (!genderOk) return false;
      return isAgeInRange(t.age, candidate.present.ageRange);
    });

    if (eligibleTargets.length === 0) continue;

    const leaderMatch = eligibleTargets.find(
      (t) => t.leaderName && t.leaderName === candidate.letter.leaderName
    );
    const chosenTarget = leaderMatch || eligibleTargets[0];

    usedTargetIds.add(chosenTarget.id);
    results.push({ originLetter: candidate.letter, present: candidate.present, targetLetter: chosenTarget });
  }

  return results;
}

export const ReassignSimulationView: React.FC<ReassignSimulationViewProps> = ({
  letters,
  events,
  leaders,
  simulations,
  currentUser,
  currentRole,
  language,
  onExecuteSimulations,
}) => {
  const t = translations[language];
  const permissions = PERMISSIONS_TABLE[currentRole];

  const [filterFolioType, setFilterFolioType] = useState('');
  const [filterLeaderName, setFilterLeaderName] = useState('');
  const [batchSize, setBatchSize] = useState(BATCH_SIZE_DEFAULT);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Letters with 0 presents, informational (not filter-scoped).
  const zeroPresentCount = useMemo(
    () => letters.filter((l) => !l.isArchived && l.presents.length === 0).length,
    [letters]
  );

  // Reassignable surplus presents, informational (not filter-scoped).
  const reassignableCount = useMemo(() => {
    let count = 0;
    letters
      .filter((l) => !l.isArchived && l.presents.length > 1)
      .forEach((l) => {
        count += l.presents.length - 1;
      });
    return count;
  }, [letters]);

  // Rows currently listed on screen: the "simulation" collection, filtered by Tipo de
  // Evento / Líder, each joined live with its origin/target letter and present data.
  const rows = useMemo(() => {
    return simulations
      .filter((sim) => {
        const originLetter = letters.find((l) => l.id === sim.originLetterId);
        if (filterFolioType && originLetter?.folioType !== filterFolioType) return false;
        if (filterLeaderName && originLetter?.leaderName !== filterLeaderName) return false;
        return true;
      })
      .map((sim) => {
        const originLetter = letters.find((l) => l.id === sim.originLetterId);
        const targetLetter = letters.find((l) => l.id === sim.targetLetterId);
        const present = originLetter?.presents.find((p) => p.id === sim.presentId);
        const isValid =
          !!originLetter && !!targetLetter && !!present &&
          originLetter.presents.length > 1 && targetLetter.presents.length === 0;
        const ageMs = Date.now() - new Date(sim.createdAt).getTime();
        const isStale = ageMs > STALE_AFTER_MS;
        return { sim, originLetter, targetLetter, present, isValid, isStale };
      });
  }, [simulations, letters, filterFolioType, filterLeaderName]);

  const selectableIds = useMemo(
    () => rows.filter((r) => !r.isStale && r.isValid).map((r) => r.sim.id),
    [rows]
  );

  const handleGenerateSimulation = async () => {
    setIsGenerating(true);
    setNotification(null);
    try {
      await deleteSimulationsByUser(currentUser.id);
      const clampedBatchSize = Math.max(1, Math.min(batchSize, BATCH_SIZE_MAX));
      const pairings = generateProposedPairings(letters, clampedBatchSize, filterFolioType, filterLeaderName);

      await Promise.all(
        pairings.map((p) =>
          saveSimulationToDb({
            id: crypto.randomUUID(),
            originLetterId: p.originLetter.id,
            targetLetterId: p.targetLetter.id,
            presentId: p.present.id,
            presentDescription: p.present.description,
            createdAt: new Date().toISOString(),
            createdByUserId: currentUser.id,
            createdByName: currentUser.name,
          })
        )
      );

      setSelectedIds(new Set());
      setNotification(
        pairings.length > 0
          ? { type: 'success', message: `Se generaron ${pairings.length} sugerencias de reasignación.` }
          : { type: 'error', message: 'No se encontraron coincidencias con los filtros actuales.' }
      );
    } catch (err) {
      console.warn('Error generating simulation:', err);
      setNotification({ type: 'error', message: 'No se pudo generar la simulación.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleRow = (simId: string) => {
    if (!selectableIds.includes(simId)) return;
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(simId)) next.delete(simId);
      else next.add(simId);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    setSelectedIds((prev) => {
      const allSelected = selectableIds.length > 0 && selectableIds.every((id) => prev.has(id));
      return allSelected ? new Set() : new Set(selectableIds);
    });
  };

  const handleExecute = () => {
    if (selectedIds.size === 0) return;
    const result = onExecuteSimulations(Array.from(selectedIds));
    setSelectedIds(new Set());

    if (result.failed.length === 0) {
      setNotification({
        type: 'success',
        message: `¡Reasignación completada! Se transfirieron ${result.executed} regalos exitosamente.`,
      });
    } else {
      const detail = result.failed.map((f) => f.reason).join(' ');
      setNotification({
        type: 'error',
        message:
          result.executed > 0
            ? `Se transfirieron ${result.executed} regalos. ${result.failed.length} no se pudieron reasignar: ${detail}`
            : `No se pudo reasignar ningún regalo: ${detail}`,
      });
    }
  };

  const leaderOptions = useMemo(
    () => leaders.map((ld) => `${ld.firstName} ${ld.lastName}`),
    [leaders]
  );

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-indigo-600" />
            <span>{t.reassign.simTitle}</span>
          </h1>
          <p className="text-xs text-slate-500">{t.reassign.simSubtitle}</p>
        </div>

        <button
          onClick={handleExecute}
          disabled={selectedIds.size === 0 || !permissions.RP}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-all"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>
            {language === 'es' ? 'Ejecutar Reasignación' : 'Execute Reassignment'} ({selectedIds.size})
          </span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-3 rounded-xl border text-xs font-medium flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Diagnostics / Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
          <span className="font-semibold text-rose-900 block">Cartas con 0 Regalos (Destino):</span>
          <span className="text-2xl font-bold font-mono text-rose-900 tabular-nums">{zeroPresentCount}</span>
          <span className="text-[11px] text-rose-700 block mt-0.5">Niños que esperan al menos un regalo.</span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
          <span className="font-semibold text-blue-900 block">Regalos Reasignables Detectados:</span>
          <span className="text-2xl font-bold font-mono text-blue-900 tabular-nums">{reassignableCount}</span>
          <span className="text-[11px] text-blue-700 block mt-0.5">Excedentes (&gt;1 por carta).</span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
          <span className="font-semibold text-emerald-900 block">Coincidencias Propuestas:</span>
          <span className="text-2xl font-bold font-mono text-emerald-900 tabular-nums">{rows.length}</span>
          <span className="text-[11px] text-emerald-700 block mt-0.5">Compatibilidad por edad, género y tipo.</span>
        </div>
      </div>

      {/* Generation Controls */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div>
          <span className="font-bold text-slate-800 text-sm">Generar Simulación</span>
          <p className="text-xs text-slate-500">
            Ejecuta el algoritmo y reemplaza las sugerencias previas generadas por ti con un nuevo lote.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
          <select
            value={filterFolioType}
            onChange={(e) => setFilterFolioType(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="">Tipo de Evento: Todos</option>
            {events.map((ev) => (
              <option key={ev.id} value={ev.id}>
                {ev.id} - {ev.location}
              </option>
            ))}
          </select>
          <select
            value={filterLeaderName}
            onChange={(e) => setFilterLeaderName(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          >
            <option value="">Líder: Todos</option>
            {leaderOptions.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={1}
            max={BATCH_SIZE_MAX}
            value={batchSize}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 1;
              setBatchSize(Math.max(1, Math.min(val, BATCH_SIZE_MAX)));
            }}
            title={`Tamaño de lote (máximo ${BATCH_SIZE_MAX})`}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
          />
          <button
            onClick={handleGenerateSimulation}
            disabled={isGenerating || !permissions.RP}
            className="flex items-center justify-center gap-1.5 p-2 font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
          >
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Generar Simulación</span>
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">Propuesta de Reasignación de Regalos Similares</span>
          <span className="text-slate-500">
            {selectedIds.size} de {selectableIds.length} seleccionables
          </span>
        </div>

        {rows.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Shuffle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-700">No hay sugerencias en la simulación</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Haz clic en <strong>"Generar Simulación"</strong> para proponer reasignaciones automáticas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                {/* Group header row: clusters all Origen columns and all Destino columns so
                    the user can immediately tell which side of the reassignment each column belongs to. */}
                <tr className="text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-1 bg-slate-50 border-b border-slate-200" />
                  <th
                    colSpan={6}
                    className="p-1 text-center bg-blue-50 border-b-2 border-blue-300 text-blue-800"
                  >
                    Origen
                  </th>
                  <th
                    colSpan={5}
                    className="p-1 text-center bg-rose-50 border-b-2 border-rose-300 text-rose-800"
                  >
                    Destino
                  </th>
                  <th className="p-1 bg-slate-50 border-b border-slate-200" />
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectableIds.length > 0 && selectableIds.every((id) => selectedIds.has(id))}
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="p-3 bg-blue-50/60 border-l-2 border-blue-200 text-blue-900">
                    Origen (Carta / Regalos)
                  </th>
                  <th className="p-3 bg-blue-50/60 text-blue-900">Líder Origen</th>
                  <th className="p-3 bg-blue-50/60 text-blue-900">Regalo a Reasignar</th>
                  <th className="p-3 bg-blue-50/60 text-blue-900">Rango Edad</th>
                  <th className="p-3 bg-blue-50/60 text-blue-900">Género</th>
                  <th className="p-3 bg-blue-50/60 border-r-2 border-blue-200 text-blue-900">Coincidencia</th>
                  <th className="p-3 bg-rose-50/60 border-l-2 border-rose-200 text-rose-900">
                    Destino (Carta / Regalos)
                  </th>
                  <th className="p-3 bg-rose-50/60 text-rose-900">Líder Destino</th>
                  <th className="p-3 bg-rose-50/60 text-rose-900">Petición Destino (Juguete)</th>
                  <th className="p-3 bg-rose-50/60 text-rose-900">Edad Destino</th>
                  <th className="p-3 bg-rose-50/60 border-r-2 border-rose-200 text-rose-900">Género Destino</th>
                  <th className="p-3">Generado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map(({ sim, originLetter, targetLetter, present, isValid, isStale }) => {
                  const disabled = isStale || !isValid;
                  return (
                    <tr
                      key={sim.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        selectedIds.has(sim.id) ? 'bg-indigo-50/30' : ''
                      } ${disabled ? 'opacity-60' : ''}`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(sim.id)}
                          disabled={disabled}
                          onChange={() => handleToggleRow(sim.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-40"
                        />
                      </td>

                      {/* ===== Origen group ===== */}
                      <td className="p-3 whitespace-nowrap bg-blue-50/30 border-l-2 border-blue-100">
                        <div className="font-mono font-bold text-slate-900">{sim.originLetterId}</div>
                        <div className="text-[11px] text-slate-500">
                          Restantes: {originLetter?.presents.length ?? '—'}
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap text-slate-700 bg-blue-50/30">
                        {originLetter?.leaderName || '—'}
                      </td>

                      <td className="p-3 bg-blue-50/30">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Gift className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>{present?.description || sim.presentDescription}</span>
                        </div>
                        {present && <div className="text-[11px] text-slate-500">{present.type}</div>}
                        {!isValid && (
                          <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                            Ya no disponible — regenera la simulación.
                          </div>
                        )}
                      </td>

                      <td className="p-3 whitespace-nowrap font-mono font-medium text-slate-800 bg-blue-50/30">
                        {present?.ageRange || '—'}
                      </td>

                      <td className="p-3 whitespace-nowrap text-slate-700 bg-blue-50/30">
                        {present?.gender || '—'}
                      </td>

                      <td className="p-3 whitespace-nowrap bg-blue-50/30 border-r-2 border-blue-100">
                        {present && (
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              present.matching === 'specific'
                                ? 'bg-emerald-100 text-emerald-800'
                                : present.matching === 'vague'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {MATCHING_LABEL[present.matching]}
                          </span>
                        )}
                      </td>

                      {/* ===== Destino group ===== */}
                      <td className="p-3 whitespace-nowrap bg-rose-50/30 border-l-2 border-rose-100">
                        <div className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                          {sim.targetLetterId}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Restantes: {targetLetter?.presents.length ?? '—'}
                        </div>
                      </td>

                      <td className="p-3 whitespace-nowrap text-slate-700 bg-rose-50/30">
                        {targetLetter?.leaderName || '—'}
                      </td>

                      <td className="p-3 text-slate-700 max-w-[12rem] bg-rose-50/30">
                        {targetLetter?.toyRequest || '—'}
                      </td>

                      <td className="p-3 whitespace-nowrap font-mono font-medium text-slate-800 bg-rose-50/30">
                        {targetLetter?.age ?? '—'}
                      </td>

                      <td className="p-3 whitespace-nowrap text-slate-700 bg-rose-50/30 border-r-2 border-rose-100">
                        {targetLetter?.gender || '—'}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        {isStale ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            <Clock className="w-3 h-3" />
                            Expirada
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">
                            {new Date(sim.createdAt).toLocaleTimeString(language === 'es' ? 'es-MX' : 'en-US', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
