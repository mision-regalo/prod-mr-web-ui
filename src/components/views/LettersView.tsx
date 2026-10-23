import React, { useState, useMemo, useEffect } from 'react';
import {
  Letter,
  Leader,
  Coordinator,
  Donor,
  SchoolCatalogItem,
  Role,
  PresentItem,
  AgeRange,
  Gender,
  MatchingGrade,
  PresentType,
  GiftGivingEvent,
  RolePermissions,
  User,
} from '../../types';
import { Language, translations } from '../../i18n/translations';
import {
  Search,
  Plus,
  Filter,
  CheckSquare,
  Gift,
  Archive,
  UserPlus,
  Star,
  X,
  PackagePlus,
  Camera,
  Lock,
  Unlock,
  Eye,
  Calendar,
  Loader2,
  Pencil,
  Check,
  AlertTriangle,
  FileText,
  HardDrive,
} from 'lucide-react';
import { db, uploadLetterPhoto, deleteLetterPhoto, resolveLetterPhotoUrl } from '../../services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { LetterPhotoMetadata } from '../../types';

const LetterThumb: React.FC<{ letter: Letter; alt: string; className?: string }> = ({
  letter,
  alt,
  className,
}) => {
  const [src, setSrc] = useState(
    letter.photoUrl && !letter.photoUrl.startsWith('/api/') ? letter.photoUrl : ''
  );
  useEffect(() => {
    let active = true;
    resolveLetterPhotoUrl(
      letter.picId || letter.photoMetadata?.picId,
      letter.photoMetadata?.storagePath,
      letter.photoUrl
    ).then((url) => active && setSrc(url));
    return () => {
      active = false;
    };
  }, [letter.picId, letter.photoMetadata?.picId, letter.photoMetadata?.storagePath, letter.photoUrl]);
  return src ? <img src={src} alt={alt} className={className} /> : null;
};

const MAX_PHOTO_SIZE_BYTES = 3 * 1024 * 1024; // 3MB

interface LettersViewProps {
  letters: Letter[];
  leaders: Leader[];
  coordinators: Coordinator[];
  donors: Donor[];
  schools: SchoolCatalogItem[];
  events: GiftGivingEvent[];
  permissions: RolePermissions;
  currentUser?: User;
  currentRole: Role;
  language: Language;
  onSaveLetter: (letter: Letter, oldId?: string) => void;
  onArchiveLetter: (letterId: string) => void;
  onAddPresent: (letterId: string, present: PresentItem) => void;
  onBulkAssign: (
    letterIds: string[],
    assignType: 'leader' | 'coordinator' | 'donor',
    targetId: string
  ) => void;
  hideGiftMatching: string;
}

export const LettersView: React.FC<LettersViewProps> = ({
  letters,
  leaders,
  coordinators,
  donors,
  schools,
  events,
  permissions,
  currentUser,
  currentRole,
  language,
  onSaveLetter,
  onArchiveLetter,
  onAddPresent,
  onBulkAssign,
  hideGiftMatching,
}) => {
  const t = translations[language];

  const userRoleLower = (currentUser?.roleName || currentRole || '').toLowerCase();
  const isAdmin = userRoleLower === 'admin' || currentUser?.roleId === 'ROLE-ADMIN';
  const isLeader = userRoleLower === 'leader' || currentUser?.roleId === 'ROLE-LEADER';
  const isCoordinator =
    userRoleLower === 'coordinator' ||
    currentUser?.roleId === 'ROLE-COORD';

  const userEmail = (currentUser?.email || '').trim().toLowerCase();
  const userName = (currentUser?.name || '').trim().toLowerCase();

  const myLeaderObj = useMemo(() => {
    if (!isLeader) return null;
    return (
      leaders.find(
        (ld) =>
          (currentUser?.assignedLeaderId && ld.id === currentUser.assignedLeaderId) ||
          ld.id === currentUser?.id ||
          (userEmail && ld.email.trim().toLowerCase() === userEmail) ||
          (userName && `${ld.firstName} ${ld.lastName}`.trim().toLowerCase() === userName)
      ) || null
    );
  }, [isLeader, currentUser, leaders, userEmail, userName]);

  const myLeaderId = myLeaderObj?.id || currentUser?.assignedLeaderId || (isLeader ? currentUser?.id : undefined);
  const myLeaderName = myLeaderObj
    ? `${myLeaderObj.firstName} ${myLeaderObj.lastName}`.trim().toLowerCase()
    : (isLeader ? userName : '');

  const myCoordObj = useMemo(() => {
    if (!isCoordinator) return null;
    return (
      coordinators.find(
        (c) =>
          (currentUser?.assignedCoordinatorId && c.id === currentUser.assignedCoordinatorId) ||
          c.id === currentUser?.id ||
          (userEmail && c.email.trim().toLowerCase() === userEmail) ||
          (userName && `${c.firstName} ${c.lastName}`.trim().toLowerCase() === userName)
      ) || null
    );
  }, [isCoordinator, currentUser, coordinators, userEmail, userName]);

  const myCoordId = myCoordObj?.id || currentUser?.assignedCoordinatorId || (isCoordinator ? currentUser?.id : undefined);
  const myCoordName = myCoordObj
    ? `${myCoordObj.firstName} ${myCoordObj.lastName}`.trim().toLowerCase()
    : (isCoordinator ? userName : '');

  // Coordinators available in Asignación Masiva modal:
  // - If Leader: only list his coordinators
  // - If Admin: list all coordinators
  const bulkModalCoordinators = useMemo(() => {
    if (isLeader) {
      return coordinators.filter(
        (c) =>
          (myLeaderId && c.leaderId === myLeaderId) ||
          (myLeaderName && c.leaderName && c.leaderName.trim().toLowerCase() === myLeaderName)
      );
    }
    return coordinators;
  }, [isLeader, myLeaderId, myLeaderName, coordinators]);

  // Donors available in Asignación Masiva modal:
  // - If Coordinator: only list his Padrinos
  // - If Leader: list Padrinos under this leader's coordinators
  // - If Admin: list all Padrinos
  const bulkModalDonors = useMemo(() => {
    if (isCoordinator) {
      return donors.filter(
        (d) =>
          (myCoordId && d.coordinatorId === myCoordId) ||
          (myCoordName && d.coordinatorName && d.coordinatorName.trim().toLowerCase() === myCoordName)
      );
    }
    if (isLeader) {
      const myCoordIds = new Set(bulkModalCoordinators.map((c) => c.id));
      const myCoordNames = new Set(
        bulkModalCoordinators.map((c) => `${c.firstName} ${c.lastName}`.trim().toLowerCase())
      );
      return donors.filter(
        (d) =>
          (d.coordinatorId && myCoordIds.has(d.coordinatorId)) ||
          (d.coordinatorName && myCoordNames.has(d.coordinatorName.trim().toLowerCase()))
      );
    }
    return donors;
  }, [isCoordinator, isLeader, myCoordId, myCoordName, bulkModalCoordinators, donors]);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedLeaderFilter, setSelectedLeaderFilter] = useState('');
  const [selectedCoordFilter, setSelectedCoordFilter] = useState('');
  const [selectedEventFilter, setSelectedEventFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'no-donor' | 'no-coord' | 'no-presents' | 'fulfilled' | 'surplus'
  >('all');
  const [genderFilter, setGenderFilter] = useState<'all' | 'Niño' | 'Niña'>('all');

  useEffect(() => {
    if (isCoordinator && (statusFilter === 'surplus' || statusFilter === 'no-coord')) {
      setStatusFilter('all');
    }
  }, [isCoordinator, statusFilter]);

  // Multi-selection for bulk actions
  const [selectedLetterIds, setSelectedLetterIds] = useState<string[]>([]);

  // Modals state
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedLetterForGift, setSelectedLetterForGift] = useState<Letter | null>(null);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState<string | null>(null);

  // Edit / View Letter Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLetter, setEditingLetter] = useState<Letter | null>(null);
  const [editFolioType, setEditFolioType] = useState('A');
  const [editFolio, setEditFolio] = useState<number>(101);
  const [editKidName, setEditKidName] = useState('');
  const [editAge, setEditAge] = useState(8);
  const [editGender, setEditGender] = useState<'Niño' | 'Niña'>('Niño');
  const [editPhone, setEditPhone] = useState('');
  const [editToy, setEditToy] = useState('');
  const [editClothing, setEditClothing] = useState('');
  const [editClothingSize, setEditClothingSize] = useState('');
  const [editShoeSize, setEditShoeSize] = useState('');
  const [editSchoolItem, setEditSchoolItem] = useState('');
  const [editCoordId, setEditCoordId] = useState('');
  const [editLeaderId, setEditLeaderId] = useState('');
  const [editDonorId, setEditDonorId] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editPicId, setEditPicId] = useState('');
  const [editPhotoMetadata, setEditPhotoMetadata] = useState<LetterPhotoMetadata | null>(null);
  const [zoomPicId, setZoomPicId] = useState<string | null>(null);
  const [zoomPhotoMetadata, setZoomPhotoMetadata] = useState<LetterPhotoMetadata | null>(null);
  const [photoSizeError, setPhotoSizeError] = useState<'add' | 'edit' | null>(null);

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // New Letter Form State
  const [formFolioType, setFormFolioType] = useState(events[0]?.id || 'A');
  const [formFolio, setFormFolio] = useState<number>(101);
  const [formKidName, setFormKidName] = useState('');
  const [formAge, setFormAge] = useState(8);
  const [formGender, setFormGender] = useState<'Niño' | 'Niña'>('Niño');
  const [formPhone, setFormPhone] = useState('');
  const [formToy, setFormToy] = useState('');
  const [formClothing, setFormClothing] = useState('');
  const [formClothingSize, setFormClothingSize] = useState('');
  const [formShoeSize, setFormShoeSize] = useState('');
  const [formSchoolItem, setFormSchoolItem] = useState('');
  const [formCoordId, setFormCoordId] = useState('');
  const [formLeaderId, setFormLeaderId] = useState('');
  const [formPhotoUrl, setFormPhotoUrl] = useState('');

  // Bulk Assign Form State
  const [bulkType, setBulkType] = useState<'leader' | 'coordinator' | 'donor'>(
    isCoordinator ? 'donor' : !isAdmin ? 'coordinator' : 'leader'
  );
  const [bulkTargetId, setBulkTargetId] = useState('');

  // Fallback to allowed bulkType if role changes
  useEffect(() => {
    if (isCoordinator && bulkType !== 'donor') {
      setBulkType('donor');
    } else if (!isAdmin && bulkType === 'leader') {
      setBulkType('coordinator');
    }
  }, [isCoordinator, isAdmin, bulkType]);

  const handleOpenBulkModal = () => {
    if (isCoordinator) {
      setBulkType('donor');
    } else if (!isAdmin) {
      setBulkType('coordinator');
    } else {
      setBulkType('leader');
    }
    setBulkTargetId('');
    setIsBulkModalOpen(true);
  };

  // Present Registration Form State
  const [giftType, setGiftType] = useState<PresentType>('Juguete');
  const [giftDesc, setGiftDesc] = useState('');
  const [giftAgeRange, setGiftAgeRange] = useState<AgeRange>('6-9');
  const [giftGender, setGiftGender] = useState<Gender>('Niño');
  const [giftMatching, setGiftMatching] = useState<MatchingGrade>('specific');
  const [giftIsSurplus, setGiftIsSurplus] = useState(false);

  // Helper: Get next available unique folio number for a given folio type
  const getNextAvailableFolio = (type: string, ignoreLetterId?: string): number => {
    const existingFolios = letters
      .filter((l) => l.folioType === type && l.id !== ignoreLetterId && !isNaN(Number(l.folio)))
      .map((l) => Number(l.folio));
    if (existingFolios.length === 0) return 101;
    return Math.max(...existingFolios) + 1;
  };

  // Uniqueness check for Add Letter Modal: Folio must be unique for chosen Tipo de Folio
  const isAddFolioDuplicate = useMemo(() => {
    if (!formFolio || isNaN(Number(formFolio))) return false;
    return letters.some(
      (l) => l.folioType === formFolioType && Number(l.folio) === Number(formFolio)
    );
  }, [letters, formFolioType, formFolio]);

  // Uniqueness check for Edit Letter Modal: Folio must be unique for chosen Tipo de Folio
  const isEditFolioDuplicate = useMemo(() => {
    if (!editingLetter || !editFolio || isNaN(Number(editFolio))) return false;
    return letters.some(
      (l) =>
        l.id !== editingLetter.id &&
        l.folioType === editFolioType &&
        Number(l.folio) === Number(editFolio)
    );
  }, [letters, editingLetter, editFolioType, editFolio]);

  // Dynamic Rule: When Coordinator is chosen, Leader is prefilled with Coordinator's leader and becomes read-only!
  const isLeaderReadOnly = !!formCoordId;

  const handleCoordinatorChange = (coordId: string) => {
    setFormCoordId(coordId);
    if (coordId) {
      const matchedCoord = coordinators.find((c) => c.id === coordId);
      if (matchedCoord) {
        setFormLeaderId(matchedCoord.leaderId);
      }
    }
  };

  // Active Letters (excluding archived)
  const activeLetters = useMemo(() => {
    return letters.filter((l) => !l.isArchived);
  }, [letters]);

  // Role Scoping:
  // - Coordinator: only see letters under their coordinator umbrella (assigned to them or their donors)
  // - Leader: only see letters under their leader umbrella (assigned to them, their coordinators, or their coordinators' donors)
  // - Admin: see all active letters
  const roleScopedLetters = useMemo(() => {
    const userRoleLower = (currentUser?.roleName || currentRole).toLowerCase();

    if (userRoleLower === 'coordinator') {
      const userEmail = (currentUser?.email || '').trim().toLowerCase();
      const userName = (currentUser?.name || '').trim().toLowerCase();
      const myCoord =
        coordinators.find(
          (c) =>
            (currentUser?.assignedCoordinatorId && c.id === currentUser.assignedCoordinatorId) ||
            (userEmail && c.email.trim().toLowerCase() === userEmail) ||
            (userName && `${c.firstName} ${c.lastName}`.trim().toLowerCase() === userName)
        ) || null;
      const myCoordId = myCoord?.id || currentUser?.assignedCoordinatorId;

      if (!myCoordId) {
        return activeLetters.filter((l) =>
          userName && l.coordinatorName?.trim().toLowerCase().includes(userName)
        );
      }

      // Donors assigned to this coordinator
      const myDonorIds = new Set(
        donors.filter((d) => d.coordinatorId === myCoordId).map((d) => d.id)
      );

      return activeLetters.filter(
        (l) =>
          l.coordinatorId === myCoordId ||
          (l.donorId && myDonorIds.has(l.donorId)) ||
          (myCoord &&
            l.coordinatorName &&
            l.coordinatorName.trim().toLowerCase() ===
              `${myCoord.firstName} ${myCoord.lastName}`.trim().toLowerCase())
      );
    }

    if (userRoleLower === 'leader') {
      const userEmail = (currentUser?.email || '').trim().toLowerCase();
      const userName = (currentUser?.name || '').trim().toLowerCase();
      const myLeader =
        leaders.find(
          (ld) =>
            (currentUser?.assignedLeaderId && ld.id === currentUser.assignedLeaderId) ||
            (userEmail && ld.email.trim().toLowerCase() === userEmail) ||
            (userName && `${ld.firstName} ${ld.lastName}`.trim().toLowerCase() === userName)
        ) || null;
      const myLeaderId = myLeader?.id || currentUser?.assignedLeaderId;

      if (!myLeaderId) {
        return activeLetters.filter((l) =>
          userName && l.leaderName?.trim().toLowerCase().includes(userName)
        );
      }

      // Coordinators under this leader
      const myCoordinators = coordinators.filter((c) => c.leaderId === myLeaderId);
      const myCoordIds = new Set(myCoordinators.map((c) => c.id));
      const myCoordNames = new Set(
        myCoordinators.map((c) => `${c.firstName} ${c.lastName}`.trim().toLowerCase())
      );

      // Donors under these coordinators
      const myDonorIds = new Set(
        donors
          .filter((d) => d.coordinatorId && myCoordIds.has(d.coordinatorId))
          .map((d) => d.id)
      );

      return activeLetters.filter(
        (l) =>
          l.leaderId === myLeaderId ||
          (l.coordinatorId && myCoordIds.has(l.coordinatorId)) ||
          (l.coordinatorName && myCoordNames.has(l.coordinatorName.trim().toLowerCase())) ||
          (l.donorId && myDonorIds.has(l.donorId)) ||
          (myLeader &&
            l.leaderName &&
            l.leaderName.trim().toLowerCase() ===
              `${myLeader.firstName} ${myLeader.lastName}`.trim().toLowerCase())
      );
    }

    return activeLetters;
  }, [activeLetters, currentRole, currentUser, coordinators, leaders, donors]);

  // Coordinators available in the dropdown filter
  const availableFilterCoordinators = useMemo(() => {
    const userRoleLower = (currentUser?.roleName || currentRole).toLowerCase();
    if (userRoleLower === 'leader') {
      const userEmail = (currentUser?.email || '').trim().toLowerCase();
      const userName = (currentUser?.name || '').trim().toLowerCase();
      const myLeader = leaders.find(
        (ld) =>
          (currentUser?.assignedLeaderId && ld.id === currentUser.assignedLeaderId) ||
          (userEmail && ld.email.trim().toLowerCase() === userEmail) ||
          (userName && `${ld.firstName} ${ld.lastName}`.trim().toLowerCase() === userName)
      );
      if (!myLeader) return coordinators;
      return coordinators.filter((c) => c.leaderId === myLeader.id);
    }
    if (selectedLeaderFilter) {
      return coordinators.filter((c) => c.leaderId === selectedLeaderFilter);
    }
    return coordinators;
  }, [coordinators, currentUser, currentRole, leaders, selectedLeaderFilter]);

  // Filtered Letters
  const filteredLetters = useMemo(() => {
    return roleScopedLetters.filter((l) => {
      const query = search.toLowerCase();
      const matchSearch =
        !query ||
        l.id.toLowerCase().includes(query) ||
        String(l.folio).includes(query) ||
        l.kidName.toLowerCase().includes(query) ||
        l.celphone.includes(query) ||
        l.toyRequest.toLowerCase().includes(query);

      if (!matchSearch) return false;

      if (selectedLeaderFilter && l.leaderId !== selectedLeaderFilter) return false;
      if (selectedCoordFilter) {
        if (selectedCoordFilter === 'none') {
          if (l.coordinatorId) return false;
        } else if (l.coordinatorId !== selectedCoordFilter) {
          return false;
        }
      }
      if (selectedEventFilter && l.folioType !== selectedEventFilter) return false;
      if (genderFilter !== 'all' && l.gender !== genderFilter) return false;

      if (statusFilter === 'no-donor' && !!l.donorId) return false;
      if (statusFilter === 'no-coord' && !!l.coordinatorId) return false;
      if (statusFilter === 'no-presents' && (!l.donorId || l.presents.length > 0)) return false;
      if (statusFilter === 'fulfilled' && l.presents.length !== 1) return false;
      if (statusFilter === 'surplus' && l.presents.length < 2) return false;

      return true;
    });
  }, [
    roleScopedLetters,
    search,
    selectedLeaderFilter,
    selectedCoordFilter,
    selectedEventFilter,
    genderFilter,
    statusFilter,
    permissions.SCC,
  ]);

  const handleToggleSelect = (id: string) => {
    setSelectedLetterIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLetterIds.length === filteredLetters.length) {
      setSelectedLetterIds([]);
    } else {
      setSelectedLetterIds(filteredLetters.map((l) => l.id));
    }
  };

  const handleCreateLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formKidName.trim()) return;

    // Guard: Folio must be unique for chosen Tipo de Folio
    if (letters.some((l) => l.folioType === formFolioType && Number(l.folio) === Number(formFolio))) {
      return;
    }

    const letterId = `${formFolioType}-${formFolio}`;
    
    // For Coordinators, enforce auto-assignment
    const myCoord = coordinators.find((c) => c.email === currentUser?.email);
    const finalCoordId = isCoordinator ? myCoord?.id : formCoordId;
    const finalLeaderId = isCoordinator 
      ? myCoord?.leaderId 
      : formLeaderId;

    const selectedLeader = leaders.find((ld) => ld.id === finalLeaderId);
    const selectedCoord = coordinators.find((c) => c.id === finalCoordId);

    const newLetter: Letter = {
      id: letterId,
      folioType: formFolioType,
      folio: Number(formFolio),
      kidName: formKidName.trim(),
      age: formAge,
      gender: formGender,
      celphone: formPhone || '33 0000 0000',
      toyRequest: formToy,
      clothingRequest: formClothing,
      schoolItemRequest: formSchoolItem,
      clothingSize: formClothingSize,
      shoeSize: formShoeSize,
      leaderId: selectedLeader?.id,
      leaderName: selectedLeader ? `${selectedLeader.firstName} ${selectedLeader.lastName}` : undefined,
      coordinatorId: selectedCoord?.id,
      coordinatorName: selectedCoord ? `${selectedCoord.firstName} ${selectedCoord.lastName}` : undefined,
      photoUrl: formPhotoUrl || undefined,
      isLocked: false,
      presents: [],
      createdAt: new Date().toISOString().split('T')[0],
    };

    onSaveLetter(newLetter);
    setIsRegisterModalOpen(false);

    // Reset Form
    setFormKidName('');
    setFormToy('');
    setFormClothing('');
    setFormClothingSize('');
    setFormShoeSize('');
    setFormSchoolItem('');
    setFormPhone('');
    setFormPhotoUrl('');
    setFormFolio(getNextAvailableFolio(formFolioType));
  };

  const handleSavePresent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetterForGift) return;

    const newPresent: PresentItem = {
      id: `PRS-${Date.now()}`,
      type: giftType,
      description: giftDesc || `${giftType} para ${giftGender}`,
      ageRange: giftAgeRange,
      gender: giftGender,
      matching: giftMatching,
      isSurplus: giftIsSurplus,
      receivedDate: new Date().toISOString().split('T')[0],
      donorName: selectedLetterForGift.donorName || 'Padrino Voluntario',
    };

    onAddPresent(selectedLetterForGift.id, newPresent);
    setIsGiftModalOpen(false);
    setSelectedLetterForGift(null);
    setGiftDesc('');
  };

  const handleExecuteBulk = () => {
    if (!bulkTargetId || selectedLetterIds.length === 0) return;
    onBulkAssign(selectedLetterIds, bulkType, bulkTargetId);
    setIsBulkModalOpen(false);
    setSelectedLetterIds([]);
  };

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        setPhotoSizeError('add');
        e.target.value = '';
        return;
      }
      setPhotoSizeError(null);

      // Local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Firebase Storage
      try {
        setIsUploadingPhoto(true);
        const letterFolioId = `${formFolioType}-${formFolio}`;
        const res = await uploadLetterPhoto(letterFolioId, file);
        setFormPhotoUrl(res.photoUrl);
      } catch (err) {
        console.warn('Storage upload fallback to local data URL:', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleOpenEditLetter = (letter: Letter) => {
    setEditingLetter(letter);
    setEditFolioType(letter.folioType || 'A');
    setEditFolio(letter.folio || 101);
    setEditKidName(letter.kidName || '');
    setEditAge(letter.age ? Math.min(Math.max(Number(letter.age), 3), 15) : 8);
    setEditGender(letter.gender || 'Niño');
    setEditPhone(letter.celphone || '');
    setEditToy(letter.toyRequest || '');
    setEditClothing(letter.clothingRequest || '');
    setEditClothingSize(letter.clothingSize || '');
    setEditShoeSize(letter.shoeSize || '');
    setEditSchoolItem(letter.schoolItemRequest || '');

    if (isCoordinator) {
      const myCoord =
        myCoordObj ||
        coordinators.find(
          (c) =>
            c.email === currentUser?.email ||
            (currentUser?.assignedCoordinatorId && c.id === currentUser.assignedCoordinatorId) ||
            c.id === currentUser?.id
        );
      setEditCoordId(myCoord?.id || myCoordId || '');
      setEditLeaderId(myCoord?.leaderId || '');
    } else {
      setEditCoordId(letter.coordinatorId || '');
      setEditLeaderId(letter.leaderId || '');
    }

    setEditDonorId(letter.donorId || '');
    setPhotoSizeError(null);
    const picId = letter.picId || letter.photoMetadata?.picId || '';
    setEditPicId(picId);
    setEditPhotoMetadata(letter.photoMetadata || null);
    setEditPhotoUrl(letter.photoUrl && !letter.photoUrl.startsWith('/api/') ? letter.photoUrl : '');
    if (picId || letter.photoUrl) {
      resolveLetterPhotoUrl(picId, letter.photoMetadata?.storagePath, letter.photoUrl).then(
        (url) => setEditPhotoUrl(url)
      );
    }
    setIsEditModalOpen(true);
  };

  const handleEditCoordinatorChange = (coordId: string) => {
    setEditCoordId(coordId);
    if (coordId) {
      const matchedCoord = coordinators.find((c) => c.id === coordId);
      if (matchedCoord) {
        setEditLeaderId(matchedCoord.leaderId);
      }
    }
  };

  const handleOpenPhotoZoom = (targetPicId?: string, metadata?: LetterPhotoMetadata | null) => {
    const idToUse = targetPicId || editPicId || editingLetter?.picId || editingLetter?.photoMetadata?.picId;
    if (idToUse) {
      // Use picId to retrieve the file from the bucket and dispatch it to the UI
      setZoomPicId(idToUse);
      const zoomMeta = metadata || editPhotoMetadata || editingLetter?.photoMetadata || null;
      setZoomPhotoUrl(editPhotoUrl);
      resolveLetterPhotoUrl(idToUse, zoomMeta?.storagePath, editPhotoUrl).then((url) =>
        setZoomPhotoUrl(url)
      );
      setZoomPhotoMetadata(zoomMeta);
    } else if (editPhotoUrl) {
      setZoomPicId(null);
      setZoomPhotoUrl(editPhotoUrl);
      setZoomPhotoMetadata(null);
    }
  };

  const handleRemovePhoto = async () => {
    if (!editingLetter) return;
    const oldPicId = editPicId || editingLetter.picId || editingLetter.photoMetadata?.picId;

    setEditPhotoUrl('');
    setEditPicId('');
    setEditPhotoMetadata(null);

    if (oldPicId) {
      try {
        await deleteLetterPhoto(oldPicId, editingLetter.photoMetadata?.storagePath?.split('.').pop());
      } catch (err) {
        console.warn('Error deleting old letter photo:', err);
      }
    }

    try {
      await setDoc(
        doc(db, 'letters', editingLetter.id),
        { photoUrl: '', picId: '', photoMetadata: null },
        { merge: true }
      );
    } catch (dbErr) {
      console.warn('Could not clear photo reference in Firestore:', dbErr);
    }
  };

  const handleEditPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingLetter?.isLocked) return;
    const file = e.target.files?.[0];
    if (file && editingLetter) {
      if (file.size > MAX_PHOTO_SIZE_BYTES) {
        setPhotoSizeError('edit');
        e.target.value = '';
        return;
      }
      setPhotoSizeError(null);

      // Show preview immediately for instant visual response
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      try {
        setIsUploadingPhoto(true);
        const oldPicId = editPicId || editingLetter.picId || editingLetter.photoMetadata?.picId;
        const oldExt = editingLetter.photoMetadata?.storagePath?.split('.').pop();

        // Upload to backend storage and linked Firebase Storage bucket (gs://gen-lang-client-0695399990-regalos)
        const res = await uploadLetterPhoto(editingLetter.id, file, oldPicId, oldExt);
        setEditPicId(res.picId);
        setEditPhotoUrl(res.photoUrl);
        setEditPhotoMetadata(res.metadata);

        // Update the reference directly in Firestore letters and letter collections
        const photoUpdate = {
          picId: res.picId,
          photoUrl: res.photoUrl,
          photoMetadata: res.metadata,
        };
        try {
          await setDoc(doc(db, 'letters', editingLetter.id), photoUpdate, { merge: true });
        } catch (dbErr) {
          console.warn('Could not immediately update letter reference in Firestore:', dbErr);
        }
      } catch (err) {
        console.warn('Backend storage upload fallback to local preview:', err);
      } finally {
        setIsUploadingPhoto(false);
      }
    }
  };

  const handleSaveEditedLetter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLetter) return;
    if (editingLetter.isLocked) return; // Guard: Closed to edit

    // Guard: Folio must be unique for chosen Tipo de Folio
    if (
      letters.some(
        (l) =>
          l.id !== editingLetter.id &&
          l.folioType === editFolioType &&
          Number(l.folio) === Number(editFolio)
      )
    ) {
      return;
    }

    // For Coordinators, enforce auto-assignment of coordinator & coordinator's leader
    const myCoord = isCoordinator
      ? (myCoordObj ||
          coordinators.find(
            (c) =>
              c.email === currentUser?.email ||
              (currentUser?.assignedCoordinatorId && c.id === currentUser.assignedCoordinatorId) ||
              c.id === currentUser?.id
          ))
      : null;
    const finalCoordId = isCoordinator ? (myCoord?.id || myCoordId || editCoordId) : editCoordId;
    const finalLeaderId = isCoordinator ? (myCoord?.leaderId || editLeaderId) : editLeaderId;

    const selectedLeader = leaders.find((ld) => ld.id === finalLeaderId);
    const selectedCoord = coordinators.find((c) => c.id === finalCoordId);
    const selectedDonor = donors.find((d) => d.id === editDonorId);

    const oldId = editingLetter.id;
    const newId = `${editFolioType}-${editFolio}`;

    const updated: Letter = {
      ...editingLetter,
      id: newId,
      folioType: editFolioType,
      folio: Number(editFolio),
      kidName: editKidName.trim(),
      age: editAge,
      gender: editGender,
      celphone: editPhone.trim() || '33 0000 0000',
      toyRequest: editToy.trim(),
      clothingRequest: editClothing.trim(),
      clothingSize: editClothingSize.trim(),
      shoeSize: editShoeSize.trim(),
      schoolItemRequest: editSchoolItem.trim(),
      photoUrl: editPhotoUrl || undefined,
      picId: editPicId || undefined,
      photoMetadata: editPhotoMetadata || undefined,
      leaderId: selectedLeader?.id,
      leaderName: selectedLeader ? `${selectedLeader.firstName} ${selectedLeader.lastName}` : undefined,
      coordinatorId: selectedCoord?.id,
      coordinatorName: selectedCoord ? `${selectedCoord.firstName} ${selectedCoord.lastName}` : undefined,
      donorId: selectedDonor?.id,
      donorName: selectedDonor ? `${selectedDonor.firstName} ${selectedDonor.lastName}` : undefined,
    };

    onSaveLetter(updated, oldId);
    setIsEditModalOpen(false);
    setEditingLetter(null);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t.letters.title}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t.letters.subtitle}</p>
        </div>

        <div className="flex items-center gap-2">
          {selectedLetterIds.length > 0 && (
            <button
              onClick={handleOpenBulkModal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>
                {t.letters.bulkAssign} ({selectedLetterIds.length})
              </span>
            </button>
          )}

          {permissions.CLett && (
            <button
              onClick={() => {
                setFormFolio(getNextAvailableFolio(formFolioType));
                setPhotoSizeError(null);
                if (isCoordinator) {
                  const myCoord = coordinators.find((c) => c.email === currentUser?.email);
                  setFormCoordId(myCoord?.id || '');
                  setFormLeaderId(myCoord?.leaderId || '');
                }
                setIsRegisterModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>{t.letters.newLetter}</span>
            </button>
          )}
        </div>
      </div>

      {/* Grouped Filter & Letters List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Filter & Search Section with Legend */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <fieldset className="border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 sm:p-4 space-y-3 bg-slate-50/50 dark:bg-slate-800/30">
            <legend className="px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
              <Search className="w-3.5 h-3.5 text-blue-600" />
              <span>Search</span>
            </legend>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Live Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.letters.searchPlaceholder}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Giving Day Event Filter */}
              <div>
                <select
                  value={selectedEventFilter}
                  onChange={(e) => setSelectedEventFilter(e.target.value)}
                  className="w-full py-1.5 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                >
                  <option value="">{t.letters.filterEvent}: {t.letters.all}</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      Evento {ev.id} ({ev.location})
                    </option>
                  ))}
                </select>
              </div>

              {/* Leader Filter - only shown for Admin */}
              {!isCoordinator && (currentUser?.roleName || currentRole).toLowerCase() === 'admin' && (
                <div>
                  <select
                    value={selectedLeaderFilter}
                    onChange={(e) => {
                      setSelectedLeaderFilter(e.target.value);
                      setSelectedCoordFilter('');
                    }}
                    className="w-full py-1.5 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    <option value="">{t.letters.filterLeader}: {t.letters.all}</option>
                    {leaders.map((ld) => (
                      <option key={ld.id} value={ld.id}>
                        {ld.firstName} {ld.lastName} ({ld.teamColor})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Coordinator Filter - available for Admin and Leader */}
              {!isCoordinator && (
                <div>
                  <select
                    value={selectedCoordFilter}
                    onChange={(e) => setSelectedCoordFilter(e.target.value)}
                    className="w-full py-1.5 px-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300"
                  >
                    <option value="">
                      {language === 'es' ? 'Coordinador: Todos' : 'Coordinator: All'}
                    </option>
                    <option value="none">
                      {t.letters.noCoordBadge}
                    </option>
                    {availableFilterCoordinators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.id})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Status Quick Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <span className="text-slate-400 font-medium">{t.letters.filterStatus}:</span>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  statusFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {t.letters.all} ({roleScopedLetters.length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('no-donor')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  statusFilter === 'no-donor'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {t.letters.noDonorBadge} ({roleScopedLetters.filter((l) => !l.donorId).length})
              </button>
              {!isCoordinator && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('no-coord')}
                  className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                    statusFilter === 'no-coord'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-purple-50 dark:bg-purple-950 text-purple-800 dark:text-purple-200 border border-purple-200 dark:border-purple-800'
                  }`}
                >
                  {t.letters.noCoordBadge} ({roleScopedLetters.filter((l) => !l.coordinatorId).length})
                </button>
              )}
              <button
                type="button"
                onClick={() => setStatusFilter('no-presents')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  statusFilter === 'no-presents'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {t.letters.withDonorNoGift} ({roleScopedLetters.filter((l) => !!l.donorId && l.presents.length === 0).length})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('fulfilled')}
                className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                  statusFilter === 'fulfilled'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                }`}
              >
                {t.letters.fulfilled} ({roleScopedLetters.filter((l) => l.presents.length === 1).length})
              </button>
              {!isCoordinator && (
                <button
                  type="button"
                  onClick={() => setStatusFilter('surplus')}
                  className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
                    statusFilter === 'surplus'
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-indigo-50 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800'
                  }`}
                >
                  {t.letters.surplus} ({roleScopedLetters.filter((l) => l.presents.length > 1).length})
                </button>
              )}
            </div>
          </fieldset>
        </div>

        {/* Main Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold uppercase text-[11px]">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredLetters.length > 0 &&
                      selectedLetterIds.length === filteredLetters.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="p-3 whitespace-nowrap">Foto</th>
                <th className="p-3 whitespace-nowrap">{t.letters.id}</th>
                <th className="p-3 whitespace-nowrap">{t.letters.kid} / {t.letters.age}</th>
                <th className="p-3 min-w-[200px]">{t.letters.toy}</th>
                {!isCoordinator && (
                  <th className="p-3 whitespace-nowrap">{t.letters.leader}</th>
                )}
                {permissions.SCC && (
                  <th className="p-3 whitespace-nowrap">{t.letters.coordinator}</th>
                )}
                <th className="p-3 whitespace-nowrap">{t.letters.donor}</th>
                <th className="p-3 whitespace-nowrap text-center">{t.letters.presentsCount}</th>
                <th className="p-3 text-right whitespace-nowrap">{t.letters.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLetters.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      8 +
                      (!isCoordinator ? 1 : 0) +
                      (permissions.SCC ? 1 : 0)
                    }
                    className="p-8 text-center text-slate-400"
                  >
                    <Gift className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-medium text-slate-600 dark:text-slate-400">
                      {language === 'es' ? 'No se encontraron cartas' : 'No letters found'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLetters.map((l) => {
                  const isSelected = selectedLetterIds.includes(l.id);
                  const presentsCount = l.presents.length;
                  const isLocked = !!l.isLocked;

                  return (
                    <tr
                      key={l.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(l.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="p-3">
                        {l.photoUrl ? (
                          <button
                            onClick={async () =>
                              setZoomPhotoUrl(
                                (await resolveLetterPhotoUrl(
                                  l.picId || l.photoMetadata?.picId,
                                  l.photoMetadata?.storagePath,
                                  l.photoUrl
                                )) || l.photoUrl!
                              )
                            }
                            className="w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 hover:ring-2 hover:ring-blue-500 transition-all flex items-center justify-center bg-slate-100"
                            title="Ver fotografía de la carta"
                          >
                            <LetterThumb letter={l} alt="Carta física"
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400">
                            <Camera className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </td>

                      {/* Folio ID */}
                      <td className="p-3 font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditLetter(l)}
                            className="group inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 hover:border-blue-300 dark:border-slate-700 text-slate-900 dark:text-white hover:text-blue-600 transition-colors cursor-pointer"
                            title={isLocked ? (language === 'es' ? 'Ver carta (Cerrada para edición)' : 'View letter (Closed to edit)') : (language === 'es' ? 'Editar carta' : 'Edit letter')}
                          >
                            <span>{l.id}</span>
                            <Pencil className="w-3 h-3 text-slate-400 group-hover:text-blue-600 opacity-60 group-hover:opacity-100" />
                          </button>
                          {isLocked && (
                            <span title="Captura cerrada / bloqueada (NC)">
                              <Lock className="w-3.5 h-3.5 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Kid & Age */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-white">{l.kidName}</div>
                        <div className="text-[11px] text-slate-500">
                          {l.age}a · {l.gender} · {l.celphone}
                        </div>
                      </td>

                      {/* Toy (Priority request) */}
                      <td className="p-3">
                        <div className="flex items-start gap-1">
                          <Star className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="font-medium text-slate-900 dark:text-white line-clamp-2">
                            {l.toyRequest}
                          </span>
                        </div>
                      </td>

                      {/* Leader */}
                      {!isCoordinator && (
                        <td className="p-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {l.leaderName || '—'}
                        </td>
                      )}

                      {/* Coordinator */}
                      {permissions.SCC && (
                        <td className="p-3 whitespace-nowrap text-slate-700 dark:text-slate-300">
                          {l.coordinatorName || '—'}
                        </td>
                      )}

                      {/* Donor */}
                      <td className="p-3 whitespace-nowrap">
                        {l.donorName ? (
                          <div className="font-medium text-emerald-800 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 inline-block">
                            {l.donorName}
                          </div>
                        ) : (
                          <span className="text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800 inline-block font-medium">
                            {t.letters.noDonorBadge}
                          </span>
                        )}
                      </td>

                      {/* Presents Count */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-xs tabular-nums ${
                            presentsCount === 0
                              ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                              : presentsCount === 1
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                              : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-800'
                          }`}
                        >
                          {presentsCount}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* Edit Letter */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditLetter(l)}
                            title={
                              isLocked
                                ? (language === 'es' ? 'Ver carta (Cerrada para edición)' : 'View letter (Closed to edit)')
                                : (language === 'es' ? 'Editar carta' : 'Edit letter')
                            }
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          {/* Record Gift */}
                          <button
                            onClick={() => {
                              setSelectedLetterForGift(l);
                              setIsGiftModalOpen(true);
                            }}
                            disabled={isLocked && currentRole !== 'Admin'}
                            title={isLocked ? 'Captura cerrada' : 'Registrar regalo en Centro de Acopio'}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <PackagePlus className="w-4 h-4" />
                          </button>

                          {/* Archive Letter */}
                          {(currentRole === 'Admin' || currentRole === 'Leader') && (
                            <button
                              onClick={() => onArchiveLetter(l.id)}
                              disabled={isLocked && currentRole !== 'Admin'}
                              title="Mover al archivo recuperable"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-md disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
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

      {/* ================= MODAL: REGISTRAR CARTA ================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'es' ? 'Registrar Carta (Fase 1)' : 'Register Letter (Phase 1)'}
                </h3>
                <p className="text-xs text-slate-500">
                  {language === 'es' ? 'Captura del formato físico: Folio manual, Día de entrega y fotografía adjunta.' : 'Capture physical form: Manual folio, Delivery day and attached photo.'}
                </p>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLetter} className="space-y-3 text-xs">
              {/* Row: Folio Type & Numeric Folio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl">
                <div>
                  <label className="font-semibold text-blue-900 dark:text-blue-200 block mb-1">
                    {language === 'es' ? 'Tipo de Folio (Día de Entrega) *' : 'Folio Type (Delivery Day) *'}
                  </label>
                  <select
                    value={formFolioType}
                    onChange={(e) => {
                      const newType = e.target.value;
                      setFormFolioType(newType);
                      setFormFolio(getNextAvailableFolio(newType));
                    }}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                  >
                    {events.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.id} - {ev.location} ({ev.dates})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-blue-900 dark:text-blue-200 block mb-1">
                    {language === 'es' ? 'Número de Folio Manual (de la carta física) *' : 'Manual Folio Number (from physical letter) *'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formFolio}
                    onChange={(e) => setFormFolio(parseInt(e.target.value) || 1)}
                    className={`w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white font-mono font-bold ${
                      isAddFolioDuplicate
                        ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-900 dark:text-rose-200'
                        : 'border-blue-300 dark:border-blue-700'
                    }`}
                  />
                </div>

                {isAddFolioDuplicate && (
                  <div className="sm:col-span-2 p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">
                        {language === 'es' ? 'Folio ya registrado' : 'Folio already registered'}
                      </span>
                      <span>
                        {language === 'es'
                          ? `El Folio #${formFolio} ya existe para el Tipo de Folio "${formFolioType}". El valor de Folio debe ser único para cada tipo de folio.`
                          : `Folio #${formFolio} already exists for Folio Type "${formFolioType}". Folio must be unique for the chosen type.`}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Kid Name, Age, Gender, School */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'es' ? 'Nombre del Niño *' : 'Kid Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formKidName}
                    onChange={(e) => setFormKidName(e.target.value)}
                    placeholder={language === 'es' ? 'Ej. Juan Carlos Morales' : 'e.g. John Doe'}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'es' ? 'Edad *' : 'Age *'}
                  </label>
                  <select
                    value={formAge}
                    onChange={(e) => setFormAge(parseInt(e.target.value) || 8)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    {Array.from({ length: 13 }, (_, i) => i + 3).map((age) => (
                      <option key={age} value={age}>
                        {age}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'es' ? 'Teléfono Celular *' : 'Cell Phone *'}
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="33 1234 5678"
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'es' ? 'Talla Ropa' : 'Clothing Size'}
                  </label>
                  <input
                    type="text"
                    value={formClothingSize}
                    onChange={(e) => setFormClothingSize(e.target.value)}
                    placeholder={language === 'es' ? 'Ej. 10' : 'e.g. 10'}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    {language === 'es' ? 'Talla Zapato' : 'Shoe Size'}
                  </label>
                  <input
                    type="text"
                    value={formShoeSize}
                    onChange={(e) => setFormShoeSize(e.target.value)}
                    placeholder={language === 'es' ? 'Ej. 21' : 'e.g. 21'}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Three gift options */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
                    <Star className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'es' ? 'Opción 1: Juguete (¡Prioridad!)' : 'Option 1: Toy (Priority!)'}</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formToy}
                    onChange={(e) => setFormToy(e.target.value)}
                    placeholder={language === 'es' ? 'Ej. Carro a control remoto, muñeca, patines...' : 'e.g. Car, doll, skates...'}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'es' ? 'Opción 2: Ropa' : 'Option 2: Clothing'}
                    </label>
                    <input
                      type="text"
                      value={formClothing}
                      onChange={(e) => setFormClothing(e.target.value)}
                      placeholder={language === 'es' ? 'Sudadera talla 10...' : 'Sweater size 10...'}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'es' ? 'Opción 3: Útil Escolar' : 'Option 3: School Item'}
                    </label>
                    <input
                      type="text"
                      value={formSchoolItem}
                      onChange={(e) => setFormSchoolItem(e.target.value)}
                      placeholder={language === 'es' ? 'Mochila reforzada...' : 'Reinforced backpack...'}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {!isCoordinator && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Coordinador (Opcional)
                    </label>
                    <select
                      value={formCoordId}
                      onChange={(e) => handleCoordinatorChange(e.target.value)}
                      className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="">Sin coordinador por ahora</option>
                      {coordinators.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                      <span>Líder (Opcional)</span>
                      {isLeaderReadOnly && (
                        <span className="text-[10px] text-amber-600 font-mono">(Prefijado por coord.)</span>
                      )}
                    </label>
                    <select
                      value={formLeaderId}
                      disabled={isLeaderReadOnly}
                      onChange={(e) => setFormLeaderId(e.target.value)}
                      className={`w-full p-2 rounded-lg border text-slate-900 dark:text-white ${
                        isLeaderReadOnly
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <option value="">Sin asignar</option>
                      {leaders.map((ld) => (
                        <option key={ld.id} value={ld.id}>
                          {ld.firstName} {ld.lastName} ({ld.teamColor})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Photo Upload Attachment */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-600" />
                  <span>Foto de la Carta Física</span>
                </span>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isUploadingPhoto}
                    className="text-[11px] text-slate-600 dark:text-slate-400 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {isUploadingPhoto && (
                    <span className="flex items-center gap-1 text-xs text-blue-600 animate-pulse font-medium">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Subiendo...
                    </span>
                  )}
                  {formPhotoUrl && !isUploadingPhoto && (
                    <img
                      src={formPhotoUrl}
                      alt="Preview"
                      className="w-10 h-10 object-cover rounded border border-slate-300"
                    />
                  )}
                </div>
                <p className="text-[10px] text-slate-400">
                  {language === 'es' ? 'Tamaño máximo: 3 MB.' : 'Maximum size: 3 MB.'}
                </p>
                {photoSizeError === 'add' && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {language === 'es'
                        ? 'La foto supera el límite de 3 MB. Elige un archivo más pequeño.'
                        : 'The photo exceeds the 3 MB limit. Choose a smaller file.'}
                    </span>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isAddFolioDuplicate || !formKidName.trim() || isUploadingPhoto}
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg shadow-2xs transition-colors"
                >
                  {language === 'es' ? 'Guardar Carta' : 'Save Letter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REGISTRAR REGALO EN ACOPIO ================= */}
      {isGiftModalOpen && selectedLetterForGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.letters.recordGift} (Folio {selectedLetterForGift.id})
              </h3>
              <button onClick={() => setIsGiftModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedLetterForGift.presents.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-xs space-y-1">
                <h4 className="font-bold text-slate-700 dark:text-slate-300">
                  {language === 'es' ? 'Regalos ya registrados:' : 'Already registered gifts:'}
                </h4>
                <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-0.5">
                  {selectedLetterForGift.presents.map((p) => (
                    <li key={p.id}>
                      {p.type}: {p.description}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <form onSubmit={handleSavePresent} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'es' ? 'Tipo de Regalo *' : 'Gift Type *'}
                </label>
                <select
                  value={giftType}
                  onChange={(e) => setGiftType(e.target.value as PresentType)}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <option value="Juguete">{language === 'es' ? 'Juguete' : 'Toy'}</option>
                  <option value="Ropa">{language === 'es' ? 'Ropa' : 'Clothing'}</option>
                  <option value="Útil Escolar">{language === 'es' ? 'Útil Escolar' : 'School Item'}</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {language === 'es' ? 'Descripción del Regalo *' : 'Gift Description *'}
                </label>
                <input
                  type="text"
                  required
                  value={giftDesc}
                  onChange={(e) => setGiftDesc(e.target.value)}
                  placeholder={language === 'es' ? 'Ej. Set muñeca veterinaria' : 'e.g. Vet doll set'}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {hideGiftMatching !== 'Y' && (
                <div className="p-3 border border-slate-200 dark:border-slate-700 rounded-lg space-y-3 bg-slate-50 dark:bg-slate-800/30">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider">
                    {language === 'es' ? 'Grado de Coincidencia de Regalo' : 'Gift Matching Grade'}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'es' ? 'Rango de Edad *' : 'Age Range *'}
                      </label>
                      <select
                        value={giftAgeRange}
                        onChange={(e) => setGiftAgeRange(e.target.value as AgeRange)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      >
                        <option value="3-6">3-6</option>
                        <option value="6-9">6-9</option>
                        <option value="9-12">9-12</option>
                        <option value="3-12">3-12</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'es' ? 'Género *' : 'Gender *'}
                      </label>
                      <select
                        value={giftGender}
                        onChange={(e) => setGiftGender(e.target.value as Gender)}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                      >
                        <option value="Niño">{language === 'es' ? 'Niño' : 'Boy'}</option>
                        <option value="Niña">{language === 'es' ? 'Niña' : 'Girl'}</option>
                        <option value="Unisex">{language === 'es' ? 'Unisex' : 'Unisex'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'es' ? 'Grado de Coincidencia *' : 'Matching Grade *'}
                    </label>
                    <select
                      value={giftMatching}
                      onChange={(e) => setGiftMatching(e.target.value as MatchingGrade)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value="specific">{language === 'es' ? 'Muy específica y coincide (Exacto)' : 'Specific and matching (Exact)'}</option>
                      <option value="vague">{language === 'es' ? 'Vaga y coincide (Aceptable)' : 'Vague and matching (Acceptable)'}</option>
                      <option value="mismatch">{language === 'es' ? 'NO coincide con la petición (Mismatch)' : 'Does NOT match request (Mismatch)'}</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGiftModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  {language === 'es' ? 'Cancelar' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs"
                >
                  {language === 'es' ? 'Guardar Regalo' : 'Save Gift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ASIGNACIÓN MASIVA ================= */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {t.letters.bulkAssign}
              </h3>
              <button onClick={() => setIsBulkModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div
                className={`grid gap-2 ${
                  isAdmin ? 'grid-cols-3' : !isCoordinator ? 'grid-cols-2' : 'grid-cols-1'
                }`}
              >
                {/* 1. Hide "A Lider" button when the logged-in user is not Admin */}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setBulkType('leader');
                      setBulkTargetId('');
                    }}
                    className={`p-2 rounded-lg border font-bold text-center transition-colors cursor-pointer ${
                      bulkType === 'leader'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    A Líder
                  </button>
                )}

                {/* 2. Hide "A Coordinador" button when the logged-in user is a Coordinator */}
                {!isCoordinator && (
                  <button
                    type="button"
                    onClick={() => {
                      setBulkType('coordinator');
                      setBulkTargetId('');
                    }}
                    className={`p-2 rounded-lg border font-bold text-center transition-colors cursor-pointer ${
                      bulkType === 'coordinator'
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200 shadow-2xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    A Coord.
                  </button>
                )}

                {/* 3. A Padrino button */}
                <button
                  type="button"
                  onClick={() => {
                    setBulkType('donor');
                    setBulkTargetId('');
                  }}
                  className={`p-2 rounded-lg border font-bold text-center transition-colors cursor-pointer ${
                    bulkType === 'donor'
                      ? 'border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-200 shadow-2xs'
                      : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  A Padrino
                </button>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Destinatario *
                </label>
                {bulkType === 'leader' && (
                  <select
                    value={bulkTargetId}
                    onChange={(e) => setBulkTargetId(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">
                      {language === 'es' ? 'Selecciona Líder...' : 'Select Leader...'}
                    </option>
                    {leaders.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.firstName} {l.lastName} ({l.teamColor})
                      </option>
                    ))}
                  </select>
                )}

                {/* 3. When a Leader is logged-in, only list his coordinators */}
                {bulkType === 'coordinator' && (
                  <select
                    value={bulkTargetId}
                    onChange={(e) => setBulkTargetId(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">
                      {bulkModalCoordinators.length === 0
                        ? (language === 'es' ? 'No hay coordinadores disponibles' : 'No coordinators available')
                        : (language === 'es' ? 'Selecciona Coordinador...' : 'Select Coordinator...')}
                    </option>
                    {bulkModalCoordinators.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.firstName} {c.lastName} ({c.id})
                      </option>
                    ))}
                  </select>
                )}

                {/* 4. When a Coordinator is logged-in, only list his Padrinos */}
                {bulkType === 'donor' && (
                  <select
                    value={bulkTargetId}
                    onChange={(e) => setBulkTargetId(e.target.value)}
                    className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="">
                      {bulkModalDonors.length === 0
                        ? (language === 'es' ? 'No tienes padrinos asignados' : 'No donors assigned')
                        : (language === 'es' ? 'Selecciona Padrino...' : 'Select Donor...')}
                    </option>
                    {bulkModalDonors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.firstName} {d.lastName} ({d.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBulkModalOpen(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!bulkTargetId}
                  onClick={handleExecuteBulk}
                  className="px-4 py-2 font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg shadow-2xs"
                >
                  Aplicar Asignación
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDITAR / VER CARTA ================= */}
      {isEditModalOpen && editingLetter && (() => {
        const isClosedToEdit = !!editingLetter.isLocked;
        const isEditLeaderReadOnly = isClosedToEdit || !!editCoordId;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {editingLetter.id}
                      </span>
                      <span>
                        {isClosedToEdit
                          ? (language === 'es' ? 'Detalles de la Carta' : 'Letter Details')
                          : (language === 'es' ? 'Editar Carta' : 'Edit Letter')}
                      </span>
                    </h3>
                    {isClosedToEdit ? (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        <span>{language === 'es' ? 'Cerrada para Edición (NC)' : 'Closed to Edit (NC)'}</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                        <Unlock className="w-3 h-3" />
                        <span>{language === 'es' ? 'Abierta para Edición' : 'Open for Editing'}</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isClosedToEdit
                      ? (language === 'es'
                          ? 'Esta carta ha sido cerrada para edición. Los datos se muestran en modo solo lectura.'
                          : 'This letter has been closed to edit. Data is displayed in read-only mode.')
                      : (language === 'es'
                          ? 'Modifica los datos del niño, regalos solicitados o asignaciones.'
                          : 'Update child information, gift requests, or assignments.')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingLetter(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Read-Only Banner when Closed to Edit */}
              {isClosedToEdit && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/70 border-2 border-amber-300 dark:border-amber-800 rounded-xl flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs font-semibold shadow-xs">
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    {language === 'es'
                      ? 'Carta cerrada para edición mediante Cierre de Captura (NC). Los campos no pueden modificarse.'
                      : 'Letter closed to edit via Closing Capture (NC). Fields cannot be modified.'}
                  </span>
                </div>
              )}

              {/* Form Body */}
              <form onSubmit={handleSaveEditedLetter} className="space-y-3 text-xs">
                {/* Identification / Folio Row */}
                {isClosedToEdit ? (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">Folio ID</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">{editingLetter.id}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        {language === 'es' ? 'Evento / Letra' : 'Event / Letter'}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Evento {editingLetter.folioType} (Folio #{editingLetter.folio})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase">
                        {language === 'es' ? 'Fecha Registro' : 'Created Date'}
                      </span>
                      <span className="text-slate-700 dark:text-slate-300 font-mono">
                        {editingLetter.createdAt || 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl">
                    <div>
                      <label className="font-semibold text-blue-900 dark:text-blue-200 block mb-1">
                        {language === 'es' ? 'Tipo de Folio (Día de Entrega) *' : 'Folio Type (Event Day) *'}
                      </label>
                      <select
                        value={editFolioType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setEditFolioType(newType);
                          const conflict = letters.some(
                            (l) =>
                              l.id !== editingLetter.id &&
                              l.folioType === newType &&
                              Number(l.folio) === Number(editFolio)
                          );
                          if (conflict) {
                            setEditFolio(getNextAvailableFolio(newType, editingLetter.id));
                          }
                        }}
                        className="w-full p-2 bg-white dark:bg-slate-800 border border-blue-300 dark:border-blue-700 rounded-lg text-slate-900 dark:text-white font-mono font-bold"
                      >
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.id} - {ev.location} ({ev.dates})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-blue-900 dark:text-blue-200 block mb-1">
                        {language === 'es' ? 'Número de Folio Manual *' : 'Manual Folio Number *'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={editFolio}
                        onChange={(e) => setEditFolio(parseInt(e.target.value) || 1)}
                        className={`w-full p-2 bg-white dark:bg-slate-800 border rounded-lg text-slate-900 dark:text-white font-mono font-bold ${
                          isEditFolioDuplicate
                            ? 'border-rose-500 ring-2 ring-rose-500/20 text-rose-900 dark:text-rose-200'
                            : 'border-blue-300 dark:border-blue-700'
                        }`}
                      />
                    </div>

                    {isEditFolioDuplicate ? (
                      <div className="sm:col-span-2 p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">
                            {language === 'es' ? 'Folio ya registrado' : 'Folio already in use'}
                          </span>
                          <span>
                            {language === 'es'
                              ? `El Folio #${editFolio} ya está en uso por otra carta para el Tipo de Folio "${editFolioType}". El valor de Folio debe ser único para el tipo de folio seleccionado.`
                              : `Folio #${editFolio} is already in use by another letter for Folio Type "${editFolioType}". Folio must be unique for the chosen type.`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="sm:col-span-2 text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center justify-between font-mono bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        <span className="flex items-center gap-1 font-sans font-medium">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{language === 'es' ? 'Folio único y disponible' : 'Unique folio available'}</span>
                        </span>
                        <span className="font-bold text-xs bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-emerald-300">
                          ID Resultante: {editFolioType}-{editFolio}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Kid Name, Age, Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'es' ? 'Nombre del Niño *' : 'Kid Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      readOnly={isClosedToEdit}
                      disabled={isClosedToEdit}
                      value={editKidName}
                      onChange={(e) => setEditKidName(e.target.value)}
                      className={`w-full p-2 rounded-lg border transition-colors ${
                        isClosedToEdit
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'es' ? 'Edad *' : 'Age *'}
                    </label>
                    <select
                      disabled={isClosedToEdit}
                      value={editAge}
                      onChange={(e) => setEditAge(parseInt(e.target.value) || 8)}
                      className={`w-full p-2 rounded-lg border transition-colors ${
                        isClosedToEdit
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500'
                      }`}
                    >
                      {Array.from({ length: 13 }, (_, i) => i + 3).map((age) => (
                        <option key={age} value={age}>
                          {age}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Gender & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'es' ? 'Género *' : 'Gender *'}
                    </label>
                    <select
                      disabled={isClosedToEdit}
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as 'Niño' | 'Niña')}
                      className={`w-full p-2 rounded-lg border transition-colors ${
                        isClosedToEdit
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                      }`}
                    >
                      <option value="Niño">{language === 'es' ? 'Niño' : 'Boy'}</option>
                      <option value="Niña">{language === 'es' ? 'Niña' : 'Girl'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'es' ? 'Teléfono Celular *' : 'Cell Phone *'}
                    </label>
                    <input
                      type="text"
                      readOnly={isClosedToEdit}
                      disabled={isClosedToEdit}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="33 1234 5678"
                      className={`w-full p-2 rounded-lg border transition-colors ${
                        isClosedToEdit
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:border-blue-500'
                      }`}
                    />
                  </div>
                </div>

                {/* Gift Requests */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="p-2.5 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-bold">
                      <Star className="w-3.5 h-3.5 text-amber-600" />
                      <span>{language === 'es' ? 'Opción 1: Juguete (¡Prioridad!)' : 'Option 1: Toy (Priority!)'}</span>
                    </div>
                    <input
                      type="text"
                      required
                      readOnly={isClosedToEdit}
                      disabled={isClosedToEdit}
                      value={editToy}
                      onChange={(e) => setEditToy(e.target.value)}
                      placeholder="Ej. Carro a control remoto, muñeca, patines..."
                      className={`w-full p-2 rounded-lg border transition-colors ${
                        isClosedToEdit
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800 border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white'
                      }`}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'es' ? 'Opción 2: Ropa' : 'Option 2: Clothing'}
                      </label>
                      <input
                        type="text"
                        readOnly={isClosedToEdit}
                        disabled={isClosedToEdit}
                        value={editClothing}
                        onChange={(e) => setEditClothing(e.target.value)}
                        placeholder="Sudadera talla 10..."
                        className={`w-full p-2 rounded-lg border transition-colors ${
                          isClosedToEdit
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                        }`}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Talla Ropa
                          </label>
                          <input
                            type="text"
                            readOnly={isClosedToEdit}
                            disabled={isClosedToEdit}
                            value={editClothingSize}
                            onChange={(e) => setEditClothingSize(e.target.value)}
                            placeholder="Ej. 10"
                            className={`w-full p-2 rounded-lg border transition-colors ${
                                isClosedToEdit
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                              }`}
                          />
                        </div>
                        <div>
                          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                            Talla Zapato
                          </label>
                          <input
                            type="text"
                            readOnly={isClosedToEdit}
                            disabled={isClosedToEdit}
                            value={editShoeSize}
                            onChange={(e) => setEditShoeSize(e.target.value)}
                            placeholder="Ej. 21"
                            className={`w-full p-2 rounded-lg border transition-colors ${
                                isClosedToEdit
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                                  : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                              }`}
                          />
                        </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        {language === 'es' ? 'Opción 3: Útil Escolar' : 'Option 3: School Item'}
                      </label>
                      <input
                        type="text"
                        readOnly={isClosedToEdit}
                        disabled={isClosedToEdit}
                        value={editSchoolItem}
                        onChange={(e) => setEditSchoolItem(e.target.value)}
                        placeholder="Mochila reforzada..."
                        className={`w-full p-2 rounded-lg border transition-colors ${
                          isClosedToEdit
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                            : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Assignments Section: Coordinator, Leader, Donor */}
                <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  {!isCoordinator && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          {language === 'es' ? 'Coordinador Asignado' : 'Assigned Coordinator'}
                        </label>
                        <select
                          disabled={isClosedToEdit}
                          value={editCoordId}
                          onChange={(e) => handleEditCoordinatorChange(e.target.value)}
                          className={`w-full p-2 rounded-lg border transition-colors ${
                            isClosedToEdit
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                          }`}
                        >
                          <option value="">{language === 'es' ? 'Sin coordinador asignado' : 'No coordinator assigned'}</option>
                          {coordinators.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.firstName} {c.lastName} ({c.id})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                          <span>{language === 'es' ? 'Líder Asignado' : 'Assigned Leader'}</span>
                          {editCoordId && !isClosedToEdit && (
                            <span className="text-[10px] text-amber-600 font-mono">(Prefijado por coord.)</span>
                          )}
                        </label>
                        <select
                          disabled={isEditLeaderReadOnly}
                          value={editLeaderId}
                          onChange={(e) => setEditLeaderId(e.target.value)}
                          className={`w-full p-2 rounded-lg border transition-colors ${
                            isEditLeaderReadOnly
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                              : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                          }`}
                        >
                          <option value="">{language === 'es' ? 'Sin líder asignado' : 'No leader assigned'}</option>
                          {leaders.map((ld) => (
                            <option key={ld.id} value={ld.id}>
                              {ld.firstName} {ld.lastName} ({ld.teamColor})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      {language === 'es' ? 'Padrino Donante Asignado' : 'Assigned Donor Sponsor'}
                    </label>
                    <select
                      disabled={isClosedToEdit}
                      value={editDonorId}
                      onChange={(e) => setEditDonorId(e.target.value)}
                      className={`w-full p-2 rounded-lg border transition-colors ${
                        isClosedToEdit
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 cursor-not-allowed border-slate-200 dark:border-slate-700'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white'
                      }`}
                    >
                      <option value="">{language === 'es' ? 'Sin padrino asignado (disponible)' : 'No donor assigned (available)'}</option>
                      {donors
                        .filter((d) => !editCoordId || d.coordinatorId === editCoordId)
                        .map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.firstName} {d.lastName} ({d.email})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Photo Section */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                      <Camera className="w-4 h-4 text-blue-600" />
                      <span>{language === 'es' ? 'Foto de la Carta Física' : 'Physical Letter Photo'}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {(editPhotoUrl || editPicId) && (
                        <button
                          type="button"
                          onClick={() => handleOpenPhotoZoom(editPicId, editPhotoMetadata)}
                          className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{language === 'es' ? 'Ver Ampliada' : 'Zoom Photo'}</span>
                        </button>
                      )}
                      {(editPhotoUrl || editPicId) && !isClosedToEdit && (
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="text-[11px] text-red-500 hover:text-red-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>{language === 'es' ? 'Quitar' : 'Remove'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {(editPhotoUrl || editPicId) ? (
                      <div
                        className="relative group w-20 h-20 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-600 shrink-0 bg-slate-100 cursor-pointer shadow-xs"
                        onClick={() => handleOpenPhotoZoom(editPicId, editPhotoMetadata)}
                        title={language === 'es' ? 'Clic para recuperar del bucket y ver ampliada' : 'Click to retrieve from bucket and zoom'}
                      >
                        <img
                          src={editPhotoUrl}
                          alt="Carta física"
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          onError={(err) => {
                            console.warn('Failed to load letter photo preview:', err);
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0 border border-dashed border-slate-300 dark:border-slate-600">
                        <Camera className="w-7 h-7" />
                      </div>
                    )}

                    {!isClosedToEdit ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="file"
                          accept="image/*,.jpg,.jpeg,.png,.gif,.bmp"
                          onChange={handleEditPhotoChange}
                          disabled={isUploadingPhoto}
                          className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 cursor-pointer"
                        />
                        {isUploadingPhoto ? (
                          <div className="flex items-center gap-1.5 text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{language === 'es' ? 'Almacenando en bucket Firebase y backend...' : 'Storing in Firebase bucket & backend...'}</span>
                          </div>
                        ) : (editPhotoUrl || editPicId) ? (
                          <div className="space-y-1.5 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px]">
                            {editPhotoMetadata?.fileType && (
                              <div className="flex items-center justify-end gap-1">
                                <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300">
                                  {editPhotoMetadata.fileType}
                                </span>
                              </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400">
                              {editPhotoMetadata?.originalName && (
                                <div className="truncate">
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">Archivo:</span> {editPhotoMetadata.originalName}
                                </div>
                              )}
                              {editPhotoMetadata?.size !== undefined && (
                                <div>
                                  <span className="font-semibold text-slate-700 dark:text-slate-300">Tamaño:</span> {formatBytes(editPhotoMetadata.size)}
                                </div>
                              )}

                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-slate-400">
                            {language === 'es'
                              ? 'Formatos aceptados: JPG, GIF, BMP, PNG, JPEG. Tamaño máximo: 3 MB.'
                              : 'Accepted formats: JPG, GIF, BMP, PNG, JPEG. Maximum size: 3 MB.'}
                          </p>
                        )}
                        {photoSizeError === 'edit' && (
                          <div className="flex items-center gap-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {language === 'es'
                                ? 'La foto supera el límite de 3 MB. Elige un archivo más pequeño.'
                                : 'The photo exceeds the 3 MB limit. Choose a smaller file.'}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 space-y-1">
                        <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                          {(editPhotoUrl || editPicId)
                            ? (language === 'es' ? 'Fotografía física registrada en el bucket' : 'Physical letter photo registered in bucket')
                            : (language === 'es' ? 'Sin fotografía registrada' : 'No photo registered')}
                        </div>
                        
                      </div>
                    )}
                  </div>
                </div>

                {/* Presents Summary (if any) */}
                {editingLetter.presents && editingLetter.presents.length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'es' ? 'Regalos Registrados en Acopio' : 'Gathered Presents'} ({editingLetter.presents.length})</span>
                    </span>
                    <div className="space-y-1.5">
                      {editingLetter.presents.map((p) => (
                        <div
                          key={p.id}
                          className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white mr-1.5">{p.type}:</span>
                            <span className="text-slate-700 dark:text-slate-300">{p.description}</span>
                          </div>
                          <span className="font-mono text-[10px] text-slate-400">{p.receivedDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Modal Footer */}
                {isClosedToEdit ? (
                  <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs font-medium">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === 'es' ? 'Modo solo lectura activado' : 'Read-only mode active'}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingLetter(null);
                      }}
                      className="px-5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                    >
                      {language === 'es' ? 'Cerrar' : 'Close'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditModalOpen(false);
                        setEditingLetter(null);
                      }}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                    >
                      {language === 'es' ? 'Cancelar' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={isEditFolioDuplicate || !editKidName.trim() || isUploadingPhoto}
                      className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'es' ? 'Guardar Cambios' : 'Save Changes'}</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        );
      })()}

      {/* ================= MODAL: ZOOM FOTO CARTA ================= */}
      {zoomPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-blue-600" />
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'es' ? 'Foto de la Carta Física' : 'Physical Letter Photo'}
                </span>
                {zoomPhotoMetadata?.fileType && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                    {zoomPhotoMetadata.fileType}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  setZoomPhotoUrl(null);
                  setZoomPicId(null);
                  setZoomPhotoMetadata(null);
                }}
                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Photo Container */}
            <div className="p-3 bg-black/90 flex items-center justify-center overflow-auto flex-1 min-h-[300px]">
              <img
                src={zoomPhotoUrl}
                alt="Carta física ampliada"
                className="w-auto h-auto max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>



              {zoomPhotoMetadata && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  {zoomPhotoMetadata.originalName && (
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Archivo:</span> {zoomPhotoMetadata.originalName}
                    </div>
                  )}
                  {zoomPhotoMetadata.size !== undefined && (
                    <div>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">Tamaño:</span> {formatBytes(zoomPhotoMetadata.size)}
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Tipo:</span> {zoomPhotoMetadata.fileType}
                  </div>
                  <div className="text-slate-400 font-mono">
                    letters/{zoomPicId || editPicId}.{(zoomPhotoMetadata.fileType || 'jpg').toLowerCase()}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};
