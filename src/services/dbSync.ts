import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, deleteLetterPhoto } from './firebase';
import {
  Letter,
  GiftGivingEvent,
  SchoolCatalogItem,
  Leader,
  Coordinator,
  Donor,
  CustomRole,
  User,
} from '../types';
import {
  INITIAL_LETTERS,
  INITIAL_EVENTS,
  INITIAL_SCHOOLS,
  INITIAL_LEADERS,
  INITIAL_COORDINATORS,
  INITIAL_DONORS,
  INITIAL_ROLES,
  INITIAL_USERS,
} from '../data/mockData';

// Strip undefined fields which Firestore setDoc rejects
export function cleanData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// Seed Initial Data into Firestore for any collection that is empty
export async function seedInitialFirestoreData(forceAll: boolean = false): Promise<{ seeded: string[] }> {
  const seeded: string[] = [];
  console.log('Checking and populating missing Firestore collections...');

  try {
    // 1. Letters
    try {
      const lettersSnap = await getDocs(collection(db, 'letters'));
      if (lettersSnap.empty || forceAll) {
        console.log('Seeding letters...');
        for (const l of INITIAL_LETTERS) {
          await setDoc(doc(db, 'letters', l.id), cleanData(l));
        }
        seeded.push('letters');
      }
    } catch (e) {
      console.warn('Error checking/seeding letters:', e);
    }

    // 2. Events
    try {
      const eventsSnap = await getDocs(collection(db, 'events'));
      if (eventsSnap.empty || forceAll) {
        console.log('Seeding events...');
        for (const ev of INITIAL_EVENTS) {
          await setDoc(doc(db, 'events', ev.id), cleanData(ev));
        }
        seeded.push('events');
      }
    } catch (e) {
      console.warn('Error checking/seeding events:', e);
    }

    // 3. Schools
    try {
      const schoolsSnap = await getDocs(collection(db, 'schools'));
      if (schoolsSnap.empty || forceAll) {
        console.log('Seeding schools...');
        for (const sch of INITIAL_SCHOOLS) {
          await setDoc(doc(db, 'schools', sch.id), cleanData(sch));
        }
        seeded.push('schools');
      }
    } catch (e) {
      console.warn('Error checking/seeding schools:', e);
    }

    // 4. Leaders
    try {
      const leadersSnap = await getDocs(collection(db, 'leaders'));
      if (leadersSnap.empty || forceAll) {
        console.log('Seeding leaders...');
        for (const lead of INITIAL_LEADERS) {
          await setDoc(doc(db, 'leaders', lead.id), cleanData(lead));
        }
        seeded.push('leaders');
      }
    } catch (e) {
      console.warn('Error checking/seeding leaders:', e);
    }

    // 5. Coordinators
    try {
      const coordsSnap = await getDocs(collection(db, 'coordinators'));
      if (coordsSnap.empty || forceAll) {
        console.log('Seeding coordinators...');
        for (const c of INITIAL_COORDINATORS) {
          await setDoc(doc(db, 'coordinators', c.id), cleanData(c));
        }
        seeded.push('coordinators');
      }
    } catch (e) {
      console.warn('Error checking/seeding coordinators:', e);
    }

    // 6. Donors
    try {
      const donorsSnap = await getDocs(collection(db, 'donors'));
      if (donorsSnap.empty || forceAll) {
        console.log('Seeding donors...');
        for (const d of INITIAL_DONORS) {
          await setDoc(doc(db, 'donors', d.id), cleanData(d));
        }
        seeded.push('donors');
      }
    } catch (e) {
      console.warn('Error checking/seeding donors:', e);
    }

    // 7. Roles
    try {
      const rolesSnap = await getDocs(collection(db, 'roles'));
      if (rolesSnap.empty || forceAll) {
        console.log('Seeding roles...');
        for (const r of INITIAL_ROLES) {
          await setDoc(doc(db, 'roles', r.id), cleanData(r));
        }
        seeded.push('roles');
      }
    } catch (e) {
      console.warn('Error checking/seeding roles:', e);
    }

    // 8. Users
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      if (usersSnap.empty || forceAll) {
        console.log('Seeding users...');
        for (const u of INITIAL_USERS) {
          await setDoc(doc(db, 'users', u.id), cleanData(u));
        }
        seeded.push('users');
      }
    } catch (e) {
      console.warn('Error checking/seeding users:', e);
    }

    // 9. App Parameters
    try {
      const paramsSnap = await getDocs(collection(db, 'app_parameters'));
      if (paramsSnap.empty) {
        console.log('Seeding app_parameters...');
        await setDoc(doc(db, 'app_parameters', 'HIDE_GIFT_MATCHING'), { value: 'N' });
        seeded.push('app_parameters');
      }
    } catch (e) {
      console.warn('Error checking/seeding app_parameters:', e);
    }

    console.log(`Seeding complete. Populated collections: ${seeded.join(', ') || 'All were already populated'}`);
  } catch (error) {
    console.warn('Could not complete Firestore check/seed:', error);
  }

  return { seeded };
}

// Letter CRUD
export async function saveLetterToDb(letter: Letter): Promise<void> {
  const path = `letters/${letter.id}`;
  try {
    await setDoc(doc(db, 'letters', letter.id), cleanData(letter));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLetterFromDb(letterId: string, picId?: string, storagePath?: string): Promise<void> {
  const path = `letters/${letterId}`;
  if (picId) {
    try {
      await deleteLetterPhoto(picId, storagePath?.split('.').pop());
    } catch (photoErr) {
      console.warn('Could not delete photo when deleting letter:', photoErr);
    }
  }
  try {
    await deleteDoc(doc(db, 'letters', letterId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Event CRUD
export async function saveEventToDb(event: GiftGivingEvent): Promise<void> {
  const path = `events/${event.id}`;
  try {
    await setDoc(doc(db, 'events', event.id), cleanData(event));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteEventFromDb(eventId: string): Promise<void> {
  const path = `events/${eventId}`;
  try {
    await deleteDoc(doc(db, 'events', eventId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// School CRUD
export async function saveSchoolToDb(school: SchoolCatalogItem): Promise<void> {
  const path = `schools/${school.id}`;
  try {
    await setDoc(doc(db, 'schools', school.id), cleanData(school));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSchoolFromDb(schoolId: string): Promise<void> {
  const path = `schools/${schoolId}`;
  try {
    await deleteDoc(doc(db, 'schools', schoolId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Leader CRUD
export async function saveLeaderToDb(leader: Leader): Promise<void> {
  const path = `leaders/${leader.id}`;
  try {
    await setDoc(doc(db, 'leaders', leader.id), cleanData(leader));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteLeaderFromDb(leaderId: string): Promise<void> {
  const path = `leaders/${leaderId}`;
  try {
    await deleteDoc(doc(db, 'leaders', leaderId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Coordinator CRUD
export async function saveCoordinatorToDb(coordinator: Coordinator): Promise<void> {
  const path = `coordinators/${coordinator.id}`;
  try {
    await setDoc(doc(db, 'coordinators', coordinator.id), cleanData(coordinator));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteCoordinatorFromDb(coordinatorId: string): Promise<void> {
  const path = `coordinators/${coordinatorId}`;
  try {
    await deleteDoc(doc(db, 'coordinators', coordinatorId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Donor CRUD
export async function saveDonorToDb(donor: Donor): Promise<void> {
  const path = `donors/${donor.id}`;
  try {
    await setDoc(doc(db, 'donors', donor.id), cleanData(donor));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDonorFromDb(donorId: string): Promise<void> {
  const path = `donors/${donorId}`;
  try {
    await deleteDoc(doc(db, 'donors', donorId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Roles CRUD
export async function saveRoleToDb(role: CustomRole): Promise<void> {
  const path = `roles/${role.id}`;
  try {
    await setDoc(doc(db, 'roles', role.id), cleanData(role));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteRoleFromDb(roleId: string): Promise<void> {
  const path = `roles/${roleId}`;
  try {
    await deleteDoc(doc(db, 'roles', roleId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

// Users CRUD
export async function saveUserToDb(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const payload = cleanData({
      ...user,
      customRoleIds: user.customRoleIds || [],
    });
    await setDoc(doc(db, 'users', user.id), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteUserFromDb(userId: string): Promise<void> {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export interface FirestoreSubscriptions {
  onLetters?: (letters: Letter[]) => void;
  onEvents?: (events: GiftGivingEvent[]) => void;
  onSchools?: (schools: SchoolCatalogItem[]) => void;
  onLeaders?: (leaders: Leader[]) => void;
  onCoordinators?: (coordinators: Coordinator[]) => void;
  onDonors?: (donors: Donor[]) => void;
  onRoles?: (roles: CustomRole[]) => void;
  onUsers?: (users: User[]) => void;
}

export function subscribeToAllFirestore(callbacks: FirestoreSubscriptions): () => void {
  const unsubs: (() => void)[] = [];

  try {
    if (callbacks.onLetters) {
      const unsub = onSnapshot(
        collection(db, 'letters'),
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => d.data() as Letter);
            callbacks.onLetters!(data);
          }
        },
        (err) => {
          console.warn('Firestore letters subscription notice:', err.message);
        }
      );
      unsubs.push(unsub);
    }

    if (callbacks.onEvents) {
      const unsub = onSnapshot(
        collection(db, 'events'),
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => d.data() as GiftGivingEvent);
            callbacks.onEvents!(data);
          }
        },
        (err) => {
          console.warn('Firestore events subscription notice:', err.message);
        }
      );
      unsubs.push(unsub);
    }

    if (callbacks.onSchools) {
      const unsub = onSnapshot(
        collection(db, 'schools'),
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => d.data() as SchoolCatalogItem);
            callbacks.onSchools!(data);
          }
        },
        (err) => {
          console.warn('Firestore schools subscription notice:', err.message);
        }
      );
      unsubs.push(unsub);
    }

    if (callbacks.onLeaders) {
      const unsub = onSnapshot(
        collection(db, 'leaders'),
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => d.data() as Leader);
            callbacks.onLeaders!(data);
          }
        },
        (err) => {
          console.warn('Firestore leaders subscription notice:', err.message);
        }
      );
      unsubs.push(unsub);
    }

    if (callbacks.onCoordinators) {
      const unsub = onSnapshot(
        collection(db, 'coordinators'),
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => d.data() as Coordinator);
            callbacks.onCoordinators!(data);
          }
        },
        (err) => {
          console.warn('Firestore coordinators subscription notice:', err.message);
        }
      );
      unsubs.push(unsub);
    }

    if (callbacks.onDonors) {
      const unsub = onSnapshot(
        collection(db, 'donors'),
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => d.data() as Donor);
            callbacks.onDonors!(data);
          }
        },
        (err) => {
          console.warn('Firestore donors subscription notice:', err.message);
        }
      );
      unsubs.push(unsub);
    }

    if (callbacks.onRoles) {
      const unsub = onSnapshot(
        collection(db, 'roles'),
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => d.data() as CustomRole);
            callbacks.onRoles!(data);
          }
        },
        (err) => {
          console.warn('Firestore roles subscription notice:', err.message);
        }
      );
      unsubs.push(unsub);
    }

    if (callbacks.onUsers) {
      const unsub = onSnapshot(
        collection(db, 'users'),
        (snap) => {
          if (!snap.empty) {
            const data = snap.docs.map((d) => d.data() as User);
            callbacks.onUsers!(data);
          }
        },
        (err) => {
          console.warn('Firestore users subscription notice:', err.message);
        }
      );
      unsubs.push(unsub);
    }
  } catch (err) {
    console.warn('Could not establish some Firestore snapshot listeners:', err);
  }

  return () => {
    unsubs.forEach((u) => u());
  };
}
