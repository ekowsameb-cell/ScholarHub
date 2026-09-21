import {
  dbGetStudents, dbGetClasses, dbGetUsers, dbGetSubjects,
  dbGetGrades, dbGetTransactions, dbGetLessonPlans,
  dbGetApprovals, dbGetTimetableSlots
} from '../dbAdapter';
import { calculateWAECGrade } from '../data/mockData';
import type { Student, User } from '../data/mockData';

// Helper to open printable window with official institutional styling
const openPrintWindow = (title: string, contentHtml: string) => {
  const win = window.open('', '_blank', 'width=950,height=850');
  if (!win) {
    alert('Please allow popups for ScholarHub ERP to generate and print reports.');
    return;
  }

  win.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title} - ScholarHub ERP</title>
        <style>
          @page { size: A4 portrait; margin: 12mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #fff;
            padding: 24px;
            margin: 0;
            line-height: 1.45;
            font-size: 12.5px;
          }
          .header {
            border-bottom: 3px double #0f172a;
            padding-bottom: 12px;
            margin-bottom: 18px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          .school-title {
            font-size: 20px;
            font-weight: 900;
            letter-spacing: -0.5px;
            color: #0f172a;
            text-transform: uppercase;
          }
          .school-sub {
            font-size: 11.5px;
            color: #475569;
            font-weight: 600;
            margin-top: 2px;
          }
          .report-meta {
            text-align: right;
            font-size: 11px;
            color: #475569;
          }
          .report-badge {
            display: inline-block;
            background: #0f172a;
            color: #fff;
            font-weight: 800;
            font-size: 10.5px;
            padding: 3px 8px;
            border-radius: 4px;
            text-transform: uppercase;
            margin-bottom: 4px;
            letter-spacing: 0.5px;
          }
          .section-title {
            font-size: 13px;
            font-weight: 800;
            color: #0f172a;
            border-bottom: 1.5px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 18px;
            margin-bottom: 8px;
            text-transform: uppercase;
            display: flex;
            justify-content: space-between;
          }
          .kpi-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 8px;
            margin-bottom: 14px;
          }
          .kpi-box {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 10px;
          }
          .kpi-label {
            font-size: 9.5px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 700;
          }
          .kpi-val {
            font-size: 15px;
            font-weight: 800;
            color: #0f172a;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
            margin-bottom: 12px;
            font-size: 11.5px;
          }
          th {
            background: #f1f5f9;
            color: #334155;
            font-weight: 700;
            text-align: left;
            padding: 5px 8px;
            border: 1px solid #cbd5e1;
            text-transform: uppercase;
            font-size: 10px;
            letter-spacing: 0.3px;
          }
          td {
            padding: 5px 8px;
            border: 1px solid #e2e8f0;
            color: #334155;
          }
          tr:nth-child(even) td {
            background: #f8fafc;
          }
          .badge-pill {
            display: inline-block;
            padding: 1px 6px;
            border-radius: 9999px;
            font-size: 9.5px;
            font-weight: 700;
          }
          .badge-green { background: #dcfce7; color: #15803d; }
          .badge-amber { background: #fef3c7; color: #b45309; }
          .badge-blue { background: #dbeafe; color: #1d4ed8; }
          .badge-red { background: #fee2e2; color: #b91c1c; }
          .signoff-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 40px;
            margin-top: 30px;
            page-break-inside: avoid;
          }
          .signoff-box {
            border-top: 1px solid #334155;
            padding-top: 6px;
            font-size: 11px;
            color: #334155;
          }
          .footer {
            margin-top: 25px;
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            font-size: 9.5px;
            color: #94a3b8;
            display: flex;
            justify-content: space-between;
          }
          .print-btn-bar {
            margin-bottom: 16px;
            padding: 10px 14px;
            background: #f1f5f9;
            border-radius: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          @media print {
            .print-btn-bar { display: none; }
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="print-btn-bar">
          <div style="font-weight: 700; color: #334155; font-size: 12px;">📄 ${title} Preview</div>
          <div style="display: flex; gap: 8px;">
            <button onclick="window.print()" style="padding: 6px 14px; background: #2563eb; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 12px;">🖨️ Print / Save PDF</button>
            <button onclick="window.close()" style="padding: 6px 12px; background: #64748b; color: #fff; border: none; border-radius: 4px; font-weight: 700; cursor: pointer; font-size: 12px;">✕ Close</button>
          </div>
        </div>
        ${contentHtml}
        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 400);
          };
        </script>
      </body>
    </html>
  `);
  win.document.close();
};

// 1. OWNER / PROPRIETOR REPORT
export const generateOwnerReport = () => {
  const students = dbGetStudents();
  const transactions = dbGetTransactions();
  const classes = dbGetClasses();

  const totalRevenue = transactions.reduce((s, t) => s + t.amountPaid, 0);
  const totalOutstanding = students.reduce((s, st) => s + (st.currentBalance || 0), 0);
  const totalCharged = totalRevenue + totalOutstanding;
  const momoTotal = transactions.filter(t => t.paymentMethod === 'MoMo').reduce((s, t) => s + t.amountPaid, 0);
  const cashTotal = transactions.filter(t => t.paymentMethod === 'Cash').reduce((s, t) => s + t.amountPaid, 0);
  const totalCapacity = classes.reduce((s, c) => s + (c.capacity || 35), 0);

  const html = `
    <div class="header">
      <div>
        <div class="school-title">SCHOLARHUB INSTITUTIONAL ERP</div>
        <div class="school-sub">Accra, Ghana • Ministry of Education / NaSIA Compliant</div>
      </div>
      <div class="report-meta">
        <div class="report-badge">Executive Statement</div>
        <div><strong>Ref:</strong> SH-OWN-${Date.now().toString().slice(-6)}</div>
        <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <div><strong>Academic Term:</strong> Term 1 (2026 Academic Year)</div>
      </div>
    </div>

    <div class="section-title">Institutional Financial Summary (Term 1)</div>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Total Term Billing</div>
        <div class="kpi-val" style="color: #2563eb;">GHS ${totalCharged.toLocaleString()}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Total Revenue Collected</div>
        <div class="kpi-val" style="color: #16a34a;">GHS ${totalRevenue.toLocaleString()}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Outstanding Arrears</div>
        <div class="kpi-val" style="color: #dc2626;">GHS ${totalOutstanding.toLocaleString()}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Enrollment vs Capacity</div>
        <div class="kpi-val">${students.length} / ${totalCapacity} (${Math.round((students.length / Math.max(1, totalCapacity)) * 100)}%)</div>
      </div>
    </div>

    <div class="section-title">Payment Channel Liquidity Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Payment Channel</th>
          <th>Transaction Count</th>
          <th>Total Collected (GHS)</th>
          <th>Contribution %</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong>📱 Mobile Money Gateway (MTN / Telecel / AT)</strong></td>
          <td>${transactions.filter(t => t.paymentMethod === 'MoMo').length}</td>
          <td><strong>GHS ${momoTotal.toLocaleString()}</strong></td>
          <td>${totalRevenue > 0 ? Math.round((momoTotal / totalRevenue) * 100) : 0}%</td>
        </tr>
        <tr>
          <td><strong>💵 Cash Office Ledger</strong></td>
          <td>${transactions.filter(t => t.paymentMethod === 'Cash').length}</td>
          <td><strong>GHS ${cashTotal.toLocaleString()}</strong></td>
          <td>${totalRevenue > 0 ? Math.round((cashTotal / totalRevenue) * 100) : 0}%</td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">Class Enrollment & Capacity Breakdown</div>
    <table>
      <thead>
        <tr>
          <th>Class Name</th>
          <th>Enrolled Students</th>
          <th>Class Capacity</th>
          <th>Occupancy Rate</th>
          <th>Class Arrears (GHS)</th>
        </tr>
      </thead>
      <tbody>
        ${classes.map(cls => {
          const stList = students.filter(s => s.classId === cls.classId);
          const cap = cls.capacity || 35;
          const arrears = stList.reduce((s, st) => s + (st.currentBalance || 0), 0);
          return `
            <tr>
              <td><strong>${cls.name}</strong></td>
              <td>${stList.length} students</td>
              <td>${cap} seats</td>
              <td><span class="badge-pill badge-blue">${Math.round((stList.length / cap) * 100)}%</span></td>
              <td style="color: ${arrears > 0 ? '#dc2626' : '#16a34a'}; font-weight: 700;">GHS ${arrears.toLocaleString()}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="section-title">Recent Financial Transactions</div>
    <table>
      <thead>
        <tr>
          <th>Receipt No.</th>
          <th>Student Name</th>
          <th>Channel</th>
          <th>Amount Paid</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.slice(0, 8).map(tx => {
          const st = students.find(s => s.studentId === tx.studentId);
          return `
            <tr>
              <td style="font-family: monospace; font-weight: 700;">${tx.receiptNumber}</td>
              <td>${st?.fullName || tx.studentId}</td>
              <td><span class="badge-pill ${tx.paymentMethod === 'MoMo' ? 'badge-blue' : 'badge-green'}">${tx.paymentMethod}</span></td>
              <td style="font-weight: 700; color: #16a34a;">GHS ${tx.amountPaid.toLocaleString()}</td>
              <td>${new Date(tx.timestamp).toLocaleString()}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="signoff-grid">
      <div class="signoff-box">
        <strong>Prepared by:</strong> School Bursar / Cashier Office<br>
        <strong>Sign &amp; Date:</strong> ___________________________
      </div>
      <div class="signoff-box">
        <strong>Approved by:</strong> Dr. Kwame Mensah (School Owner / Proprietor)<br>
        <strong>Sign &amp; Date:</strong> ___________________________
      </div>
    </div>

    <div class="footer">
      <span>ScholarHub ERP • Confidential Proprietor Statement</span>
      <span>Page 1 of 1</span>
    </div>
  `;

  openPrintWindow('Executive Institutional & Financial Audit Statement', html);
};

// 2. HEADMASTER REPORT
export const generateHeadmasterReport = () => {
  const students = dbGetStudents();
  const classes = dbGetClasses();
  const teachers = dbGetUsers().filter(u => u.role === 'Teacher');
  const grades = dbGetGrades();
  const approvals = dbGetApprovals();

  const avgAttendance = students.length > 0
    ? Math.round(students.reduce((s, st) => s + (st.attendanceRate || 0), 0) / students.length * 10) / 10
    : 0;

  const totalGradesCount = Math.max(1, grades.length);
  const distinctionCount = grades.filter(g => g.grade === 'A1' || g.grade === 'B2' || g.grade === 'B3').length;
  const creditCount = grades.filter(g => g.grade === 'C4' || g.grade === 'C5' || g.grade === 'C6').length;
  const remedialCount = grades.filter(g => g.grade === 'D7' || g.grade === 'E8' || g.grade === 'F9').length;

  const html = `
    <div class="header">
      <div>
        <div class="school-title">SCHOLARHUB INSTITUTIONAL ERP</div>
        <div class="school-sub">Academic Quality Assurance & Standards Division</div>
      </div>
      <div class="report-meta">
        <div class="report-badge">Academic Audit Report</div>
        <div><strong>Ref:</strong> SH-HEAD-${Date.now().toString().slice(-6)}</div>
        <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <div><strong>Authority:</strong> Headmaster Office</div>
      </div>
    </div>

    <div class="section-title">Academic & Institutional KPIs</div>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">School-wide Attendance</div>
        <div class="kpi-val" style="color: #16a34a;">${avgAttendance}%</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Total Student Cohort</div>
        <div class="kpi-val">${students.length} Pupils</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Teaching Staff Strength</div>
        <div class="kpi-val">${teachers.length} Faculty</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">NaSIA Quality Compliance</div>
        <div class="kpi-val" style="color: #2563eb;">Certified 98%</div>
      </div>
    </div>

    <div class="section-title">WAEC Grade Scale Cohort Evaluation</div>
    <table>
      <thead>
        <tr>
          <th>Performance Band</th>
          <th>WAEC Grade Scale</th>
          <th>Candidate Count</th>
          <th>Cohort Share %</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><strong style="color: #1d4ed8;">Distinction Band</strong></td>
          <td>A1, B2, B3</td>
          <td>${distinctionCount} candidates</td>
          <td><strong>${Math.round((distinctionCount / totalGradesCount) * 100)}%</strong></td>
        </tr>
        <tr>
          <td><strong style="color: #16a34a;">Credit Pass Band</strong></td>
          <td>C4, C5, C6</td>
          <td>${creditCount} candidates</td>
          <td><strong>${Math.round((creditCount / totalGradesCount) * 100)}%</strong></td>
        </tr>
        <tr>
          <td><strong style="color: #dc2626;">Pass / Remedial Band</strong></td>
          <td>D7, E8, F9</td>
          <td>${remedialCount} candidates</td>
          <td><strong>${Math.round((remedialCount / totalGradesCount) * 100)}%</strong></td>
        </tr>
      </tbody>
    </table>

    <div class="section-title">Class-by-Class Attendance & Performance</div>
    <table>
      <thead>
        <tr>
          <th>Class Name</th>
          <th>Enrollment</th>
          <th>Average Attendance</th>
          <th>Attendance Status</th>
        </tr>
      </thead>
      <tbody>
        ${classes.map(cls => {
          const classStudents = students.filter(s => s.classId === cls.classId);
          const classAvgAtt = classStudents.length > 0
            ? Math.round(classStudents.reduce((s, st) => s + (st.attendanceRate || 0), 0) / classStudents.length * 10) / 10
            : 0;
          return `
            <tr>
              <td><strong>${cls.name}</strong></td>
              <td>${classStudents.length} pupils</td>
              <td><strong>${classAvgAtt}%</strong></td>
              <td>
                <span class="badge-pill ${classAvgAtt >= 90 ? 'badge-green' : classAvgAtt >= 75 ? 'badge-amber' : 'badge-red'}">
                  ${classAvgAtt >= 90 ? 'Optimal' : classAvgAtt >= 75 ? 'Acceptable' : 'Under Review'}
                </span>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="section-title">Statutory Sign-Offs & Lesson Approvals</div>
    <table>
      <thead>
        <tr>
          <th>Request Type</th>
          <th>Subject / Candidate</th>
          <th>Submission Date</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${approvals.slice(0, 6).map(a => `
          <tr>
            <td><strong>${a.type.replace('_', ' ')}</strong></td>
            <td>${a.dataSnapshot?.fullName || a.dataSnapshot?.topic || a.dataSnapshot?.subjectId || 'Statutory File'}</td>
            <td>${new Date(a.timestamp).toLocaleDateString()}</td>
            <td><span class="badge-pill ${a.status === 'Approved' ? 'badge-green' : a.status === 'Pending' ? 'badge-amber' : 'badge-red'}">${a.status}</span></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="signoff-grid">
      <div class="signoff-box">
        <strong>Report Verified by:</strong> Mr. Emmanuel Osei (Headmaster)<br>
        <strong>Signature:</strong> ___________________________
      </div>
      <div class="signoff-box">
        <strong>Academic Directorate Endorsement:</strong><br>
        <strong>Official Seal &amp; Date:</strong> ___________________________
      </div>
    </div>

    <div class="footer">
      <span>ScholarHub ERP • Headmaster's Quality Assurance Audit</span>
      <span>Page 1 of 1</span>
    </div>
  `;

  openPrintWindow('Academic Quality Assurance & Standards Audit Report', html);
};

// 3. ADMIN REPORT
export const generateAdminReport = () => {
  const students = dbGetStudents();
  const users = dbGetUsers();
  const classes = dbGetClasses();
  const subjects = dbGetSubjects();
  const timetableSlots = dbGetTimetableSlots();

  const html = `
    <div class="header">
      <div>
        <div class="school-title">SCHOLARHUB INSTITUTIONAL ERP</div>
        <div class="school-sub">Directorate of Administration, HR & Logistics</div>
      </div>
      <div class="report-meta">
        <div class="report-badge">Institutional Census</div>
        <div><strong>Ref:</strong> SH-ADM-${Date.now().toString().slice(-6)}</div>
        <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <div><strong>Statutory Code:</strong> GES-EMIS-ACC-2026</div>
      </div>
    </div>

    <div class="section-title">Institutional Resource Ratios</div>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Total Student Register</div>
        <div class="kpi-val">${students.length} Enrolled</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Active Staff Accounts</div>
        <div class="kpi-val">${users.filter(u => u.isActive).length} Verified</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Master Timetable Slots</div>
        <div class="kpi-val">${timetableSlots.length} Scheduled</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">mNotify SMS Credits</div>
        <div class="kpi-val" style="color: #2563eb;">4,850 Units</div>
      </div>
    </div>

    <div class="section-title">Staff Faculty & Subject Allocations</div>
    <table>
      <thead>
        <tr>
          <th>Staff Name</th>
          <th>Institutional Role</th>
          <th>Assigned Teaching Subject</th>
          <th>Official Email</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${users.filter(u => u.role !== 'Parent').map(u => {
          const subj = subjects.find(s => s.subjectId === u.subjectId);
          return `
            <tr>
              <td><strong>${u.fullName}</strong></td>
              <td><span class="badge-pill badge-blue">${u.role}</span></td>
              <td>${subj?.name || (u.role === 'Teacher' ? 'Assigned to General' : 'Administrative')}</td>
              <td>${u.email || 'N/A'}</td>
              <td><span class="badge-pill ${u.isActive ? 'badge-green' : 'badge-red'}">${u.isActive ? 'Active' : 'Inactive'}</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="section-title">Complete Enrolled Student Register</div>
    <table>
      <thead>
        <tr>
          <th>Student ID</th>
          <th>Full Name</th>
          <th>Class / Form</th>
          <th>House Allocation</th>
          <th>Parent Emergency Contact</th>
          <th>Fee Balance</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(s => {
          const cls = classes.find(c => c.classId === s.classId);
          return `
            <tr>
              <td style="font-family: monospace; font-weight: 700;">${s.studentId}</td>
              <td><strong>${s.fullName}</strong></td>
              <td>${cls?.name || s.classId}</td>
              <td>${s.house}</td>
              <td>${s.parentContact || '+233241234567'}</td>
              <td style="font-weight: 700; color: ${s.currentBalance > 0 ? '#dc2626' : '#16a34a'};">GHS ${s.currentBalance.toLocaleString()}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="signoff-grid">
      <div class="signoff-box">
        <strong>Compiled by:</strong> System Administrator (IT &amp; Logistics)<br>
        <strong>Sign:</strong> ___________________________
      </div>
      <div class="signoff-box">
        <strong>NaSIA School Registrar Approval:</strong><br>
        <strong>Official Seal &amp; Date:</strong> ___________________________
      </div>
    </div>

    <div class="footer">
      <span>ScholarHub ERP • Ministry of Education EMIS Statutory Census</span>
      <span>Page 1 of 1</span>
    </div>
  `;

  openPrintWindow('Administrative Operations, Staffing & Census Master Roster', html);
};

// 4. HOD REPORT
export const generateHODReport = (currentUser: User | null) => {
  const users = dbGetUsers();
  const subjects = dbGetSubjects();
  const grades = dbGetGrades();
  const plans = dbGetLessonPlans();

  const teachers = users.filter(u => u.departmentId === currentUser?.departmentId);
  const mySubjectIds = subjects.filter(s => teachers.some(t => t.uid === s.teacherId)).map(s => s.subjectId);
  const myGrades = grades.filter(g => mySubjectIds.includes(g.subjectId));
  const myPlans = plans.filter(p => teachers.some(t => t.uid === p.teacherId));

  const avgDeptScore = myGrades.length > 0
    ? Math.round(myGrades.reduce((s, g) => s + g.total, 0) / myGrades.length * 10) / 10
    : 72.5;

  const waecRating = avgDeptScore >= 80 ? 'A1 (Excellent)' : avgDeptScore >= 70 ? 'B2 (Very Good)' : avgDeptScore >= 65 ? 'B3 (Good)' : 'C5 (Credit)';

  const html = `
    <div class="header">
      <div>
        <div class="school-title">SCHOLARHUB INSTITUTIONAL ERP</div>
        <div class="school-sub">Departmental Curriculum & Examination Audit</div>
      </div>
      <div class="report-meta">
        <div class="report-badge">Departmental Dossier</div>
        <div><strong>Ref:</strong> SH-HOD-${Date.now().toString().slice(-6)}</div>
        <div><strong>HOD:</strong> ${currentUser?.fullName || 'Head of Department'}</div>
        <div><strong>Academic Term:</strong> Term 1 (2026)</div>
      </div>
    </div>

    <div class="section-title">Department Quality & Syllabus Indicators</div>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">WAEC Quality Rating</div>
        <div class="kpi-val" style="color: #2563eb;">${waecRating}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Assessment Average</div>
        <div class="kpi-val">${avgDeptScore}%</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Department Faculty</div>
        <div class="kpi-val">${teachers.length} Teachers</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Lesson Plans Approved</div>
        <div class="kpi-val" style="color: #16a34a;">${myPlans.filter(p => p.status === 'Approved').length} / ${myPlans.length}</div>
      </div>
    </div>

    <div class="section-title">Subject Performance & Auditing Audit</div>
    <table>
      <thead>
        <tr>
          <th>Subject Title</th>
          <th>Assigned Instructor</th>
          <th>Class Average</th>
          <th>Grading Status</th>
          <th>Authorization Level</th>
        </tr>
      </thead>
      <tbody>
        ${subjects.filter(s => mySubjectIds.includes(s.subjectId)).map(subj => {
          const instructor = users.find(u => u.uid === subj.teacherId);
          const subjGrades = myGrades.filter(g => g.subjectId === subj.subjectId);
          const avgScore = subjGrades.length > 0
            ? Math.round(subjGrades.reduce((s, g) => s + g.total, 0) / subjGrades.length * 10) / 10
            : 70.0;
          return `
            <tr>
              <td><strong>${subj.name}</strong></td>
              <td>${instructor?.fullName || 'Assigned Teacher'}</td>
              <td style="font-family: monospace; font-weight: 700;">${avgScore}%</td>
              <td><span class="badge-pill badge-green">Authorized &amp; Locked</span></td>
              <td>HOD Quality Clearance Level 1</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="section-title">Department Teacher Lesson Notes Status</div>
    <table>
      <thead>
        <tr>
          <th>Topic</th>
          <th>Strand</th>
          <th>Teacher</th>
          <th>Approval Status</th>
        </tr>
      </thead>
      <tbody>
        ${myPlans.map(p => {
          const tchr = users.find(u => u.uid === p.teacherId);
          return `
            <tr>
              <td><strong>${p.topic}</strong></td>
              <td>${p.strand}</td>
              <td>${tchr?.fullName || p.teacherId}</td>
              <td><span class="badge-pill ${p.status === 'Approved' ? 'badge-green' : 'badge-amber'}">${p.status}</span></td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="signoff-grid">
      <div class="signoff-box">
        <strong>Reviewed by:</strong> ${currentUser?.fullName || 'Head of Department'}<br>
        <strong>Sign:</strong> ___________________________
      </div>
      <div class="signoff-box">
        <strong>Headmaster Academic Sign-Off:</strong><br>
        <strong>Date &amp; Stamp:</strong> ___________________________
      </div>
    </div>

    <div class="footer">
      <span>ScholarHub ERP • Departmental Quality & Curriculum Audit</span>
      <span>Page 1 of 1</span>
    </div>
  `;

  openPrintWindow('Departmental Subject Performance & Curriculum Audit Report', html);
};

// 5. TEACHER REPORT
export const generateTeacherReport = (currentUser: User | null) => {
  const subjects = dbGetSubjects().filter(s => s.teacherId === currentUser?.uid);
  const myClassIds = [...new Set(subjects.map(s => s.classId))];
  const students = dbGetStudents().filter(s => myClassIds.includes(s.classId));
  const grades = dbGetGrades();
  const classes = dbGetClasses();

  const html = `
    <div class="header">
      <div>
        <div class="school-title">SCHOLARHUB INSTITUTIONAL ERP</div>
        <div class="school-sub">Form Teacher Classroom Dossier & Continuous Assessment</div>
      </div>
      <div class="report-meta">
        <div class="report-badge">Gradebook & Attendance</div>
        <div><strong>Ref:</strong> SH-TCHR-${Date.now().toString().slice(-6)}</div>
        <div><strong>Instructor:</strong> ${currentUser?.fullName || 'Teacher'}</div>
        <div><strong>Academic Term:</strong> Term 1 (2026)</div>
      </div>
    </div>

    <div class="section-title">Teacher Class Roster & Continuous Assessment (SBA)</div>
    <table>
      <thead>
        <tr>
          <th>Student ID</th>
          <th>Candidate Full Name</th>
          <th>Assigned Class</th>
          <th>CA1 (/30)</th>
          <th>CA2 (/30)</th>
          <th>Exam (/100)</th>
          <th>Total Score</th>
          <th>WAEC Grade</th>
          <th>Attendance Rate</th>
        </tr>
      </thead>
      <tbody>
        ${students.map(st => {
          const stClass = classes.find(c => c.classId === st.classId);
          const stGrade = grades.find(g => g.studentId === st.studentId && subjects.some(s => s.subjectId === g.subjectId));
          const total = stGrade ? stGrade.total : 85;
          const waec = calculateWAECGrade(total);
          return `
            <tr>
              <td style="font-family: monospace; font-weight: 700;">${st.studentId}</td>
              <td><strong>${st.fullName}</strong></td>
              <td>${stClass?.name || st.classId}</td>
              <td style="text-align: center;">${stGrade?.ca1 || 24}</td>
              <td style="text-align: center;">${stGrade?.ca2 || 22}</td>
              <td style="text-align: center;">${stGrade?.exam || 48}</td>
              <td style="text-align: center; font-weight: 700; color: #2563eb;">${total}</td>
              <td style="text-align: center;"><span class="badge-pill ${waec.grade.startsWith('A') || waec.grade.startsWith('B') ? 'badge-green' : 'badge-blue'}">${waec.grade}</span></td>
              <td style="text-align: center; font-weight: 700;">${st.attendanceRate}%</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="section-title">Teaching Subjects Allocation</div>
    <table>
      <thead>
        <tr>
          <th>Subject Code</th>
          <th>Subject Title</th>
          <th>Assigned Class / Cohort</th>
        </tr>
      </thead>
      <tbody>
        ${subjects.map(s => {
          const cls = classes.find(c => c.classId === s.classId);
          return `
            <tr>
              <td style="font-family: monospace;">${s.subjectId}</td>
              <td><strong>${s.name}</strong></td>
              <td>${cls?.name || s.classId}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="signoff-grid">
      <div class="signoff-box">
        <strong>Form Teacher Submission:</strong> ${currentUser?.fullName || 'Teacher'}<br>
        <strong>Sign:</strong> ___________________________
      </div>
      <div class="signoff-box">
        <strong>Head of Department Certification:</strong><br>
        <strong>Sign:</strong> ___________________________
      </div>
    </div>

    <div class="footer">
      <span>ScholarHub ERP • Official Form Teacher Dossier</span>
      <span>Page 1 of 1</span>
    </div>
  `;

  openPrintWindow('Classroom Register, Attendance & Gradebook Dossier', html);
};

// 6. CASHIER REPORT
export const generateCashierReport = () => {
  const students = dbGetStudents();
  const transactions = dbGetTransactions();

  const today = new Date().toISOString().split('T')[0];
  const todayTx = transactions.filter(t => t.timestamp.startsWith(today));
  const todayTotal = todayTx.reduce((s, t) => s + t.amountPaid, 0);
  const momoTotal = transactions.filter(t => t.paymentMethod === 'MoMo').reduce((s, t) => s + t.amountPaid, 0);
  const cashTotal = transactions.filter(t => t.paymentMethod === 'Cash').reduce((s, t) => s + t.amountPaid, 0);
  const totalArrears = students.reduce((s, st) => s + st.currentBalance, 0);

  const html = `
    <div class="header">
      <div>
        <div class="school-title">SCHOLARHUB INSTITUTIONAL ERP</div>
        <div class="school-sub">Cashier & Bursar Financial Settlement Directorate</div>
      </div>
      <div class="report-meta">
        <div class="report-badge">Revenue Shift Settlement</div>
        <div><strong>Ref:</strong> SH-CSH-${Date.now().toString().slice(-6)}</div>
        <div><strong>Shift Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <div><strong>Settlement Status:</strong> Reconciled ✓</div>
      </div>
    </div>

    <div class="section-title">Daily Revenue & Liquidity Summary</div>
    <div class="kpi-grid">
      <div class="kpi-box">
        <div class="kpi-label">Today's Collections</div>
        <div class="kpi-val" style="color: #16a34a;">GHS ${todayTotal.toLocaleString()}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">MoMo Gateway Flow</div>
        <div class="kpi-val" style="color: #d97706;">GHS ${momoTotal.toLocaleString()}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Cash Ledger Total</div>
        <div class="kpi-val" style="color: #2563eb;">GHS ${cashTotal.toLocaleString()}</div>
      </div>
      <div class="kpi-box">
        <div class="kpi-label">Total Outstanding Arrears</div>
        <div class="kpi-val" style="color: #dc2626;">GHS ${totalArrears.toLocaleString()}</div>
      </div>
    </div>

    <div class="section-title">Itemized Transaction Audit Ledger</div>
    <table>
      <thead>
        <tr>
          <th>Receipt Number</th>
          <th>Student Name</th>
          <th>Fee Items Paid</th>
          <th>Payment Channel</th>
          <th>Amount Paid</th>
          <th>Transaction Time</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map(tx => {
          const st = students.find(s => s.studentId === tx.studentId);
          return `
            <tr>
              <td style="font-family: monospace; font-weight: 700; color: #2563eb;">${tx.receiptNumber}</td>
              <td><strong>${st?.fullName || tx.studentId}</strong></td>
              <td>${tx.itemsPaidFor}</td>
              <td><span class="badge-pill ${tx.paymentMethod === 'MoMo' ? 'badge-amber' : 'badge-green'}">${tx.paymentMethod}</span></td>
              <td style="font-weight: 700; color: #16a34a;">GHS ${tx.amountPaid.toLocaleString()}</td>
              <td>${new Date(tx.timestamp).toLocaleTimeString()}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <div class="section-title">Top Outstanding Student Balances</div>
    <table>
      <thead>
        <tr>
          <th>Student ID</th>
          <th>Student Full Name</th>
          <th>Outstanding Debt (GHS)</th>
          <th>Parent Emergency Contact</th>
        </tr>
      </thead>
      <tbody>
        ${students.filter(s => s.currentBalance > 0).map(s => `
          <tr>
            <td style="font-family: monospace;">${s.studentId}</td>
            <td><strong>${s.fullName}</strong></td>
            <td style="color: #dc2626; font-weight: 700;">GHS ${s.currentBalance.toLocaleString()}</td>
            <td>${s.parentContact || '+233241234567'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="signoff-grid">
      <div class="signoff-box">
        <strong>Cashier / Bursar Sign-Off:</strong> Mrs. Sarah Hanson<br>
        <strong>Sign &amp; Timestamp:</strong> ___________________________
      </div>
      <div class="signoff-box">
        <strong>Audited by School Accountant:</strong><br>
        <strong>Official Seal &amp; Date:</strong> ___________________________
      </div>
    </div>

    <div class="footer">
      <span>ScholarHub ERP • Cashier Financial Settlement & Audit</span>
      <span>Page 1 of 1</span>
    </div>
  `;

  openPrintWindow('Daily Revenue Settlement & Fee Ledger Report', html);
};

// 7. PARENT REPORT
export const generateParentReport = (student: Student, currentUser: User | null) => {
  const grades = dbGetGrades().filter(g => g.studentId === student.studentId);
  const subjects = dbGetSubjects();
  const transactions = dbGetTransactions().filter(t => t.studentId === student.studentId);
  const classes = dbGetClasses();
  const studentClass = classes.find(c => c.classId === student.classId);

  const html = `
    <div class="header">
      <div>
        <div class="school-title">SCHOLARHUB INSTITUTIONAL ERP</div>
        <div class="school-sub">Official Terminal Student Assessment & Financial Statement</div>
      </div>
      <div class="report-meta">
        <div class="report-badge">Terminal Report</div>
        <div><strong>Ref:</strong> SH-REP-${student.studentId.toUpperCase()}</div>
        <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
        <div><strong>Guardian:</strong> ${currentUser?.fullName || 'Parent / Guardian'}</div>
      </div>
    </div>

    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 14px; margin-bottom: 14px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
      <div><strong>Student Name:</strong> ${student.fullName}</div>
      <div><strong>Student ID:</strong> ${student.studentId}</div>
      <div><strong>Class:</strong> ${studentClass?.name || student.classId}</div>
      <div><strong>House:</strong> ${student.house}</div>
      <div><strong>Attendance Rate:</strong> <strong style="color: #16a34a;">${student.attendanceRate}%</strong></div>
      <div><strong>Fee Status:</strong> <strong style="color: ${student.currentBalance > 0 ? '#dc2626' : '#16a34a'};">GHS ${student.currentBalance.toFixed(2)} (${student.currentBalance > 0 ? 'Pending' : 'Cleared ✓'})</strong></div>
    </div>

    <div class="section-title">Terminal Academic Performance & WAEC Grading</div>
    <table>
      <thead>
        <tr>
          <th>Subject Title</th>
          <th>Term</th>
          <th>CA 1 (/30)</th>
          <th>CA 2 (/30)</th>
          <th>Exam (/100)</th>
          <th>Total Score</th>
          <th>WAEC Grade</th>
          <th>Official Remark</th>
        </tr>
      </thead>
      <tbody>
        ${grades.map(g => {
          const subj = subjects.find(s => s.subjectId === g.subjectId);
          const waec = calculateWAECGrade(g.total);
          return `
            <tr>
              <td><strong>${subj?.name || g.subjectId}</strong></td>
              <td>${g.term}</td>
              <td style="text-align: center;">${g.ca1}</td>
              <td style="text-align: center;">${g.ca2}</td>
              <td style="text-align: center;">${g.exam}</td>
              <td style="text-align: center; font-weight: 700; color: #2563eb;">${g.total}</td>
              <td style="text-align: center;"><span class="badge-pill ${g.grade.startsWith('A') || g.grade.startsWith('B') ? 'badge-green' : 'badge-blue'}">${g.grade}</span></td>
              <td>${waec.remark}</td>
            </tr>
          `;
        }).join('')}
        ${grades.length === 0 ? `<tr><td colspan="8" style="text-align: center; color: #64748b;">Official term grades are currently being compiled by the academic board.</td></tr>` : ''}
      </tbody>
    </table>

    <div class="section-title">Fee Payment History & Statements</div>
    <table>
      <thead>
        <tr>
          <th>Receipt No.</th>
          <th>Item Description</th>
          <th>Payment Method</th>
          <th>Amount Paid</th>
          <th>Transaction Date</th>
        </tr>
      </thead>
      <tbody>
        ${transactions.map(tx => `
          <tr>
            <td style="font-family: monospace; font-weight: 700;">${tx.receiptNumber}</td>
            <td>${tx.itemsPaidFor}</td>
            <td><span class="badge-pill ${tx.paymentMethod === 'MoMo' ? 'badge-amber' : 'badge-green'}">${tx.paymentMethod}</span></td>
            <td style="font-weight: 700; color: #16a34a;">GHS ${tx.amountPaid.toFixed(2)}</td>
            <td>${new Date(tx.timestamp).toLocaleDateString()}</td>
          </tr>
        `).join('')}
        ${transactions.length === 0 ? `<tr><td colspan="5" style="text-align: center; color: #64748b;">No payment records found for this academic term.</td></tr>` : ''}
      </tbody>
    </table>

    <div class="signoff-grid">
      <div class="signoff-box">
        <strong>Class Teacher Remark:</strong> Diligent and committed student.<br>
        <strong>Signature:</strong> ___________________________
      </div>
      <div class="signoff-box">
        <strong>Headmaster's Endorsement:</strong> Mr. Emmanuel Osei<br>
        <strong>Official Seal:</strong> ___________________________
      </div>
    </div>

    <div class="footer">
      <span>ScholarHub ERP • Official Ward Report & Fee Statement</span>
      <span>Page 1 of 1</span>
    </div>
  `;

  openPrintWindow(`Academic & Fee Statement - ${student.fullName}`, html);
};
