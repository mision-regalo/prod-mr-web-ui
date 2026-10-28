import React, { useState, useEffect, useMemo } from 'react';
import { Leader, Coordinator, Donor, Letter, Role, SchoolCatalogItem, User, RolePermissions } from '../../types';
import { Language, translations } from '../../i18n/translations';
import { PERMISSIONS_TABLE } from '../../data/mockData';
import {
  Users,
  UserCheck,
  HeartHandshake,
  Plus,
  Trash2,
  ArrowRightLeft,
  Phone,
  Mail,
  AlertTriangle,
  X,
  Check,
  ShieldCheck,
  School,
  Sparkles,
  Pencil,
  Search,
} from 'lucide-react';

interface VolunteersViewProps {
  leaders: Leader[];
  coordinators: Coordinator[];
  donors: Donor[];
  letters: Letter[];
  schools: SchoolCatalogItem[];
  permissions?: RolePermissions;
  currentUser?: User;
  currentRole: Role;
  language: Language;
  onSaveLeader: (leader: Leader) => void;
  onDeleteLeader: (leaderId: string) => { success: boolean; message?: string };
  onSaveCoordinator: (coordinator: Coordinator) => void;
  onDeleteCoordinator: (coordId: string) => { success: boolean; message?: string };
  onSaveDonor: (donor: Donor) => void;
  onDeleteDonor: (donorId: string) => { success: boolean; message?: string };
  onTransferDonor: (donorId: string, newCoordinatorId: string) => void;
  onUpdateDonorLetters?: (donorId: string, updatedLetterIds: string[]) => void;
}

// Computes the next sequential numeric suffix for a given ID prefix (e.g. "LDR-04") from the
// highest number currently in use, instead of array length. Using array length breaks as soon
// as records are deleted out of order (or all at once): the length-based ID can collide with an
// ID still in use, silently overwriting it on save instead of creating a new record.
function getNextSequentialNumber(items: { id: string }[], prefix: string): number {
  const regex = new RegExp(`^${prefix}-(\\d+)$`);
  const existingNums = items
    .map((item) => {
      const match = item.id.match(regex);
      return match ? Number(match[1]) : NaN;
    })
    .filter((n) => !isNaN(n));
  return existingNums.length === 0 ? 1 : Math.max(...existingNums) + 1;
}

export const VolunteersView: React.FC<VolunteersViewProps> = ({
  leaders,
  coordinators,
  donors,
  letters,
  schools,
  permissions: permissionsProp,
  currentUser,
  currentRole,
  language,
  onSaveLeader,
  onDeleteLeader,
  onSaveCoordinator,
  onDeleteCoordinator,
  onSaveDonor,
  onDeleteDonor,
  onTransferDonor,
  onUpdateDonorLetters,
}) => {
  const t = translations[language];
  const permissions = permissionsProp || (currentUser?.roleName && PERMISSIONS_TABLE[currentUser.roleName as keyof typeof PERMISSIONS_TABLE]) || PERMISSIONS_TABLE.Admin;
  const roleNormalized = (currentUser?.roleName || currentRole || '').toLowerCase();
  const isCoordinator = roleNormalized === 'coordinator' || roleNormalized === 'coordinador';
  const isLeader = roleNormalized === 'leader' || roleNormalized === 'lider';

  const myLeader = useMemo(() => {
    if (!currentUser || !isLeader) return null;
    const userEmail = (currentUser.email || '').trim().toLowerCase();
    const userName = (currentUser.name || '').trim().toLowerCase();
    return leaders.find(
      (l) =>
        (currentUser.assignedLeaderId && l.id === currentUser.assignedLeaderId) ||
        (userEmail && l.email.trim().toLowerCase() === userEmail) ||
        (userName && `${l.firstName} ${l.lastName}`.trim().toLowerCase() === userName)
    ) || null;
  }, [currentUser, isLeader, leaders]);

  const myCoord = useMemo(() => {
    if (!currentUser || !isCoordinator) return null;
    const userEmail = (currentUser.email || '').trim().toLowerCase();
    const userName = (currentUser.name || '').trim().toLowerCase();
    return coordinators.find(
      (c) =>
        (currentUser.assignedCoordinatorId && c.id === currentUser.assignedCoordinatorId) ||
        (userEmail && c.email.trim().toLowerCase() === userEmail) ||
        (userName && `${c.firstName} ${c.lastName}`.trim().toLowerCase() === userName)
    ) || null;
  }, [currentUser, isCoordinator, coordinators]);

  // Admin Coordinator filter states
  const [coordSearch, setCoordSearch] = useState('');
  const [coordLeaderFilter, setCoordLeaderFilter] = useState('');
  const [coordLettersFilter, setCoordLettersFilter] = useState<'all' | 'with-letters' | 'no-letters'>('all');

  // Donors visible based on logged-in user:
  // - Coordinator: only his sponsors (donors where d.coordinatorId matches coordinator)
  // - Leader: only donors assigned to his coordinators
  // - Admin: can see all
  const visibleDonors = useMemo(() => {
    if (!currentUser) return donors;

    const userRoleLower = (currentUser.roleName || currentRole).toLowerCase();

    if (userRoleLower === 'coordinator') {
      const userEmail = (currentUser.email || '').trim().toLowerCase();
      const userName = (currentUser.name || '').trim().toLowerCase();
      const myCoord =
        coordinators.find(
          (c) =>
            (currentUser.assignedCoordinatorId && c.id === currentUser.assignedCoordinatorId) ||
            (userEmail && c.email.trim().toLowerCase() === userEmail) ||
            (userName && `${c.firstName} ${c.lastName}`.trim().toLowerCase() === userName)
        ) || null;
      const myCoordId = myCoord?.id || currentUser.assignedCoordinatorId;
      if (!myCoordId) return donors;

      return donors.filter(
        (d) =>
          d.coordinatorId === myCoordId ||
          (myCoord &&
            d.coordinatorName &&
            d.coordinatorName.trim().toLowerCase() ===
              `${myCoord.firstName} ${myCoord.lastName}`.trim().toLowerCase())
      );
    }

    if (userRoleLower === 'leader') {
      const userEmail = (currentUser.email || '').trim().toLowerCase();
      const userName = (currentUser.name || '').trim().toLowerCase();
      const myLeader =
        leaders.find(
          (l) =>
            (currentUser.assignedLeaderId && l.id === currentUser.assignedLeaderId) ||
            (userEmail && l.email.trim().toLowerCase() === userEmail) ||
            (userName && `${l.firstName} ${l.lastName}`.trim().toLowerCase() === userName)
        ) || null;
      const myLeaderId = myLeader?.id || currentUser.assignedLeaderId;
      if (!myLeaderId) return donors;

      const myCoordinators = coordinators.filter((c) => c.leaderId === myLeaderId);
      const myCoordIds = new Set(myCoordinators.map((c) => c.id));
      const myCoordNames = new Set(
        myCoordinators.map((c) => `${c.firstName} ${c.lastName}`.trim().toLowerCase())
      );

      return donors.filter(
        (d) =>
          (d.coordinatorId && myCoordIds.has(d.coordinatorId)) ||
          (d.coordinatorName && myCoordNames.has(d.coordinatorName.trim().toLowerCase()))
      );
    }

    return donors;
  }, [donors, currentUser, currentRole, coordinators, leaders]);

  // Coordinators visible based on logged-in user:
  // - Leader: ONLY coordinators under this leader's umbrella
  // - Admin: all coordinators, with filtering options
  // - Coordinator: none (tab hidden)
  const visibleCoordinators = useMemo(() => {
    if (!currentUser) return coordinators;

    const userRoleLower = (currentUser.roleName || currentRole).toLowerCase();

    if (userRoleLower === 'coordinator') {
      return [];
    }

    if (userRoleLower === 'leader') {
      const userEmail = (currentUser.email || '').trim().toLowerCase();
      const userName = (currentUser.name || '').trim().toLowerCase();
      const myLeader =
        leaders.find(
          (l) =>
            (currentUser.assignedLeaderId && l.id === currentUser.assignedLeaderId) ||
            (userEmail && l.email.trim().toLowerCase() === userEmail) ||
            (userName && `${l.firstName} ${l.lastName}`.trim().toLowerCase() === userName)
        ) || null;
      const myLeaderId = myLeader?.id || currentUser.assignedLeaderId;
      if (!myLeaderId) return coordinators;

      return coordinators.filter((c) => c.leaderId === myLeaderId);
    }

    // Admin role: apply filters
    return coordinators.filter((c) => {
      if (coordLeaderFilter && c.leaderId !== coordLeaderFilter) {
        return false;
      }

      if (coordSearch.trim()) {
        const q = coordSearch.toLowerCase().trim();
        const matches =
          c.id.toLowerCase().includes(q) ||
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.whatsapp.includes(q) ||
          c.leaderName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      if (coordLettersFilter !== 'all') {
        const assignedLetters = letters.filter((l) => l.coordinatorId === c.id).length;
        if (coordLettersFilter === 'with-letters' && assignedLetters === 0) return false;
        if (coordLettersFilter === 'no-letters' && assignedLetters > 0) return false;
      }

      return true;
    });
  }, [
    coordinators,
    currentUser,
    currentRole,
    leaders,
    letters,
    coordSearch,
    coordLeaderFilter,
    coordLettersFilter,
  ]);

  // Active tab: 'leaders' | 'coordinators' | 'donors'
  const [activeTab, setActiveTab] = useState<'leaders' | 'coordinators' | 'donors'>(
    currentRole === 'Coordinator' ? 'donors' : currentRole === 'Leader' ? 'coordinators' : 'leaders'
  );

  // For Coordinator role, ensure activeTab stays on donors
  useEffect(() => {
    if (currentRole === 'Coordinator' && activeTab !== 'donors') {
      setActiveTab('donors');
    }
  }, [currentRole, activeTab]);

  // Feedback message / error alert
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Modals
  const [isLeaderModalOpen, setIsLeaderModalOpen] = useState(false);
  const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);
  const [isDonorModalOpen, setIsDonorModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedDonorForTransfer, setSelectedDonorForTransfer] = useState<Donor | null>(null);
  const [newCoordinatorId, setNewCoordinatorId] = useState('');

  // Form states
  const [leadFirstName, setLeadFirstName] = useState('');
  const [leadLastName, setLeadLastName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadWhatsapp, setLeadWhatsapp] = useState('');
  const [leadColor, setLeadColor] = useState('Azul Real');

  const [coordFirstName, setCoordFirstName] = useState('');
  const [coordLastName, setCoordLastName] = useState('');
  const [coordEmail, setCoordEmail] = useState('');
  const [coordWhatsapp, setCoordWhatsapp] = useState('');
  const [coordSchool, setCoordSchool] = useState('');
  const [coordGrade, setCoordGrade] = useState('');
  const [coordLeaderId, setCoordLeaderId] = useState(leaders[0]?.id || '');

  const [donorFirstName, setDonorFirstName] = useState('');
  const [donorLastName, setDonorLastName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorWhatsapp, setDonorWhatsapp] = useState('');
  const [donorCoordId, setDonorCoordId] = useState(coordinators[0]?.id || '');
  const [donorRelationship, setDonorRelationship] = useState('Amigo / Conocido');

  // Deletion Handlers with Business Constraint Feedback
  const handleDeleteLeader = (id: string) => {
    const res = onDeleteLeader(id);
    if (!res.success) {
      setAlertMessage({ type: 'error', text: res.message || 'Error al eliminar líder.' });
    } else {
      setAlertMessage({ type: 'success', text: 'Líder eliminado correctamente.' });
    }
  };

  const handleDeleteCoordinator = (id: string) => {
    const res = onDeleteCoordinator(id);
    if (!res.success) {
      setAlertMessage({ type: 'error', text: res.message || 'Error al eliminar coordinador.' });
    } else {
      setAlertMessage({ type: 'success', text: 'Coordinador eliminado correctamente.' });
    }
  };

  const handleDeleteDonor = (id: string) => {
    const res = onDeleteDonor(id);
    if (!res.success) {
      setAlertMessage({ type: 'error', text: res.message || 'Error al eliminar donante.' });
    } else {
      setAlertMessage({ type: 'success', text: 'Donante eliminado correctamente.' });
    }
  };

  // Create Leader
  const handleCreateLeader = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = leadEmail.trim().toLowerCase();
    const isGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail);
    if (!isGmail) {
      setAlertMessage({
        type: 'error',
        text:
          language === 'es'
            ? 'El correo del líder debe ser una cuenta @gmail.com válida (ejemplo: usuario@gmail.com).'
            : 'Leader email must be a valid @gmail.com account (e.g. user@gmail.com).',
      });
      return;
    }

    const nextIdNum = getNextSequentialNumber(leaders, 'LDR');
    const newL: Leader = {
      id: `LDR-${String(nextIdNum).padStart(2, '0')}`,
      firstName: leadFirstName.trim(),
      lastName: leadLastName.trim(),
      email: cleanEmail,
      whatsapp: leadWhatsapp.trim(),
      teamColor: leadColor.trim(),
      teamCode: String.fromCharCode(65 + nextIdNum - 1),
      coordinatorCount: 0,
    };
    onSaveLeader(newL);
    setIsLeaderModalOpen(false);
    setLeadFirstName('');
    setLeadLastName('');
    setLeadEmail('');
    setLeadWhatsapp('');
    setAlertMessage({
      type: 'success',
      text:
        language === 'es'
          ? `Líder registrado exitosamente y usuario creado en sistema con rol "Leader" (${cleanEmail}).`
          : `Leader registered successfully and system user created with "Leader" role (${cleanEmail}).`,
    });
  };

  // Create Coordinator
  const handleCreateCoordinator = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = coordEmail.trim().toLowerCase();
    const isGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail);
    if (!isGmail) {
      setAlertMessage({
        type: 'error',
        text:
          language === 'es'
            ? 'El correo del coordinador debe ser una cuenta @gmail.com válida (ejemplo: usuario@gmail.com).'
            : 'Coordinator email must be a valid @gmail.com account (e.g. user@gmail.com).',
      });
      return;
    }

    const parentLeader = leaders.find((l) => l.id === coordLeaderId);
    const nextIdNum = getNextSequentialNumber(coordinators, 'CRD');
    const newC: Coordinator = {
      id: `CRD-${String(nextIdNum).padStart(2, '0')}`,
      firstName: coordFirstName.trim(),
      lastName: coordLastName.trim(),
      email: cleanEmail,
      whatsapp: coordWhatsapp.trim(),
      school: coordSchool.trim() || (language === 'es' ? 'No especificada' : 'Unspecified'),
      grade: coordGrade.trim() || (language === 'es' ? 'En curso' : 'Current'),
      leaderId: coordLeaderId,
      leaderName: parentLeader ? `${parentLeader.firstName} ${parentLeader.lastName} (${parentLeader.teamColor})` : 'Líder',
      lettersAssignedCount: 0,
    };
    onSaveCoordinator(newC);
    setIsCoordModalOpen(false);
    setCoordFirstName('');
    setCoordLastName('');
    setCoordEmail('');
    setCoordWhatsapp('');
    setCoordSchool('');
    setCoordGrade('');
    setAlertMessage({
      type: 'success',
      text:
        language === 'es'
          ? `Coordinador registrado exitosamente y usuario creado en sistema con rol "Coordinator" (${cleanEmail}).`
          : `Coordinator registered successfully and system user created with "Coordinator" role (${cleanEmail}).`,
    });
  };

  // Create Donor
  const handleCreateDonor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorWhatsapp.trim()) {
      setAlertMessage({ type: 'error', text: 'El número de WhatsApp es obligatorio.' });
      return;
    }
    if (!/^\+?[0-9\s-]{7,20}$/.test(donorWhatsapp.trim())) {
      console.log('[Debug] Validation failed: invalid format');
      setAlertMessage({
        type: 'error',
        text: language === 'es' 
          ? 'El número de WhatsApp no es válido. Debe contener solo números, +, espacios o guiones.' 
          : 'Invalid WhatsApp number. Only numbers, +, spaces, or hyphens allowed.'
      });
      return;
    }
    const parentCoord = coordinators.find((c) => c.id === donorCoordId);
    const nextIdNum = getNextSequentialNumber(donors, 'DNR');
    const newD: Donor = {
      id: `DNR-${String(nextIdNum).padStart(2, '0')}`,
      firstName: donorFirstName,
      lastName: donorLastName,
      email: donorEmail,
      whatsapp: donorWhatsapp.trim(),
      coordinatorId: donorCoordId,
      coordinatorName: parentCoord ? `${parentCoord.firstName} ${parentCoord.lastName}` : 'Coordinador',
      coordinatorRelationship: donorRelationship,
      assignedLetterIds: [],
    };
    onSaveDonor(newD);
    setIsDonorModalOpen(false); // Enable closing modal automatically
    setDonorFirstName('');
    setDonorLastName('');
    setDonorEmail('');
    setDonorWhatsapp('');
    setAlertMessage({ type: 'success', text: 'Padrino donante registrado exitosamente.' });
  };

  // Execute Transfer
  const handleExecuteTransfer = () => {
    if (!selectedDonorForTransfer || !newCoordinatorId) return;
    onTransferDonor(selectedDonorForTransfer.id, newCoordinatorId);
    setIsTransferModalOpen(false);
    setSelectedDonorForTransfer(null);
    setNewCoordinatorId('');
    setAlertMessage({ type: 'success', text: 'Padrino transferido exitosamente entre coordinadores.' });
  };

  // Editing states
  const [editingLeader, setEditingLeader] = useState<Leader | null>(null);
  const [editLeadFirstName, setEditLeadFirstName] = useState('');
  const [editLeadLastName, setEditLeadLastName] = useState('');
  const [editLeadEmail, setEditLeadEmail] = useState('');
  const [editLeadWhatsapp, setEditLeadWhatsapp] = useState('');
  const [editLeadColor, setEditLeadColor] = useState('');

  const [editingCoordinator, setEditingCoordinator] = useState<Coordinator | null>(null);
  const [editCoordFirstName, setEditCoordFirstName] = useState('');
  const [editCoordLastName, setEditCoordLastName] = useState('');
  const [editCoordEmail, setEditCoordEmail] = useState('');
  const [editCoordWhatsapp, setEditCoordWhatsapp] = useState('');
  const [editCoordSchool, setEditCoordSchool] = useState('');
  const [editCoordGrade, setEditCoordGrade] = useState('');
  const [editCoordLeaderId, setEditCoordLeaderId] = useState('');

  const [isDonorReadOnlyLettersOnly, setIsDonorReadOnlyLettersOnly] = useState(false);
  const [editingDonor, setEditingDonor] = useState<Donor | null>(null);
  const [editDonorFirstName, setEditDonorFirstName] = useState('');
  const [editDonorLastName, setEditDonorLastName] = useState('');
  const [editDonorEmail, setEditDonorEmail] = useState('');
  const [editDonorWhatsapp, setEditDonorWhatsapp] = useState('');
  const [editDonorCoordId, setEditDonorCoordId] = useState('');
  const [editDonorRelationship, setEditDonorRelationship] = useState('');
  const [editDonorAssignedLetterIds, setEditDonorAssignedLetterIds] = useState<string[]>([]);
  const [isAssignLetterPickerOpen, setIsAssignLetterPickerOpen] = useState(false);
  const [letterSearchQuery, setLetterSearchQuery] = useState('');

  // Handlers to open edit modals
  const handleOpenEditLeader = (lead: Leader) => {
    setEditingLeader(lead);
    setEditLeadFirstName(lead.firstName);
    setEditLeadLastName(lead.lastName);
    setEditLeadEmail(lead.email);
    setEditLeadWhatsapp(lead.whatsapp);
    setEditLeadColor(lead.teamColor);
    setAlertMessage(null);
  };

  const handleOpenEditCoordinator = (c: Coordinator) => {
    setEditingCoordinator(c);
    setEditCoordFirstName(c.firstName);
    setEditCoordLastName(c.lastName);
    setEditCoordEmail(c.email);
    setEditCoordWhatsapp(c.whatsapp);
    setEditCoordSchool(c.school || '');
    setEditCoordGrade(c.grade || '');
    setEditCoordLeaderId(c.leaderId);
    setAlertMessage(null);
  };

  const handleOpenEditDonor = (d: Donor, lettersOnly = false) => {
    setEditingDonor(d);
    setIsDonorReadOnlyLettersOnly(lettersOnly);
    setEditDonorFirstName(d.firstName);
    setEditDonorLastName(d.lastName);
    setEditDonorEmail(d.email);
    setEditDonorWhatsapp(d.whatsapp);
    setEditDonorCoordId(d.coordinatorId);
    setEditDonorRelationship(d.coordinatorRelationship || 'Amigo / Conocido');

    // Aggregate assigned letters: both from d.assignedLetterIds and letters with l.donorId === d.id
    const currentLinked = Array.from(
      new Set([
        ...(d.assignedLetterIds || []),
        ...letters.filter((l) => l.donorId === d.id).map((l) => l.id),
      ])
    );
    setEditDonorAssignedLetterIds(currentLinked);
    setIsAssignLetterPickerOpen(lettersOnly);
    setLetterSearchQuery('');
    setAlertMessage(null);
  };

  // Save edited Leader
  const handleSaveEditedLeader = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLeader) return;

    const cleanEmail = editLeadEmail.trim().toLowerCase();
    const isGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail);
    if (!isGmail) {
      setAlertMessage({
        type: 'error',
        text:
          language === 'es'
            ? 'El correo del líder debe ser una cuenta @gmail.com válida (ejemplo: usuario@gmail.com).'
            : 'Leader email must be a valid @gmail.com account (e.g. user@gmail.com).',
      });
      return;
    }

    const updatedLeader: Leader = {
      ...editingLeader,
      firstName: editLeadFirstName.trim(),
      lastName: editLeadLastName.trim(),
      email: cleanEmail,
      whatsapp: editLeadWhatsapp.trim(),
      teamColor: editLeadColor.trim(),
    };

    onSaveLeader(updatedLeader);
    setEditingLeader(null);
    setAlertMessage({
      type: 'success',
      text:
        language === 'es'
          ? `Líder "${updatedLeader.firstName} ${updatedLeader.lastName}" actualizado exitosamente.`
          : `Leader "${updatedLeader.firstName} ${updatedLeader.lastName}" updated successfully.`,
    });
  };

  // Save edited Coordinator
  const handleSaveEditedCoordinator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoordinator) return;

    const cleanEmail = editCoordEmail.trim().toLowerCase();
    const isGmail = /^[a-zA-Z0-9._%+-]+@gmail\.com$/i.test(cleanEmail);
    if (!isGmail) {
      setAlertMessage({
        type: 'error',
        text:
          language === 'es'
            ? 'El correo del coordinador debe ser una cuenta @gmail.com válida (ejemplo: usuario@gmail.com).'
            : 'Coordinator email must be a valid @gmail.com account (e.g. user@gmail.com).',
      });
      return;
    }

    const parentLeader = leaders.find((l) => l.id === editCoordLeaderId);
    const updatedCoord: Coordinator = {
      ...editingCoordinator,
      firstName: editCoordFirstName.trim(),
      lastName: editCoordLastName.trim(),
      email: cleanEmail,
      whatsapp: editCoordWhatsapp.trim(),
      school: editCoordSchool.trim() || (language === 'es' ? 'No especificada' : 'Unspecified'),
      grade: editCoordGrade.trim() || (language === 'es' ? 'En curso' : 'Current'),
      leaderId: editCoordLeaderId,
      leaderName: parentLeader
        ? `${parentLeader.firstName} ${parentLeader.lastName} (${parentLeader.teamColor})`
        : editingCoordinator.leaderName,
    };

    onSaveCoordinator(updatedCoord);
    setEditingCoordinator(null);
    setAlertMessage({
      type: 'success',
      text:
        language === 'es'
          ? `Coordinador "${updatedCoord.firstName} ${updatedCoord.lastName}" actualizado exitosamente.`
          : `Coordinator "${updatedCoord.firstName} ${updatedCoord.lastName}" updated successfully.`,
    });
  };

  // Save edited Donor
  const handleSaveEditedDonor = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();

    /* //debug
    setAlertMessage({
      type: 'success',
      text: 'Debug: handleSaveEditedDonor: after e.preventDefault()'
    });
    */

    if (!editingDonor) return;
    
    /*
    setAlertMessage({
      type: 'success',
      text: 'Debug: handleSaveEditedDonor: after !editingDonor editingDonor:' + JSON.stringify(editingDonor)
    }); 
    return;
    */

    if (!editDonorWhatsapp.trim()) {
      setAlertMessage({ type: 'error', text: 'El número de WhatsApp es obligatorio.' });
      return;
    }
    if (!/^\+?[0-9\s-]{7,20}$/.test(editDonorWhatsapp.trim())) {
      setAlertMessage({
        type: 'error',
        text: language === 'es' 
          ? 'El número de WhatsApp no es válido. Debe contener solo números, +, espacios o guiones.' 
          : 'Invalid WhatsApp number. Only numbers, +, spaces, or hyphens allowed.'
      });
      return;
    } 

    const parentCoord = coordinators.find((c) => c.id === editDonorCoordId);
    const updatedDonor: Donor = {
      ...editingDonor,
      firstName: editDonorFirstName.trim(),
      lastName: editDonorLastName.trim(),
      email: editDonorEmail.trim(),
      whatsapp: editDonorWhatsapp.trim(),
      coordinatorId: editDonorCoordId,
      coordinatorName: parentCoord
        ? `${parentCoord.firstName} ${parentCoord.lastName}`
        : editingDonor.coordinatorName,
      coordinatorRelationship: editDonorRelationship.trim(),
      assignedLetterIds: editDonorAssignedLetterIds,
    };

    if (onUpdateDonorLetters) {
      onUpdateDonorLetters(updatedDonor.id, editDonorAssignedLetterIds);
    }

    onSaveDonor(updatedDonor);

    setEditingDonor(null); // Close modal automatically
    return;  
  };

  // Donor Letters helper actions
  const handleAddLetterToDonor = (letterId: string) => {
    if (!editDonorAssignedLetterIds.includes(letterId)) {
      setEditDonorAssignedLetterIds((prev) => [...prev, letterId]);
    }
  };

  const handleRemoveLetterFromDonor = (letterId: string) => {
    setEditDonorAssignedLetterIds((prev) => prev.filter((id) => id !== letterId));
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {currentRole === 'Coordinator'
                ? (language === 'es' ? 'Padrinos Donantes' : 'Donor Sponsors')
                : (language === 'es' ? 'Voluntarios, Líderes y Donantes' : 'Volunteers, Leaders & Donors')}
            </h1>
            <p className="text-xs text-slate-500">
              {currentRole === 'Coordinator'
                ? (language === 'es'
                    ? 'Gestión de padrinos donantes vinculados a la misión.'
                    : 'Management of donor sponsors linked to the mission.')
                : (language === 'es'
                    ? 'Estructura organizativa: Líderes (150 cartas) ➔ Coordinadores (10-15 cartas) ➔ Donantes (Cartas individuales).'
                    : 'Organizational hierarchy: Leaders (150 letters) ➔ Coordinators (10-15 letters) ➔ Donors (Individual letters).')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'leaders' && permissions.CL && currentRole !== 'Coordinator' && (
              <button
                onClick={() => {
                  setAlertMessage(null);
                  setIsLeaderModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'es' ? 'Registrar Líder' : 'Register Leader'}</span>
              </button>
            )}

            {activeTab === 'coordinators' && permissions.CC && currentRole !== 'Coordinator' && (
              <button
                onClick={() => {
                  setAlertMessage(null);
                  setIsCoordModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'es' ? 'Registrar Coordinador' : 'Register Coordinator'}</span>
              </button>
            )}

            {activeTab === 'donors' && permissions.CD && (
              <button
                onClick={() => {
                  if (isCoordinator && myCoord) setDonorCoordId(myCoord.id);
                  else if (!isCoordinator) setDonorCoordId(coordinators[0]?.id || '');
                  setAlertMessage(null);
                  setIsDonorModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'es' ? 'Registrar Donante' : 'Register Donor'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Controls (Vuetify v-tabs) */}
        <div className="flex border-b border-slate-200 text-xs font-medium">
          {currentRole !== 'Coordinator' && currentRole !== 'Leader' && (
            <button
              onClick={() => {
                setActiveTab('leaders');
                setAlertMessage(null);
              }}
              className={`py-2 px-4 border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'leaders'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              <span>
                {language === 'es' ? 'Líderes de Equipo' : 'Team Leaders'} ({leaders.length})
              </span>
            </button>
          )}

          {currentRole !== 'Coordinator' && (
            <button
              onClick={() => {
                setActiveTab('coordinators');
                setAlertMessage(null);
              }}
              className={`py-2 px-4 border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'coordinators'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>
                {language === 'es' ? 'Coordinadores' : 'Coordinators'} ({visibleCoordinators.length})
              </span>
            </button>
          )}

          <button
            onClick={() => {
              setActiveTab('donors');
              setAlertMessage(null);
            }}
            className={`py-2 px-4 border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'donors'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>
              {language === 'es' ? 'Padrinos Donantes' : 'Donor Sponsors'} ({visibleDonors.length})
            </span>
          </button>
        </div>
      </div>

      {/* Alert Notification - Main View */}
      {/* (Removed from here, moved into modals) */}

      {/* TAB 1: LEADERS */}
      {activeTab === 'leaders' && currentRole !== 'Coordinator' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3">{language === 'es' ? 'ID / Equipo' : 'ID / Team'}</th>
                  <th className="p-3">{language === 'es' ? 'Nombre del Líder' : 'Leader Name'}</th>
                  <th className="p-3">{language === 'es' ? 'Color de Equipo' : 'Team Color'}</th>
                  <th className="p-3">WhatsApp</th>
                  <th className="p-3">Email</th>
                  <th className="p-3 text-center">{language === 'es' ? 'Coordinadores Asignados' : 'Assigned Coordinators'}</th>
                  <th className="p-3 text-right">{language === 'es' ? 'Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leaders.map((lead) => {
                  const assignedCoords = coordinators.filter((c) => c.leaderId === lead.id).length;

                  return (
                    <tr key={lead.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => handleOpenEditLeader(lead)}
                          className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-900 hover:text-blue-700 transition-colors cursor-pointer text-left font-mono"
                          title={language === 'es' ? 'Haz clic para editar este Líder' : 'Click to edit this Leader'}
                        >
                          <span>{lead.id} ({lead.teamCode})</span>
                          <Pencil className="w-3 h-3 text-slate-400 group-hover:text-blue-600 opacity-60 group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEditLeader(lead)}
                          className="font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left"
                          title={language === 'es' ? 'Haz clic para editar este Líder' : 'Click to edit this Leader'}
                        >
                          {lead.firstName} {lead.lastName}
                        </button>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                          {lead.teamColor}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-mono">
                        <a
                          href={`https://wa.me/${lead.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-600 flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{lead.whatsapp}</span>
                        </a>
                      </td>
                      <td className="p-3 text-slate-600 font-mono">{lead.email}</td>
                      <td className="p-3 text-center">
                        <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                          {assignedCoords}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {permissions.CL && (
                            <div className="relative group inline-flex">
                              <button
                                type="button"
                                onClick={() => handleOpenEditLeader(lead)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title={language === 'es' ? 'Editar Líder' : 'Edit Leader'}
                                aria-label={language === 'es' ? 'Editar Líder' : 'Edit Leader'}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">
                                {language === 'es' ? 'Editar Líder' : 'Edit Leader'}
                              </span>
                            </div>
                          )}
                          {permissions.CL && (
                            <div className="relative group inline-flex">
                              <button
                                type="button"
                                onClick={() => handleDeleteLeader(lead.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title={
                                  language === 'es'
                                    ? 'Eliminar líder (no se puede borrar si tiene coordinadores)'
                                    : 'Delete leader (cannot be deleted if coordinators assigned)'
                                }
                                aria-label={language === 'es' ? 'Eliminar líder' : 'Delete leader'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">
                                {language === 'es' ? 'Eliminar Líder' : 'Delete Leader'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: COORDINATORS */}
      {activeTab === 'coordinators' && currentRole !== 'Coordinator' && (
        <div className="space-y-4">
          {/* Admin Filtering Controls */}
          {((currentUser?.roleName || currentRole).toLowerCase() === 'admin') && (
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search */}
                <div className="relative sm:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={coordSearch}
                    onChange={(e) => setCoordSearch(e.target.value)}
                    placeholder={
                      language === 'es'
                        ? 'Buscar coordinador por nombre, email o teléfono...'
                        : 'Search coordinator by name, email or phone...'
                    }
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                  {coordSearch && (
                    <button
                      onClick={() => setCoordSearch('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter by Leader */}
                <div>
                  <select
                    value={coordLeaderFilter}
                    onChange={(e) => setCoordLeaderFilter(e.target.value)}
                    className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                  >
                    <option value="">
                      {language === 'es' ? 'Filtrar por Líder: Todos' : 'Filter by Leader: All'}
                    </option>
                    {leaders.map((ld) => (
                      <option key={ld.id} value={ld.id}>
                        {ld.firstName} {ld.lastName} ({ld.teamColor})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Status Pill Filters */}
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCoordLettersFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition-colors font-medium text-[11px] ${
                      coordLettersFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {language === 'es' ? 'Todos' : 'All'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoordLettersFilter('with-letters')}
                    className={`px-2.5 py-1 rounded-md transition-colors font-medium text-[11px] ${
                      coordLettersFilter === 'with-letters'
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    {language === 'es' ? 'Con Cartas' : 'With Letters'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoordLettersFilter('no-letters')}
                    className={`px-2.5 py-1 rounded-md transition-colors font-medium text-[11px] ${
                      coordLettersFilter === 'no-letters'
                        ? 'bg-amber-600 text-white shadow-2xs'
                        : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {language === 'es' ? 'Sin Cartas' : 'No Letters'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Leader Umbrella Indicator Banner */}
          {((currentUser?.roleName || currentRole).toLowerCase() === 'leader') && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-semibold text-blue-900">
                  {language === 'es'
                    ? 'Coordinadores bajo tu Liderazgo'
                    : 'Coordinators under your Leadership'}
                </span>
              </div>
              <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[11px]">
                {visibleCoordinators.length} {language === 'es' ? 'coordinador(es)' : 'coordinator(s)'}
              </span>
            </div>
          )}

          {/* Coordinators Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="p-3">{language === 'es' ? 'ID Coordinador' : 'Coordinator ID'}</th>
                    <th className="p-3">{language === 'es' ? 'Nombre' : 'Name'}</th>
                    <th className="p-3">{language === 'es' ? 'Líder Asignado' : 'Assigned Leader'}</th>
                    <th className="p-3">{language === 'es' ? 'Grado / Nota' : 'Grade / Notes'}</th>
                    <th className="p-3">WhatsApp</th>
                    <th className="p-3">Email</th>
                    <th className="p-3 text-center">{language === 'es' ? 'Cartas Asignadas' : 'Assigned Letters'}</th>
                    <th className="p-3 text-right">{language === 'es' ? 'Acciones' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibleCoordinators.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <div className="font-semibold text-slate-700 text-xs">
                          {((currentUser?.roleName || currentRole).toLowerCase() === 'leader')
                            ? (language === 'es'
                                ? 'No tienes coordinadores asignados a tu liderazgo actualmente.'
                                : 'You currently have no coordinators assigned under your leadership.')
                            : (language === 'es'
                                ? 'No se encontraron coordinadores con los filtros seleccionados.'
                                : 'No coordinators found matching the selected filters.')}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleCoordinators.map((c) => {
                      const assignedLetters = letters.filter((l) => l.coordinatorId === c.id).length;

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80">
                          <td className="p-3 font-mono font-bold text-slate-900">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCoordinator(c)}
                              className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-900 hover:text-blue-700 transition-colors cursor-pointer text-left font-mono"
                              title={language === 'es' ? 'Haz clic para editar este Coordinador' : 'Click to edit this Coordinator'}
                            >
                              <span>{c.id}</span>
                              <Pencil className="w-3 h-3 text-slate-400 group-hover:text-blue-600 opacity-60 group-hover:opacity-100" />
                            </button>
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCoordinator(c)}
                              className="font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left"
                              title={language === 'es' ? 'Haz clic para editar este Coordinador' : 'Click to edit this Coordinator'}
                            >
                              {c.firstName} {c.lastName}
                            </button>
                          </td>
                          <td className="p-3">
                            <span className="font-medium text-slate-800">{c.leaderName}</span>
                          </td>
                          <td className="p-3">
                            <div className="text-slate-800 font-medium">{c.grade || '—'}</div>
                          </td>
                          <td className="p-3 text-slate-700 font-mono">
                            <a
                              href={`https://wa.me/${c.whatsapp.replace(/\D/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-emerald-600 flex items-center gap-1"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>{c.whatsapp}</span>
                            </a>
                          </td>
                          <td className="p-3 text-slate-600 font-mono">{c.email}</td>
                          <td className="p-3 text-center">
                            <span className="font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-800 border border-slate-200">
                              {assignedLetters}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {permissions.CC && (
                                <div className="relative group inline-flex">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditCoordinator(c)}
                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                    title={language === 'es' ? 'Editar Coordinador' : 'Edit Coordinator'}
                                    aria-label={language === 'es' ? 'Editar Coordinador' : 'Edit Coordinator'}
                                  >
                                    <Pencil className="w-4 h-4" />
                                  </button>
                                  <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">
                                    {language === 'es' ? 'Editar Coordinador' : 'Edit Coordinator'}
                                  </span>
                                </div>
                              )}
                              {permissions.CC && (
                                <div className="relative group inline-flex">
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteCoordinator(c.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                    title={
                                      language === 'es'
                                        ? 'Eliminar coordinador (no se puede borrar si tiene cartas asignadas)'
                                        : 'Delete coordinator (cannot be deleted if letters assigned)'
                                    }
                                    aria-label={language === 'es' ? 'Eliminar coordinador' : 'Delete coordinator'}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                  <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">
                                    {language === 'es' ? 'Eliminar Coordinador' : 'Delete Coordinator'}
                                  </span>
                                </div>
                              )}
                            </div>
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
      )}

      {/* TAB 3: DONORS */}
      {activeTab === 'donors' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-3">{language === 'es' ? 'ID Padrino' : 'Donor ID'}</th>
                  <th className="p-3">{language === 'es' ? 'Nombre del Padrino' : 'Donor Name'}</th>
                  {!isCoordinator && (
                    <th className="p-3">{language === 'es' ? 'Coordinador Asignado' : 'Assigned Coordinator'}</th>
                  )}
                  <th className="p-3">{language === 'es' ? 'Relación con Coordinador' : 'Relationship'}</th>
                  <th className="p-3">WhatsApp</th>
                  <th className="p-3">Email</th>
                  <th className="p-3 text-center">{language === 'es' ? 'Cartas Apadrinadas' : 'Sponsored Letters'}</th>
                  <th className="p-3 text-right">{language === 'es' ? 'Acciones' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visibleDonors.length === 0 ? (
                  <tr>
                    <td colSpan={isCoordinator ? 7 : 8} className="p-8 text-center text-slate-400">
                      <HeartHandshake className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <div className="font-semibold text-slate-700 text-xs">
                        {language === 'es'
                          ? 'No hay padrinos registrados para tu coordinación o equipo.'
                          : 'No donor sponsors registered under your coordination or team.'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {language === 'es'
                          ? 'Usa el botón "+ Registrar Donante" para vincular un nuevo padrino.'
                          : 'Use the "+ Register Donor" button to link a new donor sponsor.'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleDonors.map((d) => {
                    const assignedLetters = letters.filter((l) => l.donorId === d.id);

                  return (
                    <tr key={d.id} className="hover:bg-slate-50/80">
                      <td className="p-3 font-mono font-bold text-slate-900">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDonor(d)}
                          className="group inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-900 hover:text-blue-700 transition-colors cursor-pointer text-left font-mono"
                          title={language === 'es' ? 'Haz clic para editar este Padrino y sus cartas' : 'Click to edit this Donor and assigned letters'}
                        >
                          <span>{d.id}</span>
                          <Pencil className="w-3 h-3 text-slate-400 group-hover:text-blue-600 opacity-60 group-hover:opacity-100" />
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => handleOpenEditDonor(d)}
                          className="font-semibold text-slate-900 hover:text-blue-600 hover:underline transition-colors cursor-pointer text-left"
                          title={language === 'es' ? 'Haz clic para editar este Padrino y sus cartas' : 'Click to edit this Donor and assigned letters'}
                        >
                          {d.firstName} {d.lastName}
                        </button>
                      </td>
                      {!isCoordinator && (
                        <td className="p-3">
                          <span className="font-medium text-slate-800">{d.coordinatorName}</span>
                        </td>
                      )}
                      <td className="p-3 text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                          {d.coordinatorRelationship}
                        </span>
                      </td>
                      <td className="p-3 text-slate-700 font-mono">
                        <a
                          href={`https://wa.me/${d.whatsapp.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-emerald-600 flex items-center gap-1"
                        >
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{d.whatsapp}</span>
                        </a>
                      </td>
                      <td className="p-3 text-slate-600 font-mono">{d.email}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200">
                            {assignedLetters.length}
                          </span>
                          {assignedLetters.length > 0 && (
                            <span className="text-[10px] text-slate-500 font-mono">
                              ({assignedLetters.map((l) => l.id).join(', ')})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Letter Icon: Assign / Manage Letters (Read-only Donor data, editable letter assignment) */}
                          {permissions.CD && (
                            <div className="relative group inline-flex">
                              <button
                                type="button"
                                onClick={() => handleOpenEditDonor(d, true)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title={language === 'es' ? 'Asignar cartas al padrino' : 'Assign letters to donor'}
                                aria-label={language === 'es' ? 'Asignar cartas al padrino' : 'Assign letters to donor'}
                              >
                                <Mail className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">
                                {language === 'es' ? 'Asignar Cartas' : 'Assign Letters'}
                              </span>
                            </div>
                          )}

                          {/* Pencil Icon: Edit Donor Data */}
                          {permissions.CD && (
                            <div className="relative group inline-flex">
                              <button
                                type="button"
                                onClick={() => handleOpenEditDonor(d, false)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title={language === 'es' ? 'Editar datos del padrino' : 'Edit donor'}
                                aria-label={language === 'es' ? 'Editar datos del padrino' : 'Edit donor'}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">
                                {language === 'es' ? 'Editar Padrino' : 'Edit Donor'}
                              </span>
                            </div>
                          )}

                          {/* Transfer Donor between Coordinators (Admin Only) */}
                          {currentRole === 'Admin' && (
                            <div className="relative group inline-flex">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedDonorForTransfer(d);
                                  setNewCoordinatorId(
                                    coordinators.find((c) => c.id !== d.coordinatorId)?.id || ''
                                  );
                                  setAlertMessage(null);
                                  setIsTransferModalOpen(true);
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                                title={
                                  language === 'es'
                                    ? 'Transferir padrino a otro coordinador'
                                    : 'Transfer donor to another coordinator'
                                }
                                aria-label={
                                  language === 'es'
                                    ? 'Transferir padrino a otro coordinador'
                                    : 'Transfer donor to another coordinator'
                                }
                              >
                                <ArrowRightLeft className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">
                                {language === 'es' ? 'Transferir Padrino' : 'Transfer Donor'}
                              </span>
                            </div>
                          )}

                          {/* Delete Donor */}
                          {permissions.CD && (
                            <div className="relative group inline-flex">
                              <button
                                type="button"
                                onClick={() => handleDeleteDonor(d.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                title={
                                  language === 'es'
                                    ? 'Eliminar padrino (no se puede borrar si tiene cartas asignadas)'
                                    : 'Delete donor (cannot be deleted if letters are assigned)'
                                }
                                aria-label={language === 'es' ? 'Eliminar padrino' : 'Delete donor'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <span className="pointer-events-none absolute bottom-full mb-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-800 px-2 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-md">
                                {language === 'es' ? 'Eliminar Padrino' : 'Delete Donor'}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTRAR LÍDER ================= */}
      {isLeaderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Registrar Líder de Equipo</h3>
              <button onClick={() => setIsLeaderModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateLeader} className="space-y-3 text-xs">
              {alertMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    alertMessage.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{alertMessage.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertMessage(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={leadFirstName}
                    onChange={(e) => setLeadFirstName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={leadLastName}
                    onChange={(e) => setLeadLastName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Color de Equipo *</label>
                <input
                  type="text"
                  required
                  value={leadColor}
                  onChange={(e) => setLeadColor(e.target.value)}
                  placeholder="Ej. Amarillo Dorado, Púrpura Imperial"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'es' ? 'Correo Electrónico (@gmail.com) *' : 'Email Address (@gmail.com) *'}
                </label>
                <input
                  type="email"
                  required
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                  placeholder="ejemplo.lider@gmail.com"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {language === 'es'
                    ? 'Debe ser una cuenta @gmail.com.'
                    : 'Must be a @gmail.com account.'}
                </p>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Número de WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={leadWhatsapp}
                  onChange={(e) => setLeadWhatsapp(e.target.value)}
                  placeholder="+52 33 0000 0000"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsLeaderModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs">
                  Guardar Líder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTRAR COORDINADOR ================= */}
      {isCoordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Registrar Coordinador</h3>
              <button onClick={() => setIsCoordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCoordinator} className="space-y-3 text-xs">
              {alertMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    alertMessage.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{alertMessage.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertMessage(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={coordFirstName}
                    onChange={(e) => setCoordFirstName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={coordLastName}
                    onChange={(e) => setCoordLastName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Líder al que reporta *</label>
                <select
                  value={coordLeaderId}
                  onChange={(e) => setCoordLeaderId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {leaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.firstName} {l.lastName} (Equipo {l.teamColor})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Escuela donde estudia *' : 'School currently studying *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={coordSchool}
                    onChange={(e) => setCoordSchool(e.target.value)}
                    placeholder={language === 'es' ? 'Ej. ITESO, Prepa 7, Tec...' : 'e.g. ITESO, High School, College...'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'es'
                      ? 'Institución donde estudia el coordinador'
                      : 'School where coordinator studies'}
                  </p>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Grado escolar que cursa *' : 'Current school grade *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={coordGrade}
                    onChange={(e) => setCoordGrade(e.target.value)}
                    placeholder={language === 'es' ? 'Ej. 5° Semestre, 3° Preparatoria...' : 'e.g. 5th Semester, 3rd Year...'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {language === 'es'
                      ? 'Grado o semestre en curso'
                      : 'Current school grade / semester'}
                  </p>
                </div>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'es' ? 'Correo Electrónico (@gmail.com) *' : 'Email Address (@gmail.com) *'}
                </label>
                <input
                  type="email"
                  required
                  value={coordEmail}
                  onChange={(e) => setCoordEmail(e.target.value)}
                  placeholder="coordinador@gmail.com"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {language === 'es'
                    ? 'Debe ser una cuenta @gmail.com.'
                    : 'Must be a @gmail.com account.'}
                </p>
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Número de WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={coordWhatsapp}
                  onChange={(e) => setCoordWhatsapp(e.target.value)}
                  placeholder="+52 33 0000 0000"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsCoordModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs">
                  Guardar Coordinador
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTRAR DONANTE ================= */}
      {isDonorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Registrar Padrino Donante</h3>
              <button onClick={() => setIsDonorModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateDonor} className="space-y-3 text-xs">
              {alertMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    alertMessage.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{alertMessage.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertMessage(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={donorFirstName}
                    onChange={(e) => setDonorFirstName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Apellidos *</label>
                  <input
                    type="text"
                    required
                    value={donorLastName}
                    onChange={(e) => setDonorLastName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>
              {!isCoordinator && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Coordinador Responsable *</label>
                  <select
                    value={donorCoordId}
                    disabled={isCoordinator}
                    onChange={(e) => setDonorCoordId(e.target.value)}
                    className={`w-full p-2 border border-slate-200 rounded-lg text-slate-800 ${isCoordinator ? 'bg-slate-100' : 'bg-slate-50'}`}
                  >
                    {(isLeader && myLeader
                      ? coordinators.filter((c) => c.leaderId === myLeader.id)
                      : coordinators
                    ).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.school})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Relación con el Coordinador *</label>
                <input
                  type="text"
                  required
                  value={donorRelationship}
                  onChange={(e) => setDonorRelationship(e.target.value)}
                  placeholder="Ej. Compañero de trabajo, Familiar, Vecino..."
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder="donante@correo.com"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Número de WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={donorWhatsapp}
                  onChange={(e) => setDonorWhatsapp(e.target.value)}
                  placeholder="+52 33 0000 0000"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsDonorModalOpen(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs">
                  Guardar Donante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: TRANSFERIR DONANTE (ADMIN ONLY) ================= */}
      {isTransferModalOpen && selectedDonorForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Transferir Donante</h3>
                <p className="text-xs text-slate-500">
                  Acción restringida exclusivamente para rol Administrador.
                </p>
              </div>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {alertMessage && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  alertMessage.type === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{alertMessage.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAlertMessage(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-1 text-xs">
              <span className="font-bold text-blue-900">Donante a Transferir:</span>
              <div className="text-blue-800 font-semibold">
                {selectedDonorForTransfer.firstName} {selectedDonorForTransfer.lastName}
              </div>
              <div className="text-blue-700">
                Coordinador actual: {selectedDonorForTransfer.coordinatorName}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-semibold text-slate-700 block">
                Nuevo Coordinador Responsable *
              </label>
              <select
                value={newCoordinatorId}
                onChange={(e) => setNewCoordinatorId(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                {coordinators
                  .filter((c) => c.id !== selectedDonorForTransfer.coordinatorId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName} ({c.school})
                    </option>
                  ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 text-xs">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!newCoordinatorId}
                onClick={handleExecuteTransfer}
                className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
              >
                Confirmar Transferencia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR LÍDER ================= */}
      {editingLeader && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {editingLeader.id} ({editingLeader.teamCode})
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'es' ? 'Editar Líder de Equipo' : 'Edit Team Leader'}
                </h3>
              </div>
              <button
                onClick={() => setEditingLeader(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedLeader} className="space-y-3 text-xs">
              {alertMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    alertMessage.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{alertMessage.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertMessage(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Nombre *' : 'First Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editLeadFirstName}
                    onChange={(e) => setEditLeadFirstName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Apellidos *' : 'Last Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editLeadLastName}
                    onChange={(e) => setEditLeadLastName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'es' ? 'Color de Equipo *' : 'Team Color *'}
                </label>
                <input
                  type="text"
                  required
                  value={editLeadColor}
                  onChange={(e) => setEditLeadColor(e.target.value)}
                  placeholder="Ej. Amarillo Dorado, Púrpura Imperial"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'es' ? 'Correo Electrónico (@gmail.com) *' : 'Email Address (@gmail.com) *'}
                </label>
                <input
                  type="email"
                  required
                  value={editLeadEmail}
                  onChange={(e) => setEditLeadEmail(e.target.value)}
                  placeholder="ejemplo.lider@gmail.com"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {language === 'es'
                    ? 'Debe ser una cuenta @gmail.com.'
                    : 'Must be a @gmail.com account.'}
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'es' ? 'Número de WhatsApp *' : 'WhatsApp Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={editLeadWhatsapp}
                  onChange={(e) => setEditLeadWhatsapp(e.target.value)}
                  placeholder="+52 33 0000 0000"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingLeader(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR COORDINADOR ================= */}
      {editingCoordinator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {editingCoordinator.id}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {language === 'es' ? 'Editar Coordinador' : 'Edit Coordinator'}
                </h3>
              </div>
              <button
                onClick={() => setEditingCoordinator(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedCoordinator} className="space-y-3 text-xs">
              {alertMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    alertMessage.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{alertMessage.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertMessage(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Nombre *' : 'First Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editCoordFirstName}
                    onChange={(e) => setEditCoordFirstName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Apellidos *' : 'Last Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editCoordLastName}
                    onChange={(e) => setEditCoordLastName(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'es' ? 'Líder al que reporta *' : 'Reporting Leader *'}
                </label>
                <select
                  value={editCoordLeaderId}
                  onChange={(e) => setEditCoordLeaderId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                >
                  {leaders.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.firstName} {l.lastName} (Equipo {l.teamColor})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Escuela donde estudia *' : 'School currently studying *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editCoordSchool}
                    onChange={(e) => setEditCoordSchool(e.target.value)}
                    placeholder={language === 'es' ? 'Ej. ITESO, Prepa 7, Tec...' : 'e.g. ITESO, High School, College...'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Grado escolar que cursa *' : 'Current school grade *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editCoordGrade}
                    onChange={(e) => setEditCoordGrade(e.target.value)}
                    placeholder={language === 'es' ? 'Ej. 5° Semestre, 3° Preparatoria...' : 'e.g. 5th Semester, 3rd Year...'}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'es' ? 'Correo Electrónico (@gmail.com) *' : 'Email Address (@gmail.com) *'}
                </label>
                <input
                  type="email"
                  required
                  value={editCoordEmail}
                  onChange={(e) => setEditCoordEmail(e.target.value)}
                  placeholder="coordinador@gmail.com"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {language === 'es'
                    ? 'Debe ser una cuenta @gmail.com.'
                    : 'Must be a @gmail.com account.'}
                </p>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {language === 'es' ? 'Número de WhatsApp *' : 'WhatsApp Number *'}
                </label>
                <input
                  type="text"
                  required
                  value={editCoordWhatsapp}
                  onChange={(e) => setEditCoordWhatsapp(e.target.value)}
                  placeholder="+52 33 0000 0000"
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCoordinator(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR PADRINO DONANTE (CON ASIGNACIÓN DE CARTAS) ================= */}
      {editingDonor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                  {editingDonor.id}
                </span>
                <h3 className="text-base font-bold text-slate-900">
                  {isDonorReadOnlyLettersOnly
                    ? (language === 'es' ? 'Asignar Cartas al Padrino' : 'Assign Letters to Donor')
                    : (language === 'es' ? 'Editar Padrino Donante' : 'Edit Donor Sponsor')}
                </h3>
                {isDonorReadOnlyLettersOnly && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {language === 'es' ? 'Solo Asignación de Cartas' : 'Letters Assignment Only'}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditingDonor(null)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isDonorReadOnlyLettersOnly && (
              <div className="p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-700 shrink-0" />
                <span>
                  {language === 'es'
                    ? 'Los datos generales del padrino son de solo lectura. Puedes asignar o remover cartas del coordinador a continuación.'
                    : 'Donor details are in read-only mode. You can assign or remove letters from the coordinator below.'}
                </span>
              </div>
            )}

            <form onSubmit={handleSaveEditedDonor} className="space-y-4 text-xs">
              {alertMessage && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    alertMessage.type === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{alertMessage.text}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAlertMessage(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Nombre *' : 'First Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={isDonorReadOnlyLettersOnly}
                    disabled={isDonorReadOnlyLettersOnly}
                    value={editDonorFirstName}
                    onChange={(e) => setEditDonorFirstName(e.target.value)}
                    className={`w-full p-2 rounded-lg text-slate-800 border transition-colors ${
                      isDonorReadOnlyLettersOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Apellidos *' : 'Last Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={isDonorReadOnlyLettersOnly}
                    disabled={isDonorReadOnlyLettersOnly}
                    value={editDonorLastName}
                    onChange={(e) => setEditDonorLastName(e.target.value)}
                    className={`w-full p-2 rounded-lg text-slate-800 border transition-colors ${
                      isDonorReadOnlyLettersOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {!isCoordinator && (
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Coordinador Responsable *' : 'Assigned Coordinator *'}
                  </label>
                  <select
                    disabled={isDonorReadOnlyLettersOnly}
                    value={editDonorCoordId}
                    onChange={(e) => setEditDonorCoordId(e.target.value)}
                    className={`w-full p-2 rounded-lg text-slate-800 border transition-colors ${
                      isDonorReadOnlyLettersOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500'
                    }`}
                  >
                    {coordinators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.school})
                      </option>
                    ))}
                  </select>
                </div>
              )}
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Relación con el Coordinador *' : 'Relationship with Coordinator *'}
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={isDonorReadOnlyLettersOnly}
                    disabled={isDonorReadOnlyLettersOnly}
                    value={editDonorRelationship}
                    onChange={(e) => setEditDonorRelationship(e.target.value)}
                    placeholder="Ej. Familiar, Amigo, Compañero de trabajo..."
                    className={`w-full p-2 rounded-lg text-slate-800 border transition-colors ${
                      isDonorReadOnlyLettersOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Correo Electrónico *' : 'Email Address *'}
                  </label>
                  <input
                    type="email"
                    required
                    readOnly={isDonorReadOnlyLettersOnly}
                    disabled={isDonorReadOnlyLettersOnly}
                    value={editDonorEmail}
                    onChange={(e) => setEditDonorEmail(e.target.value)}
                    placeholder="padrino@correo.com"
                    className={`w-full p-2 rounded-lg text-slate-800 border transition-colors ${
                      isDonorReadOnlyLettersOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500'
                    }`}
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">
                    {language === 'es' ? 'Número de WhatsApp *' : 'WhatsApp Number *'}
                  </label>
                  <input
                    type="text"
                    required
                    readOnly={isDonorReadOnlyLettersOnly}
                    disabled={isDonorReadOnlyLettersOnly}
                    value={editDonorWhatsapp}
                    onChange={(e) => setEditDonorWhatsapp(e.target.value)}
                    placeholder="+52 33 0000 0000"
                    className={`w-full p-2 rounded-lg text-slate-800 border transition-colors ${
                      isDonorReadOnlyLettersOnly
                        ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200'
                        : 'bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>

                {/* SECCIÓN DE CARTAS ASIGNADAS (REQUIRED BY USER) */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900">
                      {language === 'es' ? 'Cartas Asignadas al Padrino' : 'Letters Assigned to Donor'}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-bold">
                      {editDonorAssignedLetterIds.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAssignLetterPickerOpen((prev) => !prev)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'es' ? 'Asignar Carta' : 'Assign Letter'}</span>
                  </button>
                </div>

                {/* Highlighted Warning Banner when no letters available for this coordinator */}
                {letters.filter((l) => {
                  const targetCoordId = editDonorCoordId || editingDonor.coordinatorId;
                  const targetCoordObj = coordinators.find((c) => c.id === targetCoordId);
                  const isAssignedToThisCoord =
                    !targetCoordId ||
                    l.coordinatorId === targetCoordId ||
                    (targetCoordObj &&
                      l.coordinatorName &&
                      l.coordinatorName.toLowerCase().trim() ===
                        `${targetCoordObj.firstName} ${targetCoordObj.lastName}`
                          .toLowerCase()
                          .trim());

                  return (
                    !l.isArchived &&
                    isAssignedToThisCoord &&
                    (!l.donorId || l.donorId === '' || l.donorId === editingDonor.id) &&
                    !editDonorAssignedLetterIds.includes(l.id)
                  );
                }).length === 0 && (
                  <div className="p-3 my-2 bg-amber-100 border-2 border-amber-400 rounded-xl text-amber-950 text-xs font-bold flex items-center justify-center gap-2.5 text-center shadow-md animate-pulse">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span className="leading-snug">
                      {language === 'es'
                        ? 'No hay cartas disponibles asignadas a este coordinador para asignar.'
                        : 'No available letters assigned to this coordinator to assign.'}
                    </span>
                  </div>
                )}

                {/* PICKER / SEARCH DE CARTAS DISPONIBLES */}
                {isAssignLetterPickerOpen && (
                  <div className="p-3 bg-slate-50 border border-blue-200 rounded-xl space-y-2 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-700 text-[11px] block">
                          {language === 'es'
                            ? 'Selecciona una carta del coordinador para asignar:'
                            : 'Select a coordinator letter to assign:'}
                        </span>
                        <span className="text-[10px] text-blue-700 font-medium">
                          {language === 'es' ? 'Cartas del Coordinador: ' : 'Coordinator Letters: '}
                          {coordinators.find((c) => c.id === (editDonorCoordId || editingDonor.coordinatorId))
                            ? `${coordinators.find((c) => c.id === (editDonorCoordId || editingDonor.coordinatorId))?.firstName} ${coordinators.find((c) => c.id === (editDonorCoordId || editingDonor.coordinatorId))?.lastName} (${editDonorCoordId || editingDonor.coordinatorId})`
                            : editDonorCoordId || editingDonor.coordinatorId || 'N/A'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAssignLetterPickerOpen(false)}
                        className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer p-1 rounded hover:bg-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                      <input
                        type="text"
                        value={letterSearchQuery}
                        onChange={(e) => setLetterSearchQuery(e.target.value)}
                        placeholder={
                          language === 'es'
                            ? 'Buscar por folio (ej. A-101) o niño...'
                            : 'Search by folio (e.g. A-101) or child...'
                        }
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:border-blue-500"
                      />
                    </div>

                    <div className="max-h-44 overflow-y-auto divide-y divide-slate-100 bg-white border border-slate-200 rounded-lg">
                      {letters
                        .filter((l) => {
                          const targetCoordId = editDonorCoordId || editingDonor.coordinatorId;
                          const targetCoordObj = coordinators.find((c) => c.id === targetCoordId);
                          const isAssignedToThisCoord =
                            !targetCoordId ||
                            l.coordinatorId === targetCoordId ||
                            (targetCoordObj &&
                              l.coordinatorName &&
                              l.coordinatorName.toLowerCase().trim() ===
                                `${targetCoordObj.firstName} ${targetCoordObj.lastName}`
                                  .toLowerCase()
                                  .trim());

                          return (
                            !l.isArchived &&
                            isAssignedToThisCoord &&
                            (!l.donorId || l.donorId === '' || l.donorId === editingDonor.id) &&
                            !editDonorAssignedLetterIds.includes(l.id)
                          );
                        })
                        .filter((l) => {
                          if (!letterSearchQuery.trim()) return true;
                          const q = letterSearchQuery.toLowerCase();
                          return (
                            l.id.toLowerCase().includes(q) ||
                            l.kidName.toLowerCase().includes(q)
                          );
                        })
                        .slice(0, 15)
                        .map((availLetter) => (
                          <div
                            key={availLetter.id}
                            className="p-2 flex items-center justify-between hover:bg-slate-50 gap-2"
                          >
                            <div className="min-w-0 flex items-center gap-2">
                              <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
                                {availLetter.id}
                              </span>
                              <div className="truncate">
                                <span className="font-semibold text-slate-900 mr-1.5">
                                  {availLetter.kidName}
                                </span>
                                <span className="text-slate-500 text-[11px]">
                                  ({availLetter.age} {language === 'es' ? 'años' : 'yrs'}, {availLetter.gender})
                                </span>
                                {availLetter.toyRequest && (
                                  <div className="text-[10px] text-slate-400 truncate">
                                    {language === 'es' ? 'Deseo: ' : 'Wish: '}
                                    {availLetter.toyRequest}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddLetterToDonor(availLetter.id)}
                              className="shrink-0 flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                              <span>{language === 'es' ? 'Asignar' : 'Assign'}</span>
                            </button>
                          </div>
                        ))}

                      {letters.filter((l) => {
                        const targetCoordId = editDonorCoordId || editingDonor.coordinatorId;
                        const targetCoordObj = coordinators.find((c) => c.id === targetCoordId);
                        const isAssignedToThisCoord =
                          !targetCoordId ||
                          l.coordinatorId === targetCoordId ||
                          (targetCoordObj &&
                            l.coordinatorName &&
                            l.coordinatorName.toLowerCase().trim() ===
                              `${targetCoordObj.firstName} ${targetCoordObj.lastName}`
                                .toLowerCase()
                                .trim());

                        return (
                          !l.isArchived &&
                          isAssignedToThisCoord &&
                          (!l.donorId || l.donorId === '' || l.donorId === editingDonor.id) &&
                          !editDonorAssignedLetterIds.includes(l.id)
                        );
                      }).length === 0 && (
                        <div className="p-4 m-2 bg-amber-100 border-2 border-amber-400 rounded-xl text-amber-950 text-xs font-bold flex items-center justify-center gap-2.5 text-center shadow-md animate-pulse">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                          <span className="leading-snug">
                            {language === 'es'
                              ? 'No hay cartas disponibles asignadas a este coordinador para asignar.'
                              : 'No available letters assigned to this coordinator to assign.'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* LISTA DE CARTAS ACTUALMENTE ASIGNADAS AL DONANTE */}
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                  {editDonorAssignedLetterIds.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      {language === 'es'
                        ? 'Este padrino no tiene cartas asignadas actualmente. Haz clic en "+ Asignar Carta" para vincular una.'
                        : 'This donor currently has no letters assigned. Click "+ Assign Letter" to link one.'}
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto divide-y divide-slate-200 bg-white">
                      {editDonorAssignedLetterIds.map((letterId) => {
                        const letterObj = letters.find((l) => l.id === letterId);
                        return (
                          <div
                            key={letterId}
                            className="p-2.5 flex items-center justify-between hover:bg-slate-50 gap-2"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                                {letterId}
                              </span>
                              <div className="truncate">
                                <div className="font-semibold text-slate-900">
                                  {letterObj?.kidName || letterId}
                                </div>
                                <div className="text-[11px] text-slate-500">
                                  {letterObj?.age ? `${letterObj.age} ${language === 'es' ? 'años' : 'yrs'}` : ''}{letterObj?.gender ? ` · ${letterObj.gender}` : ''}
                                </div>
                                {letterObj?.toyRequest && (
                                  <div className="text-[10px] text-slate-400 italic truncate">
                                    {letterObj.toyRequest}
                                  </div>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveLetterFromDonor(letterId)}
                              className="shrink-0 p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title={language === 'es' ? 'Desasignar carta de este padrino' : 'Remove letter from this donor'}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingDonor(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedDonor}
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs cursor-pointer"
                >
                  {language === 'es' ? 'Guardar Cambios' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
