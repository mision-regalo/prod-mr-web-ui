import React, { useState } from 'react';
import { SchoolCatalogItem, Letter, RolePermissions } from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  School,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  Check,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';

interface SchoolsViewProps {
  schools: SchoolCatalogItem[];
  letters: Letter[];
  permissions: RolePermissions;
  language: Language;
  onSaveSchool: (school: SchoolCatalogItem) => void;
  onDeleteSchool: (schoolId: string) => { success: boolean; message?: string };
}

export const SchoolsView: React.FC<SchoolsViewProps> = ({
  schools,
  letters,
  permissions,
  language,
  onSaveSchool,
  onDeleteSchool,
}) => {
  const t = translations[language];

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<SchoolCatalogItem | null>(null);

  const [formName, setFormName] = useState('');
  const [formZone, setFormZone] = useState('');
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  if (!permissions.CS) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center max-w-lg mx-auto space-y-3">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          {language === 'es' ? 'Acceso Restringido' : 'Restricted Access'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {language === 'es'
            ? 'La administración del catálogo de Escuelas Primarias requiere el permiso CS (exclusivo de Administradores).'
            : 'Elementary Schools catalog management requires the CS privilege (Admin only).'}
        </p>
      </div>
    );
  }

  const filteredSchools = schools.filter((s) => {
    const q = search.toLowerCase();
    return s.name.toLowerCase().includes(q) || (s.zone && s.zone.toLowerCase().includes(q));
  });

  const handleOpenCreate = () => {
    setEditingSchool(null);
    setFormName('');
    setFormZone('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sch: SchoolCatalogItem) => {
    setEditingSchool(sch);
    setFormName(sch.name);
    setFormZone(sch.zone || '');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newSch: SchoolCatalogItem = {
      id: editingSchool ? editingSchool.id : `SCH-${String(schools.length + 1).padStart(2, '0')}`,
      name: formName.trim(),
      zone: formZone.trim() || 'Guadalajara',
      communityCode: editingSchool?.communityCode || formName.substring(0, 2).toUpperCase(),
    };

    onSaveSchool(newSch);
    setIsModalOpen(false);
    setAlertMessage({
      type: 'success',
      text: language === 'es' ? 'Escuela guardada exitosamente' : 'School saved successfully',
    });
  };

  const handleDelete = (id: string) => {
    const res = onDeleteSchool(id);
    if (!res.success) {
      setAlertMessage({ type: 'error', text: res.message || 'Error al eliminar escuela.' });
    } else {
      setAlertMessage({
        type: 'success',
        text: language === 'es' ? 'Escuela eliminada del catálogo' : 'School removed from catalog',
      });
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <School className="w-5 h-5 text-blue-600" />
            <span>{t.schools.title}</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              {schools.length} {language === 'es' ? 'escuelas' : 'schools'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.schools.subtitle}</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.schools.newSchool}</span>
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
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{alertMessage.text}</span>
          </div>
          <button onClick={() => setAlertMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'es' ? 'Buscar escuela por nombre o zona...' : 'Search school by name or zone...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Schools Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px]">
                <th className="p-3">ID Catálogo</th>
                <th className="p-3">{t.schools.schoolName}</th>
                <th className="p-3">Zona / Comunidad</th>
                <th className="p-3 text-center">{t.schools.lettersCount}</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSchools.map((sch) => {
                const assignedCount = letters.filter((l) => l.school === sch.name).length;

                return (
                  <tr key={sch.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                      {sch.id}
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900 dark:text-white">{sch.name}</div>
                    </td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">
                      {sch.zone || 'Guadalajara'}
                    </td>
                    <td className="p-3 text-center">
                      <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        {assignedCount}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(sch)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Editar escuela"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(sch.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Eliminar escuela (protegido si tiene cartas)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit School */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSchool ? (language === 'es' ? 'Editar Escuela' : 'Edit School') : t.schools.newSchool}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.schools.schoolName} *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej. Primaria Niños Héroes"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'es' ? 'Zona / Comunidad' : 'Zone / Community'}
                </label>
                <input
                  type="text"
                  value={formZone}
                  onChange={(e) => setFormZone(e.target.value)}
                  placeholder="Ej. Oblatos, Polanco GDL"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
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
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                >
                  {language === 'es' ? 'Guardar Escuela' : 'Save School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
