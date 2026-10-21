import React from 'react';
import { Letter, User } from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  FileText,
  UserCheck,
  PackageCheck,
  Shuffle,
  Truck,
  ArrowRight,
  Gift,
  AlertTriangle,
  Heart,
  Layers,
} from 'lucide-react';

interface DashboardViewProps {
  letters: Letter[];
  currentUser?: User;
  onNavigate: (viewId: string) => void;
  language: Language;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  letters,
  currentUser,
  onNavigate,
  language,
}) => {
  const t = translations[language];

  const isCoordinator = (currentUser?.roleName || '').toLowerCase() === 'coordinator' || currentUser?.roleId === 'ROLE-COORD';

  const totalLetters = letters.length;
  const noDonorLetters = letters.filter((l) => !l.donorId);
  const withDonorLetters = letters.filter((l) => !!l.donorId);
  const withDonorNoPresents = withDonorLetters.filter((l) => l.presents.length === 0);
  const fulfilledLetters = letters.filter((l) => l.presents.length >= 1);
  const surplusLetters = letters.filter((l) => l.presents.length > 1);

  const distribution = {
    threePlus: letters.filter((l) => l.presents.length >= 3).length,
    two: letters.filter((l) => l.presents.length === 2).length,
    one: letters.filter((l) => l.presents.length === 1).length,
    zero: letters.filter((l) => l.presents.length === 0).length,
  };

  const coveragePercent = totalLetters > 0 ? Math.round((fulfilledLetters.length / totalLetters) * 100) : 0;

  const phases = [
    {
      num: 1,
      title: language === 'es' ? 'Fase 1: Cartas de los Niños' : 'Phase 1: Letters Collection',
      desc: language === 'es'
        ? 'Recepción de cartas impresas: Juguete (prioridad), Ropa y Útil escolar. Captura con ID único consecutivo.'
        : 'Printed letter forms: Toy (priority), Clothing, School item. Unique consecutive ID.',
      icon: FileText,
      badge: `${totalLetters} cartas`,
      action: 'letters',
      btnText: language === 'es' ? 'Gestionar Cartas' : 'Manage Letters',
      color: 'border-blue-500 bg-blue-50/50',
    },
    {
      num: 2,
      title: language === 'es' ? 'Fase 2: Asignación de Padrinos' : 'Phase 2: Recruiting Donors',
      desc: language === 'es'
        ? 'Líderes reciben paquetes de 150 cartas, reclutan Coordinadores (10-15 cartas c/u) y buscan donantes.'
        : 'Leaders get 150-letter buckets, recruit Coordinators (10-15 each) and match with donors.',
      icon: UserCheck,
      badge: `${noDonorLetters.length} ${language === 'es' ? 'pendientes' : 'pending'}`,
      action: 'volunteers',
      btnText: language === 'es' ? 'Ver Voluntarios' : 'View Volunteers',
      color: 'border-amber-500 bg-amber-50/50',
    },
    {
      num: 3,
      title: language === 'es' ? 'Fase 3: Centro de Acopio' : 'Phase 3: Gathering Presents',
      desc: language === 'es'
        ? 'Seguimiento con donantes para llevar regalos al centro de acopio. Registro de regalos y grado de coincidencia.'
        : 'Follow-up with donors to collect gifts. Registration of age range, gender & matching grade.',
      icon: PackageCheck,
      badge: `${withDonorNoPresents.length} ${language === 'es' ? 'por entregar' : 'to deliver'}`,
      action: 'reports',
      btnText: language === 'es' ? 'Reporte Acopio' : 'Collection Report',
      color: 'border-purple-500 bg-purple-50/50',
    },
    {
      num: 4,
      title: language === 'es' ? 'Fase 4: Reasignación y Excedentes' : 'Phase 4: Surplus Reassignment',
      desc: language === 'es'
        ? 'Simulación y reasignación manual: usar regalos de cartas con excedentes (>1) para cubrir cartas en 0.'
        : 'Simulation & manual reassignments: distribute surplus gifts to ensure 100% of children receive a present.',
      icon: Shuffle,
      badge: `${surplusLetters.length} ${language === 'es' ? 'excedentes' : 'surplus'}`,
      action: 'reassign-sim',
      btnText: language === 'es' ? 'Simular Reasignación' : 'Simulate Reassignment',
      color: 'border-emerald-500 bg-emerald-50/50',
    },
    {
      num: 5,
      title: language === 'es' ? 'Fase 5: Día de Entrega' : 'Phase 5: Giving Day',
      desc: language === 'es'
        ? 'Transporte a escuelas primarias en Guadalajara y entrega personalizada a cada niño según su carta.'
        : 'Transport gifts to primary schools in Guadalajara and celebrate delivery with children.',
      icon: Truck,
      badge: language === 'es' ? 'Meta: 100% Niños' : 'Goal: 100% Kids',
      action: 'reports',
      btnText: language === 'es' ? 'Ver Métricas' : 'View Metrics',
      color: 'border-rose-500 bg-rose-50/50',
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome with Vuetify Card aesthetic */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
              <Gift className="w-4 h-4" />
              <span>{t.tagline}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t.appTitle}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {language === 'es'
                ? 'Objetivo de la misión: Asegurar que ningún niño se quede sin regalo de Navidad. Administra el flujo completo desde la captura de cartas hasta la reasignación inteligente de excedentes.'
                : 'Mission Goal: Ensure no child is left without a Christmas present. Manage the end-to-end pipeline from letter entry to intelligent surplus gift reassignments.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 shrink-0">
            <div className="text-center sm:text-right">
              <div className="text-xs text-slate-500 font-medium">
                {language === 'es' ? 'Cobertura de Niños' : 'Children Coverage'}
              </div>
              <div className="text-3xl font-bold text-slate-900 font-mono tabular-nums">
                {coveragePercent}%
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold">
                {fulfilledLetters.length} / {totalLetters} {language === 'es' ? 'con regalo' : 'with gift'}
              </div>
            </div>
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500 border-t-amber-400 border-r-emerald-500 border-b-emerald-500 flex items-center justify-center font-bold text-sm text-slate-800">
              {coveragePercent}%
            </div>
          </div>
        </div>
      </div>

      {/* 4 Metric Cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isCoordinator ? 'lg:grid-cols-3' : 'lg:grid-cols-4'} gap-4`}>
        {/* Total Letters */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {language === 'es' ? 'Cartas Registradas' : 'Total Letters'}
            </span>
            <Layers className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {totalLetters}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {language === 'es' ? 'Fase 1 completada' : 'Phase 1 captured'}
          </div>
        </div>

        {/* Missing Donors */}
        <div className="bg-white border border-amber-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {language === 'es' ? 'Sin Padrino Asignado' : 'Without Donors'}
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-900 font-mono tabular-nums">
            {noDonorLetters.length}
          </div>
          <div className="text-xs text-amber-700 mt-1">
            {language === 'es' ? 'Requieren coordinador' : 'Need coordinator & donor'}
          </div>
        </div>

        {/* Missing Gifts */}
        <div className="bg-white border border-rose-200/80 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-rose-700 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">
              {language === 'es' ? 'Padrino sin Regalo' : 'With Donor (0 Gifts)'}
            </span>
            <Gift className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-900 font-mono tabular-nums">
            {withDonorNoPresents.length}
          </div>
          <div className="text-xs text-rose-700 mt-1">
            {language === 'es' ? 'Fase 3: seguimiento activo' : 'Phase 3: active collection'}
          </div>
        </div>

        {/* Surplus Gifts for Reassignment */}
        {!isCoordinator && (
          <div className="bg-white border border-emerald-200/80 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-emerald-700 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">
                {language === 'es' ? 'Excedentes Disponibles' : 'Surplus Gifts'}
              </span>
              <Shuffle className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-900 font-mono tabular-nums">
              {surplusLetters.reduce((acc, l) => acc + (l.presents.length - 1), 0)}
            </div>
            <div className="text-xs text-emerald-700 mt-1">
              {language === 'es' ? 'Listos para reasignar a 0s' : 'Ready to cover zero-gift kids'}
            </div>
          </div>
        )}
      </div>

      {/* 5 Operational Phases Pipeline */}
      {!isCoordinator && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'es' ? 'Flujo de las 5 Fases Operativas' : '5-Phase Operational Pipeline'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'es'
                  ? 'Proceso documentado para asegurar que cada niño reciba al menos un regalo.'
                  : 'Documented business process ensuring every child receives at least one gift.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {phases.map((phase) => (
              <div
                key={phase.num}
                className={`rounded-xl border p-4 flex flex-col justify-between ${phase.color} transition-all hover:shadow-xs`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-xs text-slate-800 shadow-2xs">
                      {phase.num}
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-slate-200 text-slate-700">
                      {phase.badge}
                    </span>
                  </div>
                  <h3 className="font-semibold text-slate-900 text-xs">{phase.title}</h3>
                  <p className="text-[11px] text-slate-600 leading-snug">{phase.desc}</p>
                </div>

                <button
                  onClick={() => onNavigate(phase.action)}
                  className="mt-4 flex items-center justify-between w-full text-xs font-semibold text-slate-800 bg-white/90 hover:bg-white px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors"
                >
                  <span>{phase.btnText}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Distribution by Letter Breakdown */}
      {!isCoordinator && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {language === 'es' ? 'Distribución de Regalos por Carta' : 'Distribution of Presents by Letter'}
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'es'
                  ? 'Objetivo de Fase 4: Reducir las cartas con 0 regalos mediante reasignación.'
                  : 'Phase 4 Goal: Eliminate 0-gift letters using intelligent surplus reassignments.'}
              </p>
            </div>
            <button
              onClick={() => onNavigate('reassign-sim')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>{language === 'es' ? 'Abrir Simulación' : 'Open Simulation'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4 pt-2">
            {/* 3 or more presents */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">
                  {language === 'es' ? '3 o más regalos (Gran Excedente)' : '3+ Presents (Large Surplus)'}
                </span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {distribution.threePlus} {language === 'es' ? 'cartas' : 'letters'} ({Math.round((distribution.threePlus / totalLetters) * 100 || 0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(distribution.threePlus / totalLetters) * 100 || 0}%` }}
                />
              </div>
            </div>

            {/* 2 presents */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">
                  {language === 'es' ? '2 regalos (1 Excedente Reasignable)' : '2 Presents (1 Reassignable Surplus)'}
                </span>
                <span className="font-mono font-semibold text-slate-900 tabular-nums">
                  {distribution.two} {language === 'es' ? 'cartas' : 'letters'} ({Math.round((distribution.two / totalLetters) * 100 || 0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(distribution.two / totalLetters) * 100 || 0}%` }}
                />
              </div>
            </div>

            {/* 1 present */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-slate-700">
                  {language === 'es' ? '1 regalo (Meta Cumplida)' : '1 Present (Goal Achieved)'}
                </span>
                <span className="font-mono font-semibold text-emerald-700 tabular-nums">
                  {distribution.one} {language === 'es' ? 'cartas' : 'letters'} ({Math.round((distribution.one / totalLetters) * 100 || 0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(distribution.one / totalLetters) * 100 || 0}%` }}
                />
              </div>
            </div>

            {/* 0 presents */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-rose-700 font-semibold">
                  {language === 'es' ? '0 regalos (Requiere Padrino / Reasignación)' : '0 Presents (Needs Donor / Reassignment)'}
                </span>
                <span className="font-mono font-bold text-rose-700 tabular-nums">
                  {distribution.zero} {language === 'es' ? 'cartas' : 'letters'} ({Math.round((distribution.zero / totalLetters) * 100 || 0)}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(distribution.zero / totalLetters) * 100 || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
