export interface User {
  uid: string;
  fullName: string;
  role: 'Admin' | 'Owner' | 'Headmaster' | 'HOD' | 'Teacher' | 'Cashier' | 'Parent';
  departmentId?: string;
  subjectId?: string;
  reportsTo?: string;
  phone: string;
  isActive: boolean;
  avatar?: string;
  email?: string;
}

export interface Student {
  studentId: string;
  fullName: string;
  classId: string;
  parentId: string;
  house: string;
  currentBalance: number;
  attendanceRate: number;
  phone?: string;
  parentContact?: string;
  whatsappNumber?: string;
}

export interface Class {
  classId: string;
  name: string;
  classTeacherId: string;
  capacity: number;
  subjects: string[];
}

export interface Subject {
  subjectId: string;
  name: string;
  classId: string;
  teacherId: string;
}

export interface Grade {
  gradeId: string;
  studentId: string;
  subjectId: string;
  term: string;
  ca1: number; // Max 20 or 30
  ca2: number; // Max 20 or 30
  exam: number; // Max 50 or 60
  total: number;
  grade: string; // Auto WAEC/WASSCE
  status: 'Draft' | 'Pending' | 'Approved';
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  classId: string;
  records: { [studentId: string]: 'Present' | 'Absent' | 'Late' };
}

export interface FeeTransaction {
  transactionId: string;
  studentId: string;
  amountPaid: number;
  paymentMethod: 'Cash' | 'MoMo';
  itemsPaidFor: string;
  timestamp: string;
  receiptNumber: string;
}

export interface ApprovalRequest {
  approvalId: string;
  type: 'Lesson_Plan' | 'Grade_Submission' | 'Student_Enrollment' | 'Staff_Registration';
  submittedById: string;
  submittedToId: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  dataSnapshot: any;
  timestamp: string;
  comments?: string;
}

export interface LessonPlan {
  planId: string;
  teacherId: string;
  subjectId: string;
  classId: string;
  topic: string;
  strand: string;
  indicators: string;
  content: string; // HTML formatted
  status: 'Draft' | 'Pending' | 'Approved';
  submittedToId?: string;
}

export interface Task {
  taskId: string;
  assignedBy: string;
  assignedTo: string;
  title: string;
  dueDate: string;
  status: 'Open' | 'Completed' | 'Overdue';
  priority: 'Low' | 'Medium' | 'High';
}

export interface TimetableSlot {
  slotId: string;
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday';
  period: string; // e.g. "08:00 AM - 09:00 AM"
  classId: string;
  subjectId: string;
  teacherId: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string; // 'all' or user uid
  content: string;
  timestamp: string;
}

export interface Announcement {
  id: string;
  content: string;
  authorRole: string;
  authorName?: string;
  timestamp: string;
}

export const mockTimetableSlots: TimetableSlot[] = [
  // Monday
  { slotId: 'tt-1', day: 'Monday', period: '08:00 AM - 09:00 AM', classId: 'c-jhs1', subjectId: 'sub-math1', teacherId: 'u-teacher1' },
  { slotId: 'tt-2', day: 'Monday', period: '09:00 AM - 10:00 AM', classId: 'c-jhs1', subjectId: 'sub-science1', teacherId: 'u-teacher2' },
  { slotId: 'tt-3', day: 'Monday', period: '10:30 AM - 11:30 AM', classId: 'c-jhs2', subjectId: 'sub-math2', teacherId: 'u-teacher1' },
  { slotId: 'tt-4', day: 'Monday', period: '11:30 AM - 12:30 PM', classId: 'c-jhs2', subjectId: 'sub-science2', teacherId: 'u-teacher2' },

  // Tuesday
  { slotId: 'tt-5', day: 'Tuesday', period: '08:00 AM - 09:00 AM', classId: 'c-jhs2', subjectId: 'sub-science2', teacherId: 'u-teacher2' },
  { slotId: 'tt-6', day: 'Tuesday', period: '09:00 AM - 10:00 AM', classId: 'c-jhs2', subjectId: 'sub-math2', teacherId: 'u-teacher1' },
  { slotId: 'tt-7', day: 'Tuesday', period: '10:30 AM - 11:30 AM', classId: 'c-jhs1', subjectId: 'sub-science1', teacherId: 'u-teacher2' },
  { slotId: 'tt-8', day: 'Tuesday', period: '11:30 AM - 12:30 PM', classId: 'c-jhs1', subjectId: 'sub-math1', teacherId: 'u-teacher1' },

  // Wednesday
  { slotId: 'tt-9', day: 'Wednesday', period: '08:00 AM - 09:00 AM', classId: 'c-jhs1', subjectId: 'sub-math1', teacherId: 'u-teacher1' },
  { slotId: 'tt-10', day: 'Wednesday', period: '09:00 AM - 10:00 AM', classId: 'c-jhs1', subjectId: 'sub-science1', teacherId: 'u-teacher2' },
  { slotId: 'tt-11', day: 'Wednesday', period: '10:30 AM - 11:30 AM', classId: 'c-jhs2', subjectId: 'sub-math2', teacherId: 'u-teacher1' },
  { slotId: 'tt-12', day: 'Wednesday', period: '11:30 AM - 12:30 PM', classId: 'c-jhs2', subjectId: 'sub-science2', teacherId: 'u-teacher2' },

  // Thursday
  { slotId: 'tt-13', day: 'Thursday', period: '08:00 AM - 09:00 AM', classId: 'c-jhs2', subjectId: 'sub-math2', teacherId: 'u-teacher1' },
  { slotId: 'tt-14', day: 'Thursday', period: '09:00 AM - 10:00 AM', classId: 'c-jhs2', subjectId: 'sub-science2', teacherId: 'u-teacher2' },
  { slotId: 'tt-15', day: 'Thursday', period: '10:30 AM - 11:30 AM', classId: 'c-jhs1', subjectId: 'sub-math1', teacherId: 'u-teacher1' },
  { slotId: 'tt-16', day: 'Thursday', period: '11:30 AM - 12:30 PM', classId: 'c-jhs1', subjectId: 'sub-science1', teacherId: 'u-teacher2' },

  // Friday
  { slotId: 'tt-17', day: 'Friday', period: '08:00 AM - 09:00 AM', classId: 'c-jhs1', subjectId: 'sub-science1', teacherId: 'u-teacher2' },
  { slotId: 'tt-18', day: 'Friday', period: '09:00 AM - 10:00 AM', classId: 'c-jhs1', subjectId: 'sub-math1', teacherId: 'u-teacher1' },
  { slotId: 'tt-19', day: 'Friday', period: '10:30 AM - 11:30 AM', classId: 'c-jhs2', subjectId: 'sub-science2', teacherId: 'u-teacher2' },
  { slotId: 'tt-20', day: 'Friday', period: '11:30 AM - 12:30 PM', classId: 'c-jhs2', subjectId: 'sub-math2', teacherId: 'u-teacher1' }
];

// Grading calculator following West African Examinations Council (WAEC/WASSCE) standard
export const calculateWAECGrade = (total: number): { grade: string; remark: string } => {
  if (total >= 80) return { grade: 'A1', remark: 'Excellent' };
  if (total >= 70) return { grade: 'B2', remark: 'Very Good' };
  if (total >= 65) return { grade: 'B3', remark: 'Good' };
  if (total >= 60) return { grade: 'C4', remark: 'Credit' };
  if (total >= 55) return { grade: 'C5', remark: 'Credit' };
  if (total >= 50) return { grade: 'C6', remark: 'Credit' };
  if (total >= 45) return { grade: 'D7', remark: 'Pass' };
  if (total >= 40) return { grade: 'E8', remark: 'Pass' };
  return { grade: 'F9', remark: 'Fail' };
};

// Seed Mock Data
export const mockUsers: User[] = [
  { uid: 'u-admin', fullName: 'System Administrator (IT)', role: 'Admin', phone: '+233540001122', isActive: true, email: 'admin@scholarhub.edu.gh' },
  { uid: 'u-owner', fullName: 'Dr. Kwame Mensah', role: 'Owner', phone: '+233244123456', isActive: true, email: 'mensah.owner@scholarhub.edu.gh' },
  { uid: 'u-head', fullName: 'Mr. Emmanuel Osei', role: 'Headmaster', reportsTo: 'u-owner', phone: '+233201122334', isActive: true, email: 'osei.headmaster@scholarhub.edu.gh' },
  { uid: 'u-hod-math', fullName: 'Mrs. Patience Addo', role: 'HOD', departmentId: 'dept-math', reportsTo: 'u-head', phone: '+233271122335', isActive: true, email: 'addo.math@scholarhub.edu.gh' },
  { uid: 'u-hod-science', fullName: 'Mr. Kwame Boateng', role: 'HOD', departmentId: 'dept-science', reportsTo: 'u-head', phone: '+233541122336', isActive: true, email: 'boateng.science@scholarhub.edu.gh' },
  { uid: 'u-teacher1', fullName: 'Mr. Joseph Lamptey', role: 'Teacher', departmentId: 'dept-math', reportsTo: 'u-hod-math', phone: '+233245678901', isActive: true, email: 'lamptey.math@scholarhub.edu.gh' },
  { uid: 'u-teacher2', fullName: 'Miss Regina Appiah', role: 'Teacher', departmentId: 'dept-science', reportsTo: 'u-hod-science', phone: '+233205678902', isActive: true, email: 'appiah.science@scholarhub.edu.gh' },
  { uid: 'u-cashier', fullName: 'Mrs. Sarah Hanson', role: 'Cashier', reportsTo: 'u-head', phone: '+233275678903', isActive: true, email: 'hanson.bursar@scholarhub.edu.gh' },
  { uid: 'u-parent1', fullName: 'Mr. Prince Awuah', role: 'Parent', phone: '+233241234567', isActive: true, email: 'prince.awuah@gmail.com' },
  { uid: 'u-parent2', fullName: 'Alhaji Issah Ibrahim', role: 'Parent', phone: '+233207890123', isActive: true, email: 'issah.ibrahim@yahoo.com' }
];

export const mockClasses: Class[] = [
  { classId: 'c-jhs1', name: 'JHS 1 (Junior High School)', classTeacherId: 'u-teacher1', capacity: 35, subjects: ['sub-math1', 'sub-science1'] },
  { classId: 'c-jhs2', name: 'JHS 2 (Junior High School)', classTeacherId: 'u-teacher2', capacity: 30, subjects: ['sub-math2', 'sub-science2'] }
];

export const mockSubjects: Subject[] = [
  { subjectId: 'sub-math1', name: 'Mathematics (GES)', classId: 'c-jhs1', teacherId: 'u-teacher1' },
  { subjectId: 'sub-science1', name: 'Integrated Science (NaCCA)', classId: 'c-jhs1', teacherId: 'u-teacher2' },
  { subjectId: 'sub-math2', name: 'Mathematics (GES)', classId: 'c-jhs2', teacherId: 'u-teacher1' },
  { subjectId: 'sub-science2', name: 'Integrated Science (NaCCA)', classId: 'c-jhs2', teacherId: 'u-teacher2' }
];

export const mockStudents: Student[] = [
  { studentId: 's-001', fullName: 'Kojo Awuah', classId: 'c-jhs1', parentId: 'u-parent1', house: 'Red House', currentBalance: 450.00, attendanceRate: 94.5 },
  { studentId: 's-002', fullName: 'Ama Awuah', classId: 'c-jhs1', parentId: 'u-parent1', house: 'Blue House', currentBalance: 120.00, attendanceRate: 98.2 },
  { studentId: 's-003', fullName: 'Salifu Ibrahim', classId: 'c-jhs2', parentId: 'u-parent2', house: 'Yellow House', currentBalance: 750.00, attendanceRate: 88.0 },
  { studentId: 's-004', fullName: 'Mariam Ibrahim', classId: 'c-jhs2', parentId: 'u-parent2', house: 'Green House', currentBalance: 0.00, attendanceRate: 95.0 }
];

export const mockGrades: Grade[] = [
  // Kojo Awuah JHS1 Math
  { gradeId: 'g-1', studentId: 's-001', subjectId: 'sub-math1', term: 'Term 1', ca1: 25, ca2: 22, exam: 48, total: 95, grade: 'A1', status: 'Approved' },
  // Ama Awuah JHS1 Math
  { gradeId: 'g-2', studentId: 's-002', subjectId: 'sub-math1', term: 'Term 1', ca1: 18, ca2: 20, exam: 35, total: 73, grade: 'B2', status: 'Approved' },
  // JHS2 Science - Salifu
  { gradeId: 'g-3', studentId: 's-003', subjectId: 'sub-science2', term: 'Term 1', ca1: 15, ca2: 12, exam: 22, total: 49, grade: 'D7', status: 'Approved' }
];

export const mockAttendance: AttendanceRecord[] = [
  {
    date: '2026-08-18',
    classId: 'c-jhs1',
    records: {
      's-001': 'Present',
      's-002': 'Present'
    }
  },
  {
    date: '2026-08-18',
    classId: 'c-jhs2',
    records: {
      's-003': 'Absent',
      's-004': 'Present'
    }
  }
];

export const mockFeeTransactions: FeeTransaction[] = [
  { transactionId: 't-001', studentId: 's-001', amountPaid: 300, paymentMethod: 'MoMo', itemsPaidFor: 'Term 1 Tuition', timestamp: '2026-08-10T14:32:00Z', receiptNumber: 'SH-REC-2026-1002' },
  { transactionId: 't-002', studentId: 's-003', amountPaid: 500, paymentMethod: 'Cash', itemsPaidFor: 'Term 1 Tuition & PTA', timestamp: '2026-08-12T09:15:00Z', receiptNumber: 'SH-REC-2026-1003' }
];

export const mockLessonPlans: LessonPlan[] = [
  {
    planId: 'lp-001',
    teacherId: 'u-teacher1',
    subjectId: 'sub-math1',
    classId: 'c-jhs1',
    topic: 'Fractions and Percentages',
    strand: 'Number',
    indicators: 'B7.1.1.1 - Solve word problems involving positive decimals and percentages',
    content: `
      <h4>Starter Activity</h4>
      <p>Quick card matching game: Match percentages (e.g., 25%, 50%, 75%) with their simplified fraction equivalences (1/4, 1/2, 3/4).</p>
      <h4>Main Content</h4>
      <p>Group work solving localized market pricing problems (e.g., "Kejetia Market traders offering 15% discount on yams"). Use percentages to compute raw savings.</p>
      <h4>Plenary</h4>
      <p>Exit ticket: Write down one real-life scenario where percentages are used in your neighborhood.</p>
    `,
    status: 'Approved'
  },
  {
    planId: 'lp-002',
    teacherId: 'u-teacher2',
    subjectId: 'sub-science1',
    classId: 'c-jhs1',
    topic: 'Classification of Materials',
    strand: 'Diversity of Matter',
    indicators: 'B7.2.1.1.1 - Group substances according to physical states',
    content: `
      <h4>Starter Activity</h4>
      <p>Display common domestic materials (water, sand, cooking oil, balloon air) and ask students to group them.</p>
      <h4>Main Content</h4>
      <p>Introduce the particle theory of matter. Conduct an experiment comparing the flow rates of solids, liquids, and gases.</p>
      <h4>Plenary</h4>
      <p>Ask students to explain why honey flows slower than water based on viscosity.</p>
    `,
    status: 'Pending',
    submittedToId: 'u-hod-science'
  }
];

export const mockTasks: Task[] = [
  { taskId: 'tk-1', assignedBy: 'u-owner', assignedTo: 'u-head', title: 'Prepare PTA Meeting Agenda', dueDate: '2026-08-25', status: 'Open', priority: 'High' },
  { taskId: 'tk-2', assignedBy: 'u-head', assignedTo: 'u-hod-math', title: 'Submit Mathematics Term 1 Syllabus Progress Report', dueDate: '2026-08-22', status: 'Open', priority: 'Medium' },
  { taskId: 'tk-3', assignedBy: 'u-hod-math', assignedTo: 'u-teacher1', title: 'Compile Final Mock Exam Scores', dueDate: '2026-08-20', status: 'Open', priority: 'High' }
];

export const mockApprovals: ApprovalRequest[] = [
  {
    approvalId: 'app-001',
    type: 'Lesson_Plan',
    submittedById: 'u-teacher2',
    submittedToId: 'u-hod-science',
    status: 'Pending',
    dataSnapshot: { planId: 'lp-002', topic: 'Classification of Materials', strand: 'Diversity of Matter' },
    timestamp: '2026-08-18T16:45:00Z'
  }
];

export const mockMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    senderId: 'u-head',
    receiverId: 'all',
    content: 'Welcome to Term 1! Please ensure all lesson plans are submitted to HODs by end of week.',
    timestamp: '2026-08-18T08:30:00Z'
  },
  {
    id: 'msg-2',
    senderId: 'u-admin',
    receiverId: 'u-teacher1',
    content: 'Hi Mr. Lamptey, your class JHS 1 timetable has been updated in the system.',
    timestamp: '2026-08-18T09:15:00Z'
  },
  {
    id: 'msg-3',
    senderId: 'u-teacher1',
    receiverId: 'u-admin',
    content: 'Thank you Admin, I have reviewed the timetable schedule.',
    timestamp: '2026-08-18T09:40:00Z'
  }
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    content: '📢 Staff General Meeting scheduled for Friday at 2:00 PM in the Main Conference Room.',
    authorRole: 'Headmaster',
    authorName: 'Mr. Emmanuel Osei',
    timestamp: '2026-08-18T08:00:00Z'
  },
  {
    id: 'ann-2',
    content: '🗓️ Mid-term examinations commence on October 12th. All teachers should prepare draft papers.',
    authorRole: 'Admin',
    authorName: 'System Administrator',
    timestamp: '2026-08-17T14:20:00Z'
  }
];

// ==========================================================================
// STATUTORY PAYROLL & COMPENSATION DATA STRUCTURES (SSNIT & GRA COMPLIANT)
// ==========================================================================

export interface StaffCompensationProfile {
  id: string;
  staffId: string; // User.uid
  firstName: string;
  lastName: string;
  staffName: string;
  role: string;
  department: string;
  staffIdNumber: string; // e.g. "TCH-2026-004"
  graTin: string;        // Mandatory GRA TIN
  ssnitNumber: string;   // Mandatory SSNIT ID
  bankName: string;
  bankBranch: string;
  accountNumber: string;
  basicSalary: number;   // Anchored to SSNIT floor (>= 587.79)
  allowancesTaxable: number;
  allowancesNonTaxable: number;
  updatedAt: string;
}

export interface SalaryApprovalRequest {
  id: string;
  profileId: string;
  staffId: string;
  staffName: string;
  staffIdNumber: string;
  department: string;
  requestedBy: string; // Admin/HR user ID
  currentBase: number;
  proposedBase: number;
  proposedAllowancesTaxable: number;
  justification: string;
  status: 'Pending_Owner_Review' | 'Approved_By_Owner' | 'Rejected_By_Owner';
  ownerId?: string;
  ownerRemarks?: string;
  createdAt: string;
  actionedAt?: string;
}

export interface PayrollHistoricalLedgerItem {
  id: string;
  staffId: string;
  staffName: string;
  staffIdNumber: string;
  role: string;
  department: string;
  graTin: string;
  ssnitNumber: string;
  bankName: string;
  bankBranch?: string;
  accountNumber: string;
  payPeriodMonthYear: string; // e.g. "2026-09"
  periodName: string;         // e.g. "September 2026"
  basicSalarySnapshot: number;
  taxableAllowancesSnapshot: number;
  nonTaxableAllowancesSnapshot: number;
  grossSalary: number;
  deductionSsnitEmployee: number; // 5.5%
  contributionSsnitEmployer: number; // 13.0%
  graPayeWithheld: number;
  otherDeductionsWelfare: number;
  netSalaryPayout: number;
  netPayout: number; // alias for convenient display
  generatedAt: string;
  isPublishedToStaff: boolean;
}

export const mockCompensationProfiles: StaffCompensationProfile[] = [
  {
    id: 'comp-001',
    staffId: 'u-head',
    firstName: 'Emmanuel',
    lastName: 'Osei',
    staffName: 'Mr. Emmanuel Osei',
    role: 'Headmaster',
    department: 'Administration',
    staffIdNumber: 'ADM-2026-001',
    graTin: 'P000984512X',
    ssnitNumber: 'C104592817263',
    bankName: 'GCB Bank',
    bankBranch: 'High Street Accra',
    accountNumber: '1041130004567',
    basicSalary: 8500.00,
    allowancesTaxable: 1200.00,
    allowancesNonTaxable: 500.00,
    updatedAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'comp-002',
    staffId: 'u-hod-math',
    firstName: 'Patience',
    lastName: 'Addo',
    staffName: 'Mrs. Patience Addo',
    role: 'HOD',
    department: 'dept-math',
    staffIdNumber: 'HOD-2026-002',
    graTin: 'P001847291Y',
    ssnitNumber: 'C108392019482',
    bankName: 'Ecobank Ghana',
    bankBranch: 'Legon Main',
    accountNumber: '0021489201941',
    basicSalary: 6200.00,
    allowancesTaxable: 800.00,
    allowancesNonTaxable: 350.00,
    updatedAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'comp-003',
    staffId: 'u-hod-science',
    firstName: 'Kwame',
    lastName: 'Boateng',
    staffName: 'Mr. Kwame Boateng',
    role: 'HOD',
    department: 'dept-science',
    staffIdNumber: 'HOD-2026-003',
    graTin: 'P002948172Z',
    ssnitNumber: 'C109482716354',
    bankName: 'Fidelity Bank',
    bankBranch: 'Airport City',
    accountNumber: '2049182736451',
    basicSalary: 6200.00,
    allowancesTaxable: 800.00,
    allowancesNonTaxable: 350.00,
    updatedAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'comp-004',
    staffId: 'u-teacher1',
    firstName: 'Joseph',
    lastName: 'Lamptey',
    staffName: 'Mr. Joseph Lamptey',
    role: 'Teacher',
    department: 'dept-math',
    staffIdNumber: 'TCH-2026-004',
    graTin: 'P003847291A',
    ssnitNumber: 'C103948271625',
    bankName: 'Absa Ghana',
    bankBranch: 'Circle Branch',
    accountNumber: '0482910492817',
    basicSalary: 4500.00,
    allowancesTaxable: 500.00,
    allowancesNonTaxable: 200.00,
    updatedAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'comp-005',
    staffId: 'u-teacher2',
    firstName: 'Regina',
    lastName: 'Appiah',
    staffName: 'Miss Regina Appiah',
    role: 'Teacher',
    department: 'dept-science',
    staffIdNumber: 'TCH-2026-005',
    graTin: 'P004829172B',
    ssnitNumber: 'C107392816472',
    bankName: 'Stanbic Bank',
    bankBranch: 'Tema Harbour',
    accountNumber: '9048271635482',
    basicSalary: 4500.00,
    allowancesTaxable: 500.00,
    allowancesNonTaxable: 200.00,
    updatedAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'comp-006',
    staffId: 'u-cashier',
    firstName: 'Sarah',
    lastName: 'Hanson',
    staffName: 'Mrs. Sarah Hanson',
    role: 'Cashier',
    department: 'Finance & Accounts',
    staffIdNumber: 'FIN-2026-006',
    graTin: 'P005829182C',
    ssnitNumber: 'C105839201948',
    bankName: 'Zenith Bank',
    bankBranch: 'Kaneshie Main',
    accountNumber: '1092837465019',
    basicSalary: 4200.00,
    allowancesTaxable: 400.00,
    allowancesNonTaxable: 200.00,
    updatedAt: '2026-08-01T08:00:00Z'
  },
  {
    id: 'comp-007',
    staffId: 'u-admin',
    firstName: 'System',
    lastName: 'Administrator',
    staffName: 'System Administrator (IT)',
    role: 'Admin',
    department: 'IT Systems',
    staffIdNumber: 'IT-2026-007',
    graTin: 'P006839201D',
    ssnitNumber: 'C106948271536',
    bankName: 'Standard Chartered',
    bankBranch: 'Liberia Road',
    accountNumber: '0100293847562',
    basicSalary: 5500.00,
    allowancesTaxable: 600.00,
    allowancesNonTaxable: 300.00,
    updatedAt: '2026-08-01T08:00:00Z'
  }
];

export const mockSalaryApprovalRequests: SalaryApprovalRequest[] = [
  {
    id: 'req-sal-001',
    profileId: 'comp-004',
    staffId: 'u-teacher1',
    staffName: 'Mr. Joseph Lamptey',
    staffIdNumber: 'TCH-2026-004',
    department: 'Mathematics',
    requestedBy: 'u-admin',
    currentBase: 4500.00,
    proposedBase: 5200.00,
    proposedAllowancesTaxable: 650.00,
    justification: 'Completed Postgraduate Diploma in Mathematics Education (UEW) and added senior form master duties.',
    status: 'Pending_Owner_Review',
    createdAt: '2026-09-15T10:30:00Z'
  },
  {
    id: 'req-sal-002',
    profileId: 'comp-005',
    staffId: 'u-teacher2',
    staffName: 'Miss Regina Appiah',
    staffIdNumber: 'TCH-2026-005',
    department: 'Integrated Science',
    requestedBy: 'u-admin',
    currentBase: 4500.00,
    proposedBase: 4950.00,
    proposedAllowancesTaxable: 500.00,
    justification: 'Annual performance index rating exceeded 92% and led science practical lab renovations.',
    status: 'Pending_Owner_Review',
    createdAt: '2026-09-18T14:15:00Z'
  }
];

export const mockPayrollHistoricalLedger: PayrollHistoricalLedgerItem[] = [
  {
    id: 'pay-2026-08-u-teacher1',
    staffId: 'u-teacher1',
    staffName: 'Mr. Joseph Lamptey',
    staffIdNumber: 'TCH-2026-004',
    role: 'Teacher',
    department: 'Mathematics',
    graTin: 'P003847291A',
    ssnitNumber: 'C103948271625',
    bankName: 'Absa Ghana',
    accountNumber: '0482910492817',
    payPeriodMonthYear: '2026-08',
    periodName: 'August 2026',
    basicSalarySnapshot: 4500.00,
    taxableAllowancesSnapshot: 500.00,
    nonTaxableAllowancesSnapshot: 200.00,
    grossSalary: 5200.00,
    deductionSsnitEmployee: 247.50, // 5.5% of 4500
    contributionSsnitEmployer: 585.00, // 13.0% of 4500
    graPayeWithheld: 771.55,
    otherDeductionsWelfare: 50.00,
    netSalaryPayout: 4130.95,
    netPayout: 4130.95,
    generatedAt: '2026-08-28T16:00:00Z',
    isPublishedToStaff: true
  },
  {
    id: 'pay-2026-07-u-teacher1',
    staffId: 'u-teacher1',
    staffName: 'Mr. Joseph Lamptey',
    staffIdNumber: 'TCH-2026-004',
    role: 'Teacher',
    department: 'Mathematics',
    graTin: 'P003847291A',
    ssnitNumber: 'C103948271625',
    bankName: 'Absa Ghana',
    accountNumber: '0482910492817',
    payPeriodMonthYear: '2026-07',
    periodName: 'July 2026',
    basicSalarySnapshot: 4500.00,
    taxableAllowancesSnapshot: 500.00,
    nonTaxableAllowancesSnapshot: 200.00,
    grossSalary: 5200.00,
    deductionSsnitEmployee: 247.50,
    contributionSsnitEmployer: 585.00,
    graPayeWithheld: 771.55,
    otherDeductionsWelfare: 50.00,
    netSalaryPayout: 4130.95,
    netPayout: 4130.95,
    generatedAt: '2026-07-28T16:00:00Z',
    isPublishedToStaff: true
  }
];

