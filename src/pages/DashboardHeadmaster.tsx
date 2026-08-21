import { useState, useEffect } from 'react';
import {
  dbGetStudents, dbGetClasses, dbGetApprovals, dbGetUsers,
  dbApproveRequest, dbRejectRequest, dbGetGrades, dbGetAttendance
} from '../dbAdapter';
import type { ApprovalRequest, Student } from '../data/mockData';
import { Users, BookOpen, CheckCircle, XCircle, TrendingUp, AlertCircle } from 'lucide-react';

interface Props { tab: string; }

export const DashboardHeadmaster = ({ tab }: Props) => {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const reload = () => {
    setApprovals(dbGetApprovals());
    setStudents(dbGetStudents());
  };

  useEffect(() => { reload(); }, [tab]);

  const classes = dbGetClasses();
  const teachers = dbGetUsers().filter(u => u.role === 'Teacher');
  const grades = dbGetGrades();
  const attendance = dbGetAttendance();

  const pending = approvals.filter(a => a.status === 'Pending');
  const approved = approvals.filter(a => a.status === 'Approved');
  const rejected = approvals.filter(a => a.status === 'Rejected');

  const handleApprove = (id: string) => {
    dbApproveRequest(id);
    reload();
  };

  const handleReject = (id: string) => {
    if (!rejectComment.trim()) return;
    dbRejectRequest(id, rejectComment.trim());
    setRejectingId(null);
    setRejectComment('');
    reload();
  };

  // Average attendance across all records
  const avgAttendance = students.length > 0
    ? Math.round(students.reduce((s, st) => s + (st.attendanceRate || 0), 0) / students.length * 10) / 10
    : 0;

  // Grade distribution
  const gradeMap: Record<string, number> = {};
  grades.forEach(g => { gradeMap[g.grade] = (gradeMap[g.grade] || 0) + 1; });

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Headmaster Dashboard</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>School performance, attendance &amp; approval management</p>
      </div>

      {/* KPI Row */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Users size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{students.length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}><BookOpen size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Teaching Staff</div>
            <div className="stat-value">{teachers.length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}><TrendingUp size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Avg. Attendance</div>
            <div className="stat-value">{avgAttendance}%</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><AlertCircle size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value">{pending.length}</div>
          </div>
        </div>
      </div>

      {/* Approvals Panel */}
      <div className="dashboard-two-col">
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
            Pending Approvals
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 360, overflowY: 'auto' }}>
            {pending.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No pending requests.</p>}
            {pending.map(a => (
              <div key={a.approvalId} className="glass-card" style={{ padding: '1rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{a.type.replace('_', ' ')}</strong>
                  <span className="badge badge-warning">Pending</span>
                </div>
                <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
                  {a.type === 'Lesson_Plan'
                    ? `Topic: ${a.dataSnapshot.topic}`
                    : a.type === 'Student_Enrollment'
                    ? `Student Enrollment: ${a.dataSnapshot.fullName} (Class: ${a.dataSnapshot.classId}, House: ${a.dataSnapshot.house})`
                    : a.type === 'Staff_Registration'
                    ? `Staff Registration: ${a.dataSnapshot.fullName} (Role: ${a.dataSnapshot.role})`
                    : `Subject: ${a.dataSnapshot.subjectId} — ${a.dataSnapshot.gradeCount} grades`}
                </p>
                {rejectingId === a.approvalId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <input
                      className="input-field"
                      placeholder="Reason for rejection..."
                      value={rejectComment}
                      onChange={e => setRejectComment(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-danger" style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem' }} onClick={() => handleReject(a.approvalId)}>Confirm Reject</button>
                      <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem' }} onClick={() => setRejectingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem' }} onClick={() => handleApprove(a.approvalId)}>
                      <CheckCircle size={14} /> Approve
                    </button>
                    <button className="btn btn-danger" style={{ flex: 1, fontSize: '0.78rem', padding: '0.4rem' }} onClick={() => setRejectingId(a.approvalId)}>
                      <XCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Approval History */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Approval History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 360, overflowY: 'auto' }}>
            {[...approved, ...rejected].length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No history yet.</p>}
            {[...approved, ...rejected].map(a => (
              <div key={a.approvalId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                <span>{a.type.replace('_', ' ')}</span>
                <span className={`badge ${a.status === 'Approved' ? 'badge-success' : 'badge-danger'}`}>{a.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Class Performance Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Class Performance</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)' }}>Class</th>
                <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)' }}>Students</th>
                <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)' }}>Avg Attendance</th>
                <th style={{ textAlign: 'center', padding: '0.5rem', color: 'var(--text-muted)' }}>Attendance Records</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(cls => {
                const classStudents = students.filter(s => s.classId === cls.classId);
                const classAvgAtt = classStudents.length > 0
                  ? Math.round(classStudents.reduce((s, st) => s + (st.attendanceRate || 0), 0) / classStudents.length * 10) / 10
                  : 0;
                const classAttRecords = attendance.filter(a => a.classId === cls.classId).length;
                return (
                  <tr key={cls.classId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{cls.name}</td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>{classStudents.length}</td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>
                      <span style={{ color: classAvgAtt >= 80 ? '#22c55e' : classAvgAtt >= 60 ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                        {classAvgAtt}%
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'center' }}>{classAttRecords}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeadmaster;
