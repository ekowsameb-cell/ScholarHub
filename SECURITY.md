# Security Runbook — Leaked Firebase Service Account

**Severity: CRITICAL.** A Firebase Admin SDK service-account private key is currently committed to
this repository:

```
scholar-hub-198c5-firebase-adminsdk-fbsvc-bc09590550.json
```

Anyone who clones the repo (or reads its git history) can use it to **read and write every document**
in the `scholar-hub-198c5` Firestore project and access Storage. Treat it as compromised.

> This file has been removed from tracking and gitignored (commit following the audit), **but it is
> still present in git history**. History must be purged and the key rotated. Do not rely on the
> file deletion alone.

## Immediate actions (do these now, in order)

1. **Rotate the key.** In the Firebase console → *Project settings → Service accounts*, click
   *Generate new private key* (or delete the existing `scholar-hub-198c5` service account key). The
   old key stops working the moment you generate/delete a new one. This is the single most important step.

2. **Purge from git history.** The file is in past commits, so `git rm --cached` is not enough.
   Use one of:
   - `git filter-repo --path scholar-hub-198c5-firebase-adminsdk-*.json --invert-paths`
     (requires `git-filter-repo`; cleanest), **or**
   - BFG Repo Cleaner.
   Then `git push --force-with-lease` to `main`. Coordinate with collaborators — this rewrites history.

3. **Verify no other secrets are tracked.** Run `git ls-files` and grep for `.env`, `*.json` service
   accounts, `*.pem`. Add any hits to `.gitignore` and repeat step 2 for them.

4. **Keep the key out of CI too.** The deploy workflow already uses the
   `FIREBASE_SERVICE_ACCOUNT` **GitHub Actions secret**, not a file in the repo. Confirm the secret
   holds the *new* key after rotation. Delete the old Actions secret if it exists.

## Why this happened
The repo ships `firebase-admin` as a **frontend** dependency and kept a server-only key file in the
tree. Admin SDK + its key belong **only** in `functions/` (or another server), never in a browser bundle
or in version control. `src/firebaseAdmin.ts` correctly documents this; the dependency was simply in
the wrong `package.json`.

## Prevention
- `.gitignore` now excludes `*-firebase-adminsdk-*.json` and `serviceAccountKey.json`.
- Service-account JSON is provided to CI exclusively via encrypted Actions secrets.
- Add a pre-commit scan (e.g. `gitleaks` / `trufflehog`) to `.github/workflows` to catch future leaks.
