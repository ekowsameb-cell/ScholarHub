# ScholarHub ERP — Architecture & Design

> Offline-first school management PWA for West African schools.
> Owner: Providers Consultancy · Stack: React 19 + TypeScript + Vite 8 + Firebase (Firestore/Auth/Hosting) + MUI 9 + Cloud Functions.

This document is the source of truth for how the repo *should* be shaped. Written against the
current code (audited 2026-09-22). It separates **what exists** from **what to build toward**, and
flags blockers that must be fixed before this can be called production-grade.

---

## 1. Current state (audit findings)

The repo is **not** a Vite template — it's a working product. The boilerplate README is simply wrong.

**Strengths**
- Offline-first data layer: `localStorage` is the primary store, Firestore is a secondary mirror, and `dbAdapter.ts` is the single write gate. Correct pattern for low-connectivity schools.
- Real West-African domain model: Users, Students, Classes, Subjects, Grades, Attendance, FeeTransactions, LessonPlans, Approvals, Tasks, Timetable, Messages, Announcements, CompensationProfiles, PayrollLedger.
- Ghana-specific compliance baked in: WAEC grading, GRA PAYE 2026 brackets, SSNIT Act 766.
- Approval workflow engine (grade / lesson-plan / enrollment / staff / salary).
- 7 role dashboards with a clean tab router in `App.tsx`.
- Service worker + Firebase Hosting + Cloud Functions (notifications).

**Blockers / gaps (priority order)**

| # | Severity | Issue | Where |
|---|----------|-------|-------|
| 0 | 🔴 Critical | Firebase **service-account private key committed** to git (`scholar-hub-198c5-firebase-adminsdk-*.json`). Anyone cloning gets root on the project. | `SECURITY.md` runbook + `.gitignore` |
| 1 | 🔴 Critical | Firestore rules allow **any signed-in user** (incl. anonymous) to read/write every collection. Client "roles" are not enforced server-side. | §4 target rules |
| 2 | 🟠 High | `firebase-admin` is a **frontend dependency**; cannot run in a browser, must never ship in a Vite bundle. | `package.json` (keep only in `functions/`) |
| 3 | 🟠 High | Service worker precaches **dev paths** (`/src/main.tsx`, …) absent from `dist/`, so the prod app shell never caches → not actually offline in prod. | `public/sw.js` (fixed) |
| 4 | 🟡 Med | No `manifest.webmanifest` → not installable as a PWA despite the "PWA" claim. | `public/manifest.webmanifest` (added) |
| 5 | 🟡 Med | `dbAdapter.ts` (~600 lines) entangles CRUD + sync with fire-and-forget writes that can clobber local data. | §3.3 refactor |
| 6 | 🟢 Low | README is the Vite boilerplate; no tests; `tsconfig` not strict; demo role-swap leaks into "auth". | README + §6 |

---

## 2. Target architecture (layered)

```
┌──────────────────────────────────────────────────────────────┐
│  PWA Shell (React + MUI)  ·  Service Worker (offline app shell)  │
└───────────────┬───────────────────────────┬──────────────────┘
                │                           │
        ┌───────▼────────┐          ┌─────────▼─────────┐
        │  UI / Pages    │          │  Auth Context     │  role + session
        │  (role routes) │          │  (claims-based)    │
        └───────┬────────┘          └─────────┬─────────┘
                │                           │
        ┌───────▼───────────────────────────▼─────────┐
        │           Data Access Layer (DAL)            │   ← single boundary
        │  students/ · finance/ · payroll/ · timetable/ │
        │  comms/ · approvals/ · auth/                 │
        └───────┬───────────────────────────┬─────────┘
                │                           │
        ┌───────▼────────┐          ┌─────────▼─────────┐
        │ Local Store    │  sync    │  Firestore (mirror) │
        │ (IndexedDB*)   │ ───────► │  + Cloud Functions  │
        │ localStorage   │ ◄─────── │  (claims, webhooks) │
        │  now)          │  push    │                     │
        └────────────────┘          └─────────────────────┘
```

\* `localStorage` works but is synchronous and size-capped (~5 MB). Migrate the DAL to **IndexedDB**
(through `idb` or Dexie) behind the same interface so the rest of the app is unchanged.

### 2.1 Why a DAL boundary
Today every page imports `dbAdapter` and "sync to Firestore" is entangled with CRUD. Extract
per-domain modules under `src/data/` so the UI never knows *where* data lives, sync/conflict policy
lives in one place, and the offline story is testable.

Proposed layout (additive — do not rewrite in one shot):
```
src/data/
  local/        # IndexedDB wrapper, versioned schema
  remote/       # Firestore read/write + outbox queue
  domains/
    students.ts  finance.ts  payroll.ts  timetable.ts
    comms.ts     approvals.ts  auth.ts
  dbAdapter.ts   # thin re-export facade (kept for compatibility)
```

---

## 3. Domain & data design

### 3.1 Role & permission model
Roles: `Owner · Admin · Headmaster · HOD · Teacher · Cashier · Parent`.
Permissions must be enforced in **three** places:
1. **UI** — which tabs render (done in `App.tsx`).
2. **DAL** — which domains a role may mutate (add guard helpers).
3. **Firestore rules** — via Auth **custom claims** (`role`, `schoolId`). The only one that actually secures data. See §4.

### 3.2 Offline-first contract
- Writes always succeed locally first (instant UI, works with no signal).
- Every local write is appended to an **outbox** with monotonic `updatedAt` + `clientId`.
- When online, the outbox drains to Firestore; remote wins on `updatedAt` except owner-scoped docs.
- `onSnapshot` pulls remote → merges locally (last-write-wins by `updatedAt`). No CRDT needed at this scale.

### 3.3 Sync hardening (replaces current fire-and-forget)
- Add `outbox` in local store: `{ id, entity, op, payload, updatedAt, synced }`.
- `saveList` → write local + enqueue outbox; a `SyncEngine` drains it.
- Never overwrite local with a stale/empty remote snapshot (the current `data.length >= local.length` guard is fragile — use `updatedAt` instead).
- Surface a real **sync status** in the UI (idle / pending N / error) instead of a silent banner.

---

## 4. Target Firestore security rules (server-side enforcement)

The current rules treat "signed in" == "authorized". Replace with custom-claims checks. Cloud
Functions (or the Admin SDK) set `role` + `schoolId` claims at login; rules read them.

```text
rules_version = '2';
service cloud.firestore {
  function isSignedIn() { return request.auth != null; }
  function role() { return request.auth.token.role; }
  function schoolId() { return request.auth.token.schoolId; }
  // a user may touch a doc only if it belongs to their school
  function sameSchool(res) { return res.data.schoolId == schoolId(); }

  match /databases/{database}/documents {
    // school-scoped collections
    match /{c=students|classes|subjects|grades|attendance|feeTransactions|
              lessonPlans|approvals|tasks|timetable|assignments|
              compensationProfiles|salaryApprovals|payrollLedger|users}/{docId} {
      allow read:  if isSignedIn() && sameSchool(resource);
      allow write: if isSignedIn() && schoolId() == request.resource.data.schoolId
                   && (role() in ['Owner','Admin']
                       || (c == 'grades'        && role() in ['Teacher','HOD','Headmaster','Admin','Owner'])
                       || (c == 'attendance'     && role() in ['Teacher','Admin','Owner'])
                       || (c == 'feeTransactions'&& role() in ['Cashier','Admin','Owner'])
                       || (c == 'lessonPlans'    && role() in ['Teacher','HOD','Headmaster','Admin','Owner'])
                       || (c == 'users'          && role() in ['Owner','Admin']));
    }
    match /messages/{id} {
      allow read:   if isSignedIn() && (request.auth.uid == resource.data.senderId
                                        || request.auth.uid == resource.data.receiverId);
      allow create: if isSignedIn() && request.auth.uid == request.resource.data.senderId;
    }
    match /announcements/{id} {
      allow read:   if isSignedIn() && sameSchool(resource);
      allow create: if isSignedIn() && role() in ['Admin','Headmaster'];
    }
    match /{document=**} { allow read, write: if false; }
  }
}
```

> Note: anonymous auth (`signInAnonymously`) gives no claims, so it must be **removed** for prod —
> replace with email/phone or a real IdP. Anonymous is fine for a local demo only.

---

## 5. PWA / offline design

- `public/sw.js` now uses **runtime caching**: precache only `/`, `/index.html`, `/manifest.webmanifest`,
  `/favicon.svg`; serve navigations from cache with `/index.html` fallback; cache-first for same-origin
  static assets, updating the cache in the background. This works against the real `dist/` output.
- `public/manifest.webmanifest` makes the app installable (name, icons, `display: standalone`,
  `start_url`, theme color). Add `<link rel="manifest">` to `index.html`.
- Icons: add `public/icons/icon-192.png` and `public/icons/icon-512.png` (reference them in the manifest).

---

## 6. Quality & process

- **README**: replaced boilerplate with a real overview, run instructions, and the security note.
- **TypeScript**: enable `"strict": true` in `tsconfig.app.json` (incremental; fix errors per file).
- **Tests**: add Vitest; start with `payrollCompliance.ts` (pure, high-value, easy to verify against
  GRA/SSNIT tables) and the grade/WAEC helpers.
- **Lint/CI**: keep `oxlint`; add a `test` step to `.github/workflows/deploy.yml`.
- **Secrets**: never commit keys. Service-account JSON lives only as a **GitHub Actions secret**
  (`FIREBASE_SERVICE_ACCOUNT`), which the existing deploy workflow already consumes.

---

## 7. Build / run

```bash
npm install            # frontend
cd functions && npm install && cd ..
cp .env.example .env   # fill VITE_FIREBASE_* from your Firebase console
npm run dev            # local dev (http://localhost:5173)
npm run build          # tsc -b && vite build -> dist/
npm run lint
npm run preview        # serve the production build locally
```

Deploy (already wired): push to `main` → GitHub Actions builds and runs
`FirebaseExtended/action-hosting-deploy` using the `FIREBASE_SERVICE_ACCOUNT` secret.
Cloud Functions deploy separately with `firebase deploy --only functions`.

---

## 8. Roadmap (suggested order)

1. 🔴 Rotate + purge the leaked key (see `SECURITY.md`); tighten Firestore rules (§4); drop anon auth.
2. 🟠 Remove `firebase-admin` from frontend; ship the fixed service worker + manifest.
3. 🟡 Introduce the DAL boundary + outbox sync; migrate `localStorage` → IndexedDB.
4. 🟢 Strict TS, tests for payroll/grading, real auth (email/phone), audit logging.
