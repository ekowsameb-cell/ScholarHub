import { useState, useEffect } from 'react';
import {
  dbGetStudents, dbGetUsers, dbUpdateStudent, dbUpdateUser, dbGetClasses,
  dbSubmitStudentEnrollmentApproval, dbSubmitStaffRegistrationApproval, dbGetApprovals,
  dbGetSubjects, dbGetTimetableSlots, dbGenerateTimetable
} from '../dbAdapter';
import type { Student, User, ApprovalRequest, Subject, TimetableSlot } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Users, Search, CheckCircle, Shield, Phone, Mail, Edit, Send, Calendar, Zap, BookOpen } from 'lucide-react';

interface Props { tab: string; }

export const DashboardAdmin = ({ tab }: Props) => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>('all');
  const [searchStudent, setSearchStudent] = useState('');
  const [searchStaff, setSearchStaff] = useState('');

  // Notifications
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);

  // Modals
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);

  // New Student Form State
  const [stFullName, setStFullName] = useState('');
  const [stClassId, setStClassId] = useState('c-jhs1');
  const [stHouse, setStHouse] = useState('Red House');
  const [stBalance, setStBalance] = useState('0');
  const [stParentId, setStParentId] = useState('u-parent1');
  const [stParentContact, setStParentContact] = useState('');
  const [stWhatsappNumber, setStWhatsappNumber] = useState('');

  // New Staff Form State
  const [stfFullName, setStfFullName] = useState('');
  const [stfRole, setStfRole] = useState<User['role']>('Teacher');
  const [stfEmail, setStfEmail] = useState('');
  const [stfPhone, setStfPhone] = useState('');
  const [stfDept, setStfDept] = useState('dept-math');
  const [stfSubjectId, setStfSubjectId] = useState('sub-math1');

  const reload = () => {
    setStudents(dbGetStudents());
    setUsers(dbGetUsers());
    setSubjects(dbGetSubjects());
    setApprovals(dbGetApprovals());
    setTimetableSlots(dbGetTimetableSlots());
  };

  useEffect(() => { reload(); }, [tab]);

  // Submit Student Enrollment for Higher Authority Approval
  const handleEnrollStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stFullName.trim()) return;

    const newStudent: Student = {
      studentId: `s-${Date.now().toString().slice(-4)}`,
      fullName: stFullName.trim(),
      classId: stClassId,
      parentId: stParentId,
      house: stHouse,
      currentBalance: parseFloat(stBalance) || 0,
      attendanceRate: 100.0,
      parentContact: stParentContact.trim(),
      whatsappNumber: stWhatsappNumber.trim()
    };

    dbSubmitStudentEnrollmentApproval(newStudent, currentUser?.uid || 'u-admin');
    setNotifyMsg(`✓ Student enrollment for "${newStudent.fullName}" submitted to Headmaster for approval!`);
    setStFullName('');
    setStBalance('0');
    setShowStudentModal(false);
    reload();
  };

  // Submit Staff Registration for Higher Authority Approval
  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stfFullName.trim()) return;

    const newUser: User = {
      uid: `u-${Date.now().toString().slice(-4)}`,
      fullName: stfFullName.trim(),
      role: stfRole,
      email: stfEmail.trim() || `${stfFullName.toLowerCase().replace(/\s+/g, '.')}@scholarhub.edu.gh`,
      phone: stfPhone.trim() || '+233200000000',
      departmentId: stfRole === 'Teacher' || stfRole === 'HOD' ? stfDept : undefined,
      subjectId: stfRole === 'Teacher' ? stfSubjectId : undefined,
      isActive: false // Pending approval
    };

    dbSubmitStaffRegistrationApproval(newUser, currentUser?.uid || 'u-admin');
    setNotifyMsg(`✓ Staff registration for "${newUser.fullName}" (Subject: ${subjects.find(s => s.subjectId === stfSubjectId)?.name || 'General'}) submitted to Owner for approval!`);
    setStfFullName('');
    setStfEmail('');
    setStfPhone('');
    setShowStaffModal(false);
    reload();
  };

  // Trigger Timetable Generation
  const handleGenerateTimetable = () => {
    const slots = dbGenerateTimetable();
    setTimetableSlots(slots);
    setNotifyMsg('⚡ Master Timetable generated successfully! All teacher schedules have been assigned conflict-free.');
  };

  // Save Edits for Existing Student
  const handleSaveStudentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    dbUpdateStudent(editingStudent);
    setEditingStudent(null);
    setNotifyMsg(`✓ Updated student details for "${editingStudent.fullName}".`);
    reload();
  };

  // Save Edits for Existing Staff
  const handleSaveStaffEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    dbUpdateUser(editingStaff);
    setEditingStaff(null);
    setNotifyMsg(`✓ Updated staff account for "${editingStaff.fullName}".`);
    reload();
  };

  const filteredStudents = searchStudent.trim().length > 0
    ? students.filter(s =>
        s.fullName.toLowerCase().includes(searchStudent.toLowerCase()) || s.studentId.toLowerCase().includes(searchStudent.toLowerCase())
      )
    : [];

  const filteredStaff = searchStaff.trim().length > 0
    ? users.filter(u =>
        u.fullName.toLowerCase().includes(searchStaff.toLowerCase()) || u.role.toLowerCase().includes(searchStaff.toLowerCase())
      )
    : [];

  const classes = dbGetClasses();
  const teachers = users.filter(u => u.role === 'Teacher');

  // Pending Onboarding Approvals
  const pendingEnrollments = approvals.filter(a => a.type === 'Student_Enrollment' || a.type === 'Staff_Registration');

  const days: ('Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday')[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const periods = ['08:00 AM - 09:00 AM', '09:00 AM - 10:00 AM', '10:30 AM - 11:30 AM', '11:30 AM - 12:30 PM'];

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>School Administration &amp; Onboarding</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Search records, manage staff subjects, timetable generation &amp; onboarding approvals</p>
      </div>

      {notifyMsg && (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(34,197,94,0.12)', border: '1px solid #22c55e', borderRadius: 'var(--radius-sm)', color: '#22c55e', fontWeight: 600, fontSize: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{notifyMsg}</span>
          <button style={{ background: 'none', border: 'none', color: '#22c55e', cursor: 'pointer' }} onClick={() => setNotifyMsg(null)}>✕</button>
        </div>
      )}

      {/* KPI Overview */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Users size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Total Enrolled Students</div>
            <div className="stat-value">{students.length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}><CheckCircle size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Active Staff Accounts</div>
            <div className="stat-value">{users.filter(u => u.isActive && u.role !== 'Parent').length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}><Calendar size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Timetable Slots</div>
            <div className="stat-value">{timetableSlots.length}</div>
          </div>
        </div>
      </div>

      {/* Pending Approvals Tracker Banner */}
      {pendingEnrollments.length > 0 && (
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Send size={18} color="var(--warning)" /> Pending Higher Authority Approvals ({pendingEnrollments.length})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {pendingEnrollments.map(a => (
              <div key={a.approvalId} style={{ padding: '0.6rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{a.type.replace('_', ' ')}:</strong> {a.dataSnapshot.fullName} ({a.type === 'Student_Enrollment' ? `Class: ${a.dataSnapshot.classId}` : `Role: ${a.dataSnapshot.role}`})
                </div>
                <span className={`badge ${a.status === 'Approved' ? 'badge-success' : a.status === 'Pending' ? 'badge-warning' : 'badge-danger'}`}>
                  {a.status === 'Pending' ? 'Awaiting Sign-off' : a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TIMETABLE GENERATION & MANAGEMENT PANEL (ADMIN IN CHARGE) */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={20} color="var(--accent-primary)" /> Teacher Timetable Management (Admin Control)
            </h3>
            <p className="text-muted" style={{ fontSize: '0.78rem' }}>Generate and inspect weekly class schedules for teachers</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <select
              className="input-field"
              value={selectedTeacherFilter}
              onChange={e => setSelectedTeacherFilter(e.target.value)}
              style={{ fontSize: '0.82rem', width: 220 }}
            >
              <option value="all">All Teachers Overview</option>
              {teachers.map(t => (
                <option key={t.uid} value={t.uid}>{t.fullName} ({subjects.find(s => s.subjectId === t.subjectId)?.name || 'Teacher'})</option>
              ))}
            </select>
            <button className="btn btn-primary" onClick={handleGenerateTimetable}>
              <Zap size={16} /> Auto-Generate Timetable
            </button>
          </div>
        </div>

        {/* Timetable Grid View */}
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>Day</th>
                {periods.map(p => <th key={p} style={{ textAlign: 'center' }}>{p}</th>)}
              </tr>
            </thead>
            <tbody>
              {days.map(d => (
                <tr key={d}>
                  <td style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{d}</td>
                  {periods.map(p => {
                    const slots = timetableSlots.filter(s =>
                      s.day === d && s.period === p && (selectedTeacherFilter === 'all' || s.teacherId === selectedTeacherFilter)
                    );
                    return (
                      <td key={p} style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.78rem' }}>
                        {slots.length === 0 ? (
                          <span className="text-muted" style={{ fontSize: '0.72rem' }}>— Free Period —</span>
                        ) : (
                          slots.map(s => {
                            const subj = subjects.find(sb => sb.subjectId === s.subjectId);
                            const cls = classes.find(c => c.classId === s.classId);
                            const tchr = teachers.find(t => t.uid === s.teacherId);
                            return (
                              <div key={s.slotId} style={{ padding: '0.4rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 'var(--radius-sm)', marginBottom: '0.2rem' }}>
                                <div style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{cls?.name || s.classId}</div>
                                <div style={{ fontSize: '0.72rem' }}>{subj?.name || s.subjectId}</div>
                                {selectedTeacherFilter === 'all' && (
                                  <div className="text-muted" style={{ fontSize: '0.68rem', marginTop: 2 }}>👨‍🏫 {tchr?.fullName}</div>
                                )}
                              </div>
                            );
                          })
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

      {/* STUDENT MANAGEMENT SECTION */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Action button directly ON TOP of search input */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Student Management</h3>
              <p className="text-muted" style={{ fontSize: '0.78rem' }}>Enroll new students or search existing roster to update</p>
            </div>
            <button className="btn btn-primary" onClick={() => setShowStudentModal(true)}>
              <UserPlus size={16} /> Enroll New Student
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              placeholder="Search student by Name, ID, or House to display records..."
              value={searchStudent}
              onChange={e => setSearchStudent(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Results or Empty Helper */}
          {searchStudent.trim().length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              🔍 Type a student name or ID in the search box above to display and edit student records.
            </div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No enrolled students found matching "{searchStudent}".
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Full Name</th>
                    <th>Class</th>
                    <th>House</th>
                    <th>Balance (GHS)</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStudents.map(s => {
                    const cls = classes.find(c => c.classId === s.classId);
                    return (
                      <tr key={s.studentId}>
                        <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{s.studentId}</td>
                        <td style={{ fontWeight: 600 }}>{s.fullName}</td>
                        <td>{cls?.name || s.classId}</td>
                        <td><span className="badge badge-info">{s.house}</span></td>
                        <td style={{ fontWeight: 700, color: s.currentBalance > 0 ? '#ef4444' : '#22c55e' }}>
                          GHS {s.currentBalance.toLocaleString()}
                        </td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setEditingStudent(s)}>
                            <Edit size={13} /> Edit / Update
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* STAFF MANAGEMENT SECTION */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Action button directly ON TOP of search input */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Staff &amp; User Accounts</h3>
              <p className="text-muted" style={{ fontSize: '0.78rem' }}>Register staff credentials with assigned subjects, or search to edit account status</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setShowStaffModal(true)}>
              <Shield size={16} /> Register Staff Account
            </button>
          </div>

          {/* Search Box */}
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              placeholder="Search staff by Name, Role, or Email to display accounts..."
              value={searchStaff}
              onChange={e => setSearchStaff(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Results or Empty Helper */}
          {searchStaff.trim().length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              🔍 Type a staff name or role in the search box above to display and edit staff accounts.
            </div>
          ) : filteredStaff.length === 0 ? (
            <div style={{ padding: '1.25rem', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No staff accounts found matching "{searchStaff}".
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Assigned Subject</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map(u => {
                    const assignedSubject = subjects.find(s => s.subjectId === u.subjectId);
                    return (
                      <tr key={u.uid}>
                        <td style={{ fontWeight: 600 }}>{u.fullName}</td>
                        <td><span className="badge badge-warning">{u.role}</span></td>
                        <td>
                          {u.role === 'Teacher' ? (
                            <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <BookOpen size={10} /> {assignedSubject?.name || 'Not Assigned'}
                            </span>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}>N/A</span>
                          )}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}><Mail size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{u.email}</td>
                        <td style={{ fontSize: '0.8rem' }}><Phone size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />{u.phone}</td>
                        <td>
                          <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem' }} onClick={() => setEditingStaff(u)}>
                            <Edit size={13} /> Edit / Update
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ENROLL NEW STUDENT (SUBMITS TO HIGHER AUTHORITY APPROVAL) */}
      {showStudentModal && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowStudentModal(false)}>✕</button>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={20} color="var(--accent-primary)" /> Enroll New Student
            </h2>
            <p className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '1.25rem' }}>
              ⚠️ Requires approval from Headmaster or Owner before official registration.
            </p>
            <form onSubmit={handleEnrollStudent} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Full Name *</label>
                <input className="input-field" placeholder="e.g. Kwame Asante" value={stFullName} onChange={e => setStFullName(e.target.value)} required />
              </div>
              <div className="dashboard-two-col">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Class / Form</label>
                  <select className="input-field" value={stClassId} onChange={e => setStClassId(e.target.value)}>
                    {classes.map(c => <option key={c.classId} value={c.classId}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>House</label>
                  <select className="input-field" value={stHouse} onChange={e => setStHouse(e.target.value)}>
                    {['Red House', 'Blue House', 'Yellow House', 'Green House'].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div className="dashboard-two-col">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Initial Fee Balance (GHS)</label>
                  <input className="input-field" type="number" value={stBalance} onChange={e => setStBalance(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Parent Account</label>
                  <select className="input-field" value={stParentId} onChange={e => setStParentId(e.target.value)}>
                    {users.filter(u => u.role === 'Parent').map(p => <option key={p.uid} value={p.uid}>{p.fullName}</option>)}
                  </select>
                </div>
              </div>
              <div className="dashboard-two-col">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Parent Contact (Phone)</label>
                  <input className="input-field" placeholder="e.g. 0244123456" value={stParentContact} onChange={e => setStParentContact(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>WhatsApp Number (if different)</label>
                  <input className="input-field" placeholder="e.g. 0244123456" value={stWhatsappNumber} onChange={e => setStWhatsappNumber(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                <Send size={16} /> Submit Enrollment for Higher Approval
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REGISTER STAFF ACCOUNT WITH SUBJECT ASSIGNMENT */}
      {showStaffModal && (
        <div className="modal-overlay" onClick={() => setShowStaffModal(false)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowStaffModal(false)}>✕</button>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={20} color="var(--accent-secondary)" /> Register Staff Account &amp; Assign Subject
            </h2>
            <p className="text-muted" style={{ fontSize: '0.78rem', marginBottom: '1.25rem' }}>
              ⚠️ Requires approval from School Owner before account activation.
            </p>
            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Full Name *</label>
                <input className="input-field" placeholder="e.g. Mrs. Abena Ofori" value={stfFullName} onChange={e => setStfFullName(e.target.value)} required />
              </div>
              <div className="dashboard-two-col">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Role</label>
                  <select className="input-field" value={stfRole} onChange={e => setStfRole(e.target.value as User['role'])}>
                    {(['Teacher', 'HOD', 'Cashier', 'Headmaster', 'Admin', 'Owner', 'Parent'] as const).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Department</label>
                  <select className="input-field" value={stfDept} onChange={e => setStfDept(e.target.value)}>
                    <option value="dept-math">Mathematics</option>
                    <option value="dept-science">Science &amp; Tech</option>
                    <option value="dept-languages">Languages</option>
                  </select>
                </div>
              </div>

              {/* Subject Column Assignment for Teachers */}
              {stfRole === 'Teacher' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                    📖 Assigned Teaching Subject Column *
                  </label>
                  <select className="input-field" value={stfSubjectId} onChange={e => setStfSubjectId(e.target.value)} style={{ border: '1px solid var(--accent-primary)' }}>
                    {subjects.map(s => (
                      <option key={s.subjectId} value={s.subjectId}>{s.name} ({classes.find(c => c.classId === s.classId)?.name})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="dashboard-two-col">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Email Address</label>
                  <input className="input-field" type="email" placeholder="ofori@scholarhub.edu.gh" value={stfEmail} onChange={e => setStfEmail(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Phone Number</label>
                  <input className="input-field" placeholder="+233240000000" value={stfPhone} onChange={e => setStfPhone(e.target.value)} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem', width: '100%', justifyContent: 'center' }}>
                <Send size={16} /> Submit Staff Registration for Higher Approval
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EXISTING STUDENT */}
      {editingStudent && (
        <div className="modal-overlay" onClick={() => setEditingStudent(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingStudent(null)}>✕</button>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={20} color="var(--accent-primary)" /> Edit Student Record
            </h2>
            <form onSubmit={handleSaveStudentEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Full Name</label>
                <input className="input-field" value={editingStudent.fullName} onChange={e => setEditingStudent({ ...editingStudent, fullName: e.target.value })} required />
              </div>
              <div className="dashboard-two-col">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Class</label>
                  <select className="input-field" value={editingStudent.classId} onChange={e => setEditingStudent({ ...editingStudent, classId: e.target.value })}>
                    {classes.map(c => <option key={c.classId} value={c.classId}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>House</label>
                  <select className="input-field" value={editingStudent.house} onChange={e => setEditingStudent({ ...editingStudent, house: e.target.value })}>
                    {['Red House', 'Blue House', 'Yellow House', 'Green House'].map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Fee Balance (GHS)</label>
                <input className="input-field" type="number" value={editingStudent.currentBalance} onChange={e => setEditingStudent({ ...editingStudent, currentBalance: parseFloat(e.target.value) || 0 })} />
              </div>
              <div className="dashboard-two-col">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Parent Contact (Phone)</label>
                  <input className="input-field" placeholder="e.g. 0244123456" value={editingStudent.parentContact || ''} onChange={e => setEditingStudent({ ...editingStudent, parentContact: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>WhatsApp Number</label>
                  <input className="input-field" placeholder="e.g. 0244123456" value={editingStudent.whatsappNumber || ''} onChange={e => setEditingStudent({ ...editingStudent, whatsappNumber: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Save Student Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT EXISTING STAFF */}
      {editingStaff && (
        <div className="modal-overlay" onClick={() => setEditingStaff(null)}>
          <div className="modal-content animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setEditingStaff(null)}>✕</button>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Edit size={20} color="var(--accent-secondary)" /> Edit Staff Account &amp; Assigned Subject
            </h2>
            <form onSubmit={handleSaveStaffEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Full Name</label>
                <input className="input-field" value={editingStaff.fullName} onChange={e => setEditingStaff({ ...editingStaff, fullName: e.target.value })} required />
              </div>
              <div className="dashboard-two-col">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Role</label>
                  <select className="input-field" value={editingStaff.role} onChange={e => setEditingStaff({ ...editingStaff, role: e.target.value as User['role'] })}>
                    {(['Teacher', 'HOD', 'Cashier', 'Headmaster', 'Admin', 'Owner', 'Parent'] as const).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Account Status</label>
                  <select className="input-field" value={editingStaff.isActive ? 'Active' : 'Inactive'} onChange={e => setEditingStaff({ ...editingStaff, isActive: e.target.value === 'Active' })}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Subject Assignment Edit for Teachers */}
              {editingStaff.role === 'Teacher' && (
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 700, display: 'block', marginBottom: '0.3rem' }}>
                    📖 Assigned Teaching Subject Column
                  </label>
                  <select className="input-field" value={editingStaff.subjectId || ''} onChange={e => setEditingStaff({ ...editingStaff, subjectId: e.target.value })} style={{ border: '1px solid var(--accent-primary)' }}>
                    <option value="">Select Teaching Subject...</option>
                    {subjects.map(s => (
                      <option key={s.subjectId} value={s.subjectId}>{s.name} ({classes.find(c => c.classId === s.classId)?.name})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="dashboard-two-col">
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Email</label>
                  <input className="input-field" value={editingStaff.email || ''} onChange={e => setEditingStaff({ ...editingStaff, email: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Phone</label>
                  <input className="input-field" value={editingStaff.phone} onChange={e => setEditingStaff({ ...editingStaff, phone: e.target.value })} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Save Staff Changes
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardAdmin;
