export type Role = 'Admin' | 'Leader' | 'Coordinator';

export type Gender = 'Niño' | 'Niña' | 'Unisex';

export type AgeRange = '3-6' | '6-9' | '9-12' | '3-12';

export type PresentType = 'Juguete' | 'Ropa' | 'Útil Escolar';

export type MatchingGrade = 
  | 'specific' // La petición fue muy específica y el regalo coincide
  | 'vague'    // La petición fue vaga y el regalo coincide
  | 'mismatch'; // El regalo no coincide con la petición

export interface PresentItem {
  id: string;
  type: PresentType;
  description: string;
  ageRange: AgeRange;
  gender: Gender;
  matching: MatchingGrade;
  isSurplus?: boolean;
  receivedDate?: string;
  donorName?: string;
}

export interface GiftGivingEvent {
  id: string; // Single character: 'A' | 'B' | 'C' | 'X' | 'G'
  location: string;
  dates: string;
  goal: number;
}

export interface Letter {
  id: string; // e.g. "A-101" (Folio type - Folio number)
  folioType: string; // Gift-Giving day id (e.g. 'A', 'B', 'C', 'X', 'G')
  folio: number; // Manual numeric folio captured from physical letter review
  kidName: string;
  age: number;
  gender: 'Niño' | 'Niña';
  school?: string;
  celphone: string;
  toyRequest: string;       // Priority option
  clothingRequest: string;
  schoolItemRequest: string;
  clothingSize?: string;
  shoeSize?: string;
  leaderId?: string;
  leaderName?: string;
  coordinatorId?: string;
  coordinatorName?: string;
  donorId?: string;
  donorName?: string;
  presents: PresentItem[];
  photoUrl?: string; // Uploaded physical letter photo
  picId?: string; // UUID identifier of physical photo file
  photoMetadata?: LetterPhotoMetadata; // Metadata stored in letter collection
  isArchived?: boolean;
  isLocked?: boolean; // Closing letters capture: locks CRUD edits under NC permission
  notes?: string;
  createdAt: string;
}

export type PhotoFileType = 'JPG' | 'GIF' | 'BMP' | 'PNG' | 'JPEG';

export interface LetterPhotoMetadata {
  picId: string; // The UUID generated as id of the file
  originalName: string; // Original name of the file
  fileType: PhotoFileType; // Type of file (JPG, GIF, BMP, PNG, JPEG)
  size: number; // Size in bytes
  bucket: string; // gs://gen-lang-client-0695399990-regalos
  storagePath: string; // letters/<picId>.<ext>
  uploadedAt?: string;
}

export interface Leader {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  teamColor: string; // e.g. "Azul Zafiro", "Rojo Rubí", "Verde Esmeralda", "Amarillo Oro"
  teamCode: string;  // 1 char code: 'A', 'B', 'C', 'D'
  coordinatorCount?: number;
}

export interface Coordinator {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  school: string; // School where coordinator is currently studying
  grade: string;  // School grade coordinator is studying (e.g. "4° Primaria")
  leaderId: string;
  leaderName: string;
  lettersAssignedCount?: number;
}

export interface Donor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  whatsapp: string;
  coordinatorId: string;
  coordinatorName: string;
  coordinatorRelationship: string; // e.g. "Familiar", "Compañero de trabajo", "Amigo", "Vecino"
  assignedLetterIds: string[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  roleId: string; // 'ROLE-ADMIN' | 'ROLE-LEADER' | 'ROLE-COORD' or custom
  roleName: string;
  customRoleIds?: string[];
  assignedLeaderId?: string;
  assignedCoordinatorId?: string;
  active: boolean;
}

export interface CustomRole {
  id: string;
  name: string;
  description: string;
  permissions: RolePermissions;
  userCount?: number;
}

export interface ReassignmentAction {
  id: string;
  selected: boolean;
  present: PresentItem;
  sourceLetterId: string;
  sourceRemainingPresents: number;
  sourceLeader: string;
  sourceCoordinator: string;
  targetLetterId: string;
  targetRemainingPresents: number;
  targetLeader: string;
  targetCoordinator: string;
  reason?: string;
}

export interface SchoolCatalogItem {
  id: string;
  name: string;
  zone?: string;
  communityCode?: string;
}

export type PermissionKey = 
  | 'CL'    // CRUD Leaders
  | 'CC'    // CRUD Coordinators
  | 'CD'    // CRUD Donors
  | 'CLett' // CRUD Letters
  | 'CE'    // CRUD Gift-Giving day events
  | 'CS'    // Manage Elementary Schools catalog
  | 'NC'    // Closing letters capture
  | 'RP'    // Reassign presents
  | 'SWR'   // Send WhatsApp reminder
  | 'SER'   // Send email reminder
  | 'SCC';  // Show Coordinator column/filter

export interface RolePermissions {
  CL: boolean;    // CRUD Leaders
  CC: boolean;    // CRUD Coordinators
  CD: boolean;    // CRUD Donors
  CLett: boolean; // CRUD Letters
  CE: boolean;    // CRUD Gift-Giving day events
  CS: boolean;    // Manage Elementary Schools catalog
  NC: boolean;    // Closing letters capture
  RP: boolean;    // Reassign presents
  SWR: boolean;   // Send WhatsApp reminder
  SER: boolean;   // Send email reminder
  SCC: boolean;   // Show Coordinator column/filter
}
