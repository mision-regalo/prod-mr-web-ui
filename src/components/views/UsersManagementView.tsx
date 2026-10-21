import React, { useState } from 'react';
import { User, CustomRole } from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Search,
  X,
  Check,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';

interface UsersManagementViewProps {
  users: User[];
  roles: CustomRole[];
  language: Language;
  onSaveUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  users,
  roles,
  language,
  onSaveUser,
  onDeleteUser,
}) => {
  const t = translations[language];

  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const systemRoleIds = ['ROLE-ADMIN', 'ROLE-COORD', 'ROLE-LEADER'];
  const systemRoles = roles.filter(
    (r) =>
      systemRoleIds.includes(r.id) ||
      ['admin', 'coordinator', 'leader'].includes(r.name.toLowerCase())
  );
  const customRoles = roles.filter(
    (r) =>
      !systemRoleIds.includes(r.id) &&
      !['admin', 'coordinator', 'leader'].includes(r.name.toLowerCase())
  );

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRoleId, setUserRoleId] = useState(systemRoles[0]?.id || 'ROLE-ADMIN');
  const [userCustomRoleIds, setUserCustomRoleIds] = useState<string[]>([]);
  const [userActive, setUserActive] = useState(true);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const hasMatchingCustomRole = u.customRoleIds?.some((cid) => {
      const cr = roles.find((r) => r.id === cid);
      return cr && cr.name.toLowerCase().includes(q);
    });
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.roleName.toLowerCase().includes(q) ||
      Boolean(hasMatchingCustomRole)
    );
  });

  const handleOpenCreate = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRoleId(systemRoles[0]?.id || 'ROLE-ADMIN');
    setUserCustomRoleIds([]);
    setUserActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRoleId(user.roleId);
    setUserCustomRoleIds(user.customRoleIds || []);
    setUserActive(user.active);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    const matchedRole = roles.find((r) => r.id === userRoleId) || systemRoles[0] || roles[0];

    const newUser: User = {
      id: editingUser ? editingUser.id : `USR-${String(users.length + 1).padStart(2, '0')}`,
      name: userName.trim(),
      email: userEmail.trim(),
      roleId: matchedRole?.id || 'ROLE-ADMIN',
      roleName: matchedRole?.name || 'Admin',
      customRoleIds: userCustomRoleIds,
      assignedLeaderId: editingUser?.assignedLeaderId,
      assignedCoordinatorId: editingUser?.assignedCoordinatorId,
      active: userActive,
    };

    onSaveUser(newUser);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>{t.users.title}</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {users.length} {language === 'es' ? 'usuarios' : 'users'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.users.subtitle}</p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.users.newUser}</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === 'es' ? 'Buscar usuario por nombre o correo...' : 'Search user by name or email...'}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px]">
                <th className="p-3">ID</th>
                <th className="p-3">{t.users.name}</th>
                <th className="p-3">{t.users.email}</th>
                <th className="p-3">{language === 'es' ? 'Rol / Roles' : 'Role / Roles'}</th>
                <th className="p-3 text-center">{t.users.status}</th>
                <th className="p-3 text-right">{language === 'es' ? 'Acciones' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">
                    {user.id}
                  </td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-900 dark:text-white">{user.name}</div>
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 font-mono">
                    {user.email}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        <Shield className="w-3 h-3" />
                        <span>{user.roleName}</span>
                      </span>
                      {user.customRoleIds?.map((cRoleId) => {
                        const cr = roles.find((r) => r.id === cRoleId);
                        if (!cr) return null;
                        return (
                          <span
                            key={cRoleId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                          >
                            <span>{cr.name}</span>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    {user.active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200">
                        <UserCheck className="w-3 h-3" />
                        <span>{language === 'es' ? 'Activo' : 'Active'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">
                        <UserX className="w-3 h-3" />
                        <span>{language === 'es' ? 'Inactivo' : 'Inactive'}</span>
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEdit(user)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={language === 'es' ? 'Editar usuario' : 'Edit user'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteUser(user.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={language === 'es' ? 'Eliminar usuario' : 'Delete user'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Add/Edit User */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingUser ? (language === 'es' ? 'Editar Usuario' : 'Edit User') : t.users.newUser}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.users.name} *
                </label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder={language === 'es' ? 'Nombre y Apellidos' : 'Full Name'}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.users.email} (Google Login) *
                </label>
                <input
                  type="email"
                  required
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="usuario@gmail.com"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'es' ? 'Rol del Sistema (Principal) *' : 'System Role (Primary) *'}
                </label>
                <select
                  value={userRoleId}
                  onChange={(e) => setUserRoleId(e.target.value)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-medium"
                >
                  {(systemRoles.length > 0 ? systemRoles : roles).map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Additional Custom Roles Checklist */}
              {customRoles.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block">
                      {language === 'es' ? 'Roles Personalizados Adicionales' : 'Additional Custom Roles'}
                    </label>
                    <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                      {userCustomRoleIds.length} {language === 'es' ? 'asignados' : 'assigned'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">
                    {language === 'es'
                      ? 'Un usuario puede pertenecer a más de 1 rol simultáneamente.'
                      : 'A user can belong to more than 1 role simultaneously.'}
                  </p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {customRoles.map((cr) => {
                      const isChecked = userCustomRoleIds.includes(cr.id);
                      return (
                        <label
                          key={cr.id}
                          className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800'
                              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setUserCustomRoleIds((prev) =>
                                prev.includes(cr.id)
                                  ? prev.filter((id) => id !== cr.id)
                                  : [...prev, cr.id]
                              );
                            }}
                            className="mt-0.5 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                              {cr.name}
                            </div>
                            <div className="text-[10px] text-slate-500 line-clamp-1">{cr.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={userActive}
                    onChange={(e) => setUserActive(e.target.checked)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'es' ? 'Usuario Activo' : 'Active User'}
                  </span>
                </label>
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
                  {language === 'es' ? 'Guardar Usuario' : 'Save User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
