import React, { useState, useMemo } from 'react';
import { Letter, Role, ReassignmentAction, PresentItem, AgeRange, Gender, MatchingGrade, PresentType } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { PERMISSIONS_TABLE } from '../../data/mockData';
import {
  GitMerge,
  Plus,
  Trash2,
  CheckCircle2,
  Search,
  X,
  ArrowRight,
  Gift,
  HelpCircle,
  Filter,
  Check,
} from 'lucide-react';

interface ReassignManualViewProps {
  letters: Letter[];
  currentRole: Role;
  language: Language;
  onManualTransfer: (sourceLetterId: string, presentId: string, targetLetterId: string) => void;
}

export const ReassignManualView: React.FC<ReassignManualViewProps> = ({
  letters,
  currentRole,
  language,
  onManualTransfer,
}) => {
  const t = translations[language];
  const permissions = PERMISSIONS_TABLE[currentRole];

  // Landing Table State (Active manual pairing items)
  const [manualQueue, setManualQueue] = useState<ReassignmentAction[]>([
    {
      id: 'MAN-1',
      selected: false,
      present: {
        id: 'PRS-02',
        type: 'Ropa',
        description: 'Sudadera con capucha azul marino talla 10',
        ageRange: '6-9',
        gender: 'Niño',
        matching: 'specific',
        isSurplus: true,
      },
      sourceLetterId: 'A-OB-001',
      sourceRemainingPresents: 2,
      sourceLeader: 'Sofía Hernández',
      sourceCoordinator: 'Alejandro Gómez',
      targetLetterId: 'B-PO-007',
      targetRemainingPresents: 0,
      targetLeader: 'Carlos Mendoza',
      targetCoordinator: 'Rodrigo Torres',
    },
    {
      id: 'MAN-2',
      selected: false,
      present: {
        id: 'PRS-05',
        type: 'Útil Escolar',
        description: 'Kit de 48 crayones y 3 libros de dibujo',
        ageRange: '3-6',
        gender: 'Unisex',
        matching: 'specific',
        isSurplus: true,
      },
      sourceLetterId: 'A-SJ-004',
      sourceRemainingPresents: 2,
      sourceLeader: 'Sofía Hernández',
      sourceCoordinator: 'Valeria Rios',
      targetLetterId: 'B-HU-008',
      targetRemainingPresents: 0,
      targetLeader: 'Carlos Mendoza',
      targetCoordinator: 'Elena Navarro',
    },
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  // Modal "Create a Match" state
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);

  // ====== SOURCE FILTER STATES (Right section) ======
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

  // ====== TARGET FILTER STATES (Left section) ======
  const [tgtFilterId, setTgtFilterId] = useState('');
  const [tgtFilterName, setTgtFilterName] = useState('');
  const [tgtFilterAge, setTgtFilterAge] = useState<string>('');
  const [tgtFilterGender, setTgtFilterGender] = useState<string>('');
  const [tgtFilterMatching, setTgtFilterMatching] = useState('');
  const [tgtFilterDonor, setTgtFilterDonor] = useState('');
  const [tgtFilterCoord, setTgtFilterCoord] = useState('');
  const [tgtFilterLeader, setTgtFilterLeader] = useState('');

  // Target search executed results
  const [tgtSearchResults, setTgtSearchResults] = useState<Letter[]>([]);

  // Selected pairing in modal
  const [selectedTargetLetterId, setSelectedTargetLetterId] = useState<string>('');

  // Landing Table Actions: Toggle selection
  const handleToggleSelectRow = (id: string) => {
    setManualQueue((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSelectAll = () => {
    const all = manualQueue.every((r) => r.selected);
    setManualQueue((prev) => prev.map((r) => ({ ...r, selected: !all })));
  };

  // Reassign selected rows from landing page
  const handleExecuteLandingReassign = () => {
    const selectedRows = manualQueue.filter((r) => r.selected);
    if (selectedRows.length === 0) return;

    selectedRows.forEach((row) => {
      onManualTransfer(row.sourceLetterId, row.present.id, row.targetLetterId);
    });

    setNotification(`¡Se reasignaron ${selectedRows.length} regalos manualmente con éxito!`);
    setManualQueue((prev) => prev.filter((r) => !r.selected));
  };

  // Remove selected rows from landing page
  const handleRemoveSelected = () => {
    setManualQueue((prev) => prev.filter((r) => !r.selected));
  };

  // Execute Source Search
  const handleSearchSource = () => {
    const active = letters.filter((l) => !l.isArchived);
    const results: { letter: Letter; present: PresentItem; reassignToId: string }[] = [];

    active.forEach((l) => {
      // Check ID
      if (srcFilterId && !l.id.toLowerCase().includes(srcFilterId.toLowerCase())) return;
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
          reassignToId: selectedTargetLetterId || '',
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

      return true;
    });

    setTgtSearchResults(results);
  };

  // Pick target row into source input
  const handleSelectTargetForSource = (targetId: string) => {
    setSelectedTargetLetterId(targetId);
    setSrcSearchResults((prev) =>
      prev.map((item) => ({ ...item, reassignToId: targetId }))
    );
  };

  // Reassign directly from Modal
  const handleModalReassign = (sourceLetterId: string, presentId: string, targetId: string) => {
    if (!targetId.trim()) return;
    onManualTransfer(sourceLetterId, presentId, targetId);
    setNotification(`¡Regalo reasignado manualmente a la carta ${targetId}!`);
    setIsMatchModalOpen(false);
  };

  // Open Modal and run initial search so sections are populated
  const handleOpenModal = () => {
    setIsMatchModalOpen(true);
    // Pre-populate target with 0-present letters
    setTgtSearchResults(letters.filter((l) => !l.isArchived && l.presents.length === 0));
    // Pre-populate source with surplus/mismatch letters
    const active = letters.filter((l) => !l.isArchived && l.presents.length > 0);
    const initialSrc: { letter: Letter; present: PresentItem; reassignToId: string }[] = [];
    active.forEach((l) => {
      l.presents.forEach((p) => {
        initialSrc.push({ letter: l, present: p, reassignToId: '' });
      });
    });
    setSrcSearchResults(initialSrc);
  };

  const selectedCount = manualQueue.filter((r) => r.selected).length;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-blue-600" />
            <span>{t.reassign.manualTitle}</span>
          </h1>
          <p className="text-xs text-slate-500">{t.reassign.manualSubtitle}</p>
        </div>

        {/* Action Buttons: Reassign, Remove, Add */}
        <div className="flex items-center gap-2">
          {/* Reassign Button (executed over selected rows) */}
          <button
            onClick={handleExecuteLandingReassign}
            disabled={selectedCount === 0 || !permissions.RP}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{t.reassign.reassignBtn} ({selectedCount})</span>
          </button>

          {/* Remove Button (executed over selected rows) */}
          <button
            onClick={handleRemoveSelected}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed border border-rose-200 rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t.reassign.removeBtn}</span>
          </button>

          {/* Add Button: does not affect checked rows, pops up modal */}
          {permissions.RP && (
            <button
              onClick={handleOpenModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4 text-emerald-800" />
              <span className="font-bold text-emerald-900">{t.reassign.createMatch}</span>
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>{notification}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Landing Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-slate-700">
            Cola de Reasignaciones Manuales Activas
          </span>
          <span className="text-slate-500">
            {manualQueue.length} coincidencias configuradas
          </span>
        </div>

        {manualQueue.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <GitMerge className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-700">No hay filas en la cola manual</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Haz clic en <strong>"{t.reassign.createMatch}"</strong> para abrir el buscador dividido (Origen vs Destino) y emparejar un regalo con una carta sin regalos.
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
                      checked={manualQueue.length > 0 && manualQueue.every((r) => r.selected)}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="p-3">Regalo a Reasignar</th>
                  <th className="p-3">Rango Edad</th>
                  <th className="p-3">Género</th>
                  <th className="p-3">Coincidencia</th>
                  <th className="p-3">Origen (Carta / Restantes)</th>
                  <th className="p-3">Líder Origen</th>
                  {permissions.SCC && <th className="p-3">Coord. Origen</th>}
                  <th className="p-3">Destino (Carta / Restantes)</th>
                  <th className="p-3">Líder Destino</th>
                  {permissions.SCC && <th className="p-3">Coord. Destino</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {manualQueue.map((row) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      row.selected ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={() => handleToggleSelectRow(row.id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{row.present.type}</div>
                      <div className="text-[11px] text-slate-500">{row.present.description}</div>
                    </td>
                    <td className="p-3 font-mono">{row.present.ageRange}</td>
                    <td className="p-3 text-slate-700">{row.present.gender}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {row.present.matching}
                      </span>
                    </td>
                    <td className="p-3 font-mono">
                      <span className="font-bold text-slate-900">{row.sourceLetterId}</span>
                      <span className="text-[11px] text-slate-500 block">
                        Restantes: {row.sourceRemainingPresents}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{row.sourceLeader}</td>
                    {permissions.SCC && <td className="p-3 text-slate-700">{row.sourceCoordinator}</td>}
                    <td className="p-3 font-mono">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {row.targetLetterId}
                      </span>
                      <span className="text-[11px] text-slate-500 block">
                        Restantes: {row.targetRemainingPresents}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{row.targetLeader}</td>
                    {permissions.SCC && <td className="p-3 text-slate-700">{row.targetCoordinator}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= MODAL: "CREAR COINCIDENCIA" (2-SECTION HORIZONTAL SPLIT) ================= */}
      {isMatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-7xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 my-4 max-h-[95vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <GitMerge className="w-5 h-5 text-blue-600" />
                  <span>Modal: Crear Coincidencia (Reasignación Manual)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Especificación de 2 secciones: Selecciona o escribe el ID de la carta destino en la fila de origen para habilitar el botón "Reasignar".
                </p>
              </div>
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Screen Container (Two horizontal columns) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-y-auto pr-1">
              {/* ================= SECTION 1: THE TARGET (EL DESTINO) ================= */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col space-y-3">
                <div className="bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                  <span className="font-bold text-rose-900 block text-xs">
                    Sección: El Destino (The Target)
                  </span>
                  <span className="text-[11px] text-rose-700">
                    Cartas necesitadas. Haz clic en una carta de la lista para copiar su ID automáticamente al origen.
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
                <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto flex-1 max-h-80">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Regalos</th>
                        <th className="p-2">ID</th>
                        <th className="p-2">Nombre / Edad</th>
                        <th className="p-2">Petición (Juguete)</th>
                        <th className="p-2">Líder</th>
                        {permissions.SCC && <th className="p-2">Coordinador</th>}
                        <th className="p-2 text-right">Elegir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tgtSearchResults.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400">
                            No se encontraron cartas destino con esos filtros.
                          </td>
                        </tr>
                      ) : (
                        tgtSearchResults.map((l) => (
                          <tr
                            key={l.id}
                            className={`hover:bg-slate-50 cursor-pointer ${
                              selectedTargetLetterId === l.id ? 'bg-emerald-50' : ''
                            }`}
                            onClick={() => handleSelectTargetForSource(l.id)}
                          >
                            <td className="p-2 font-mono font-bold text-rose-700">
                              {l.presents.length}
                            </td>
                            <td className="p-2 font-mono font-bold text-slate-900">
                              {l.id}
                            </td>
                            <td className="p-2">
                              <span className="font-semibold block">{l.kidName}</span>
                              <span className="text-slate-500">
                                {l.age}a · {l.gender}
                              </span>
                            </td>
                            <td className="p-2 text-slate-700 line-clamp-2">
                              {l.toyRequest}
                            </td>
                            <td className="p-2 text-slate-600">{l.leaderName || '—'}</td>
                            {permissions.SCC && (
                              <td className="p-2 text-slate-600">{l.coordinatorName || '—'}</td>
                            )}
                            <td className="p-2 text-right">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectTargetForSource(l.id);
                                }}
                                className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600 text-white hover:bg-emerald-700"
                              >
                                Seleccionar
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ================= SECTION 2: THE SOURCE (EL ORIGEN) ================= */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 flex flex-col space-y-3">
                <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
                  <span className="font-bold text-blue-900 block text-xs">
                    Sección: El Origen (The Source)
                  </span>
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
                <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto flex-1 max-h-80">
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead className="bg-slate-100 sticky top-0 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="p-2">Regalo</th>
                        <th className="p-2">Edad / Género</th>
                        <th className="p-2">Coincidencia</th>
                        <th className="p-2">Origen (Carta / Regalos)</th>
                        <th className="p-2">Líder</th>
                        {permissions.SCC && <th className="p-2">Coord.</th>}
                        <th className="p-2">Reasignar a (ID Destino)</th>
                        <th className="p-2 text-right">Acción</th>
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
                          const canReassign = !!item.reassignToId.trim();

                          return (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2">
                                <span className="font-bold text-slate-900 block">
                                  {item.present.type}
                                </span>
                                <span className="text-[10px] text-slate-500 line-clamp-1">
                                  {item.present.description}
                                </span>
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
                              <td className="p-2 text-slate-600">
                                {item.letter.leaderName || '—'}
                              </td>
                              {permissions.SCC && (
                                <td className="p-2 text-slate-600">
                                  {item.letter.coordinatorName || '—'}
                                </td>
                              )}
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
                              {/* Reassign Button (Enabled when Target ID is captured) */}
                              <td className="p-2 text-right">
                                <button
                                  type="button"
                                  disabled={!canReassign}
                                  onClick={() =>
                                    handleModalReassign(
                                      item.letter.id,
                                      item.present.id,
                                      item.reassignToId
                                    )
                                  }
                                  className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed rounded shadow-2xs transition-colors"
                                >
                                  Reasignar
                                </button>
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

            {/* Modal Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 shrink-0 text-xs">
              <span className="text-slate-500">
                Regla: Cuando se captura el ID de "The Target" en "The Source", el botón "Reasignar" se activa y transfiere el regalo.
              </span>
              <button
                type="button"
                onClick={() => setIsMatchModalOpen(false)}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg font-medium"
              >
                Cerrar Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
