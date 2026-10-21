import React, { useState } from 'react';
import { CustomRole, User, PermissionKey, RolePermissions } from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Users,
  Check,
  X,
  AlertTriangle,
  UserCheck,
  Info,
  Loader2,
} from 'lucide-react';

interface RolesManagementViewProps {
  roles: CustomRole[];
  users: User[];
  language: Language;
  onSaveRole: (role: CustomRole) => void;
  onDeleteRole: (roleId: string) => { success: boolean; message?: string };
  onBulkAssignUsersToRole: (userIds: string[], roleId: string) => Promise<void> | void;
}

export const RolesManagementView: React.FC<RolesManagementViewProps> = ({
  roles,
  users,
  language,
  onSaveRole,
  onDeleteRole,
  onBulkAssignUsersToRole,
}) => {
  const t = translations[language];

  const permissionList: {
    key: PermissionKey;
    label: string;
    desc: string;
    details: string;
    scope: string;
  }[] = [
    {
      key: 'CL',
      label: 'CL',
      desc: language === 'es' ? 'CRUD Líderes' : 'CRUD Leaders',
      details:
        language === 'es'
          ? 'Permite crear, consultar, modificar y eliminar Líderes en el sistema.'
          : 'Allows creating, viewing, updating, and deleting Leaders in the system.',
      scope:
        language === 'es'
          ? 'Administración de directores de equipo y colores asignados.'
          : 'Management of team directors and assigned team colors.',
    },
    {
      key: 'CC',
      label: 'CC',
      desc: language === 'es' ? 'CRUD Coordinadores' : 'CRUD Coordinators',
      details:
        language === 'es'
          ? 'Permite crear, consultar, modificar y eliminar Coordinadores de zona.'
          : 'Allows creating, viewing, updating, and deleting Zone Coordinators.',
      scope:
        language === 'es'
          ? 'Asignación a líderes y control de coordinaciones activas.'
          : 'Assignment to leaders and active coordination management.',
    },
    {
      key: 'CD',
      label: 'CD',
      desc: language === 'es' ? 'CRUD Donantes' : 'CRUD Donors',
      details:
        language === 'es'
          ? 'Permite registrar, transferir y administrar Padrinos Donantes.'
          : 'Allows registering, transferring, and managing Donor Sponsors.',
      scope:
        language === 'es'
          ? 'Vinculación de padrinos con sus cartas apadrinadas y contacto.'
          : 'Linking sponsors with sponsored letters and communication.',
    },
    {
      key: 'CLett',
      label: 'CL',
      desc: language === 'es' ? 'CRUD Cartas' : 'CRUD Letters',
      details:
        language === 'es'
          ? 'Permite registrar cartas físicas (Fase 1), editarlas y asignarlas.'
          : 'Allows registering physical letters (Phase 1), editing, and assigning them.',
      scope:
        language === 'es'
          ? 'Folio físico, día de entrega, deseos del niño y foto adjunta.'
          : 'Physical folio, delivery event, child requests, and attached photo.',
    },
    {
      key: 'CE',
      label: 'CE',
      desc: language === 'es' ? 'CRUD Días de Entrega (Eventos)' : 'CRUD Delivery Events',
      details:
        language === 'es'
          ? 'Permite gestionar Días de Entrega, sedes, fechas y metas de regalos.'
          : 'Allows managing Delivery Days, venues, dates, and gift goals.',
      scope:
        language === 'es'
          ? 'Configuración de tipos de folio (A, B, C, X, G) y calendarios.'
          : 'Configuration of folio types (A, B, C, X, G) and schedules.',
    },
    {
      key: 'CS',
      label: 'CS',
      desc: language === 'es' ? 'Catálogo de Escuelas Primarias' : 'Elementary Schools Catalog',
      details:
        language === 'es'
          ? 'Permite administrar el catálogo de escuelas primarias participantes.'
          : 'Allows managing the catalog of participating elementary schools.',
      scope:
        language === 'es'
          ? 'Altas, bajas y modificación de escuelas primarias beneficiadas.'
          : 'Add, edit, and remove benefited primary schools.',
    },
    {
      key: 'NC',
      label: 'NC',
      desc: language === 'es' ? 'Cierre de Captura de Cartas' : 'Letters Capture Closure',
      details:
        language === 'es'
          ? 'Bloquea la edición de cartas finalizadas para proteger los datos operativos.'
          : 'Locks finalized letters to protect operational data from modifications.',
      scope:
        language === 'es'
          ? 'Las cartas cerradas se muestran en modo solo lectura.'
          : 'Closed letters are displayed in read-only mode.',
    },
    {
      key: 'RP',
      label: 'RP',
      desc: language === 'es' ? 'Reasignación de Regalos' : 'Gift Reassignment',
      details:
        language === 'es'
          ? 'Permite reasignar regalos recibidos en Acopio a cartas con necesidades.'
          : 'Allows reassigning gifts received at Collection Center to letters.',
      scope:
        language === 'es'
          ? 'Redistribución de excedentes o regalos con discrepancia de edad/género.'
          : 'Redistribution of surplus gifts or age/gender discrepancies.',
    },
    {
      key: 'SWR',
      label: 'SWR',
      desc: language === 'es' ? 'Enviar Recordatorios WhatsApp' : 'Send WhatsApp Reminders',
      details:
        language === 'es'
          ? 'Permite enviar recordatorios automáticos de fecha límite por WhatsApp.'
          : 'Allows sending automated deadline reminders via WhatsApp.',
      scope:
        language === 'es'
          ? 'Notificaciones de recolección de regalos a los padrinos asignados.'
          : 'Gift collection notifications to assigned sponsors.',
    },
    {
      key: 'SER',
      label: 'SER',
      desc: language === 'es' ? 'Enviar Recordatorios Correo' : 'Send Email Reminders',
      details:
        language === 'es'
          ? 'Permite enviar notificaciones y confirmaciones por correo electrónico.'
          : 'Allows sending notices and confirmations via email.',
      scope:
        language === 'es'
          ? 'Resumen de cartas asignadas e instrucciones de entrega a donantes.'
          : 'Summary of assigned letters and drop-off instructions to sponsors.',
    },
    {
      key: 'SCC',
      label: 'SCC',
      desc: language === 'es' ? 'Ver Columna / Filtro Coordinador' : 'View Coordinator Column / Filter',
      details:
        language === 'es'
          ? 'Controla la visibilidad de la columna y filtro de Coordinador en listas.'
          : 'Controls visibility of Coordinator column and filter across tables.',
      scope:
        language === 'es'
          ? 'Permite visualizar el coordinador asignado en vistas compartidas.'
          : 'Allows viewing assigned coordinator in shared views.',
    },
  ];

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isBulkUserModalOpen, setIsBulkUserModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);

  // Form state
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [rolePerms, setRolePerms] = useState<RolePermissions>({
    CL: false,
    CC: false,
    CD: false,
    CLett: false,
    CE: false,
    CS: false,
    NC: false,
    RP: false,
    SWR: false,
    SER: false,
    SCC: false,
  });

  // Bulk assign state
  const [targetRoleIdForBulk, setTargetRoleIdForBulk] = useState('');
  const [selectedUserIdsForBulk, setSelectedUserIdsForBulk] = useState<string[]>([]);

  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleOpenCreateRole = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDesc('');
    setRolePerms({
      CL: false,
      CC: false,
      CD: false,
      CLett: true,
      CE: false,
      CS: false,
      NC: false,
      RP: false,
      SWR: false,
      SER: false,
      SCC: false,
    });
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: CustomRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDesc(role.description);
    setRolePerms({ ...role.permissions });
    setIsRoleModalOpen(true);
  };

  const handleTogglePerm = (key: PermissionKey) => {
    setRolePerms((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleName.trim()) return;

    const newRole: CustomRole = {
      id: editingRole ? editingRole.id : `ROLE-${Date.now()}`,
      name: roleName.trim(),
      description: roleDesc.trim(),
      permissions: { ...rolePerms },
      userCount: editingRole?.userCount || 0,
    };

    onSaveRole(newRole);
    setIsRoleModalOpen(false);
    setAlertMessage({
      type: 'success',
      text: language === 'es' ? 'Rol y permisos actualizados exitosamente' : 'Role and permissions saved successfully',
    });
  };

  const handleDeleteRole = (id: string) => {
    const res = onDeleteRole(id);
    if (!res.success) {
      setAlertMessage({ type: 'error', text: res.message || 'Error al eliminar rol.' });
    } else {
      setAlertMessage({
        type: 'success',
        text: language === 'es' ? 'Rol eliminado exitosamente' : 'Role deleted successfully',
      });
    }
  };

  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const handleOpenBulkAssign = (roleId: string) => {
    setTargetRoleIdForBulk(roleId);
    // Preselect users currently with this role (system or custom)
    setSelectedUserIdsForBulk(
      users
        .filter((u) => u.roleId === roleId || u.customRoleIds?.includes(roleId))
        .map((u) => u.id)
    );
    setIsBulkUserModalOpen(true);
  };

  const handleExecuteBulkAssign = async () => {
    if (!targetRoleIdForBulk) return;
    setIsBulkSaving(true);
    try {
      await onBulkAssignUsersToRole(selectedUserIdsForBulk, targetRoleIdForBulk);
      setIsBulkUserModalOpen(false);
      setAlertMessage({
        type: 'success',
        text:
          language === 'es'
            ? 'Asignación masiva de usuarios guardada en la base de datos'
            : 'Bulk users assignment saved to database',
      });
    } catch (err) {
      console.error(err);
      setAlertMessage({
        type: 'error',
        text:
          language === 'es'
            ? 'Error al guardar asignación en la base de datos'
            : 'Error saving assignment to database',
      });
    } finally {
      setIsBulkSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            <span>{t.rolesAdmin.title}</span>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              {roles.length} {language === 'es' ? 'roles configurados' : 'configured roles'}
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.rolesAdmin.subtitle}</p>
        </div>

        <button
          onClick={handleOpenCreateRole}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t.rolesAdmin.newRole}</span>
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

      {/* Roles & Permissions Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Permission Tooltip Hint Banner */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-indigo-50/60 dark:bg-indigo-950/40 border-b border-indigo-100 dark:border-indigo-900/50 text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">
          <Info className="w-3.5 h-3.5 shrink-0 text-indigo-500" />
          <span>
            {language === 'es'
              ? 'Pasa el cursor sobre los encabezados de permisos (CL, CC, CD...) para ver el detalle y alcance de cada uno.'
              : 'Hover over permission column headers (CL, CC, CD...) to view details and scope of each permission.'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px]">
                <th className="p-3">{language === 'es' ? 'Rol' : 'Role'}</th>
                <th className="p-3 text-center">{language === 'es' ? 'Usuarios' : 'Users'}</th>
                {permissionList.map((p, idx) => {
                  const isNearEnd = idx >= permissionList.length - 3;
                  return (
                    <th
                      key={p.key}
                      className="p-2 text-center relative group select-none"
                      title={`${p.label} - ${p.desc}: ${p.details}`}
                    >
                      <button
                        type="button"
                        className="inline-flex items-center justify-center px-1.5 py-0.5 rounded hover:bg-indigo-50 dark:hover:bg-slate-700 transition-colors cursor-help focus:outline-hidden"
                      >
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300 border-b border-dotted border-slate-400 group-hover:border-indigo-600 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {p.label}
                        </span>
                      </button>

                      {/* Floating Rich Tooltip */}
                      <div
                        className={`absolute top-full ${
                          isNearEnd ? 'right-0' : 'left-1/2 -translate-x-1/2'
                        } mt-1 hidden group-hover:flex group-focus-within:flex flex-col z-50 w-56 p-3 bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 rounded-xl shadow-2xl pointer-events-none text-left normal-case tracking-normal`}
                      >
                        {/* Tooltip Arrow */}
                        <div
                          className={`absolute -top-1 ${
                            isNearEnd ? 'right-4' : 'left-1/2 -translate-x-1/2'
                          } w-2.5 h-2.5 bg-slate-900 dark:bg-slate-800 border-t border-l border-slate-700 rotate-45`}
                        />

                        <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5 mb-1.5">
                          <span className="font-mono font-black text-indigo-400 text-xs bg-indigo-950/90 px-1.5 py-0.5 rounded border border-indigo-800">
                            {p.key}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            {language === 'es' ? 'Permiso' : 'Permission'}
                          </span>
                        </div>

                        <div className="font-bold text-white text-xs leading-snug mb-1">
                          {p.desc}
                        </div>

                        <div className="text-[11px] text-slate-300 leading-relaxed mb-2">
                          {p.details}
                        </div>

                        <div className="text-[10px] text-indigo-200 bg-indigo-950/40 p-1.5 rounded-lg border border-indigo-900/50 leading-tight">
                          <span className="font-semibold text-indigo-300 block mb-0.5">
                            {language === 'es' ? 'Alcance:' : 'Scope:'}
                          </span>
                          {p.scope}
                        </div>
                      </div>
                    </th>
                  );
                })}
                <th className="p-3 text-right">{language === 'es' ? 'Acciones' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {roles.map((role) => {
                const assignedUsers = users.filter((u) => u.roleId === role.id || u.customRoleIds?.includes(role.id));

                return (
                  <tr key={role.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-white">{role.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{role.description}</div>
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleOpenBulkAssign(role.id)}
                        className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                        title={language === 'es' ? 'Asignar o desasignar usuarios en bloque' : 'Bulk assign/unassign users'}
                      >
                        <Users className="w-3 h-3" />
                        <span>{assignedUsers.length}</span>
                      </button>
                    </td>

                    {/* Permission status columns */}
                    {permissionList.map((p) => {
                      const hasPerm = role.permissions[p.key];
                      return (
                        <td key={p.key} className="p-2 text-center font-mono">
                          {hasPerm ? (
                            <span className="inline-block w-5 h-5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold leading-5">
                              Y
                            </span>
                          ) : (
                            <span className="inline-block w-5 h-5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 leading-5">
                              N
                            </span>
                          )}
                        </td>
                      );
                    })}

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEditRole(role)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={language === 'es' ? 'Editar rol y permisos' : 'Edit role and permissions'}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={language === 'es' ? 'Eliminar rol (bloqueado si tiene usuarios asignados)' : 'Delete role (locked if users assigned)'}
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

      {/* Modal: Create/Edit Role */}
      {isRoleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingRole ? (language === 'es' ? 'Editar Rol y Permisos' : 'Edit Role & Permissions') : t.rolesAdmin.newRole}
              </h3>
              <button onClick={() => setIsRoleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRoleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {t.rolesAdmin.roleName} *
                </label>
                <input
                  type="text"
                  required
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  placeholder="Ej. Coordinador de Zona, Super Admin"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'es' ? 'Descripción' : 'Description'}
                </label>
                <input
                  type="text"
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  placeholder={
                    language === 'es'
                      ? 'Responsabilidades de este rol...'
                      : 'Responsibilities of this role...'
                  }
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {/* Checkboxes matrix */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  {language === 'es'
                    ? 'Permisos Concedidos al Rol (11 Permisos RBAC):'
                    : 'Granted Permissions to Role (11 RBAC Permissions):'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                  {permissionList.map((p) => {
                    const isChecked = rolePerms[p.key];
                    return (
                      <label
                        key={p.key}
                        className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePerm(p.key)}
                          className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <div>
                          <span className="font-bold font-mono text-slate-900 dark:text-white block">
                            {p.label}
                          </span>
                          <span className="text-[11px] text-slate-600 dark:text-slate-400">
                            {p.desc}
                          </span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRoleModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs"
                >
                  {language === 'es' ? 'Guardar Rol' : 'Save Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Bulk Assign Users to Role */}
      {isBulkUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'es' ? 'Asignación Masiva de Usuarios' : 'Bulk User Assignment'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'es'
                    ? 'Selecciona qué usuarios pertenecerán a este rol.'
                    : 'Select which users will belong to this role.'}
                </p>
              </div>
              <button
                disabled={isBulkSaving}
                onClick={() => setIsBulkUserModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {targetRoleIdForBulk && (
              <div className="flex items-center justify-between bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/70 p-3 rounded-xl text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-indigo-500 tracking-wider block">
                    {language === 'es' ? 'Rol a Asignar' : 'Role to Assign'}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">
                    {roles.find((r) => r.id === targetRoleIdForBulk)?.name}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">
                    {language === 'es' ? 'Seleccionados' : 'Selected'}
                  </span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                    {selectedUserIdsForBulk.length} / {users.length}
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-72 overflow-y-auto text-xs pr-1">
              {users.map((u) => {
                const isSelected = selectedUserIdsForBulk.includes(u.id);

                return (
                  <label
                    key={u.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-300 dark:border-indigo-800'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        disabled={isBulkSaving}
                        checked={isSelected}
                        onChange={() => {
                          setSelectedUserIdsForBulk((prev) =>
                            prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                          );
                        }}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 dark:text-white truncate">{u.name}</div>
                        <div className="text-[11px] text-slate-500 truncate">{u.email}</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        {u.roleName}
                      </span>
                      {u.customRoleIds && u.customRoleIds.length > 0 && (
                        <div className="flex flex-wrap gap-1 justify-end max-w-[140px]">
                          {u.customRoleIds.map((cid) => {
                            const r = roles.find((rol) => rol.id === cid);
                            if (!r) return null;
                            return (
                              <span
                                key={cid}
                                className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              >
                                {r.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
              <button
                type="button"
                disabled={isBulkSaving}
                onClick={() => setSelectedUserIdsForBulk(users.map((u) => u.id))}
                className="hover:text-indigo-600 font-medium transition-colors disabled:opacity-50"
              >
                {language === 'es' ? 'Seleccionar todos' : 'Select all'}
              </button>
              <button
                type="button"
                disabled={isBulkSaving}
                onClick={() => setSelectedUserIdsForBulk([])}
                className="hover:text-indigo-600 font-medium transition-colors disabled:opacity-50"
              >
                {language === 'es' ? 'Deseleccionar todos' : 'Deselect all'}
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                disabled={isBulkSaving}
                onClick={() => setIsBulkUserModalOpen(false)}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
              >
                {language === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isBulkSaving}
                onClick={handleExecuteBulkAssign}
                className="px-4 py-2 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs flex items-center gap-1.5"
              >
                {isBulkSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{language === 'es' ? 'Aplicar Asignación' : 'Apply Assignment'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
