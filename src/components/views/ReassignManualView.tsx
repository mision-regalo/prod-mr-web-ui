import React, { useEffect, useState } from 'react';
import { Letter, Role, PresentItem } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { PERMISSIONS_TABLE } from '../../data/mockData';
import { GitMerge, Search, Check, AlertTriangle } from 'lucide-react';

interface ReassignManualViewProps {
  letters: Letter[];
  currentRole: Role;
  language: Language;
  onManualTransfer: (
    sourceLetterId: string,
    presentId: string,
    targetLetterId: string
  ) => { success: boolean; error?: string };
}

export const ReassignManualView: React.FC<ReassignManualViewProps> = ({
  letters,
  currentRole,
  language,
  onManualTransfer,
}) => {
  const t = translations[language];
  const permissions = PERMISSIONS_TABLE[currentRole];

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // ====== SOURCE FILTER STATES (Cartas Origen) ======
  const [srcFilterId, setSrcFilterId] = useState('');
  const [srcFilterRemaining, setSrcFilterRemaining] = useState<string>('');
  const [srcFilterType, setSrcFilterType] = useState<string>('');
  const [srcFilterAge, setSrcFilterAge] = useState<string>('');
  const [srcFilterGender, setSrcFilterGender] = useState<string>('');
  const [srcFilterMatching, setSrcFilterMatching] = useState<string>('');
  const [srcFilterDonor, setSrcFilterDonor] = useState('');
  const [srcFilterCoord, setSrcFilterCoord] = useState('');
  const [srcFilterLeader, setSrcFilterLeader] = useState('');

  // Source search executed indicator & results
  const [srcSearchResults, setSrcSearchResults] = useState<
    { letter: Letter; present: PresentItem; reassignToId: string }[]
  >([]);

  // ====== TARGET FILTER STATES (Cartas Destino) ======
  const [tgtFilterId, setTgtFilterId] = useState('');
  const [tgtFilterName, setTgtFilterName] = useState('');
  const [tgtFilterAge, setTgtFilterAge] = useState<string>('');
  const [tgtFilterGender, setTgtFilterGender] = useState<string>('');
  const [tgtFilterDonor, setTgtFilterDonor] = useState('');
  const [tgtFilterCoord, setTgtFilterCoord] = useState('');
  const [tgtFilterLeader, setTgtFilterLeader] = useState('');

  // Target search executed results
  const [tgtSearchResults, setTgtSearchResults] = useState<Letter[]>([]);

  // Execute Source Search
  const handleSearchSource = () => {
    const active = letters.filter((l) => !l.isArchived);
    const results: { letter: Letter; present: PresentItem; reassignToId: string }[] = [];

    active.forEach((l) => {
      // Check ID
      if (srcFilterId && !l.id.toLowerCase().includes(srcFilterId.toLowerCase())) return;
      // Only letters with 2+ presents have a spare one available to reassign.
      if (l.presents.length < 2) return;
      // Remaining
      if (srcFilterRemaining && l.presents.length !== parseInt(srcFilterRemaining)) return;
      // Leader
      if (srcFilterLeader && !l.leaderName?.toLowerCase().includes(srcFilterLeader.toLowerCase())) return;
      // Coord
      if (srcFilterCoord && !l.coordinatorName?.toLowerCase().includes(srcFilterCoord.toLowerCase())) return;
      // Donor
      if (srcFilterDonor && !l.donorName?.toLowerCase().includes(srcFilterDonor.toLowerCase())) return;

      l.presents.forEach((p) => {
        if (srcFilterType && p.type !== srcFilterType) return;
        if (srcFilterAge && p.ageRange !== srcFilterAge) return;
        if (srcFilterGender && p.gender !== srcFilterGender) return;
        if (srcFilterMatching && p.matching !== srcFilterMatching) return;

        results.push({
          letter: l,
          present: p,
          reassignToId: '',
        });
      });
    });

    setSrcSearchResults(results);
  };

  // Execute Target Search
  const handleSearchTarget = () => {
    const active = letters.filter((l) => !l.isArchived);
    const results = active.filter((l) => {
      if (tgtFilterId && !l.id.toLowerCase().includes(tgtFilterId.toLowerCase())) return false;
      if (tgtFilterName && !l.kidName.toLowerCase().includes(tgtFilterName.toLowerCase())) return false;
      if (tgtFilterAge && l.age !== parseInt(tgtFilterAge)) return false;
      if (tgtFilterGender && l.gender !== tgtFilterGender) return false;
      if (tgtFilterLeader && !l.leaderName?.toLowerCase().includes(tgtFilterLeader.toLowerCase())) return false;
      if (tgtFilterCoord && !l.coordinatorName?.toLowerCase().includes(tgtFilterCoord.toLowerCase())) return false;
      if (tgtFilterDonor && !l.donorName?.toLowerCase().includes(tgtFilterDonor.toLowerCase())) return false;
      // Only letters with no presents at all qualify as reassignment targets.
      if (l.presents.length !== 0) return false;

      return true;
    });

    setTgtSearchResults(results);
  };

  // Reassign a present from a source letter to a target letter
  const handleReassign = (sourceLetterId: string, presentId: string, targetId: string) => {
    if (!targetId.trim()) return;
    const result = onManualTransfer(sourceLetterId, presentId, targetId);
    if (result.success) {
      setNotification({
        type: 'success',
        message: `¡Regalo reasignado manualmente a la carta ${targetId}!`,
      });
      // Cartas Origen/Destino are refreshed by the effect below once the updated
      // `letters` prop arrives, rather than here with the still-stale closure.
    } else {
      setNotification({
        type: 'error',
        message: result.error || 'No se pudo reasignar el regalo.',
      });
    }
  };

  // Keep both lists in sync with the current filters whenever the underlying
  // letters data changes — on initial mount, and after any reassignment (own or
  // from another user via realtime sync) updates presents/remaining counts.
  useEffect(() => {
    handleSearchSource();
    handleSearchTarget();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [letters]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <GitMerge className="w-5 h-5 text-blue-600" />
          <span>{t.reassign.manualTitle}</span>
        </h1>
        <p className="text-xs text-slate-500">{t.reassign.manualSubtitle}</p>
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

      {/* Split Screen Container (Two horizontal columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ================= SECTION: CARTAS DESTINO ================= */}
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col space-y-3">
          <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
            <span className="font-bold text-rose-900 block text-xs">Cartas Destino</span>
            <span className="text-[11px] text-rose-700">
              Cartas necesitadas. Captura manualmente el ID en "Reasignar a" de la carta origen.
            </span>
          </div>

          {/* Filters for Target */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <input
              type="text"
              placeholder="Filtrar ID..."
              value={tgtFilterId}
              onChange={(e) => setTgtFilterId(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            />
            <input
              type="text"
              placeholder="Nombre niño..."
              value={tgtFilterName}
              onChange={(e) => setTgtFilterName(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            />
            <input
              type="number"
              placeholder="Edad..."
              value={tgtFilterAge}
              onChange={(e) => setTgtFilterAge(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            />
            <select
              value={tgtFilterGender}
              onChange={(e) => setTgtFilterGender(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            >
              <option value="">Género: Todos</option>
              <option value="Niño">Niño</option>
              <option value="Niña">Niña</option>
            </select>
            <input
              type="text"
              placeholder="Líder..."
              value={tgtFilterLeader}
              onChange={(e) => setTgtFilterLeader(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            />
            <input
              type="text"
              placeholder="Coordinador..."
              value={tgtFilterCoord}
              onChange={(e) => setTgtFilterCoord(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            />
            <input
              type="text"
              placeholder="Padrino..."
              value={tgtFilterDonor}
              onChange={(e) => setTgtFilterDonor(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            />
            <button
              onClick={handleSearchTarget}
              className="p-1.5 font-bold text-white bg-slate-900 hover:bg-slate-800 rounded flex items-center justify-center gap-1 shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar Destino</span>
            </button>
          </div>

          {/* Target Results Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto flex-1 max-h-[32rem]">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-2">Regalos</th>
                  <th className="p-2">ID</th>
                  <th className="p-2">Nombre / Edad</th>
                  <th className="p-2">Petición (Juguete)</th>
                  <th className="p-2">Líder</th>
                  {permissions.SCC && <th className="p-2">Coordinador</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tgtSearchResults.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-6 text-center text-slate-400">
                      No se encontraron cartas destino con esos filtros.
                    </td>
                  </tr>
                ) : (
                  tgtSearchResults.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-2 font-mono font-bold text-rose-700">{l.presents.length}</td>
                      <td className="p-2 font-mono font-bold text-slate-900">{l.id}</td>
                      <td className="p-2">
                        <span className="font-semibold block">{l.kidName}</span>
                        <span className="text-slate-500">
                          {l.age}a · {l.gender}
                        </span>
                      </td>
                      <td className="p-2 text-slate-700 line-clamp-2">{l.toyRequest}</td>
                      <td className="p-2 text-slate-600">{l.leaderName || '—'}</td>
                      {permissions.SCC && (
                        <td className="p-2 text-slate-600">{l.coordinatorName || '—'}</td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= SECTION: CARTAS ORIGEN ================= */}
        <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col space-y-3">
          <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
            <span className="font-bold text-blue-900 block text-xs">Cartas Origen</span>
            <span className="text-[11px] text-blue-700">
              Regalos disponibles para transferir. Ingresa el ID de la carta destino para habilitar la transferencia.
            </span>
          </div>

          {/* Filters for Source */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <input
              type="text"
              placeholder="Filtrar ID Carta..."
              value={srcFilterId}
              onChange={(e) => setSrcFilterId(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            />
            <input
              type="number"
              placeholder="Regalos restantes..."
              value={srcFilterRemaining}
              onChange={(e) => setSrcFilterRemaining(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            />
            <select
              value={srcFilterType}
              onChange={(e) => setSrcFilterType(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            >
              <option value="">Tipo: Todos</option>
              <option value="Juguete">Juguete</option>
              <option value="Ropa">Ropa</option>
              <option value="Útil Escolar">Útil Escolar</option>
            </select>
            <select
              value={srcFilterAge}
              onChange={(e) => setSrcFilterAge(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            >
              <option value="">Edad: Todas</option>
              <option value="3-6">3-6</option>
              <option value="6-9">6-9</option>
              <option value="9-12">9-12</option>
              <option value="3-12">3-12</option>
            </select>
            <select
              value={srcFilterGender}
              onChange={(e) => setSrcFilterGender(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            >
              <option value="">Género: Todos</option>
              <option value="Niño">Niño</option>
              <option value="Niña">Niña</option>
              <option value="Unisex">Unisex</option>
            </select>
            <select
              value={srcFilterMatching}
              onChange={(e) => setSrcFilterMatching(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            >
              <option value="">Coincidencia</option>
              <option value="specific">Específico</option>
              <option value="vague">Vago</option>
              <option value="mismatch">No coincide</option>
            </select>
            <input
              type="text"
              placeholder="Líder..."
              value={srcFilterLeader}
              onChange={(e) => setSrcFilterLeader(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            />
            <input
              type="text"
              placeholder="Coordinador..."
              value={srcFilterCoord}
              onChange={(e) => setSrcFilterCoord(e.target.value)}
              className="p-1.5 bg-white border border-slate-200 rounded text-slate-800"
            />
            <button
              onClick={handleSearchSource}
              className="p-1.5 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded flex items-center justify-center gap-1 shadow-2xs"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Buscar Origen</span>
            </button>
          </div>

          {/* Source Results Table */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto flex-1 max-h-[32rem]">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                <tr>
                  <th className="p-2">Regalo</th>
                  <th className="p-2">Reasignar a (ID Destino)</th>
                  <th className="p-2">Acción</th>
                  <th className="p-2">Edad / Género</th>
                  <th className="p-2">Coincidencia</th>
                  <th className="p-2">Origen (Carta / Regalos)</th>
                  <th className="p-2">Líder</th>
                  {permissions.SCC && <th className="p-2">Coord.</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {srcSearchResults.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-400">
                      No se encontraron regalos origen con los filtros especificados.
                    </td>
                  </tr>
                ) : (
                  srcSearchResults.map((item, idx) => {
                    // Guard: the origin letter must keep at least one present after the transfer.
                    const isLastPresent = item.letter.presents.length <= 1;
                    const canReassign = !!item.reassignToId.trim() && !isLastPresent && !!permissions.RP;

                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 min-w-[14rem]">
                          <span className="font-bold text-slate-900 block">{item.present.description}</span>
                          <span className="text-[10px] text-slate-500">{item.present.type}</span>
                        </td>
                        {/* Reassign to input field */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.reassignToId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSrcSearchResults((prev) =>
                                prev.map((r, i) => (i === idx ? { ...r, reassignToId: val } : r))
                              );
                            }}
                            placeholder="ID destino ej. B-PO-007"
                            className="w-28 p-1 text-xs font-mono font-bold bg-white border border-blue-300 rounded text-blue-900 focus:ring-1 focus:ring-blue-500"
                          />
                        </td>
                        {/* Reassign Button (Enabled when Target ID is captured and origin keeps ≥1 present) */}
                        <td className="p-2">
                          <button
                            type="button"
                            disabled={!canReassign}
                            title={
                              isLastPresent
                                ? 'No se puede reasignar: la carta origen debe conservar al menos un regalo.'
                                : undefined
                            }
                            onClick={() =>
                              handleReassign(item.letter.id, item.present.id, item.reassignToId)
                            }
                            className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed rounded shadow-2xs transition-colors"
                          >
                            Reasignar
                          </button>
                        </td>
                        <td className="p-2 font-mono">
                          {item.present.ageRange} · {item.present.gender}
                        </td>
                        <td className="p-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-semibold">
                            {item.present.matching}
                          </span>
                        </td>
                        <td className="p-2 font-mono">
                          <span className="font-bold text-slate-900">{item.letter.id}</span>
                          <span className="text-[10px] text-slate-500 block">
                            Restantes: {item.letter.presents.length}
                          </span>
                        </td>
                        <td className="p-2 text-slate-600">{item.letter.leaderName || '—'}</td>
                        {permissions.SCC && (
                          <td className="p-2 text-slate-600">{item.letter.coordinatorName || '—'}</td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
