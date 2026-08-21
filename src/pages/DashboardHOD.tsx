import { useState, useEffect } from 'react';
import {
  dbGetGrades, dbGetLessonPlans, dbGetApprovals,
  dbApproveRequest, dbRejectRequest, dbGetSubjects, dbGetUsers
} from '../dbAdapter';
import type { Grade, LessonPlan, ApprovalRequest, Subject } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { CheckCircle, XCircle, BarChart2, BookOpen, Clock } from 'lucide-react';


interface Props { tab: string; }

export const DashboardHOD = ({ tab }: Props) => {
  const { currentUser } = useAuth();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [plans, setPlans] = useState<LessonPlan[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [rejectComment, setRejectComment] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const reload = () => {
    setGrades(dbGetGrades());
    setPlans(dbGetLessonPlans());
    setApprovals(dbGetApprovals().filter(a => a.submittedToId === currentUser?.uid));
    setSubjects(dbGetSubjects());
  };

  useEffect(() => { reload(); }, [tab, currentUser?.uid]);

  const teachers = dbGetUsers().filter(u => u.departmentId === currentUser?.departmentId);

  const mySubjectIds = subjects.filter(s => teachers.some(t => t.uid === s.teacherId)).map(s => s.subjectId);
  const myGrades = grades.filter(g => mySubjectIds.includes(g.subjectId));

  const gradeDist: Record<string, number> = {};
  myGrades.forEach(g => { gradeDist[g.grade] = (gradeDist[g.grade] || 0) + 1; });
  const gradeOrder = ['A1', 'B2', 'B3', 'C4', 'C5', 'C6', 'D7', 'E8', 'F9'];

  const handleApprove = (id: string) => { dbApproveRequest(id); reload(); };
  const handleReject = (id: string) => {
    if (!rejectComment.trim()) return;
    dbRejectRequest(id, rejectComment.trim());
    setRejectingId(null);
    setRejectComment('');
    reload();
  };

  const pending = approvals.filter(a => a.status === 'Pending');
  const myPlans = plans.filter(p => teachers.some(t => t.uid === p.teacherId));

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>HOD Dashboard</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Department analytics, grade distribution &amp; lesson plan approvals</p>
      </div>

      {/* KPI Row */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><BarChart2 size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Dept. Teachers</div>
            <div className="stat-value">{teachers.length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}><CheckCircle size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Grades Reviewed</div>
            <div className="stat-value">{myGrades.filter(g => g.status !== 'Draft').length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}><Clock size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Pending Approvals</div>
            <div className="stat-value">{pending.length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}><BookOpen size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Lesson Plans</div>
            <div className="stat-value">{myPlans.length}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-two-col">
        {/* Grade Distribution */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Grade Distribution (WAEC)</h3>
          {gradeOrder.filter(g => gradeDist[g]).map(grd => {
            const count = gradeDist[grd] || 0;
            const pct = myGrades.length > 0 ? Math.round((count / myGrades.length) * 100) : 0;
            const color = grd.startsWith('A') ? '#22c55e' : grd.startsWith('B') ? '#6366f1' : grd.startsWith('C') ? '#3b82f6' : grd.startsWith('D') || grd === 'E8' ? '#f59e0b' : '#ef4444';
            return (
              <div key={grd} style={{ marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, color }}>{grd}</span>
                  <span className="text-muted">{count} students ({pct}%)</span>
                </div>
                <div style={{ height: 6, background: 'var(--bg-secondary)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                </div>
              </div>
            );
          })}
          {myGrades.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No grade data for this department yet.</p>}
        </div>

        {/* Pending Approvals */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Pending Approvals</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: 360, overflowY: 'auto' }}>
            {pending.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No pending items. ✓</p>}
            {pending.map(a => (
              <div key={a.approvalId} className="glass-card" style={{ padding: '1rem', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <strong>{a.type.replace('_', ' ')}</strong>
                  <span className="badge badge-warning">Pending</span>
                </div>
                <p className="text-muted" style={{ marginBottom: '0.65rem', fontSize: '0.78rem' }}>
                  {a.type === 'Lesson_Plan' ? `"${a.dataSnapshot.topic}"` : `Subject ${a.dataSnapshot.subjectId}`}
                </p>
                {rejectingId === a.approvalId ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <input className="input-field" placeholder="Reason for rejection..." value={rejectComment} onChange={e => setRejectComment(e.target.value)} />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-danger" style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }} onClick={() => handleReject(a.approvalId)}>Confirm</button>
                      <button className="btn btn-secondary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }} onClick={() => setRejectingId(null)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button className="btn btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }} onClick={() => handleApprove(a.approvalId)}>
                      <CheckCircle size={13} /> Approve
                    </button>
                    <button className="btn btn-danger" style={{ flex: 1, fontSize: '0.75rem', padding: '0.35rem' }} onClick={() => setRejectingId(a.approvalId)}>
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lesson Plans Table */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Department Lesson Plans</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                {['Topic', 'Strand', 'Teacher', 'Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myPlans.map(p => {
                const teacher = dbGetUsers().find(u => u.uid === p.teacherId);
                return (
                  <tr key={p.planId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.6rem 0.5rem', fontWeight: 600 }}>{p.topic}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>{p.strand}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>{teacher?.fullName || p.teacherId}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>
                      <span className={`badge ${p.status === 'Approved' ? 'badge-success' : p.status === 'Pending' ? 'badge-warning' : 'badge-info'}`}>{p.status}</span>
                    </td>
                  </tr>
                );
              })}
              {myPlans.length === 0 && (
                <tr><td colSpan={4} style={{ padding: '1rem 0.5rem', color: 'var(--text-muted)' }}>No lesson plans yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHOD;
