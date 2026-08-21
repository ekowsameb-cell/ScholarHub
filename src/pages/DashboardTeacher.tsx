import { useState, useEffect } from 'react';
import {
  dbGetStudents, dbGetSubjects, dbGetGrades, dbSaveGrade,
  dbGetAttendance, dbSaveAttendance, dbGetLessonPlans,
  dbSaveLessonPlan, dbSubmitLessonPlanApproval, dbGetUsers,
  dbGetTimetableSlots, dbGetClasses
} from '../dbAdapter';
import type { Student, Subject, Grade, LessonPlan, TimetableSlot } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { Users, BookOpen, ClipboardCheck, CheckCircle, Send, FileText, PenLine, Calendar } from 'lucide-react';

interface Props { tab: string; }

export const DashboardTeacher = ({ tab }: Props) => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, 'Present' | 'Absent' | 'Late'>>({});
  const [attendanceSaved, setAttendanceSaved] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [gradeForm, setGradeForm] = useState<Record<string, { ca1: string; ca2: string; exam: string }>>({});
  const [gradeSaving, setGradeSaving] = useState(false);
  const [planTopic, setPlanTopic] = useState('');
  const [planStrand, setPlanStrand] = useState('');
  const [planIndicators, setPlanIndicators] = useState('');
  const [planContent, setPlanContent] = useState('');
  const [planGenerating, setPlanGenerating] = useState(false);
  const [planSaving, setPlanSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'attendance' | 'grades' | 'plans' | 'timetable'>('attendance');

  const reload = () => {
    const mySubjects = dbGetSubjects().filter(s => s.teacherId === currentUser?.uid);
    setSubjects(mySubjects);
    if (mySubjects.length > 0 && !selectedSubject) setSelectedSubject(mySubjects[0].subjectId);
    const myClassIds = [...new Set(mySubjects.map(s => s.classId))];
    setStudents(dbGetStudents().filter(s => myClassIds.includes(s.classId)));
    setGrades(dbGetGrades());
    setPlans(dbGetLessonPlans().filter(p => p.teacherId === currentUser?.uid));
    setTimetableSlots(dbGetTimetableSlots().filter(s => s.teacherId === currentUser?.uid));
  };

  useEffect(() => { reload(); }, [currentUser?.uid, tab]);

  // Pre-fill attendance from saved records
  useEffect(() => {
    const existing = dbGetAttendance().find(a => a.date === attendanceDate && subjects.some(s => s.classId === a.classId));
    if (existing) {
      setAttendanceMap(existing.records as Record<string, 'Present' | 'Absent' | 'Late'>);
    } else {
      const init: Record<string, 'Present' | 'Absent' | 'Late'> = {};
      students.forEach(s => { init[s.studentId] = 'Present'; });
      setAttendanceMap(init);
    }
    setAttendanceSaved(false);
  }, [attendanceDate, students.length]);

  const handleAttendanceSave = () => {
    const classId = subjects[0]?.classId;
    if (!classId) return;
    dbSaveAttendance(attendanceDate, classId, attendanceMap);
    setAttendanceSaved(true);
  };

  const handleGradeSave = () => {
    if (!selectedSubject) return;
    setGradeSaving(true);
    const subjectStudents = students.filter(s => subjects.find(sub => sub.subjectId === selectedSubject && sub.classId === s.classId));
    subjectStudents.forEach(st => {
      const form = gradeForm[st.studentId];
      if (!form) return;
      const ca1 = parseFloat(form.ca1) || 0;
      const ca2 = parseFloat(form.ca2) || 0;
      const exam = parseFloat(form.exam) || 0;
      dbSaveGrade({ studentId: st.studentId, subjectId: selectedSubject, term: 'Term 1', ca1, ca2, exam, status: 'Draft' });
    });
    setGrades(dbGetGrades());
    setGradeSaving(false);
  };

  const handleGeneratePlan = async () => {
    if (!planTopic) return;
    setPlanGenerating(true);
    // Simulate AI generation (replace with real aiService call if available)
    await new Promise(r => setTimeout(r, 1200));
    setPlanContent(`<h4>Starter Activity</h4>
<p>Begin with a quick think-pair-share on: "Where do we see ${planTopic} in everyday life?"</p>
<h4>Main Activity</h4>
<p>Introduce key concepts of ${planTopic}. Use real-world Ghanaian examples to anchor understanding. Group activity: apply concepts to solve practical problems.</p>
<h4>Plenary</h4>
<p>Exit ticket: Students write one thing they learned and one question they still have about ${planTopic}.</p>
<h4>Resources</h4>
<p>GES textbook, chalk and board, local context examples.</p>`);
    setPlanGenerating(false);
  };

  const handleSavePlan = (submit: boolean) => {
    if (!planTopic || !planStrand || !selectedSubject) return;
    setPlanSaving(true);
    const plan = dbSaveLessonPlan({
      teacherId: currentUser!.uid,
      subjectId: selectedSubject,
      classId: subjects.find(s => s.subjectId === selectedSubject)?.classId || '',
      topic: planTopic,
      strand: planStrand,
      indicators: planIndicators,
      content: planContent,
      status: 'Draft'
    });
    if (submit) {
      const hod = dbGetUsers().find(u => u.role === 'HOD' && u.departmentId === currentUser?.departmentId);
      if (hod) dbSubmitLessonPlanApproval(plan.planId, currentUser!.uid, hod.uid);
    }
    setPlans(dbGetLessonPlans().filter(p => p.teacherId === currentUser?.uid));
    setPlanTopic(''); setPlanStrand(''); setPlanIndicators(''); setPlanContent('');
    setPlanSaving(false);
  };

  const subjectStudentsForGrade = students.filter(s => {
    const sub = subjects.find(sub => sub.subjectId === selectedSubject);
    return sub && s.classId === sub.classId;
  });

  const navStyle = (active: boolean): React.CSSProperties => ({
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-sm)',
    background: active ? 'var(--accent-primary)' : 'var(--bg-secondary)',
    color: active ? '#fff' : 'var(--text-secondary)',
    border: 'none',
    cursor: 'pointer',
    fontWeight: active ? 700 : 500,
    fontSize: '0.85rem',
    transition: 'all 0.2s'
  });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Teacher Workspace</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Attendance, gradebook &amp; AI lesson planner</p>
      </div>

      {/* KPI Strip */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Users size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">My Students</div>
            <div className="stat-value">{students.length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}><ClipboardCheck size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">My Subjects</div>
            <div className="stat-value">{subjects.length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}><BookOpen size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Lesson Plans</div>
            <div className="stat-value">{plans.length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><CheckCircle size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Grades Submitted</div>
            <div className="stat-value">{grades.filter(g => g.status !== 'Draft' && subjects.some(s => s.subjectId === g.subjectId)).length}</div>
          </div>
        </div>
      </div>

      {/* Section Nav */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button style={navStyle(activeSection === 'attendance')} onClick={() => setActiveSection('attendance')}>
          <ClipboardCheck size={15} style={{ marginRight: '0.4rem' }} /> Attendance
        </button>
        <button style={navStyle(activeSection === 'grades')} onClick={() => setActiveSection('grades')}>
          <PenLine size={15} style={{ marginRight: '0.4rem' }} /> Gradebook
        </button>
        <button style={navStyle(activeSection === 'plans')} onClick={() => setActiveSection('plans')}>
          <FileText size={15} style={{ marginRight: '0.4rem' }} /> Lesson Plans
        </button>
        <button style={navStyle(activeSection === 'timetable')} onClick={() => setActiveSection('timetable')}>
          <Calendar size={15} style={{ marginRight: '0.4rem' }} /> My Weekly Timetable
        </button>
      </div>

      {/* ATTENDANCE SECTION */}
      {activeSection === 'attendance' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Daily Attendance Register</h3>
            <input
              type="date"
              className="input-field"
              value={attendanceDate}
              onChange={e => setAttendanceDate(e.target.value)}
              style={{ width: 'auto' }}
            />
          </div>
          {students.length === 0 && <p className="text-muted">No students in your assigned classes.</p>}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {students.map(st => (
              <div key={st.studentId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                <span style={{ fontWeight: 600 }}>{st.fullName}</span>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {(['Present', 'Late', 'Absent'] as const).map(status => (
                    <button
                      key={status}
                      onClick={() => setAttendanceMap(m => ({ ...m, [st.studentId]: status }))}
                      style={{
                        padding: '0.3rem 0.65rem',
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: attendanceMap[st.studentId] === status
                          ? (status === 'Present' ? '#22c55e' : status === 'Late' ? '#f59e0b' : '#ef4444')
                          : 'var(--bg-primary)',
                        color: attendanceMap[st.studentId] === status ? '#fff' : 'var(--text-muted)',
                        transition: 'all 0.15s'
                      }}
                    >{status}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary" onClick={handleAttendanceSave} disabled={students.length === 0}>
            <CheckCircle size={16} /> {attendanceSaved ? 'Saved ✓' : 'Save Attendance'}
          </button>
        </div>
      )}

      {/* GRADEBOOK SECTION */}
      {activeSection === 'grades' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Gradebook</h3>
            <select className="input-field" style={{ width: 'auto' }} value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
              {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.name}</option>)}
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                  {['Student', 'CA1 (/30)', 'CA2 (/30)', 'Exam (/100)', 'Total', 'Grade'].map(h => (
                    <th key={h} style={{ padding: '0.5rem', color: 'var(--text-muted)', textAlign: h === 'Student' ? 'left' : 'center' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subjectStudentsForGrade.map(st => {
                  const existingGrade = grades.find(g => g.studentId === st.studentId && g.subjectId === selectedSubject && g.term === 'Term 1');
                  const form = gradeForm[st.studentId] || { ca1: existingGrade?.ca1?.toString() || '', ca2: existingGrade?.ca2?.toString() || '', exam: existingGrade?.exam?.toString() || '' };
                  return (
                    <tr key={st.studentId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{st.fullName}</td>
                      {(['ca1', 'ca2', 'exam'] as const).map(field => (
                        <td key={field} style={{ padding: '0.3rem 0.5rem', textAlign: 'center' }}>
                          <input
                            type="number"
                            className="input-field"
                            style={{ width: 70, textAlign: 'center', padding: '0.3rem', fontSize: '0.82rem' }}
                            value={form[field]}
                            onChange={e => setGradeForm(f => ({ ...f, [st.studentId]: { ...form, [field]: e.target.value } }))}
                            placeholder="0"
                          />
                        </td>
                      ))}
                      <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: 700 }}>
                        {existingGrade ? existingGrade.total : '—'}
                      </td>
                      <td style={{ padding: '0.5rem', textAlign: 'center' }}>
                        {existingGrade ? <span className={`badge ${existingGrade.grade.startsWith('A') || existingGrade.grade.startsWith('B') ? 'badge-success' : existingGrade.grade.startsWith('C') ? 'badge-info' : 'badge-danger'}`}>{existingGrade.grade}</span> : '—'}
                      </td>
                    </tr>
                  );
                })}
                {subjectStudentsForGrade.length === 0 && (
                  <tr><td colSpan={6} style={{ padding: '1rem', color: 'var(--text-muted)' }}>No students for this subject.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-primary" onClick={handleGradeSave} disabled={gradeSaving || subjectStudentsForGrade.length === 0}>
              <CheckCircle size={16} /> Save Grades (Draft)
            </button>
          </div>
        </div>
      )}

      {/* LESSON PLAN SECTION */}
      {activeSection === 'plans' && (
        <div className="dashboard-two-col">
          {/* Plan Creator */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>New Lesson Plan</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Subject</label>
                <select className="input-field" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)}>
                  {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Topic</label>
                <input className="input-field" placeholder="e.g. Fractions and Percentages" value={planTopic} onChange={e => setPlanTopic(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Strand</label>
                <input className="input-field" placeholder="e.g. Number, Geometry..." value={planStrand} onChange={e => setPlanStrand(e.target.value)} />
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>NaCCA/GES Indicators</label>
                <input className="input-field" placeholder="e.g. B7.1.1.1 — ..." value={planIndicators} onChange={e => setPlanIndicators(e.target.value)} />
              </div>
              <button className="btn btn-secondary" onClick={handleGeneratePlan} disabled={planGenerating || !planTopic}>
                {planGenerating ? '⏳ Generating…' : '✨ AI Generate Content'}
              </button>
              {planContent && (
                <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', fontSize: '0.8rem', maxHeight: 180, overflowY: 'auto' }} dangerouslySetInnerHTML={{ __html: planContent }} />
              )}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleSavePlan(false)} disabled={planSaving || !planTopic}>
                  <CheckCircle size={15} /> Save Draft
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleSavePlan(true)} disabled={planSaving || !planTopic}>
                  <Send size={15} /> Submit for Review
                </button>
              </div>
            </div>
          </div>

          {/* My Plans List */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>My Lesson Plans ({plans.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 480, overflowY: 'auto' }}>
              {plans.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No lesson plans yet. Create one!</p>}
              {plans.map(p => (
                <div key={p.planId} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <strong>{p.topic}</strong>
                    <span className={`badge ${p.status === 'Approved' ? 'badge-success' : p.status === 'Pending' ? 'badge-warning' : 'badge-info'}`}>{p.status}</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.75rem' }}>{p.strand}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MY TIMETABLE SECTION */}
      {activeSection === 'timetable' && (
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={20} color="var(--accent-primary)" /> My Weekly Teaching Schedule
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Day</th>
                  {['08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM', '10:30 AM - 11:30 AM', '11:30 AM - 12:30 PM'].map(p => (
                    <th key={p} style={{ textAlign: 'center' }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const).map(day => (
                  <tr key={day}>
                    <td style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{day}</td>
                    {['08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM', '10:30 AM - 11:30 AM', '11:30 AM - 12:30 PM'].map(period => {
                      const slot = timetableSlots.find(s => s.day === day && s.period === period);
                      const cls = dbGetClasses().find(c => c.classId === slot?.classId);
                      const subj = dbGetSubjects().find(s => s.subjectId === slot?.subjectId);
                      return (
                        <td key={period} style={{ textAlign: 'center', padding: '0.6rem' }}>
                          {slot ? (
                            <div style={{ padding: '0.45rem', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 'var(--radius-sm)' }}>
                              <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{cls?.name || slot.classId}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-primary)' }}>{subj?.name || slot.subjectId}</div>
                            </div>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.72rem' }}>— Free Period —</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTeacher;
