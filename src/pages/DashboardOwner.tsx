import { useState, useEffect } from 'react';
import {
  dbGetStudents, dbGetTransactions, dbGetUsers,
  dbGetClasses, dbGetGrades, dbGetApprovals,
  dbApproveRequest, dbRejectRequest
} from '../dbAdapter';
import type { FeeTransaction, Student } from '../data/mockData';
import { TrendingUp, Users, BookOpen, AlertCircle, DollarSign, CheckCircle, Clock, XCircle } from 'lucide-react';

interface Props { tab: string; }

export const DashboardOwner = ({ tab }: Props) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [approvals, setApprovals] = useState(dbGetApprovals());

  useEffect(() => {
    setStudents(dbGetStudents());
    setTransactions(dbGetTransactions());
    setApprovals(dbGetApprovals());
  }, [tab]);

  const totalRevenue = transactions.reduce((s, t) => s + t.amountPaid, 0);
  const totalOutstanding = students.reduce((s, st) => s + (st.currentBalance || 0), 0);
  const enrollmentCount = students.length;
  const users = dbGetUsers();
  const teacherCount = users.filter(u => u.role === 'Teacher').length;
  const classes = dbGetClasses();
  const grades = dbGetGrades();
  const approvedGrades = grades.filter(g => g.status === 'Approved').length;
  const pendingApprovals = approvals.filter(a => a.status === 'Pending').length;

  const recent5Tx = transactions.slice(0, 5);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Owner Overview</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>School-wide financial &amp; academic snapshot</p>
      </div>

      {/* KPI Cards */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}><DollarSign size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Total Revenue (Term)</div>
            <div className="stat-value">GHS {totalRevenue.toLocaleString()}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}><AlertCircle size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Outstanding Balances</div>
            <div className="stat-value">GHS {totalOutstanding.toLocaleString()}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Users size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Total Enrollment</div>
            <div className="stat-value">{enrollmentCount} Students</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}><BookOpen size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Active Teachers</div>
            <div className="stat-value">{teacherCount} Staff</div>
          </div>
        </div>
      </div>

      {/* Secondary Row */}
      <div className="dashboard-two-col">
        {/* Pending approvals */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} color="var(--accent-primary)" /> Pending Approvals ({pendingApprovals})
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {approvals.filter(a => a.status === 'Pending').slice(0, 5).map(a => (
              <div key={a.approvalId} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <strong>{a.type.replace('_', ' ')}</strong>
                  <span className="badge badge-warning">Pending Sign-off</span>
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                  {a.type === 'Student_Enrollment'
                    ? `Student: ${a.dataSnapshot.fullName} (Class: ${a.dataSnapshot.classId})`
                    : a.type === 'Staff_Registration'
                    ? `Staff: ${a.dataSnapshot.fullName} (Role: ${a.dataSnapshot.role})`
                    : a.type === 'Lesson_Plan'
                    ? `Topic: ${a.dataSnapshot.topic}`
                    : `Subject: ${a.dataSnapshot.subjectId}`}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', flex: 1 }} onClick={() => { dbApproveRequest(a.approvalId); setApprovals(dbGetApprovals()); setStudents(dbGetStudents()); }}>
                    ✓ Approve
                  </button>
                  <button className="btn btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.72rem', flex: 1 }} onClick={() => { dbRejectRequest(a.approvalId, 'Rejected by Owner'); setApprovals(dbGetApprovals()); }}>
                    ✕ Reject
                  </button>
                </div>
              </div>
            ))}
            {pendingApprovals === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>All clear — no pending items.</p>}
          </div>
        </div>

        {/* Class Summary */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={18} color="var(--accent-primary)" /> Class Summary ({classes.length} Classes)
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {classes.slice(0, 5).map(cls => {
              const classStudents = students.filter(s => s.classId === cls.classId);
              return (
                <div key={cls.classId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  <span>{cls.name}</span>
                  <span className="text-muted">{classStudents.length} students</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={18} color="var(--accent-primary)" /> Recent Transactions
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)' }}>Receipt</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)' }}>Student</th>
                <th style={{ textAlign: 'right', padding: '0.5rem', color: 'var(--text-muted)' }}>Amount</th>
                <th style={{ textAlign: 'left', padding: '0.5rem', color: 'var(--text-muted)' }}>Method</th>
              </tr>
            </thead>
            <tbody>
              {recent5Tx.map(tx => {
                const st = students.find(s => s.studentId === tx.studentId);
                return (
                  <tr key={tx.transactionId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '0.6rem 0.5rem', fontFamily: 'monospace', color: 'var(--accent-primary)' }}>{tx.receiptNumber}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}>{st?.fullName || tx.studentId}</td>
                    <td style={{ padding: '0.6rem 0.5rem', textAlign: 'right', fontWeight: 700, color: '#22c55e' }}>GHS {tx.amountPaid.toLocaleString()}</td>
                    <td style={{ padding: '0.6rem 0.5rem' }}><span className={`badge ${tx.paymentMethod === 'MoMo' ? 'badge-info' : 'badge-success'}`}>{tx.paymentMethod}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {recent5Tx.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem', padding: '0.75rem 0' }}>No transactions recorded yet.</p>}
        </div>
      </div>

      {/* Grade Approval Summary */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Grade Submission Status</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <CheckCircle size={16} color="#22c55e" /> <span>{approvedGrades} Approved</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <Clock size={16} color="#f59e0b" /> <span>{grades.filter(g => g.status === 'Pending').length} Pending</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
            <XCircle size={16} color="#ef4444" /> <span>{grades.filter(g => g.status === 'Draft' && g.grade === 'F9').length} Failing (Draft)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOwner;
