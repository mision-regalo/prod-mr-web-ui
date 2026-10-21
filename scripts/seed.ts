import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };
import {
  INITIAL_LETTERS,
  INITIAL_EVENTS,
  INITIAL_SCHOOLS,
  INITIAL_LEADERS,
  INITIAL_COORDINATORS,
  INITIAL_DONORS,
  INITIAL_ROLES,
  INITIAL_USERS,
} from '../src/data/mockData';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

function cleanData<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

async function seed() {
  console.log('Seeding all collections to Firestore database:', firebaseConfig.firestoreDatabaseId);

  // 1. Letters
  console.log(`Seeding ${INITIAL_LETTERS.length} letters...`);
  for (const l of INITIAL_LETTERS) {
    await setDoc(doc(db, 'letters', l.id), cleanData(l));
  }

  // 2. Events
  console.log(`Seeding ${INITIAL_EVENTS.length} events...`);
  for (const ev of INITIAL_EVENTS) {
    await setDoc(doc(db, 'events', ev.id), cleanData(ev));
  }

  // 3. Schools
  console.log(`Seeding ${INITIAL_SCHOOLS.length} schools...`);
  for (const sch of INITIAL_SCHOOLS) {
    await setDoc(doc(db, 'schools', sch.id), cleanData(sch));
  }

  // 4. Leaders
  console.log(`Seeding ${INITIAL_LEADERS.length} leaders...`);
  for (const lead of INITIAL_LEADERS) {
    await setDoc(doc(db, 'leaders', lead.id), cleanData(lead));
  }

  // 5. Coordinators
  console.log(`Seeding ${INITIAL_COORDINATORS.length} coordinators...`);
  for (const c of INITIAL_COORDINATORS) {
    await setDoc(doc(db, 'coordinators', c.id), cleanData(c));
  }

  // 6. Donors
  console.log(`Seeding ${INITIAL_DONORS.length} donors...`);
  for (const d of INITIAL_DONORS) {
    await setDoc(doc(db, 'donors', d.id), cleanData(d));
  }

  // 7. Roles
  console.log(`Seeding ${INITIAL_ROLES.length} roles...`);
  for (const r of INITIAL_ROLES) {
    await setDoc(doc(db, 'roles', r.id), cleanData(r));
  }

  // 8. Users
  console.log(`Seeding ${INITIAL_USERS.length} users...`);
  for (const u of INITIAL_USERS) {
    await setDoc(doc(db, 'users', u.id), cleanData(u));
  }

  console.log('✅ ALL COLLECTIONS SUCCESSFULLY POPULATED IN FIRESTORE!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding error:', err);
  process.exit(1);
});
