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
