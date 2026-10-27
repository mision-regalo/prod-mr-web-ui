// Migration script for the `letters` collection schema change:
//   1. Removes the `celphone` field.
//   2. Renames `clothingRequest`  -> `toyRequested2` (value preserved).
//   3. Renames `schoolItemRequest` -> `toyRequested3` (value preserved).
//
// The script is read-only (dry-run) by default: it reports every document it
// would change without writing anything. To actually apply the changes you
// must opt in explicitly (see the "How to run" instructions below / README
// section this script was requested alongside).
//
// Usage (dry run):
//   bun scripts/migrate_letters_toy_options.ts
//
// Usage (apply changes):
//   APPLY=true CONFIRM=<firebase-projectId> bun scripts/migrate_letters_toy_options.ts
//
// CONFIRM must exactly match the `projectId` from the `firebase-applet-config.json`
// that is loaded, so you are forced to explicitly name the project you intend
// to modify (e.g. CONFIRM=prod-mision-regalos when run from prod-mr-web-ui).

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  writeBatch,
  deleteField,
  type DocumentData,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

const APPLY = (process.env.APPLY || '').toLowerCase() === 'true';
const CONFIRM = process.env.CONFIRM || '';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const OLD_PHONE_FIELD = 'celphone';
const OLD_CLOTHING_FIELD = 'clothingRequest';
const OLD_SCHOOL_ITEM_FIELD = 'schoolItemRequest';
const NEW_TOY2_FIELD = 'toyRequested2';
const NEW_TOY3_FIELD = 'toyRequested3';

// Firestore client SDK batches are capped at 500 operations; stay well under that.
const BATCH_SIZE = 400;

function buildUpdate(data: DocumentData): Record<string, unknown> | null {
  const update: Record<string, unknown> = {};
  let hasChanges = false;

  if (OLD_PHONE_FIELD in data) {
    update[OLD_PHONE_FIELD] = deleteField();
    hasChanges = true;
  }

  if (OLD_CLOTHING_FIELD in data) {
    update[NEW_TOY2_FIELD] = data[OLD_CLOTHING_FIELD];
    update[OLD_CLOTHING_FIELD] = deleteField();
    hasChanges = true;
  }

  if (OLD_SCHOOL_ITEM_FIELD in data) {
    update[NEW_TOY3_FIELD] = data[OLD_SCHOOL_ITEM_FIELD];
    update[OLD_SCHOOL_ITEM_FIELD] = deleteField();
    hasChanges = true;
  }

  return hasChanges ? update : null;
}

async function migrate() {
  console.log(`Target project:  ${firebaseConfig.projectId}`);
  console.log(`Target database: ${firebaseConfig.firestoreDatabaseId}`);
  console.log(`Mode: ${APPLY ? 'APPLY (will write changes)' : 'DRY RUN (no writes will be made)'}`);
  console.log('');

  if (APPLY && CONFIRM !== firebaseConfig.projectId) {
    console.error(
      `❌ Refusing to apply changes: CONFIRM env var must exactly equal the target projectId.\n` +
        `   Expected CONFIRM=${firebaseConfig.projectId}, got CONFIRM=${CONFIRM || '(empty)'}\n` +
        `   Re-run as: APPLY=true CONFIRM=${firebaseConfig.projectId} bun scripts/migrate_letters_toy_options.ts`
    );
    process.exit(1);
  }

  const lettersSnap = await getDocs(collection(db, 'letters'));
  console.log(`Found ${lettersSnap.size} documents in 'letters'.`);

  let toMigrate = 0;
  let alreadyMigrated = 0;
  let batch = writeBatch(db);
  let opsInBatch = 0;
  let batchesCommitted = 0;

  for (const docSnap of lettersSnap.docs) {
    const data = docSnap.data();
    const update = buildUpdate(data);

    if (!update) {
      alreadyMigrated++;
      continue;
    }

    toMigrate++;
    console.log(
      `${APPLY ? 'Updating' : '[dry-run] Would update'} letters/${docSnap.id}:`,
      JSON.stringify(
        {
          ...(OLD_PHONE_FIELD in data ? { [OLD_PHONE_FIELD]: 'REMOVED' } : {}),
          ...(OLD_CLOTHING_FIELD in data
            ? { [OLD_CLOTHING_FIELD]: `-> ${NEW_TOY2_FIELD}` }
            : {}),
          ...(OLD_SCHOOL_ITEM_FIELD in data
            ? { [OLD_SCHOOL_ITEM_FIELD]: `-> ${NEW_TOY3_FIELD}` }
            : {}),
        }
      )
    );

    if (APPLY) {
      batch.update(docSnap.ref, update);
      opsInBatch++;

      if (opsInBatch >= BATCH_SIZE) {
        await batch.commit();
        batchesCommitted++;
        batch = writeBatch(db);
        opsInBatch = 0;
      }
    }
  }

  if (APPLY && opsInBatch > 0) {
    await batch.commit();
    batchesCommitted++;
  }

  console.log('');
  console.log(`Documents already on the new schema: ${alreadyMigrated}`);
  console.log(`Documents ${APPLY ? 'migrated' : 'that would be migrated'}: ${toMigrate}`);
  if (APPLY) {
    console.log(`Batches committed: ${batchesCommitted}`);
    console.log('✅ Migration applied.');
  } else {
    console.log('ℹ️  Dry run complete. No changes were written. Re-run with APPLY=true CONFIRM=<projectId> to apply.');
  }

  process.exit(0);
}

migrate().catch((err) => {
  console.error('❌ Migration error:', err);
  process.exit(1);
});
