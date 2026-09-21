# ScholarHub ERP

**Offline-first school management PWA for West African schools.**

Built by **Providers Consultancy**. ScholarHub runs a whole school from a single Progressive Web App:
admissions, attendance, grading (WAEC-aligned), fees & receipts, timetabling, staff payroll with
Ghana statutory compliance (GRA PAYE 2026 + SSNIT Act 766), an approvals workflow, and parent
messaging — all usable with intermittent connectivity.

> ⚠️ **Security notice:** A Firebase service-account key was previously committed to this repo. It has
> been removed from tracking and gitignored, but it remains in git history. **Rotate the key and purge
> history** before any production use — see [`SECURITY.md`](./SECURITY.md). Architecture and the
> security model are described in [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Stack
- **Frontend:** React 19 + TypeScript + Vite 8, MUI 9, React Router 7, Lucide icons.
- **Backend:** Firebase (Firestore, Auth, Hosting) + Cloud Functions (notifications/approvals).
- **Offline:** writes land in a local store first, then mirror to Firestore when online.
- **Lint:** Oxlint.

## Roles
Owner · Admin · Headmaster · HOD · Teacher · Cashier · Parent — each with a dedicated dashboard.

## Run locally
```bash
npm install
cp .env.example .env          # fill VITE_FIREBASE_* from the Firebase console
npm run dev                   # http://localhost:5173
```
Build & preview:
```bash
npm run build                 # tsc -b && vite build -> dist/
npm run preview
npm run lint
```

## Deploy
Push to `main` → GitHub Actions builds and deploys to Firebase Hosting
(`FirebaseExtended/action-hosting-deploy`, authenticated with the `FIREBASE_SERVICE_ACCOUNT` secret).
Cloud Functions deploy separately:
```bash
firebase deploy --only functions
```

## Project layout
```
src/
  dbAdapter.ts      # single data-access gate (localStorage + Firestore sync)
  firebase.ts        # client SDK init (anon auth + offline persistence)
  context/AuthContext.tsx
  pages/            # 7 role dashboards + Messages + StaffProfile + AdminPanel
  components/        # Sidebar, Header, OfflineBanner, approval/salary portals…
  data/mockData.ts   # domain types + seed data
  services/          # aiService (lesson plans), smsService
  utils/             # payrollCompliance (GRA/SSNIT), reportGenerator, useRealtimeCollection
public/
  sw.js              # service worker (offline app shell)
  manifest.webmanifest
functions/           # Cloud Functions (server-only; holds firebase-admin)
```

## Status
Working product skeleton with real domain logic and compliance math. See `ARCHITECTURE.md` §8 for the
roadmap (server-side security rules, DAL/outbox sync hardening, IndexedDB migration, tests).
