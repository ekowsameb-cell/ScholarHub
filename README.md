# ScholarHub ERP

Offline-first School Management System (PWA) — by **Providers Consultancy** (Ecow).
Evolved from SchoolLedger, expanded to the full student lifecycle.

## Modules (Alpha)
- **A. Admissions** — admit a child, auto-create parent login, assign to class.
- **B. Academic Setup** — classes, subjects, weekly timetable.
- **C. Gradebook** — teacher enters CA1/CA2/Exam → auto total + letter grade from schoolProfile.gradingSystem; Term Report compiler (HTML + PDF via jsPDF).
- **D. Attendance & Behavior** — offline attendance grid + discipline log with WhatsApp parent alert (wa.me).
- **E. Finance** — fee templates, cashier collects, wa.me receipt, dashboard.
- **F. Parent Portal** — view child's grades/attendance/balance (v1 PIN mode).
- **Polish** — RBAC launcher, global search, Chart.js dashboards, jsPDF reports.

## Stack
Pure static PWA: HTML/CSS/JS + localStorage + vendored jsPDF & Chart.js (works fully offline).
No server required. Phase 2 (Firebase Auth, Cloud Function auto-receipts, ID-card PDF, multi-device sync) is planned.

## Default PINs (all roles): 0000 — change before real use.
Deploy: push to GitHub Pages. Live PWA, installable.

⚡ Powered by Providers Consultancy
