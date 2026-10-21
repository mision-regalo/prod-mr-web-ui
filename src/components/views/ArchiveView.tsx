import React from 'react';
import { Letter, Role } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { PERMISSIONS_TABLE } from '../../data/mockData';
import { Archive, RotateCcw, Trash2, AlertCircle, ShieldAlert } from 'lucide-react';

interface ArchiveViewProps {
  letters: Letter[];
  currentRole: Role;
  language: Language;
  onRestoreLetter: (letterId: string) => void;
  onHardDeleteLetter: (letterId: string) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  letters,
  currentRole,
  language,
  onRestoreLetter,
  onHardDeleteLetter,
}) => {
  const t = translations[language];
  const permissions = PERMISSIONS_TABLE[currentRole];
  const archivedLetters = letters.filter((l) => l.isArchived);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Archive className="w-5 h-5 text-amber-600" />
            <span>{t.nav.archive}</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
              {archivedLetters.length}
            </span>
          </h1>
          <p className="text-xs text-slate-500">
            {language === 'es'
              ? 'Área de resguardo no destructiva. Las cartas borradas por Líderes o Admin pueden restaurarse en cualquier momento.'
              : 'Non-destructive archive vault. Letters deleted by Leaders or Admins can be restored anytime.'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {archivedLetters.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Archive className="w-10 h-10 mx-auto mb-2 text-slate-300" />
            <p className="font-medium text-slate-700">El archivo está vacío</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              No hay cartas archivadas actualmente. Cuando un Líder o Administrador elimina una carta de la lista principal, aparecerá aquí protegida contra pérdida accidental.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3">ID Carta</th>
                  <th className="p-3">Nombre del Niño</th>
                  <th className="p-3">Petición de Juguete</th>
                  <th className="p-3">Líder</th>
                  <th className="p-3">Padrino</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {archivedLetters.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/80">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200">
                        {l.id}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{l.kidName}</div>
                      <div className="text-[11px] text-slate-500">{l.age} años · {l.gender}</div>
                    </td>
                    <td className="p-3 text-slate-700">{l.toyRequest}</td>
                    <td className="p-3 text-slate-700">{l.leaderName || 'Sin asignar'}</td>
                    <td className="p-3 text-slate-700">{l.donorName || 'Sin donante'}</td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Restore button */}
                        <button
                          onClick={() => onRestoreLetter(l.id)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restaurar</span>
                        </button>

                        {/* Admin hard delete */}
                        {currentRole === 'Admin' && (
                          <button
                            onClick={() => onHardDeleteLetter(l.id)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                            title="Eliminación definitiva (Sólo Admin)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
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
