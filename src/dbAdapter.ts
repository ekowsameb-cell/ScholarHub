import type {
  User, Student, Class, Subject, Grade, AttendanceRecord,
  FeeTransaction, ApprovalRequest, LessonPlan, Task, TimetableSlot
} from './data/mockData';
import {
  mockUsers, mockStudents, mockClasses, mockSubjects, mockGrades,
  mockAttendance, mockFeeTransactions, mockLessonPlans, mockTasks,
  mockApprovals, mockTimetableSlots, calculateWAECGrade
} from './data/mockData';

// Safe localStorage initialization wrapper
const getOrInit = <T>(key: string, initialData: T[]): T[] => {
  const existing = localStorage.getItem(key);
  if (existing) {
    try {
      return JSON.parse(existing);
    } catch (e) {
      console.error(`Failed to parse local storage key: ${key}`, e);
    }
  }
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
};

// State initializers
export const dbInit = () => {
  const users = getOrInit<User>('sh_users', mockUsers);
  let usersUpdated = false;
  mockUsers.forEach(seedUser => {
    if (!users.some(u => u.uid === seedUser.uid || u.role === seedUser.role)) {
      users.push(seedUser);
      usersUpdated = true;
    }
  });
  if (usersUpdated) {
    localStorage.setItem('sh_users', JSON.stringify(users));
  }

  getOrInit<Student>('sh_students', mockStudents);
  getOrInit<Class>('sh_classes', mockClasses);
  getOrInit<Subject>('sh_subjects', mockSubjects);
  getOrInit<Grade>('sh_grades', mockGrades);
  getOrInit<AttendanceRecord>('sh_attendance', mockAttendance);
  getOrInit<FeeTransaction>('sh_feeTransactions', mockFeeTransactions);
  getOrInit<LessonPlan>('sh_lessonPlans', mockLessonPlans);
  getOrInit<Task>('sh_tasks', mockTasks);
  getOrInit<ApprovalRequest>('sh_approvals', mockApprovals);
  getOrInit<TimetableSlot>('sh_timetable', mockTimetableSlots);
};

// Initialize DB immediately
dbInit();

// Local Storage Getters & Setters
const getList = <T>(key: string): T[] => {
  return JSON.parse(localStorage.getItem(key) || '[]');
};

const saveList = <T>(key: string, list: T[]) => {
  localStorage.setItem(key, JSON.stringify(list));
};

// USER CRUD
export const dbGetUsers = (): User[] => getList<User>('sh_users');
export const dbUpdateUser = (user: User) => {
  const users = dbGetUsers();
  const index = users.findIndex(u => u.uid === user.uid);
  if (index !== -1) {
    users[index] = user;
  } else {
    users.push(user);
  }
  saveList('sh_users', users);
};

/**
 * Update a user's profile picture.
 * Saves the Base64 dataUrl immediately (localStorage) for instant preview,
 * then uploads to Firebase Storage and stores the download URL.
 */
export const dbUpdateUserProfilePic = async (uid: string, dataUrl: string): Promise<void> => {
  // Persist locally first so it works offline
  const users = dbGetUsers();
  const index = users.findIndex(u => u.uid === uid);
  if (index !== -1) {
    users[index] = { ...users[index], avatar: dataUrl };
    saveList('sh_users', users);
  }

  // Try uploading to Firebase Storage
  try {
    const { storage } = await import('./firebase');
    const { ref, uploadString, getDownloadURL } = await import('firebase/storage');
    const storageRef = ref(storage, `avatars/${uid}.jpg`);
    await uploadString(storageRef, dataUrl, 'data_url');
    const downloadURL = await getDownloadURL(storageRef);
    // Update with the permanent URL
    const latestUsers = dbGetUsers();
    const i = latestUsers.findIndex(u => u.uid === uid);
    if (i !== -1) {
      latestUsers[i] = { ...latestUsers[i], avatar: downloadURL };
      saveList('sh_users', latestUsers);
    }
  } catch {
    // Firebase Storage not available — local Base64 is used as fallback
    console.info('[dbUpdateUserProfilePic] Firebase Storage unavailable, using local Base64 fallback.');
  }
};

// STUDENT CRUD
export const dbGetStudents = (): Student[] => getList<Student>('sh_students');
export const dbGetStudent = (studentId: string): Student | undefined => {
  return dbGetStudents().find(s => s.studentId === studentId);
};
export const dbUpdateStudent = (student: Student) => {
  const students = dbGetStudents();
  const index = students.findIndex(s => s.studentId === student.studentId);
  if (index !== -1) {
    students[index] = student;
  } else {
    students.push(student);
  }
  saveList('sh_students', students);
};

// CLASS & SUBJECT
export const dbGetClasses = (): Class[] => getList<Class>('sh_classes');
export const dbUpdateClass = (cls: Class) => {
  const classes = dbGetClasses();
  const index = classes.findIndex(c => c.classId === cls.classId);
  if (index !== -1) {
    classes[index] = cls;
  } else {
    classes.push(cls);
  }
  saveList('sh_classes', classes);
};
export const dbDeleteClass = (classId: string) => {
  let classes = dbGetClasses();
  classes = classes.filter(c => c.classId !== classId);
  saveList('sh_classes', classes);
  
  // Cascade soft delete assignments
  const assignments = dbGetAssignments();
  assignments.forEach(a => {
    if (a.classId === classId) a.active = false;
  });
  saveList('sh_assignments', assignments);
};

export const dbGetSubjects = (): Subject[] => getList<Subject>('sh_subjects');
export const dbUpdateSubject = (subject: Subject) => {
  const subjects = dbGetSubjects();
  const index = subjects.findIndex(s => s.subjectId === subject.subjectId);
  if (index !== -1) {
    subjects[index] = subject;
  } else {
    subjects.push(subject);
  }
  saveList('sh_subjects', subjects);
};
export const dbDeleteSubject = (subjectId: string) => {
  let subjects = dbGetSubjects();
  subjects = subjects.filter(s => s.subjectId !== subjectId);
  saveList('sh_subjects', subjects);
  
  // Cascade soft delete assignments
  const assignments = dbGetAssignments();
  assignments.forEach(a => {
    if (a.subjectId === subjectId) a.active = false;
  });
  saveList('sh_assignments', assignments);
};

// ASSIGNMENTS
export interface Assignment {
  assignmentId: string;
  subjectId: string;
  classId: string;
  teacherId?: string;
  active: boolean;
  createdAt: string;
}

export const dbGetAssignments = (): Assignment[] => getList<Assignment>('sh_assignments');
export const dbUpdateAssignment = (assignment: Assignment) => {
  const assignments = dbGetAssignments();
  const index = assignments.findIndex(a => a.assignmentId === assignment.assignmentId);
  if (index !== -1) {
    assignments[index] = assignment;
  } else {
    assignments.push(assignment);
  }
  saveList('sh_assignments', assignments);
};
export const dbDeleteAssignment = (assignmentId: string) => {
  let assignments = dbGetAssignments();
  assignments = assignments.filter(a => a.assignmentId !== assignmentId);
  saveList('sh_assignments', assignments);
};

// GRADES
export const dbGetGrades = (): Grade[] => getList<Grade>('sh_grades');
export const dbSaveGrade = (grade: Omit<Grade, 'gradeId' | 'total' | 'grade'>) => {
  const grades = dbGetGrades();
  const total = grade.ca1 + grade.ca2 + grade.exam;
  const waec = calculateWAECGrade(total);
  
  const existingIndex = grades.findIndex(
    g => g.studentId === grade.studentId && 
         g.subjectId === grade.subjectId && 
         g.term === grade.term
  );

  const finalGrade: Grade = {
    ...grade,
    gradeId: existingIndex !== -1 ? grades[existingIndex].gradeId : `g-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    total,
    grade: waec.grade
  };

  if (existingIndex !== -1) {
    grades[existingIndex] = finalGrade;
  } else {
    grades.push(finalGrade);
  }
  saveList('sh_grades', grades);
  return finalGrade;
};

// ATTENDANCE
export const dbGetAttendance = (): AttendanceRecord[] => getList<AttendanceRecord>('sh_attendance');
export const dbSaveAttendance = (date: string, classId: string, records: { [studentId: string]: 'Present' | 'Absent' | 'Late' }) => {
  const attendance = dbGetAttendance();
  const existingIndex = attendance.findIndex(a => a.date === date && a.classId === classId);
  
  const newRecord: AttendanceRecord = { date, classId, records };
  if (existingIndex !== -1) {
    attendance[existingIndex] = newRecord;
  } else {
    attendance.push(newRecord);
  }
  saveList('sh_attendance', attendance);
  
  // Re-calculate mock student attendance rates
  const students = dbGetStudents();
  const classStudents = students.filter(s => s.classId === classId);
  
  classStudents.forEach(student => {
    const studentRecords = attendance
      .filter(a => a.classId === classId && a.records[student.studentId])
      .map(a => a.records[student.studentId]);
      
    if (studentRecords.length > 0) {
      const presentCount = studentRecords.filter(r => r === 'Present' || r === 'Late').length;
      const rate = (presentCount / studentRecords.length) * 100;
      student.attendanceRate = Math.round(rate * 10) / 10;
      dbUpdateStudent(student);
    }
  });
};

// TRANSACTIONS & PAYMENTS
export const dbGetTransactions = (): FeeTransaction[] => getList<FeeTransaction>('sh_feeTransactions');
export const dbRecordPayment = (studentId: string, amount: number, paymentMethod: 'Cash' | 'MoMo', itemsPaidFor: string) => {
  const student = dbGetStudent(studentId);
  if (!student) throw new Error('Student not found');
  
  // Deduct from outstanding balance
  student.currentBalance = Math.max(0, student.currentBalance - amount);
  dbUpdateStudent(student);
  
  const transactions = dbGetTransactions();
  const newTx: FeeTransaction = {
    transactionId: `t-${Date.now()}`,
    studentId,
    amountPaid: amount,
    paymentMethod,
    itemsPaidFor,
    timestamp: new Date().toISOString(),
    receiptNumber: `SH-REC-2026-${Math.floor(1000 + Math.random() * 9000)}`
  };
  
  transactions.unshift(newTx); // Newest first
  saveList('sh_feeTransactions', transactions);

  // Trigger simulated WhatsApp notification on local console
  console.log(`[WHATSAPP SMS] Receipt sent to Parent for ${student.fullName}. Amount: GHS ${amount}. New Balance: GHS ${student.currentBalance}`);
  return newTx;
};

// LESSON PLANS
export const dbGetLessonPlans = (): LessonPlan[] => getList<LessonPlan>('sh_lessonPlans');
export const dbSaveLessonPlan = (plan: Omit<LessonPlan, 'planId'> & { planId?: string }) => {
  const plans = dbGetLessonPlans();
  const planId = plan.planId || `lp-${Date.now()}`;
  
  const finalPlan: LessonPlan = {
    ...plan,
    planId,
    status: plan.status || 'Draft'
  };
  
  const index = plans.findIndex(p => p.planId === planId);
  if (index !== -1) {
    plans[index] = finalPlan;
  } else {
    plans.push(finalPlan);
  }
  
  saveList('sh_lessonPlans', plans);
  return finalPlan;
};

// APPROVALS ENGINE
export const dbGetApprovals = (): ApprovalRequest[] => getList<ApprovalRequest>('sh_approvals');
export const dbSubmitGradeApproval = (subjectId: string, classId: string, teacherId: string, hodId: string) => {
  const approvals = dbGetApprovals();
  const grades = dbGetGrades().filter(g => g.subjectId === subjectId && g.status === 'Draft');
  
  // Mark these grades as Pending HOD Approval
  const allGrades = dbGetGrades();
  allGrades.forEach(g => {
    if (g.subjectId === subjectId && g.status === 'Draft') {
      g.status = 'Pending';
    }
  });
  saveList('sh_grades', allGrades);

  const newApproval: ApprovalRequest = {
    approvalId: `app-${Date.now()}`,
    type: 'Grade_Submission',
    submittedById: teacherId,
    submittedToId: hodId,
    status: 'Pending',
    dataSnapshot: { subjectId, classId, gradeCount: grades.length },
    timestamp: new Date().toISOString()
  };

  approvals.push(newApproval);
  saveList('sh_approvals', approvals);
  return newApproval;
};

export const dbSubmitLessonPlanApproval = (planId: string, teacherId: string, hodId: string) => {
  const approvals = dbGetApprovals();
  const plans = dbGetLessonPlans();
  const index = plans.findIndex(p => p.planId === planId);
  if (index !== -1) {
    plans[index].status = 'Pending';
    plans[index].submittedToId = hodId;
    saveList('sh_lessonPlans', plans);
  }

  const plan = plans[index];

  const newApproval: ApprovalRequest = {
    approvalId: `app-${Date.now()}`,
    type: 'Lesson_Plan',
    submittedById: teacherId,
    submittedToId: hodId,
    status: 'Pending',
    dataSnapshot: { planId, topic: plan.topic, strand: plan.strand },
    timestamp: new Date().toISOString()
  };

  approvals.push(newApproval);
  saveList('sh_approvals', approvals);
  return newApproval;
};

export const dbSubmitStudentEnrollmentApproval = (student: Student, submittedById: string) => {
  const approvals = dbGetApprovals();
  const newApproval: ApprovalRequest = {
    approvalId: `app-st-${Date.now()}`,
    type: 'Student_Enrollment',
    submittedById,
    submittedToId: 'u-head', // Headmaster approval
    status: 'Pending',
    dataSnapshot: student,
    timestamp: new Date().toISOString()
  };
  approvals.push(newApproval);
  saveList('sh_approvals', approvals);
  return newApproval;
};

export const dbSubmitStaffRegistrationApproval = (user: User, submittedById: string) => {
  const approvals = dbGetApprovals();
  const newApproval: ApprovalRequest = {
    approvalId: `app-stf-${Date.now()}`,
    type: 'Staff_Registration',
    submittedById,
    submittedToId: 'u-owner', // Owner approval
    status: 'Pending',
    dataSnapshot: user,
    timestamp: new Date().toISOString()
  };
  approvals.push(newApproval);
  saveList('sh_approvals', approvals);
  return newApproval;
};

export const dbApproveRequest = (approvalId: string) => {
  const approvals = dbGetApprovals();
  const index = approvals.findIndex(a => a.approvalId === approvalId);
  if (index === -1) return;

  const app = approvals[index];
  app.status = 'Approved';
  saveList('sh_approvals', approvals);

  if (app.type === 'Lesson_Plan') {
    const plans = dbGetLessonPlans();
    const pIndex = plans.findIndex(p => p.planId === app.dataSnapshot.planId);
    if (pIndex !== -1) {
      plans[pIndex].status = 'Approved';
      saveList('sh_lessonPlans', plans);
    }
  } else if (app.type === 'Grade_Submission') {
    const allGrades = dbGetGrades();
    allGrades.forEach(g => {
      if (g.subjectId === app.dataSnapshot.subjectId && g.status === 'Pending') {
        g.status = 'Approved';
      }
    });
    saveList('sh_grades', allGrades);
  } else if (app.type === 'Student_Enrollment') {
    dbUpdateStudent(app.dataSnapshot);
  } else if (app.type === 'Staff_Registration') {
    dbUpdateUser({ ...app.dataSnapshot, isActive: true });
  }
};

export const dbRejectRequest = (approvalId: string, comments: string) => {
  const approvals = dbGetApprovals();
  const index = approvals.findIndex(a => a.approvalId === approvalId);
  if (index === -1) return;

  const app = approvals[index];
  app.status = 'Rejected';
  app.comments = comments;
  saveList('sh_approvals', approvals);

  if (app.type === 'Lesson_Plan') {
    const plans = dbGetLessonPlans();
    const pIndex = plans.findIndex(p => p.planId === app.dataSnapshot.planId);
    if (pIndex !== -1) {
      plans[pIndex].status = 'Draft';
      saveList('sh_lessonPlans', plans);
    }
  } else if (app.type === 'Grade_Submission') {
    const allGrades = dbGetGrades();
    allGrades.forEach(g => {
      if (g.subjectId === app.dataSnapshot.subjectId && g.status === 'Pending') {
        g.status = 'Draft';
      }
    });
    saveList('sh_grades', allGrades);
  }
};

// TASKS
export const dbGetTasks = (): Task[] => getList<Task>('sh_tasks');
export const dbSaveTask = (task: Task) => {
  const tasks = dbGetTasks();
  tasks.unshift(task);
  saveList('sh_tasks', tasks);
};
export const dbUpdateTaskStatus = (taskId: string, status: Task['status']) => {
  const tasks = dbGetTasks();
  const index = tasks.findIndex(t => t.taskId === taskId);
  if (index !== -1) {
    tasks[index].status = status;
    saveList('sh_tasks', tasks);
  }
};

// TIMETABLE ENGINE
export const dbGetTimetableSlots = (): TimetableSlot[] => getList<TimetableSlot>('sh_timetable');
export const dbSaveTimetableSlots = (slots: TimetableSlot[]) => saveList('sh_timetable', slots);

export const dbGenerateTimetable = (): TimetableSlot[] => {
  const subjects = dbGetSubjects();
  const classes = dbGetClasses();
  const teachers = dbGetUsers().filter(u => u.role === 'Teacher');

  const days: TimetableSlot['day'][] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = [
    '08:00 AM - 09:00 AM',
    '09:00 AM - 10:00 AM',
    '10:30 AM - 11:30 AM',
    '11:30 AM - 12:30 PM'
  ];

  const generatedSlots: TimetableSlot[] = [];

  days.forEach((day, dayIndex) => {
    periods.forEach((period, periodIndex) => {
      classes.forEach((cls, classIndex) => {
        // Find subject & teacher for class
        const classSubjects = subjects.filter(s => s.classId === cls.classId);
        if (classSubjects.length === 0) return;

        const targetSubject = classSubjects[(periodIndex + classIndex) % classSubjects.length];
        const teacher = teachers.find(t => t.uid === targetSubject.teacherId || t.subjectId === targetSubject.subjectId) || teachers[0];

        if (!teacher) return;

        // Ensure teacher doesn't have an overlapping class at this day/period
        const hasOverlap = generatedSlots.some(
          s => s.day === day && s.period === period && s.teacherId === teacher.uid
        );

        if (!hasOverlap) {
          generatedSlots.push({
            slotId: `tt-gen-${dayIndex}-${periodIndex}-${cls.classId}`,
            day,
            period,
            classId: cls.classId,
            subjectId: targetSubject.subjectId,
            teacherId: teacher.uid
          });
        }
      });
    });
  });

  dbSaveTimetableSlots(generatedSlots);
  return generatedSlots;
};
