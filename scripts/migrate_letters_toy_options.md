# Migration: `letters` collection — remove phone, rename toy options

Script: [migrate_letters_toy_options.ts](./migrate_letters_toy_options.ts)

This is a one-time backfill script for the `letters` Firestore collection that:

- Removes the `celphone` field.
- Renames `clothingRequest` → `toyRequested2` (value preserved).
- Renames `schoolItemRequest` → `toyRequested3` (value preserved).

It only touches the `letters` collection. The legacy `letter` (singular) alias
collection referenced in [compare_collections.ts](./compare_collections.ts) is
out of scope and is left untouched.

## Safety guards

1. **Dry run by default.** Simply running the script prints every change it
   *would* make without writing anything to Firestore.
2. **Idempotent.** Documents that are already on the new schema (no
   `celphone`, `clothingRequest`, or `schoolItemRequest` fields) are skipped,
   so it's safe to re-run.
3. **Double confirmation required to apply changes.** You must set both
   `APPLY=true` and `CONFIRM=<exact-projectId>` env vars. `CONFIRM` must match
   the `projectId` from the `firebase-applet-config.json` that gets loaded, so
   you are forced to explicitly name the project you intend to modify before
   anything is written.
4. It reads whichever `firebase-applet-config.json` lives in the directory you
   run it from, so it naturally targets whatever environment (DEV/UAT/PROD)
   that directory is wired to. No service-account credentials are required —
   Firestore rules allow open read/write on `letters`.

## How environments map in this repo

| Directory | Environment | Firebase projectId |
|---|---|---|
| `mr-web-ui` | DEV | `gen-lang-client-0695399990` |
| `uat-mr-web-ui` | UAT | `gen-lang-client-0695399990` (same project, synced separately) |
| `prod-mr-web-ui` | PROD | `prod-mision-regalos` |

## How to run against PROD

1. **Sync this script (and the related app code changes) into the PROD
   folder:**

   ```bash
   ~/mision-git/sync_dev_to_prod
   ```

   This rsyncs `mr-web-ui/` → `prod-mr-web-ui/`, bringing over
   `scripts/migrate_letters_toy_options.ts` and the matching source changes.

2. **(Strongly recommended) Back up the PROD `letters` collection first**,
   e.g. via the Firebase/GCP console export, or
   `gcloud firestore export` for project `prod-mision-regalos`, since this
   script deletes fields in place.

3. **Move into the PROD directory** (its `firebase-applet-config.json`
   already points at `prod-mision-regalos`):

   ```bash
   cd ~/mision-git/prod-mr-web-ui
   ```

4. **Dry run first** — review exactly what would change, no writes happen:

   ```bash
   bun scripts/migrate_letters_toy_options.ts
   ```

   Confirm the printed `Target project:` line reads `prod-mision-regalos`
   and review the list of documents/changes in the console output.

5. **Apply for real**, confirming the project by name:

   ```bash
   APPLY=true CONFIRM=prod-mision-regalos bun scripts/migrate_letters_toy_options.ts
   ```

6. **Spot-check** a few letters in the Firebase console (or a Firestore
   query) afterward to confirm `celphone` is gone and `toyRequested2` /
   `toyRequested3` carry the previous values.

7. Optionally, commit the script's presence in the PROD repo for history:

   ```bash
   ~/mision-git/commit_push_prod
   ```

   This is independent of executing the migration and only affects the git
   history of that folder, not the database.

## Running against DEV or UAT instead

The same script works unmodified against DEV or UAT — just run it from that
directory instead of `prod-mr-web-ui`, using that directory's own
`firebase-applet-config.json`:

```bash
# DEV
cd ~/mision-git/mr-web-ui
bun scripts/migrate_letters_toy_options.ts                       # dry run
APPLY=true CONFIRM=gen-lang-client-0695399990 bun scripts/migrate_letters_toy_options.ts   # apply

# UAT
cd ~/mision-git/uat-mr-web-ui
bun scripts/migrate_letters_toy_options.ts                       # dry run
APPLY=true CONFIRM=gen-lang-client-0695399990 bun scripts/migrate_letters_toy_options.ts   # apply
```
