import React, { useState, useMemo } from 'react';
import { Letter, Role, ReassignmentAction, PresentItem } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { PERMISSIONS_TABLE } from '../../data/mockData';
import {
  Wand2,
  CheckCircle2,
  Shuffle,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Info,
  CheckSquare,
  Square,
  Gift,
} from 'lucide-react';

interface ReassignSimulationViewProps {
  letters: Letter[];
  currentRole: Role;
  language: Language;
  onExecuteSimulationReassignment: (actions: ReassignmentAction[]) => void;
}

export const ReassignSimulationView: React.FC<ReassignSimulationViewProps> = ({
  letters,
  currentRole,
  language,
  onExecuteSimulationReassignment,
}) => {
  const t = translations[language];
  const permissions = PERMISSIONS_TABLE[currentRole];

  // Letters with 0 presents (The Target candidates)
  const zeroPresentLetters = useMemo(() => {
    return letters.filter((l) => !l.isArchived && l.presents.length === 0);
  }, [letters]);

  // Letters with >1 present (Surplus) OR presents with matching === 'mismatch'
  const surplusAndMismatchSources = useMemo(() => {
    const list: { letter: Letter; present: PresentItem; reason: string }[] = [];
    letters
      .filter((l) => !l.isArchived)
      .forEach((l) => {
        if (l.presents.length > 1) {
          // surplus presents beyond the 1st
          l.presents.slice(1).forEach((p) => {
            list.push({ letter: l, present: p, reason: 'Excedente (>1 regalo en carta)' });
          });
        }
        // Also check if single present is mismatched
        if (l.presents.length === 1 && l.presents[0].matching === 'mismatch') {
          list.push({ letter: l, present: l.presents[0], reason: 'Discrepancia temática (Mismatch)' });
        }
      });
    return list;
  }, [letters]);

  // Generate Simulation Pairings
  const initialProposedActions = useMemo(() => {
    const actions: ReassignmentAction[] = [];
    const usedTargetIds = new Set<string>();

    surplusAndMismatchSources.forEach((source, index) => {
      // Find suitable candidate with 0 presents
      const target = zeroPresentLetters.find((cand) => {
        if (usedTargetIds.has(cand.id)) return false;
        // Check age range or gender compatibility
        const matchesGender =
          source.present.gender === 'Unisex' ||
          (source.present.gender === 'Niño' && cand.gender === 'Niño') ||
          (source.present.gender === 'Niña' && cand.gender === 'Niña');

        return matchesGender;
      });

      if (target) {
        usedTargetIds.add(target.id);
        actions.push({
          id: `SIM-${index + 1}`,
          selected: true,
          present: source.present,
          sourceLetterId: source.letter.id,
          sourceRemainingPresents: source.letter.presents.length,
          sourceLeader: source.letter.leaderName || 'Sin Líder',
          sourceCoordinator: source.letter.coordinatorName || 'Sin Coordinador',
          targetLetterId: target.id,
          targetRemainingPresents: target.presents.length,
          targetLeader: target.leaderName || 'Sin Líder',
          targetCoordinator: target.coordinatorName || 'Sin Coordinador',
          reason: source.reason,
        });
      }
    });

    return actions;
  }, [surplusAndMismatchSources, zeroPresentLetters]);

  const [simulationActions, setSimulationActions] = useState<ReassignmentAction[]>(initialProposedActions);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Toggle selection
  const handleToggleRow = (actionId: string) => {
    setSimulationActions((prev) =>
      prev.map((act) => (act.id === actionId ? { ...act, selected: !act.selected } : act))
    );
  };

  const handleSelectAll = () => {
    const allSelected = simulationActions.every((a) => a.selected);
    setSimulationActions((prev) => prev.map((act) => ({ ...act, selected: !allSelected })));
  };

  const selectedCount = simulationActions.filter((a) => a.selected).length;

  const handleExecute = () => {
    const selectedActions = simulationActions.filter((a) => a.selected);
    if (selectedActions.length === 0) return;

    onExecuteSimulationReassignment(selectedActions);
    setSuccessBanner(
      `¡Reasignación completada! Se transfirieron ${selectedActions.length} regalos a cartas con 0 regalos exitosamente.`
    );
    // Remove executed actions from current list
    setSimulationActions((prev) => prev.filter((a) => !a.selected));
  };

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

        <div className="flex items-center gap-2">
          <button
            onClick={handleExecute}
            disabled={selectedCount === 0 || !permissions.RP}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {language === 'es' ? 'Ejecutar Reasignación' : 'Execute Reassignment'} ({selectedCount})
            </span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner(null)}
            className="text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* Diagnostics / Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs">
          <span className="font-semibold text-rose-900 block">
            Cartas con 0 Regalos (Destino):
          </span>
          <span className="text-2xl font-bold font-mono text-rose-900 tabular-nums">
            {zeroPresentLetters.length}
          </span>
          <span className="text-[11px] text-rose-700 block mt-0.5">
            Niños que esperan al menos un regalo.
          </span>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs">
          <span className="font-semibold text-blue-900 block">
            Regalos Reasignables Detectados:
          </span>
          <span className="text-2xl font-bold font-mono text-blue-900 tabular-nums">
            {surplusAndMismatchSources.length}
          </span>
          <span className="text-[11px] text-blue-700 block mt-0.5">
            Excedentes (&gt;1 por carta) y discrepancias.
          </span>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs">
          <span className="font-semibold text-emerald-900 block">
            Coincidencias Propuestas:
          </span>
          <span className="text-2xl font-bold font-mono text-emerald-900 tabular-nums">
            {simulationActions.length}
          </span>
          <span className="text-[11px] text-emerald-700 block mt-0.5">
            Compatibilidad por edad, género y tipo.
          </span>
        </div>
      </div>

      {/* Results Table (matching document specification) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            Propuesta de Reasignación de Regalos Similares
          </span>
          <span className="text-slate-500">
            {selectedCount} de {simulationActions.length} seleccionadas
          </span>
        </div>

        {simulationActions.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Shuffle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-700">No hay reasignaciones pendientes en la simulación</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Todas las cartas necesarias tienen al menos un regalo asignado, o no hay excedentes disponibles en este momento.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        simulationActions.length > 0 &&
                        simulationActions.every((a) => a.selected)
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="p-3">Regalo a Reasignar</th>
                  <th className="p-3">Rango Edad</th>
                  <th className="p-3">Género</th>
                  <th className="p-3">Coincidencia</th>
                  <th className="p-3">Origen (Carta / Regalos)</th>
                  <th className="p-3">Líder Origen</th>
                  {permissions.SCC && <th className="p-3">Coord. Origen</th>}
                  <th className="p-3">Destino (Carta / Regalos)</th>
                  <th className="p-3">Líder Destino</th>
                  {permissions.SCC && <th className="p-3">Coord. Destino</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {simulationActions.map((action) => (
                  <tr
                    key={action.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      action.selected ? 'bg-indigo-50/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={action.selected}
                        onChange={() => handleToggleRow(action.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>

                    {/* Present to reassign */}
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{action.present.type}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {action.present.description}
                      </div>
                    </td>

                    {/* Age Range */}
                    <td className="p-3 whitespace-nowrap font-mono font-medium text-slate-800">
                      {action.present.ageRange}
                    </td>

                    {/* Gender */}
                    <td className="p-3 whitespace-nowrap text-slate-700">
                      {action.present.gender}
                    </td>

                    {/* Matching Grade */}
                    <td className="p-3 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          action.present.matching === 'specific'
                            ? 'bg-emerald-100 text-emerald-800'
                            : action.present.matching === 'vague'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {action.present.matching === 'specific'
                          ? 'Específico'
                          : action.present.matching === 'vague'
                          ? 'Vago'
                          : 'No coincide'}
                      </span>
                    </td>

                    {/* Source */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-slate-900">
                        {action.sourceLetterId}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Restantes antes: {action.sourceRemainingPresents}
                      </div>
                    </td>

                    {/* Source Leader */}
                    <td className="p-3 whitespace-nowrap text-slate-700">
                      {action.sourceLeader}
                    </td>

                    {/* Source Coordinator (SCC permission) */}
                    {permissions.SCC && (
                      <td className="p-3 whitespace-nowrap text-slate-700">
                        {action.sourceCoordinator}
                      </td>
                    )}

                    {/* Target */}
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded inline-block">
                        {action.targetLetterId}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Restantes antes: {action.targetRemainingPresents}
                      </div>
                    </td>

                    {/* Target Leader */}
                    <td className="p-3 whitespace-nowrap text-slate-700">
                      {action.targetLeader}
                    </td>

                    {/* Target Coordinator (SCC permission) */}
                    {permissions.SCC && (
                      <td className="p-3 whitespace-nowrap text-slate-700">
                        {action.targetCoordinator}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
