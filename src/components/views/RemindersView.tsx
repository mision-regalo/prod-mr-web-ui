import React, { useState, useMemo } from 'react';
import { Letter, Leader, Coordinator, Role } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { PERMISSIONS_TABLE } from '../../data/mockData';
import {
  BellRing,
  Mail,
  Phone,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckSquare,
  Square,
  Sliders,
} from 'lucide-react';

interface RemindersViewProps {
  letters: Letter[];
  leaders: Leader[];
  coordinators: Coordinator[];
  currentRole: Role;
  language: Language;
}

interface RecipientRow {
  id: string;
  type: 'Leader' | 'Coordinator';
  name: string;
  email: string;
  whatsapp: string;
  teamOrSchool: string;
  noDonorCount: number;
  noPresentsCount: number;
  selected: boolean;
}

export const RemindersView: React.FC<RemindersViewProps> = ({
  letters,
  leaders,
  coordinators,
  currentRole,
  language,
}) => {
  const t = translations[language];
  const permissions = PERMISSIONS_TABLE[currentRole];

  // Active channel: 'email' | 'whatsapp'
  const [activeChannel, setActiveChannel] = useState<'email' | 'whatsapp'>('email');

  // Backend parameter simulation: Days between reminders
  const [autoFrequencyDays, setAutoFrequencyDays] = useState(3);
  const [submissionDeadline, setSubmissionDeadline] = useState('2026-11-30');

  // Build recipients list calculating pending counts under their umbrella
  const initialRecipients: RecipientRow[] = useMemo(() => {
    const list: RecipientRow[] = [];

    // Leaders
    leaders.forEach((lead) => {
      const underUmbrella = letters.filter((l) => !l.isArchived && l.leaderId === lead.id);
      const noDonorCount = underUmbrella.filter((l) => !l.donorId).length;
      const noPresentsCount = underUmbrella.filter((l) => !!l.donorId && l.presents.length === 0).length;

      // Rule: Do not send if quantities are zero (we still list or flag them)
      list.push({
        id: lead.id,
        type: 'Leader',
        name: `${lead.firstName} ${lead.lastName}`,
        email: lead.email,
        whatsapp: lead.whatsapp,
        teamOrSchool: `Equipo ${lead.teamColor}`,
        noDonorCount,
        noPresentsCount,
        selected: noDonorCount > 0 || noPresentsCount > 0,
      });
    });

    // Coordinators
    coordinators.forEach((coord) => {
      const underUmbrella = letters.filter((l) => !l.isArchived && l.coordinatorId === coord.id);
      const noDonorCount = underUmbrella.filter((l) => !l.donorId).length;
      const noPresentsCount = underUmbrella.filter((l) => !!l.donorId && l.presents.length === 0).length;

      list.push({
        id: coord.id,
        type: 'Coordinator',
        name: `${coord.firstName} ${coord.lastName}`,
        email: coord.email,
        whatsapp: coord.whatsapp,
        teamOrSchool: coord.school,
        noDonorCount,
        noPresentsCount,
        selected: noDonorCount > 0 || noPresentsCount > 0,
      });
    });

    return list;
  }, [leaders, coordinators, letters]);

  const [recipients, setRecipients] = useState<RecipientRow[]>(initialRecipients);
  const [sentAlert, setSentAlert] = useState<string | null>(null);

  // Toggle selection
  const handleToggleRow = (id: string) => {
    setRecipients((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const handleSelectAllActionable = () => {
    const allActionable = recipients
      .filter((r) => r.noDonorCount > 0 || r.noPresentsCount > 0)
      .every((r) => r.selected);

    setRecipients((prev) =>
      prev.map((r) => {
        if (r.noDonorCount === 0 && r.noPresentsCount === 0) return r;
        return { ...r, selected: !allActionable };
      })
    );
  };

  const actionableCount = recipients.filter((r) => r.noDonorCount > 0 || r.noPresentsCount > 0).length;
  const selectedCount = recipients.filter((r) => r.selected && (r.noDonorCount > 0 || r.noPresentsCount > 0)).length;

  const handleSendReminders = () => {
    const targets = recipients.filter((r) => r.selected && (r.noDonorCount > 0 || r.noPresentsCount > 0));
    if (targets.length === 0) return;

    if (activeChannel === 'email') {
      setSentAlert(
        `¡Correos enviados con éxito a ${targets.length} voluntarios! Se adjuntó desglose de cartas sin padrino y regalos pendientes.`
      );
    } else {
      setSentAlert(
        `¡Mensajes de WhatsApp preparados y enviados a ${targets.length} voluntarios vía API!`
      );
    }
  };

  if (!permissions.SER && !permissions.SWR) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Acceso Restringido</h2>
        <p className="text-xs text-slate-500">
          El envío de recordatorios por Correo y WhatsApp es una función exclusiva para el rol de <strong>Administrador</strong> según la matriz de seguridad del sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BellRing className="w-5 h-5 text-purple-600" />
            <span>{t.reminders.title}</span>
          </h1>
          <p className="text-xs text-slate-500">{t.reminders.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendReminders}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>
              {language === 'es' ? 'Enviar Recordatorio a Seleccionados' : 'Send Reminder'} ({selectedCount})
            </span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {sentAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{sentAlert}</span>
          </div>
          <button onClick={() => setSentAlert(null)} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>
      )}

      {/* Backend Automation Controls Card (Document requirement) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span>Configuración de Envío Automático (Control Backend)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Frecuencia de recordatorios automáticos (días entre envíos)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={30}
                value={autoFrequencyDays}
                onChange={(e) => setAutoFrequencyDays(parseInt(e.target.value) || 3)}
                className="w-24 p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono"
              />
              <span className="text-slate-500">días entre cada notificación</span>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Fecha límite de entrega de regalos
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={submissionDeadline}
                onChange={(e) => setSubmissionDeadline(e.target.value)}
                className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-800 font-mono"
              />
              <span className="text-slate-500">fecha de corte de acopio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Switcher */}
      <div className="flex border-b border-slate-200 text-xs font-medium bg-white px-4 pt-2 rounded-t-xl border-t border-x">
        <button
          onClick={() => setActiveChannel('email')}
          className={`py-2 px-4 border-b-2 flex items-center gap-2 transition-all ${
            activeChannel === 'email'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>{t.reminders.emailTitle}</span>
        </button>

        <button
          onClick={() => setActiveChannel('whatsapp')}
          className={`py-2 px-4 border-b-2 flex items-center gap-2 transition-all ${
            activeChannel === 'whatsapp'
              ? 'border-emerald-600 text-emerald-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>{t.reminders.whatsappTitle}</span>
        </button>
      </div>

      {/* Manual Selection Table with Checkbox per Row */}
      <div className="bg-white rounded-b-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">
              Lista de Destinatarios (Líderes y Coordinadores)
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">
              Regla de negocio: No se envían mensajes a quienes tienen 0 pendientes.
            </span>
          </div>
          <button
            onClick={handleSelectAllActionable}
            className="text-xs font-semibold text-purple-600 hover:text-purple-700"
          >
            Seleccionar todos con pendientes ({actionableCount})
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                <th className="p-3 w-10 text-center">Sel.</th>
                <th className="p-3">Rol</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Equipo / Escuela</th>
                <th className="p-3">Email</th>
                <th className="p-3">WhatsApp</th>
                <th className="p-3 text-center">Cartas Sin Padrino</th>
                <th className="p-3 text-center">Padrino Sin Regalo</th>
                <th className="p-3 text-right">Vista Previa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recipients.map((rec) => {
                const isZero = rec.noDonorCount === 0 && rec.noPresentsCount === 0;

                return (
                  <tr
                    key={rec.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isZero ? 'opacity-50 bg-slate-50/40' : rec.selected ? 'bg-purple-50/30' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        disabled={isZero}
                        checked={rec.selected && !isZero}
                        onChange={() => handleToggleRow(rec.id)}
                        className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 disabled:cursor-not-allowed"
                      />
                    </td>

                    {/* Role badge */}
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          rec.type === 'Leader'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {rec.type === 'Leader' ? 'Líder' : 'Coordinador'}
                      </span>
                    </td>

                    {/* Name */}
                    <td className="p-3 font-semibold text-slate-900">{rec.name}</td>

                    {/* Team or school */}
                    <td className="p-3 text-slate-700">{rec.teamOrSchool}</td>

                    {/* Email */}
                    <td className="p-3 text-slate-600 font-mono">{rec.email}</td>

                    {/* WhatsApp */}
                    <td className="p-3 text-slate-600 font-mono">{rec.whatsapp}</td>

                    {/* No Donor Count */}
                    <td className="p-3 text-center">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded tabular-nums ${
                          rec.noDonorCount > 0
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {rec.noDonorCount}
                      </span>
                    </td>

                    {/* No Presents Count */}
                    <td className="p-3 text-center">
                      <span
                        className={`font-mono font-bold px-2 py-0.5 rounded tabular-nums ${
                          rec.noPresentsCount > 0
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {rec.noPresentsCount}
                      </span>
                    </td>

                    {/* Preview message */}
                    <td className="p-3 text-right">
                      {isZero ? (
                        <span className="text-[10px] text-slate-400 italic">Al día (0 pendientes)</span>
                      ) : activeChannel === 'whatsapp' ? (
                        <a
                          href={`https://wa.me/${rec.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Hola ${rec.name}, recordatorio de Misión Presentes: Tienes ${rec.noDonorCount} cartas sin donante y ${rec.noPresentsCount} cartas con padrino pero sin regalo en el centro de acopio. ¡Gracias por tu valioso apoyo!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded inline-flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>Abrir Chat</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-purple-700 font-medium">Plantilla lista</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
