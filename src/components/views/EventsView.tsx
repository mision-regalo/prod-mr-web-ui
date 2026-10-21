import React, { useState } from 'react';
import { GiftGivingEvent, Letter, RolePermissions } from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  Calendar,
  MapPin,
  Target,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  ShieldAlert,
  Sparkles,
  BarChart,
} from 'lucide-react';

interface EventsViewProps {
  events: GiftGivingEvent[];
  letters: Letter[];
  permissions: RolePermissions;
  language: Language;
  onSaveEvent: (event: GiftGivingEvent) => void;
  onDeleteEvent: (eventId: string) => { success: boolean; message?: string };
}

export const EventsView: React.FC<EventsViewProps> = ({
  events,
  letters,
  permissions,
  language,
  onSaveEvent,
  onDeleteEvent,
}) => {
  const t = translations[language];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GiftGivingEvent | null>(null);

  // Form states
  const [formId, setFormId] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDates, setFormDates] = useState('');
  const [formGoal, setFormGoal] = useState<number>(100);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!permissions.CE) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {language === 'es' ? 'Acceso Restringido' : 'Restricted Access'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'es'
            ? 'La administración de Eventos del Día de Entrega requiere el permiso CE (exclusivo de Administradores).'
            : 'Gift-Giving Day Events management requires the CE privilege (Admin only).'}
        </p>
      </div>
    );
  }

  const handleOpenCreate = () => {
    setEditingEvent(null);
    setFormId('');
    setFormLocation('');
    setFormDates('');
    setFormGoal(250);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ev: GiftGivingEvent) => {
    setEditingEvent(ev);
    setFormId(ev.id);
    setFormLocation(ev.location);
    setFormDates(ev.dates);
    setFormGoal(ev.goal);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formId.trim() || !formLocation.trim()) return;

    const singleCharId = formId.trim().toUpperCase().charAt(0);
    const newEvent: GiftGivingEvent = {
      id: singleCharId,
      location: formLocation,
      dates: formDates || 'TBD',
      goal: Number(formGoal) || 100,
    };

    onSaveEvent(newEvent);
    setIsModalOpen(false);
    setAlertMessage({
      type: 'success',
      text: language === 'es' ? 'Evento guardado exitosamente' : 'Event saved successfully',
    });
  };

  const handleDelete = (id: string) => {
    const res = onDeleteEvent(id);
    if (!res.success) {
      setAlertMessage({ type: 'error', text: res.message || 'Error deleting event' });
    } else {
      setAlertMessage({
        type: 'success',
        text: language === 'es' ? 'Evento eliminado exitosamente' : 'Event deleted successfully',
      });
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span>{t.events.title}</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {events.length} {language === 'es' ? 'eventos' : 'events'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.events.subtitle}</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.events.newEvent}</span>
        </button>
      </div>

      {/* Alert feedback */}
      {alertMessage && (
        <div
          className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
            alertMessage.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950 border-rose-200 text-rose-800 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 text-emerald-800 dark:text-emerald-200'
          }`}
        >
          <span>{alertMessage.text}</span>
          <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Event Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((ev) => {
          const registeredLetters = letters.filter((l) => l.folioType === ev.id).length;
          const progressPercent = Math.min(100, Math.round((registeredLetters / ev.goal) * 100));

          return (
            <div
              key={ev.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs space-y-4 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-mono font-bold text-lg flex items-center justify-center shadow-xs">
                      {ev.id}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {language === 'es' ? `Evento ${ev.id}` : `Event ${ev.id}`}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{ev.location}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(ev)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Editar evento"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Eliminar evento"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{language === 'es' ? 'Fechas' : 'Dates'}:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{ev.dates}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.events.goal}:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{ev.goal} {language === 'es' ? 'cartas' : 'letters'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t.events.registered}:</span>
                    <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{registeredLetters}</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] font-medium">
                  <span className="text-slate-500 dark:text-slate-400">{t.events.progress}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono font-bold">{progressPercent}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create/Edit Event */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingEvent ? (language === 'es' ? 'Editar Evento' : 'Edit Event') : t.events.newEvent}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'es' ? 'Identificador de 1 Carácter (Folio Type) *' : 'Single Character ID (Folio Type) *'}
                </label>
                <input
                  type="text"
                  maxLength={1}
                  required
                  value={formId}
                  onChange={(e) => setFormId(e.target.value.toUpperCase())}
                  placeholder="Ej. A, B, C, X, G"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono uppercase font-bold text-center text-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'es' ? 'Ubicación / Municipio *' : 'Location / Municipality *'}
                </label>
                <input
                  type="text"
                  required
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="Ej. Zapopan, Guadalajara, Refugio"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'es' ? 'Fechas del Evento *' : 'Event Dates *'}
                </label>
                <input
                  type="text"
                  required
                  value={formDates}
                  onChange={(e) => setFormDates(e.target.value)}
                  placeholder="Ej. Nov 28th, Nov 29th"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.events.goal} (Cartas) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={formGoal}
                  onChange={(e) => setFormGoal(Number(e.target.value))}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  {language === 'es' ? 'Guardar Evento' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
