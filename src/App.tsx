/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Letter,
  Leader,
  Coordinator,
  Donor,
  Role,
  PresentItem,
  Reassignation,
  Simulation,
  GiftGivingEvent,
  CustomRole,
  User,
  SchoolCatalogItem,
  RolePermissions,
  PermissionKey,
} from './types';
import {
  INITIAL_LETTERS,
  INITIAL_LEADERS,
  INITIAL_COORDINATORS,
  INITIAL_DONORS,
  INITIAL_SCHOOLS,
  INITIAL_EVENTS,
  INITIAL_ROLES,
  INITIAL_USERS,
  PERMISSIONS_TABLE,
} from './data/mockData';
import { Language } from './i18n/translations';
import { VuetifyAppBar } from './components/layout/VuetifyAppBar';
import { VuetifyDrawer } from './components/layout/VuetifyDrawer';
import { BottomNavigation } from './components/layout/BottomNavigation';
import { DashboardView } from './components/views/DashboardView';
import { LettersView } from './components/views/LettersView';
import { ClosingLettersView } from './components/views/ClosingLettersView';
import { ArchiveView } from './components/views/ArchiveView';
import { VolunteersView } from './components/views/VolunteersView';
import { EventsView } from './components/views/EventsView';
import { BulkLettersAssignView } from './components/views/BulkLettersAssignView';
import { RolesManagementView } from './components/views/RolesManagementView';
import { UsersManagementView } from './components/views/UsersManagementView';
import { ReassignSimulationView } from './components/views/ReassignSimulationView';
import { ReassignManualView } from './components/views/ReassignManualView';
import { ReportsView } from './components/views/ReportsView';
import { RemindersView } from './components/views/RemindersView';
import { VuetifyDocSpecView } from './components/views/VuetifyDocSpecView';
import { AccessDeniedView } from './components/views/AccessDeniedView';
import { LoginRequiredView } from './components/views/LoginRequiredView';
import { ShieldAlert } from 'lucide-react';
import { getDeployedEnv, isProdEnv } from './utils/env';
import {
  auth,
  testConnection,
  signInWithGoogle,
  logOut,
  getAppParameter,
  setAppParameter,
} from './services/firebase';
import {
  seedInitialFirestoreData,
  subscribeToAllFirestore,
  saveLetterToDb,
  deleteLetterFromDb,
  saveEventToDb,
  deleteEventFromDb,
  saveSchoolToDb,
  deleteSchoolFromDb,
  saveLeaderToDb,
  deleteLeaderFromDb,
  saveCoordinatorToDb,
  deleteCoordinatorFromDb,
  saveDonorToDb,
  deleteDonorFromDb,
  saveRoleToDb,
  deleteRoleFromDb,
  saveUserToDb,
  deleteUserFromDb,
  saveReassignationToDb,
  deleteSimulationFromDb,
} from './services/dbSync';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  // Appearance & Session State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(true);
  const [language, setLanguage] = useState<Language>('es');
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [hideGiftMatching, setHideGiftMatching] = useState('N');

  // Firebase Auth & Cloud Sync State
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isAuthResolved, setIsAuthResolved] = useState<boolean>(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Database Records
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [roles, setRoles] = useState<CustomRole[]>(INITIAL_ROLES);
  const [currentUser, setCurrentUser] = useState<User>(INITIAL_USERS[0]);
  const [events, setEvents] = useState<GiftGivingEvent[]>(INITIAL_EVENTS);
  const [schools, setSchools] = useState<SchoolCatalogItem[]>(INITIAL_SCHOOLS);
  const [letters, setLetters] = useState<Letter[]>(INITIAL_LETTERS);
  const [leaders, setLeaders] = useState<Leader[]>(INITIAL_LEADERS);
  const [coordinators, setCoordinators] = useState<Coordinator[]>(INITIAL_COORDINATORS);
  const [donors, setDonors] = useState<Donor[]>(INITIAL_DONORS);
  const [simulations, setSimulations] = useState<Simulation[]>([]);

  // Boot: Test connection, listen to Firebase Auth and real-time Firestore collections
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    // 0. Fetch App Parameters
    getAppParameter('HIDE_GIFT_MATCHING').then(setHideGiftMatching);

    // 1. Test Firestore Connection & Seed Initial Data if empty (never auto-seed in PROD)
    testConnection().then((connected) => {
      setIsDbConnected(connected);
      if (connected && !isProdEnv()) {
        seedInitialFirestoreData();
      }
    });

    // 2. Auth State Listener
    const unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
      setFirebaseUser(fbUser);
      setIsAuthResolved(true);
    });

    // 3. Realtime Firestore Sync
    unsubscribeFirestore = subscribeToAllFirestore({
      onLetters: (remoteLetters) => {
        if (remoteLetters && remoteLetters.length > 0) setLetters(remoteLetters);
      },
      onEvents: (remoteEvents) => {
        if (remoteEvents && remoteEvents.length > 0) setEvents(remoteEvents);
      },
      onSchools: (remoteSchools) => {
        if (remoteSchools && remoteSchools.length > 0) setSchools(remoteSchools);
      },
      onLeaders: (remoteLeaders) => {
        if (remoteLeaders && remoteLeaders.length > 0) setLeaders(remoteLeaders);
      },
      onCoordinators: (remoteCoords) => {
        if (remoteCoords && remoteCoords.length > 0) setCoordinators(remoteCoords);
      },
      onDonors: (remoteDonors) => {
        if (remoteDonors && remoteDonors.length > 0) setDonors(remoteDonors);
      },
      onRoles: (remoteRoles) => {
        if (remoteRoles && remoteRoles.length > 0) setRoles(remoteRoles);
      },
      onUsers: (remoteUsers) => {
        if (remoteUsers && remoteUsers.length > 0) setUsers(remoteUsers);
      },
      // Unlike the other collections, an empty result is valid here (e.g. right after
      // a user's previous simulation batch is cleared), so it is always propagated.
      onSimulations: (remoteSimulations) => {
        setSimulations(remoteSimulations);
      },
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  // Sync Dark Mode class on document root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Google Authenticated User match check against 'users' collection
  const authenticatedEmail = firebaseUser?.email?.toLowerCase().trim() || '';
  const isGoogleAuthenticated = !!firebaseUser;

  const matchedSystemUser = useMemo(() => {
    if (!firebaseUser || !authenticatedEmail) return null;
    const directMatch = users.find(
      (u) => u.email.toLowerCase().trim() === authenticatedEmail
    );
    if (directMatch) return directMatch;
    if (authenticatedEmail === 'mision.presente.gdl@gmail.com') {
      return (
        users.find((u) => u.email.toLowerCase().trim() === 'mision.presente.gdl@gmail.com') ||
        users[0]
      );
    }
    return null;
  }, [firebaseUser, authenticatedEmail, users]);

  // If a user is authenticated by Google but there is no user in the users collection with that email:
  const isAccessDenied = isGoogleAuthenticated && !matchedSystemUser;

  // Sync currentUser with matched user from users collection
  useEffect(() => {
    if (matchedSystemUser) {
      setCurrentUser(matchedSystemUser);
    }
  }, [matchedSystemUser]);

  // Dynamic Permissions calculation for logged-in user (merges system role + all custom roles)
  const activePermissions = useMemo(() => {
    const matchedRole = roles.find(
      (r) => r.id === currentUser.roleId || r.name.toLowerCase() === currentUser.roleName.toLowerCase()
    );
    const basePerms: RolePermissions = matchedRole
      ? { ...matchedRole.permissions }
      : { ...PERMISSIONS_TABLE.Admin };

    if (currentUser.customRoleIds && currentUser.customRoleIds.length > 0) {
      currentUser.customRoleIds.forEach((cRoleId) => {
        const cRole = roles.find((r) => r.id === cRoleId);
        if (cRole && cRole.permissions) {
          (Object.keys(cRole.permissions) as PermissionKey[]).forEach((permKey) => {
            if (cRole.permissions[permKey]) {
              basePerms[permKey] = true;
            }
          });
        }
      });
    }

    return basePerms;
  }, [roles, currentUser]);

  const isCoordinator = (currentUser.roleName || '').toLowerCase() === 'coordinator' || currentUser.roleId === 'ROLE-COORD';

  // Statistics and scoped umbrella letters
  const activeLetters = useMemo(() => {
    const allActive = letters.filter((l) => !l.isArchived);
    const roleLower = (currentUser.roleName || '').toLowerCase();
    
    if (roleLower === 'admin') return allActive;
    
    if (roleLower === 'coordinator') {
      const userEmail = (currentUser.email || '').trim().toLowerCase();
      const userName = (currentUser.name || '').trim().toLowerCase();
      const myCoord = coordinators.find(
        (c) =>
          (currentUser.assignedCoordinatorId && c.id === currentUser.assignedCoordinatorId) ||
          c.id === currentUser.id ||
          (userEmail && c.email.trim().toLowerCase() === userEmail) ||
          (userName && `${c.firstName} ${c.lastName}`.trim().toLowerCase() === userName)
      ) || null;
      const myCoordId = myCoord?.id || currentUser.assignedCoordinatorId || currentUser.id;
      const myCoordName = myCoord ? `${myCoord.firstName} ${myCoord.lastName}`.trim().toLowerCase() : userName;

      return allActive.filter(
        (l) =>
          (myCoordId && l.coordinatorId === myCoordId) ||
          (l.coordinatorName && l.coordinatorName.trim().toLowerCase() === myCoordName)
      );
    }
    
    if (roleLower === 'leader') {
      const userEmail = (currentUser.email || '').trim().toLowerCase();
      const userName = (currentUser.name || '').trim().toLowerCase();
      const myLeader = leaders.find(
        (l) =>
          (currentUser.assignedLeaderId && l.id === currentUser.assignedLeaderId) ||
          l.id === currentUser.id ||
          (userEmail && l.email.trim().toLowerCase() === userEmail) ||
          (userName && `${l.firstName} ${l.lastName}`.trim().toLowerCase() === userName)
      ) || null;
      const myLeaderId = myLeader?.id || currentUser.assignedLeaderId || currentUser.id;
      const myLeaderName = myLeader ? `${myLeader.firstName} ${myLeader.lastName}`.trim().toLowerCase() : userName;

      const myCoordinators = coordinators.filter(
        (c) =>
          (myLeaderId && c.leaderId === myLeaderId) ||
          (c.leaderName && c.leaderName.trim().toLowerCase() === myLeaderName)
      );
      const myCoordIds = new Set(myCoordinators.map((c) => c.id));
      const myCoordNames = new Set(myCoordinators.map((c) => `${c.firstName} ${c.lastName}`.trim().toLowerCase()));

      return allActive.filter(
        (l) =>
          (myLeaderId && l.leaderId === myLeaderId) ||
          (l.leaderName && l.leaderName.trim().toLowerCase() === myLeaderName) ||
          (l.coordinatorId && myCoordIds.has(l.coordinatorId)) ||
          (l.coordinatorName && myCoordNames.has(l.coordinatorName.trim().toLowerCase()))
      );
    }
    
    return allActive;
  }, [letters, currentUser, coordinators, leaders]);
  const noDonorCount = activeLetters.filter((l) => !l.donorId).length;
  const noPresentCount = activeLetters.filter((l) => l.presents.length === 0).length;

  // Google Sign In handler
  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user) {
        setFirebaseUser(user);
      }
    } catch (err: unknown) {
      const fbErr = err as { code?: string };
      if (
        fbErr?.code !== 'auth/popup-closed-by-user' &&
        fbErr?.code !== 'auth/cancelled-popup-request'
      ) {
        console.warn('Google Sign In:', err);
      }
    }
  };

  // Google Sign Out handler
  const handleGoogleSignOut = async () => {
    try {
      await logOut();
      setFirebaseUser(null);
      setCurrentUser(users[0]);
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Populate/Sync all Firestore collections (disabled in PROD to prevent accidental data resets)
  const handleSyncCollections = async () => {
    if (isProdEnv()) {
      console.warn('Firestore seeding is disabled when DEPLOYED_ENV=PROD.');
      return;
    }
    setIsSyncing(true);
    try {
      await seedInitialFirestoreData(true);
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Switch User handler
  const handleSwitchUser = (selectedUser: User) => {
    setCurrentUser(selectedUser);
  };

  // Handler: Save New or Updated Letter
  const handleSaveLetter = (newLetter: Letter, oldId?: string) => {
    setLetters((prev) => [
      newLetter,
      ...prev.filter((l) => l.id !== newLetter.id && (oldId ? l.id !== oldId : true)),
    ]);
    saveLetterToDb(newLetter);
  };

  // Handler: Archive (Soft-delete) Letter
  const handleArchiveLetter = (letterId: string) => {
    setLetters((prev) =>
      prev.map((l) => {
        if (l.id === letterId) {
          const updated = { ...l, isArchived: true };
          saveLetterToDb(updated);
          return updated;
        }
        return l;
      })
    );
  };

  // Handler: Restore Letter from Archive
  const handleRestoreLetter = (letterId: string) => {
    setLetters((prev) =>
      prev.map((l) => {
        if (l.id === letterId) {
          const updated = { ...l, isArchived: false };
          saveLetterToDb(updated);
          return updated;
        }
        return l;
      })
    );
  };

  // Handler: Permanent Hard Delete (Admin only)
  const handleHardDeleteLetter = (letterId: string) => {
    const target = letters.find((l) => l.id === letterId);
    setLetters((prev) => prev.filter((l) => l.id !== letterId));
    deleteLetterFromDb(
      letterId,
      target?.picId || target?.photoMetadata?.picId,
      target?.photoMetadata?.storagePath
    );
  };

  // Handler: Add Received Present to a Letter
  const handleAddPresent = (letterId: string, present: PresentItem) => {
    setLetters((prev) =>
      prev.map((l) => {
        if (l.id === letterId) {
          const updated = {
            ...l,
            presents: [...l.presents, present],
          };
          saveLetterToDb(updated);
          return updated;
        }
        return l;
      })
    );
  };

  // Handler: Bulk Lock / Unlock (Closing letters capture under NC)
  const handleBulkToggleLock = (letterIds: string[], lockStatus: boolean) => {
    setLetters((prev) =>
      prev.map((l) => {
        if (letterIds.includes(l.id)) {
          const updated = { ...l, isLocked: lockStatus };
          saveLetterToDb(updated);
          return updated;
        }
        return l;
      })
    );
  };

  // Handler: Bulk Assignment
  const handleBulkAssign = (
    letterIds: string[],
    assignType: 'leader' | 'coordinator' | 'donor',
    targetId: string
  ) => {
    if (assignType === 'leader') {
      const leaderObj = leaders.find((ld) => ld.id === targetId);
      if (!leaderObj) return;
      setLetters((prev) =>
        prev.map((l) => {
          if (letterIds.includes(l.id)) {
            const updated = {
              ...l,
              leaderId: leaderObj.id,
              leaderName: `${leaderObj.firstName} ${leaderObj.lastName}`,
              ...(l.leaderId !== leaderObj.id ? { coordinatorId: '', coordinatorName: '' } : {}),
            };
            saveLetterToDb(updated);
            return updated;
          }
          return l;
        })
      );
    } else if (assignType === 'coordinator') {
      const coordObj = coordinators.find((c) => c.id === targetId);
      if (!coordObj) return;
      setLetters((prev) =>
        prev.map((l) => {
          if (letterIds.includes(l.id)) {
            const updated = {
              ...l,
              coordinatorId: coordObj.id,
              coordinatorName: `${coordObj.firstName} ${coordObj.lastName}`,
              leaderId: coordObj.leaderId,
              leaderName: coordObj.leaderName,
            };
            saveLetterToDb(updated);
            return updated;
          }
          return l;
        })
      );
    } else if (assignType === 'donor') {
      const donorObj = donors.find((d) => d.id === targetId);
      if (!donorObj) return;
      setLetters((prev) =>
        prev.map((l) => {
          if (letterIds.includes(l.id)) {
            const updated = {
              ...l,
              donorId: donorObj.id,
              donorName: `${donorObj.firstName} ${donorObj.lastName}`,
            };
            saveLetterToDb(updated);
            return updated;
          }
          return l;
        })
      );
      setDonors((prev) =>
        prev.map((d) => {
          if (d.id === targetId) {
            const updated = {
              ...d,
              assignedLetterIds: Array.from(new Set([...d.assignedLetterIds, ...letterIds])),
            };
            saveDonorToDb(updated);
            return updated;
          }
          return d;
        })
      );
    }
  };

  // Handler: Events CRUD
  const handleSaveEvent = (event: GiftGivingEvent) => {
    setEvents((prev) => {
      const existing = prev.findIndex((e) => e.id === event.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = event;
        return updated;
      }
      return [...prev, event];
    });
    saveEventToDb(event);
  };

  const handleDeleteEvent = (eventId: string): { success: boolean; message?: string } => {
    const linkedLetters = letters.filter((l) => l.folioType === eventId);
    if (linkedLetters.length > 0) {
      return {
        success: false,
        message: `Regla: No se puede eliminar el evento ${eventId} porque tiene ${linkedLetters.length} cartas registradas con ese folio.`,
      };
    }
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
    deleteEventFromDb(eventId);
    return { success: true };
  };

  // Handler: Schools CRUD
  const handleSaveSchool = (school: SchoolCatalogItem) => {
    setSchools((prev) => {
      const idx = prev.findIndex((s) => s.id === school.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = school;
        return updated;
      }
      return [...prev, school];
    });
    saveSchoolToDb(school);
  };

  const handleDeleteSchool = (schoolId: string): { success: boolean; message?: string } => {
    const target = schools.find((s) => s.id === schoolId);
    if (!target) return { success: false, message: 'Escuela no encontrada' };

    const linked = letters.filter((l) => l.school === target.name);
    if (linked.length > 0) {
      return {
        success: false,
        message: `Regla: No se puede eliminar "${target.name}" porque tiene ${linked.length} cartas asociadas.`,
      };
    }
    setSchools((prev) => prev.filter((s) => s.id !== schoolId));
    deleteSchoolFromDb(schoolId);
    return { success: true };
  };

  // Handler: Roles CRUD with Deletion Guard
  const handleSaveRole = (role: CustomRole) => {
    setRoles((prev) => {
      const idx = prev.findIndex((r) => r.id === role.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = role;
        return updated;
      }
      return [...prev, role];
    });
    saveRoleToDb(role);
  };

  const handleDeleteRole = (roleId: string): { success: boolean; message?: string } => {
    const systemRoleIds = ['ROLE-ADMIN', 'ROLE-COORD', 'ROLE-LEADER'];
    if (systemRoleIds.includes(roleId)) {
      return {
        success: false,
        message:
          language === 'es'
            ? 'Regla estricta: No se puede eliminar un rol del sistema.'
            : 'Strict rule: Cannot delete a system role.',
      };
    }
    const assignedUsers = users.filter(
      (u) => u.roleId === roleId || u.customRoleIds?.includes(roleId)
    );
    if (assignedUsers.length > 0) {
      return {
        success: false,
        message:
          language === 'es'
            ? `Regla estricta: No se puede eliminar el rol porque tiene ${assignedUsers.length} usuario(s) asignados.`
            : `Strict rule: Cannot delete role because it has ${assignedUsers.length} assigned user(s).`,
      };
    }
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
    deleteRoleFromDb(roleId);
    return { success: true };
  };

  const handleBulkAssignUsersToRole = async (userIds: string[], roleId: string) => {
    const targetRole = roles.find((r) => r.id === roleId);
    if (!targetRole) return;

    const systemRoleIds = ['ROLE-ADMIN', 'ROLE-COORD', 'ROLE-LEADER'];
    const isSystemRole = systemRoleIds.includes(roleId);

    const updatedUsers: User[] = [];

    setUsers((prev) =>
      prev.map((u) => {
        let updated: User = u;
        if (userIds.includes(u.id)) {
          if (isSystemRole) {
            updated = {
              ...u,
              roleId: targetRole.id,
              roleName: targetRole.name,
              customRoleIds: u.customRoleIds || [],
            };
          } else {
            const currentCustomRoles = u.customRoleIds || [];
            const newCustomRoles = currentCustomRoles.includes(roleId)
              ? currentCustomRoles
              : [...currentCustomRoles, roleId];
            updated = { ...u, customRoleIds: newCustomRoles };
          }
        } else if (!isSystemRole) {
          // If it's a custom role, remove it from users NOT in userIds
          const currentCustomRoles = u.customRoleIds || [];
          if (currentCustomRoles.includes(roleId)) {
            updated = {
              ...u,
              customRoleIds: currentCustomRoles.filter((id) => id !== roleId),
            };
          }
        }

        if (updated !== u) {
          updatedUsers.push(updated);
        }
        return updated;
      })
    );

    // Persist all modified users to Firestore
    await Promise.all(
      updatedUsers.map(async (u) => {
        await saveUserToDb(u);
      })
    );

    // If currently logged-in user was modified, update currentUser state
    const updatedSelf = updatedUsers.find((u) => u.id === currentUser.id);
    if (updatedSelf) {
      setCurrentUser(updatedSelf);
    }
  };

  // Handler: Users CRUD
  const handleSaveUser = async (user: User) => {
    const sanitizedUser: User = {
      ...user,
      customRoleIds: user.customRoleIds || [],
    };
    setUsers((prev) => {
      const idx = prev.findIndex((u) => u.id === sanitizedUser.id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = sanitizedUser;
        return updated;
      }
      return [...prev, sanitizedUser];
    });
    await saveUserToDb(sanitizedUser);
    if (currentUser.id === sanitizedUser.id) {
      setCurrentUser(sanitizedUser);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    deleteUserFromDb(userId);
  };

  // Handler: Save Leader and auto-create user in "users" collection with "Leader" role
  const handleSaveLeader = (leader: Leader) => {
    setLeaders((prev) => {
      const existing = prev.findIndex((l) => l.id === leader.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = leader;
        return updated;
      }
      return [...prev, leader];
    });
    saveLeaderToDb(leader);

    // Auto-create or sync corresponding user in "users" collection with role "Leader"
    const cleanEmail = leader.email.trim().toLowerCase();
    const leaderRole = roles.find((r) => r.name.toLowerCase() === 'leader') || {
      id: 'ROLE-LEADER',
      name: 'Leader',
    };

    setUsers((prevUsers) => {
      const existingUser = prevUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        const updatedUser: User = {
          ...existingUser,
          name: `${leader.firstName} ${leader.lastName}`.trim(),
          roleId: leaderRole.id,
          roleName: leaderRole.name,
          assignedLeaderId: leader.id,
          active: true,
        };
        saveUserToDb(updatedUser);
        return prevUsers.map((u) => (u.id === existingUser.id ? updatedUser : u));
      } else {
        const nextIdx = prevUsers.length + 1;
        let newUserId = `USR-${String(nextIdx).padStart(2, '0')}`;
        if (prevUsers.some((u) => u.id === newUserId)) {
          newUserId = `USR-${Date.now().toString().slice(-4)}`;
        }
        const newUser: User = {
          id: newUserId,
          name: `${leader.firstName} ${leader.lastName}`.trim(),
          email: cleanEmail,
          roleId: leaderRole.id,
          roleName: leaderRole.name,
          assignedLeaderId: leader.id,
          active: true,
        };
        saveUserToDb(newUser);
        return [...prevUsers, newUser];
      }
    });
  };

  // Handler: Save Coordinator and auto-create user in "users" collection with "Coordinator" role
  const handleSaveCoordinator = (coord: Coordinator) => {
    setCoordinators((prev) => {
      const existing = prev.findIndex((c) => c.id === coord.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = coord;
        return updated;
      }
      return [...prev, coord];
    });
    saveCoordinatorToDb(coord);

    // Auto-create or sync corresponding user in "users" collection with role "Coordinator"
    const cleanEmail = coord.email.trim().toLowerCase();
    const coordRole = roles.find((r) => r.name.toLowerCase() === 'coordinator') || {
      id: 'ROLE-COORD',
      name: 'Coordinator',
    };

    setUsers((prevUsers) => {
      const existingUser = prevUsers.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        const updatedUser: User = {
          ...existingUser,
          name: `${coord.firstName} ${coord.lastName}`.trim(),
          roleId: coordRole.id,
          roleName: coordRole.name,
          assignedCoordinatorId: coord.id,
          active: true,
        };
        saveUserToDb(updatedUser);
        return prevUsers.map((u) => (u.id === existingUser.id ? updatedUser : u));
      } else {
        const nextIdx = prevUsers.length + 1;
        let newUserId = `USR-${String(nextIdx).padStart(2, '0')}`;
        if (prevUsers.some((u) => u.id === newUserId)) {
          newUserId = `USR-${Date.now().toString().slice(-4)}`;
        }
        const newUser: User = {
          id: newUserId,
          name: `${coord.firstName} ${coord.lastName}`.trim(),
          email: cleanEmail,
          roleId: coordRole.id,
          roleName: coordRole.name,
          assignedCoordinatorId: coord.id,
          active: true,
        };
        saveUserToDb(newUser);
        return [...prevUsers, newUser];
      }
    });
  };

  // Handler: Volunteers Deletions with CRUD Constraint Checks
  const handleDeleteLeader = (leaderId: string): { success: boolean; message?: string } => {
    const assignedCoords = coordinators.filter((c) => c.leaderId === leaderId);
    if (assignedCoords.length > 0) {
      return {
        success: false,
        message: `Regla de negocio: No se puede eliminar al Líder porque tiene ${assignedCoords.length} coordinador(es) asignados.`,
      };
    }
    setLeaders((prev) => prev.filter((l) => l.id !== leaderId));
    deleteLeaderFromDb(leaderId);
    return { success: true };
  };

  const handleDeleteCoordinator = (coordId: string): { success: boolean; message?: string } => {
    const assignedLetters = letters.filter((l) => !l.isArchived && l.coordinatorId === coordId);
    if (assignedLetters.length > 0) {
      return {
        success: false,
        message: `Regla de negocio: No se puede eliminar al Coordinador porque tiene ${assignedLetters.length} carta(s) asignadas.`,
      };
    }
    setCoordinators((prev) => prev.filter((c) => c.id !== coordId));
    deleteCoordinatorFromDb(coordId);
    return { success: true };
  };

  const handleDeleteDonor = (donorId: string): { success: boolean; message?: string } => {
    const assignedLetters = letters.filter((l) => !l.isArchived && l.donorId === donorId);
    if (assignedLetters.length > 0) {
      return {
        success: false,
        message: `Regla de negocio: No se puede eliminar al Donante porque tiene ${assignedLetters.length} carta(s) apadrinadas.`,
      };
    }
    setDonors((prev) => prev.filter((d) => d.id !== donorId));
    deleteDonorFromDb(donorId);
    return { success: true };
  };

  // Handler: Save / Update Donor
  const handleSaveDonor = (donor: Donor) => {
    setDonors((prev) => {
      const existing = prev.findIndex((d) => d.id === donor.id);
      if (existing !== -1) {
        const updated = [...prev];
        updated[existing] = donor;
        return updated;
      }
      return [...prev, donor];
    });
    saveDonorToDb(donor);

    // Sync donorName & coordinator on letters assigned to this donor
    setLetters((prev) =>
      prev.map((l) => {
        if (l.donorId === donor.id) {
          const updated = {
            ...l,
            donorName: `${donor.firstName} ${donor.lastName}`.trim(),
            coordinatorId: donor.coordinatorId || l.coordinatorId,
            coordinatorName: donor.coordinatorName || l.coordinatorName,
          };
          saveLetterToDb(updated);
          return updated;
        }
        return l;
      })
    );
  };

  // Handler: Update Donor Letters Assignment
  const handleUpdateDonorLetters = (donorId: string, updatedLetterIds: string[]) => {
    const donor = donors.find((d) => d.id === donorId);
    if (!donor) return;

    const previousLetterIds = donor.assignedLetterIds || [];
    const addedLetterIds = updatedLetterIds.filter((id) => !previousLetterIds.includes(id));
    const removedLetterIds = previousLetterIds.filter((id) => !updatedLetterIds.includes(id));

    // Update letters state and database
    setLetters((prev) =>
      prev.map((l) => {
        if (addedLetterIds.includes(l.id)) {
          const updated = {
            ...l,
            donorId: donor.id,
            donorName: `${donor.firstName} ${donor.lastName}`.trim(),
            coordinatorId: donor.coordinatorId || l.coordinatorId,
            coordinatorName: donor.coordinatorName || l.coordinatorName,
          };
          saveLetterToDb(updated);
          return updated;
        }
        if (removedLetterIds.includes(l.id)) {
          const updated = {
            ...l,
            donorId: undefined,
            donorName: undefined,
          };
          saveLetterToDb(updated);
          return updated;
        }
        return l;
      })
    );

    // Update donor state and database
    const updatedDonor: Donor = {
      ...donor,
      assignedLetterIds: updatedLetterIds,
    };
    setDonors((prev) =>
      prev.map((d) => (d.id === donorId ? updatedDonor : d))
    );
    saveDonorToDb(updatedDonor);
  };

  const handleTransferDonor = (donorId: string, newCoordinatorId: string) => {
    const newCoord = coordinators.find((c) => c.id === newCoordinatorId);
    if (!newCoord) return;

    setDonors((prev) =>
      prev.map((d) => {
        if (d.id === donorId) {
          const updated = {
            ...d,
            coordinatorId: newCoord.id,
            coordinatorName: `${newCoord.firstName} ${newCoord.lastName}`,
          };
          saveDonorToDb(updated);
          return updated;
        }
        return d;
      })
    );

    setLetters((prev) =>
      prev.map((l) => {
        if (l.donorId === donorId) {
          const updated = {
            ...l,
            coordinatorId: newCoord.id,
            coordinatorName: `${newCoord.firstName} ${newCoord.lastName}`,
          };
          saveLetterToDb(updated);
          return updated;
        }
        return l;
      })
    );
  };

  // Reassignments handlers

  // Executes a batch of previously-generated "simulation" suggestions. Processes
  // selected ids sequentially against a single local working copy of `letters` (not
  // the stale outer closure/state) so validation stays correct even when multiple
  // selected rows reference the same origin or target letter within the same batch.
  const handleExecuteSimulations = (
    selectedIds: string[]
  ): { executed: number; failed: { id: string; reason: string }[] } => {
    const failed: { id: string; reason: string }[] = [];
    const workingLetters = [...letters];
    const lettersToSave = new Map<string, Letter>();
    const reassignationsToSave: Reassignation[] = [];
    const executedSimulationIds: string[] = [];

    selectedIds.forEach((simId) => {
      const sim = simulations.find((s) => s.id === simId);
      if (!sim) {
        failed.push({ id: simId, reason: 'Simulación no encontrada.' });
        return;
      }

      const originIndex = workingLetters.findIndex((l) => l.id === sim.originLetterId);
      const targetIndex = workingLetters.findIndex((l) => l.id === sim.targetLetterId);

      if (originIndex === -1 || targetIndex === -1) {
        failed.push({ id: simId, reason: 'Carta origen o destino no encontrada.' });
        return;
      }

      const originLetter = workingLetters[originIndex];
      const targetLetter = workingLetters[targetIndex];

      const presentToMove = originLetter.presents.find((p) => p.id === sim.presentId);
      if (!presentToMove) {
        failed.push({ id: simId, reason: 'El regalo ya no está disponible en la carta origen.' });
        return;
      }

      // Guard: the origin letter must have more than 1 present (keeps at least 1 after moving).
      if (originLetter.presents.length <= 1) {
        failed.push({
          id: simId,
          reason: `La carta origen ${sim.originLetterId} ya no tiene regalos excedentes.`,
        });
        return;
      }

      // Guard: the target letter must currently have 0 presents.
      if (targetLetter.presents.length !== 0) {
        failed.push({
          id: simId,
          reason: `La carta destino ${sim.targetLetterId} ya tiene un regalo asignado.`,
        });
        return;
      }

      const updatedOrigin: Letter = {
        ...originLetter,
        presents: originLetter.presents.filter((p) => p.id !== sim.presentId),
      };
      const transferredPresent: PresentItem = {
        ...presentToMove,
        description: `${presentToMove.description} (Reasignación por simulación)`,
        receivedDate: new Date().toISOString().split('T')[0],
      };
      const updatedTarget: Letter = {
        ...targetLetter,
        presents: [...targetLetter.presents, transferredPresent],
      };

      workingLetters[originIndex] = updatedOrigin;
      workingLetters[targetIndex] = updatedTarget;
      lettersToSave.set(updatedOrigin.id, updatedOrigin);
      lettersToSave.set(updatedTarget.id, updatedTarget);

      reassignationsToSave.push({
        id: crypto.randomUUID(),
        originLetterId: sim.originLetterId,
        targetLetterId: sim.targetLetterId,
        presentId: sim.presentId,
        presentDescription: sim.presentDescription,
        createdAt: new Date().toISOString(),
      });
      executedSimulationIds.push(simId);
    });

    if (executedSimulationIds.length > 0) {
      setLetters(workingLetters);
      lettersToSave.forEach((l) => saveLetterToDb(l));
      reassignationsToSave.forEach((r) => saveReassignationToDb(r));
      executedSimulationIds.forEach((id) => deleteSimulationFromDb(id));
    }

    return { executed: executedSimulationIds.length, failed };
  };

  const handleManualTransfer = (
    sourceLetterId: string,
    presentId: string,
    targetLetterId: string
  ): { success: boolean; error?: string } => {
    const sourceLetter = letters.find((l) => l.id === sourceLetterId);
    const targetLetter = letters.find((l) => l.id === targetLetterId);

    if (!sourceLetter || !targetLetter) {
      return { success: false, error: 'Carta origen o destino no encontrada.' };
    }

    const presentToMove = sourceLetter.presents.find((p) => p.id === presentId);
    if (!presentToMove) {
      return { success: false, error: 'El regalo ya no está disponible en la carta origen.' };
    }

    // Guard: the origin letter must keep at least one present after the transfer.
    if (sourceLetter.presents.length <= 1) {
      return {
        success: false,
        error: 'No se puede reasignar: la carta origen debe conservar al menos un regalo.',
      };
    }

    const updatedSourceLetter: Letter = {
      ...sourceLetter,
      presents: sourceLetter.presents.filter((p) => p.id !== presentId),
    };

    const transferredPresent: PresentItem = {
      ...presentToMove,
      description: `${presentToMove.description} (Reasignación manual)`,
      receivedDate: new Date().toISOString().split('T')[0],
    };

    const updatedTargetLetter: Letter = {
      ...targetLetter,
      presents: [...targetLetter.presents, transferredPresent],
    };

    setLetters((prev) =>
      prev.map((l) => {
        if (l.id === sourceLetterId) return updatedSourceLetter;
        if (l.id === targetLetterId) return updatedTargetLetter;
        return l;
      })
    );

    saveLetterToDb(updatedSourceLetter);
    saveLetterToDb(updatedTargetLetter);

    // Audit trail: persist the movement in its own collection.
    const reassignation: Reassignation = {
      id: crypto.randomUUID(),
      originLetterId: sourceLetterId,
      targetLetterId,
      presentId: presentToMove.id,
      presentDescription: presentToMove.description,
      createdAt: new Date().toISOString(),
    };
    saveReassignationToDb(reassignation);

    return { success: true };
  };

  // Guard: Outside DEV, the app must not preset a logged-in user; require Google auth first.
  // Wait for the initial auth-state check to resolve to avoid a flash of this screen
  // for users with a valid, persisted Firebase session.
  const requiresGoogleAuth = getDeployedEnv() !== 'DEV';
  if (requiresGoogleAuth && !isAuthResolved) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDarkMode ? 'dark bg-slate-950' : 'bg-slate-100'
        }`}
      >
        <div className="w-8 h-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (requiresGoogleAuth && !firebaseUser) {
    return (
      <LoginRequiredView
        language={language}
        onLanguageChange={setLanguage}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        onGoogleSignIn={handleGoogleSignIn}
      />
    );
  }

  // Guard: If authenticated by Google but NOT in users collection, block access and display message
  if (isAccessDenied && firebaseUser) {
    return (
      <AccessDeniedView
        firebaseUser={firebaseUser}
        language={language}
        onLanguageChange={setLanguage}
        onLogout={handleGoogleSignOut}
        onRetry={handleSyncCollections}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'} flex flex-col font-sans transition-colors`}>
      {/* Top Application Bar */}
      <VuetifyAppBar
        currentUser={currentUser}
        onSwitchUser={handleSwitchUser}
        availableUsers={users}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
        language={language}
        onLanguageChange={setLanguage}
        onOpenDocSpec={() => setActiveView('ui-spec')}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
        onLogout={handleGoogleSignOut}
        firebaseUser={firebaseUser}
        onGoogleSignIn={handleGoogleSignIn}
        onSyncCollections={handleSyncCollections}
        isSyncing={isSyncing}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Desktop/Tablet Navigation Drawer */}
        {isDrawerOpen && (
          <div className="hidden md:block resize-x overflow-auto min-w-[200px] max-w-[400px] w-64">
            <VuetifyDrawer
              isOpen={isDrawerOpen}
              activeView={activeView}
              onSelectView={setActiveView}
              currentUser={currentUser}
              permissions={activePermissions}
              language={language}
              stats={{
                totalLetters: activeLetters.length,
                noDonorCount,
                noPresentCount,
              }}
            />
          </div>
        )}

        {/* Main Content Area (padded on bottom for mobile navigation bar) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 pb-20 md:pb-8">
          {activeView === 'dashboard' && (
            <DashboardView
              letters={activeLetters}
              currentUser={currentUser}
              onNavigate={setActiveView}
              language={language}
            />
          )}

          {activeView === 'letters' && (
            <LettersView
              letters={letters}
              leaders={leaders}
              coordinators={coordinators}
              donors={donors}
              schools={schools}
              events={events}
              permissions={activePermissions}
              currentUser={currentUser}
              currentRole={currentUser.roleName as Role}
              language={language}
              onSaveLetter={handleSaveLetter}
              onArchiveLetter={handleArchiveLetter}
              onAddPresent={handleAddPresent}
              onBulkAssign={handleBulkAssign}
              hideGiftMatching={hideGiftMatching}
            />
          )}

          {activeView === 'closing' && (
            <ClosingLettersView
              letters={letters}
              leaders={leaders}
              currentUser={currentUser}
              permissions={activePermissions}
              language={language}
              onBulkToggleLock={handleBulkToggleLock}
            />
          )}

          {activeView === 'events' && (
            <EventsView
              events={events}
              letters={activeLetters}
              permissions={activePermissions}
              language={language}
              onSaveEvent={handleSaveEvent}
              onDeleteEvent={handleDeleteEvent}
            />
          )}

          {activeView === 'bulk-assign' && (
            isCoordinator ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto text-center space-y-4 shadow-sm my-8">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'es' ? 'Acceso Restringido' : 'Restricted Access'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'es'
                    ? 'Esta sección no está disponible para el rol de Coordinador.'
                    : 'This section is not available for the Coordinator role.'}
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'es' ? 'Volver al Inicio' : 'Return to Dashboard'}
                </button>
              </div>
            ) : (
              <BulkLettersAssignView
                letters={letters}
                leaders={leaders}
                coordinators={coordinators}
                currentUser={currentUser}
                currentRole={currentUser.roleName as Role}
                language={language}
                onBulkAssign={(letterIds, assignType, targetId) =>
                  handleBulkAssign(letterIds, assignType, targetId)
                }
              />
            )
          )}

          {activeView === 'roles' && (
            <RolesManagementView
              roles={roles}
              users={users}
              language={language}
              onSaveRole={handleSaveRole}
              onDeleteRole={handleDeleteRole}
              onBulkAssignUsersToRole={handleBulkAssignUsersToRole}
            />
          )}

          {activeView === 'users' && (
            <UsersManagementView
              users={users}
              roles={roles}
              language={language}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
            />
          )}

          {activeView === 'archive' && (
            <ArchiveView
              letters={letters}
              currentRole={currentUser.roleName as Role}
              language={language}
              onRestoreLetter={handleRestoreLetter}
              onHardDeleteLetter={handleHardDeleteLetter}
            />
          )}

          {activeView === 'volunteers' && (
            <VolunteersView
              leaders={leaders}
              coordinators={coordinators}
              donors={donors}
              letters={activeLetters}
              schools={schools}
              permissions={activePermissions}
              currentUser={currentUser}
              currentRole={currentUser.roleName as Role}
              language={language}
              onSaveLeader={handleSaveLeader}
              onDeleteLeader={handleDeleteLeader}
              onSaveCoordinator={handleSaveCoordinator}
              onDeleteCoordinator={handleDeleteCoordinator}
              onSaveDonor={handleSaveDonor}
              onDeleteDonor={handleDeleteDonor}
              onTransferDonor={handleTransferDonor}
              onUpdateDonorLetters={handleUpdateDonorLetters}
            />
          )}

          {activeView === 'reassign-sim' && (
            <ReassignSimulationView
              letters={activeLetters}
              events={events}
              leaders={leaders}
              simulations={simulations}
              currentUser={currentUser}
              currentRole={currentUser.roleName as Role}
              language={language}
              onExecuteSimulations={handleExecuteSimulations}
            />
          )}

          {activeView === 'reassign-manual' && (
            <ReassignManualView
              letters={activeLetters}
              currentRole={currentUser.roleName as Role}
              language={language}
              onManualTransfer={handleManualTransfer}
            />
          )}

          {activeView === 'reports' && (
            isCoordinator ? (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 max-w-md mx-auto text-center space-y-4 shadow-sm my-8">
                <div className="w-12 h-12 bg-amber-100 dark:bg-amber-950 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'es' ? 'Acceso Restringido' : 'Restricted Access'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {language === 'es'
                    ? 'Esta sección no está disponible para el rol de Coordinador.'
                    : 'This section is not available for the Coordinator role.'}
                </p>
                <button
                  onClick={() => setActiveView('dashboard')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer"
                >
                  {language === 'es' ? 'Volver al Inicio' : 'Return to Dashboard'}
                </button>
              </div>
            ) : (
              <ReportsView
                letters={letters}
                leaders={leaders}
                coordinators={coordinators}
                schools={schools}
                currentUser={currentUser}
                currentRole={currentUser.roleName as Role}
                language={language}
              />
            )
          )}

          {activeView === 'reminders' && (
            <RemindersView
              letters={activeLetters}
              leaders={leaders}
              coordinators={coordinators}
              currentRole={currentUser.roleName as Role}
              language={language}
            />
          )}

          {activeView === 'ui-spec' && (
            <VuetifyDocSpecView language={language} />
          )}
        </main>
      </div>

      {/* Mobile Cellphone Bottom Navigation Bar */}
      <BottomNavigation
        activeView={activeView}
        onSelectView={setActiveView}
        currentUser={currentUser}
        permissions={activePermissions}
        language={language}
      />
    </div>
  );
}
