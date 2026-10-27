import React, { useState, useMemo } from 'react';
import { Letter, Leader, Coordinator, SchoolCatalogItem, Role, User } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { PERMISSIONS_TABLE } from '../../data/mockData';
import { exportLettersToExcel, exportSummaryStatsToExcel } from '../../utils/excelExport';
import {
  FileSpreadsheet,
  Download,
  Filter,
  BarChart3,
  Users,
  Gift,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface ReportsViewProps {
  letters: Letter[];
  leaders: Leader[];
  coordinators: Coordinator[];
  schools: SchoolCatalogItem[];
  currentUser?: User;
  currentRole: Role;
  language: Language;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  letters,
  leaders,
  coordinators,
  schools,
  currentUser,
  currentRole,
  language,
}) => {
  const t = translations[language];
  const permissions = PERMISSIONS_TABLE[currentRole];

  const userRoleLower = (currentUser?.roleName || currentRole).toLowerCase();
  const isLeader = userRoleLower === 'leader' || currentUser?.roleId === 'ROLE-LEADER';

  // Identify logged-in leader object
  const myLeader = useMemo(() => {
    if (!isLeader) return null;
    const userEmail = (currentUser?.email || '').trim().toLowerCase();
    const userName = (currentUser?.name || '').trim().toLowerCase();
    return (
      leaders.find(
        (ld) =>
          (currentUser?.assignedLeaderId && ld.id === currentUser.assignedLeaderId) ||
          ld.id === currentUser?.id ||
          (userEmail && ld.email.trim().toLowerCase() === userEmail) ||
          (userName && `${ld.firstName} ${ld.lastName}`.trim().toLowerCase() === userName)
      ) || null
    );
  }, [isLeader, currentUser, leaders]);

  const myLeaderId = myLeader?.id || currentUser?.assignedLeaderId || currentUser?.id;
  const myLeaderName = myLeader
    ? `${myLeader.firstName} ${myLeader.lastName}`.trim().toLowerCase()
    : (currentUser?.name || '').trim().toLowerCase();

  // Coordinators under this leader's umbrella
  const umbrellaCoordinators = useMemo(() => {
    if (isLeader) {
      return coordinators.filter(
        (c) =>
          (myLeaderId && c.leaderId === myLeaderId) ||
          (myLeaderName && c.leaderName && c.leaderName.trim().toLowerCase() === myLeaderName)
      );
    }
    return coordinators;
  }, [isLeader, myLeaderId, myLeaderName, coordinators]);

  const umbrellaCoordIds = useMemo(() => new Set(umbrellaCoordinators.map((c) => c.id)), [umbrellaCoordinators]);
  const umbrellaCoordNames = useMemo(
    () => new Set(umbrellaCoordinators.map((c) => `${c.firstName} ${c.lastName}`.trim().toLowerCase())),
    [umbrellaCoordinators]
  );

  // Scoped letters under umbrella
  const scopedLetters = useMemo(() => {
    const active = letters.filter((l) => !l.isArchived);
    if (!isLeader) return active;

    return active.filter(
      (l) =>
        (myLeaderId && l.leaderId === myLeaderId) ||
        (myLeaderName && l.leaderName && l.leaderName.trim().toLowerCase() === myLeaderName) ||
        (l.coordinatorId && umbrellaCoordIds.has(l.coordinatorId)) ||
        (l.coordinatorName && umbrellaCoordNames.has(l.coordinatorName.trim().toLowerCase()))
    );
  }, [letters, isLeader, myLeaderId, myLeaderName, umbrellaCoordIds, umbrellaCoordNames]);

  // Active Report Tab: 'no-donors' | 'no-presents' | 'distribution'
  const [activeTab, setActiveTab] = useState<'no-donors' | 'no-presents' | 'distribution'>('no-donors');

  // Filters
  const [filterLeader, setFilterLeader] = useState('');
  const [filterCoord, setFilterCoord] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterAgeRange, setFilterAgeRange] = useState('');

  // 1. Report: No Donors (umbrella scoped)
  const noDonorLetters = useMemo(() => {
    return scopedLetters.filter((l) => !l.donorId);
  }, [scopedLetters]);

  // 2. Report: Letters with donor but no presents (umbrella scoped)
  const noPresentsLetters = useMemo(() => {
    return scopedLetters.filter((l) => !!l.donorId && l.presents.length === 0);
  }, [scopedLetters]);

  // Apply Common Filters
  const applyFilters = (list: Letter[]) => {
    return list.filter((l) => {
      if (filterLeader && l.leaderId !== filterLeader) return false;
      if (permissions.SCC && filterCoord && l.coordinatorId !== filterCoord) return false;
      if (filterGender && l.gender !== filterGender) return false;
      if (filterAgeRange) {
        if (filterAgeRange === '3-6' && (l.age < 3 || l.age > 6)) return false;
        if (filterAgeRange === '6-9' && (l.age < 6 || l.age > 9)) return false;
        if (filterAgeRange === '9-12' && (l.age < 9 || l.age > 12)) return false;
      }
      return true;
    });
  };

  const filteredNoDonors = useMemo(() => applyFilters(noDonorLetters), [noDonorLetters, filterLeader, filterCoord, filterGender, filterAgeRange, permissions.SCC]);
  const filteredNoPresents = useMemo(() => applyFilters(noPresentsLetters), [noPresentsLetters, filterLeader, filterCoord, filterGender, filterAgeRange, permissions.SCC]);

  // Distribution counts (umbrella scoped)
  const totalActive = scopedLetters;
  const dist3Plus = totalActive.filter((l) => l.presents.length >= 3).length;
  const dist2 = totalActive.filter((l) => l.presents.length === 2).length;
  const dist1 = totalActive.filter((l) => l.presents.length === 1).length;
  const dist0 = totalActive.filter((l) => l.presents.length === 0).length;

  // Export Current Report to Excel
  const handleExportCurrent = () => {
    if (activeTab === 'no-donors') {
      exportLettersToExcel(
        filteredNoDonors,
        `Reporte_Cartas_Sin_Donante_${new Date().toISOString().split('T')[0]}`,
        permissions.SCC
      );
    } else if (activeTab === 'no-presents') {
      exportLettersToExcel(
        filteredNoPresents,
        `Reporte_Cartas_Sin_Regalos_${new Date().toISOString().split('T')[0]}`,
        permissions.SCC
      );
    } else {
      exportSummaryStatsToExcel(
        totalActive,
        `Reporte_Distribucion_Regalos_${new Date().toISOString().split('T')[0]}`
      );
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            <span>{t.reports.title}</span>
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'es'
              ? 'Analítica para coordinar la logística y exportar a hojas de cálculo Excel oficiales.'
              : 'Analytics to coordinate field logistics and export to official Excel spreadsheets.'}
          </p>
        </div>

        {/* Real Excel Export Trigger */}
        <button
          onClick={handleExportCurrent}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>{t.reports.exportExcel}</span>
        </button>
      </div>

      {/* Leader Umbrella Indicator Banner */}
      {isLeader && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900 shadow-2xs">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="font-semibold">
              {language === 'es'
                ? `Mostrando únicamente datos de cobertura bajo tu liderazgo (${myLeader ? `${myLeader.firstName} ${myLeader.lastName}` : (currentUser?.name || 'Líder')} · ${scopedLetters.length} cartas bajo tu cobertura)`
                : `Showing only coverage data under your leadership (${myLeader ? `${myLeader.firstName} ${myLeader.lastName}` : (currentUser?.name || 'Leader')} · ${scopedLetters.length} letters under your umbrella)`}
            </span>
          </div>
          <span className="bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px]">
            {umbrellaCoordinators.length} {language === 'es' ? 'coordinadores' : 'coordinators'}
          </span>
        </div>
      )}

      {/* Navigation Tabs (Vuetify v-tabs) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-4">
        <div className="flex border-b border-slate-200 text-xs font-medium">
          <button
            onClick={() => setActiveTab('no-donors')}
            className={`py-2 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'no-donors'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>{t.reports.noDonorsTab} ({filteredNoDonors.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('no-presents')}
            className={`py-2 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'no-presents'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Gift className="w-4 h-4 text-rose-500" />
            <span>{t.reports.noPresentsTab} ({filteredNoPresents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('distribution')}
            className={`py-2 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'distribution'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-blue-500" />
            <span>{t.reports.distributionTab}</span>
          </button>
        </div>

        {/* Filters Bar for Reports 1 & 2 */}
        {activeTab !== 'distribution' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs pt-1">
            {/* Leader filter */}
            <select
              value={isLeader ? (myLeaderId || '') : filterLeader}
              onChange={(e) => setFilterLeader(e.target.value)}
              disabled={isLeader}
              className={`p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700 ${
                isLeader ? 'bg-slate-100 font-semibold cursor-not-allowed text-slate-800' : ''
              }`}
            >
              {isLeader ? (
                <option value={myLeaderId || ''}>
                  Líder: {myLeader ? `${myLeader.firstName} ${myLeader.lastName}` : (currentUser?.name || 'Tu Liderazgo')}
                </option>
              ) : (
                <>
                  <option value="">Líder: Todos</option>
                  {leaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.firstName} {l.lastName}
                    </option>
                  ))}
                </>
              )}
            </select>

            {/* Coordinator filter (SCC permission required) */}
            {permissions.SCC && (
              <select
                value={filterCoord}
                onChange={(e) => setFilterCoord(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700"
              >
                <option value="">Coordinador: Todos</option>
                {umbrellaCoordinators.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName}
                  </option>
                ))}
              </select>
            )}



            {/* Gender filter */}
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700"
            >
              <option value="">Género: Todos</option>
              <option value="Niño">Niño</option>
              <option value="Niña">Niña</option>
            </select>

            {/* Age Range filter */}
            <select
              value={filterAgeRange}
              onChange={(e) => setFilterAgeRange(e.target.value)}
              className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700"
            >
              <option value="">Rango de Edad: Todos</option>
              <option value="3-6">3 a 6 años</option>
              <option value="6-9">6 a 9 años</option>
              <option value="9-12">9 a 12 años</option>
            </select>
          </div>
        )}
      </div>

      {/* TAB CONTENT: NO DONORS REPORT TABLE */}
      {activeTab === 'no-donors' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="p-3">Id</th>
                  <th className="p-3">Nombre Niño</th>
                  <th className="p-3">Edad</th>
                  <th className="p-3">Género</th>
                  <th className="p-3">Juguete (Opción 1)</th>
                  <th className="p-3">Juguete (Opción 2)</th>
                  <th className="p-3">Juguete (Opción 3)</th>
                  <th className="p-3">Líder</th>
                  {permissions.SCC && <th className="p-3">Coordinador</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNoDonors.length === 0 ? (
                  <tr>
                    <td colSpan={permissions.SCC ? 9 : 8} className="p-8 text-center text-slate-400">
                      No hay cartas sin donante bajo los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredNoDonors.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{l.id}</td>
                      <td className="p-3 font-semibold text-slate-900">{l.kidName}</td>
                      <td className="p-3 font-mono">{l.age}</td>
                      <td className="p-3">{l.gender}</td>
                      <td className="p-3 font-medium text-slate-800">{l.toyRequest}</td>
                      <td className="p-3 text-slate-600">{l.toyRequested2 || '—'}</td>
                      <td className="p-3 text-slate-600">{l.toyRequested3 || '—'}</td>
                      <td className="p-3 text-slate-700">{l.leaderName || 'Sin asignar'}</td>
                      {permissions.SCC && (
                        <td className="p-3 text-slate-700">{l.coordinatorName || 'Sin asignar'}</td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: NO PRESENTS REPORT TABLE */}
      {activeTab === 'no-presents' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                  <th className="p-3">Id</th>
                  <th className="p-3">Nombre Niño</th>
                  <th className="p-3">Padrino Responsable</th>
                  <th className="p-3">Juguete Solicitado</th>
                  <th className="p-3">Líder</th>
                  {permissions.SCC && <th className="p-3">Coordinador</th>}
                  <th className="p-3 text-center">Estado Acopio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredNoPresents.length === 0 ? (
                  <tr>
                    <td colSpan={permissions.SCC ? 7 : 6} className="p-8 text-center text-slate-400">
                      Todos los padrinos asignados ya entregaron sus regalos.
                    </td>
                  </tr>
                ) : (
                  filteredNoPresents.map((l) => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{l.id}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{l.kidName}</div>
                        <div className="text-[11px] text-slate-500">{l.age}a · {l.gender}</div>
                      </td>
                      <td className="p-3 font-medium text-blue-900 bg-blue-50/50">
                        {l.donorName}
                      </td>
                      <td className="p-3 font-medium text-slate-800">{l.toyRequest}</td>
                      <td className="p-3 text-slate-700">{l.leaderName || 'Sin asignar'}</td>
                      {permissions.SCC && (
                        <td className="p-3 text-slate-700">{l.coordinatorName || 'Sin asignar'}</td>
                      )}
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                          0 Regalos en Acopio
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT: DISTRIBUTION CHART (3, 2, 1, 0 PRESENTS) */}
      {activeTab === 'distribution' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Distribución de Cartas por Cantidad de Regalos (3, 2, 1, 0)
            </h2>
            <p className="text-xs text-slate-500">
              Visualización de métricas para balancear excedentes y cubrir cartas en cero.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-4 text-center">
              <span className="text-xs font-bold text-indigo-900 block mb-1">
                3 o más Regalos
              </span>
              <span className="text-3xl font-bold font-mono text-indigo-950 tabular-nums">
                {dist3Plus}
              </span>
              <span className="text-[11px] text-indigo-700 block mt-1">
                {Math.round((dist3Plus / totalActive.length) * 100 || 0)}% de cartas
              </span>
            </div>

            <div className="border border-blue-200 bg-blue-50/50 rounded-xl p-4 text-center">
              <span className="text-xs font-bold text-blue-900 block mb-1">
                2 Regalos (Excedente)
              </span>
              <span className="text-3xl font-bold font-mono text-blue-950 tabular-nums">
                {dist2}
              </span>
              <span className="text-[11px] text-blue-700 block mt-1">
                {Math.round((dist2 / totalActive.length) * 100 || 0)}% de cartas
              </span>
            </div>

            <div className="border border-emerald-200 bg-emerald-50/50 rounded-xl p-4 text-center">
              <span className="text-xs font-bold text-emerald-900 block mb-1">
                1 Regalo (Meta Cumplida)
              </span>
              <span className="text-3xl font-bold font-mono text-emerald-950 tabular-nums">
                {dist1}
              </span>
              <span className="text-[11px] text-emerald-700 block mt-1">
                {Math.round((dist1 / totalActive.length) * 100 || 0)}% de cartas
              </span>
            </div>

            <div className="border border-rose-200 bg-rose-50/50 rounded-xl p-4 text-center">
              <span className="text-xs font-bold text-rose-900 block mb-1">
                0 Regalos (Alerta)
              </span>
              <span className="text-3xl font-bold font-mono text-rose-950 tabular-nums">
                {dist0}
              </span>
              <span className="text-[11px] text-rose-700 block mt-1">
                {Math.round((dist0 / totalActive.length) * 100 || 0)}% de cartas
              </span>
            </div>
          </div>

          {/* Visual Bar Breakdown */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Proporción total de cartas activas ({totalActive.length})</span>
              <span>100% de la muestra</span>
            </div>
            <div className="w-full h-8 bg-slate-100 rounded-xl overflow-hidden flex shadow-inner">
              <div
                style={{ width: `${(dist3Plus / totalActive.length) * 100}%` }}
                className="bg-indigo-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                title={`3+ regalos: ${dist3Plus}`}
              >
                {dist3Plus > 0 ? `${dist3Plus}` : ''}
              </div>
              <div
                style={{ width: `${(dist2 / totalActive.length) * 100}%` }}
                className="bg-blue-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                title={`2 regalos: ${dist2}`}
              >
                {dist2 > 0 ? `${dist2}` : ''}
              </div>
              <div
                style={{ width: `${(dist1 / totalActive.length) * 100}%` }}
                className="bg-emerald-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                title={`1 regalo: ${dist1}`}
              >
                {dist1 > 0 ? `${dist1}` : ''}
              </div>
              <div
                style={{ width: `${(dist0 / totalActive.length) * 100}%` }}
                className="bg-rose-500 h-full flex items-center justify-center text-[10px] text-white font-bold"
                title={`0 regalos: ${dist0}`}
              >
                {dist0 > 0 ? `${dist0}` : ''}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-xs pt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-slate-600">3 o más regalos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600">2 regalos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-slate-600">1 regalo (Objetivo)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-slate-600 font-semibold text-rose-700">0 regalos (A cubrir)</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
