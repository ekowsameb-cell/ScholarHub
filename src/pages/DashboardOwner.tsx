import { useState, useEffect } from 'react';
import {
  dbGetStudents, dbGetTransactions, dbGetUsers,
  dbGetClasses, dbGetGrades, dbGetApprovals,
  dbApproveRequest, dbRejectRequest, dbGetSalaryApprovalRequests
} from '../dbAdapter';
import { StudentActivityPicker } from '../components/StudentActivityPicker';
import { OwnerApprovalSection } from '../components/OwnerApprovalSection';
import type { FeeTransaction, Student, SalaryApprovalRequest } from '../data/mockData';
import { TrendingUp, Users, BookOpen, AlertCircle, DollarSign, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { generateOwnerReport } from '../utils/reportGenerator';

interface Props { tab: string; }

export const DashboardOwner = ({ tab }: Props) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [approvals, setApprovals] = useState(dbGetApprovals());
  const [salaryApprovals, setSalaryApprovals] = useState<SalaryApprovalRequest[]>([]);

  const reload = () => {
    setStudents(dbGetStudents());
    setTransactions(dbGetTransactions());
    setApprovals(dbGetApprovals());
    setSalaryApprovals(dbGetSalaryApprovalRequests());
  };

  useEffect(() => {
    reload();
  }, [tab]);

  const totalRevenue = transactions.reduce((s, t) => s + t.amountPaid, 0);
  const totalOutstanding = students.reduce((s, st) => s + (st.currentBalance || 0), 0);
  const totalCharged = totalRevenue + totalOutstanding;
  const momoCollected = transactions.filter(t => t.paymentMethod === 'MoMo').reduce((s, t) => s + t.amountPaid, 0);
  const cashCollected = transactions.filter(t => t.paymentMethod === 'Cash').reduce((s, t) => s + t.amountPaid, 0);
  
  const enrollmentCount = students.length;
  const users = dbGetUsers();
  const teacherCount = users.filter(u => u.role === 'Teacher').length;
  const classes = dbGetClasses();
  const totalCapacity = classes.reduce((s, c) => s + (c.capacity || 35), 0);
  const capacityPct = totalCapacity > 0 ? Math.min(100, Math.round((enrollmentCount / totalCapacity) * 100)) : 0;

  const grades = dbGetGrades();
  const approvedGrades = grades.filter(g => g.status === 'Approved').length;
  const pendingApprovals = approvals.filter(a => a.status === 'Pending').length;

  const recent5Tx = transactions.slice(0, 5);

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Executive Summary Dashboard (Owner)</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>School-wide financial, capacity &amp; academic snapshot</p>
        </div>
        <button
          onClick={generateOwnerReport}
          className="btn btn-primary"
          style={{ fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
        >
          <FileText size={16} /> 📄 Generate Executive Audit Report
        </button>
      </div>

      {/* Executive Payroll Authorization Board (Proprietor Action Required) */}
      <OwnerApprovalSection pendingRequests={salaryApprovals} onReload={reload} />

      {/* Student Activity Picker for Owner */}
      <StudentActivityPicker role="Owner" />

      {/* Primary KPI Cards */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)' }}><TrendingUp size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Total Term Billing</div>
            <div className="stat-value">GHS {totalCharged.toLocaleString()}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}><DollarSign size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Total Revenue Collected</div>
            <div className="stat-value">GHS {totalRevenue.toLocaleString()}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}><AlertCircle size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Outstanding Arrears</div>
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

      {/* Payment Stream Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(234,179,8,0.15), rgba(202,138,4,0.05))', border: '1px solid rgba(234,179,8,0.3)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>📱 MoMo Gateway Flow</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem', color: '#eab308' }}>GHS {momoCollected.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(22,163,74,0.05))', border: '1px solid rgba(34,197,94,0.3)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>💵 Cash Ledger Flow</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem', color: '#22c55e' }}>GHS {cashCollected.toLocaleString()}</div>
        </div>
        <div className="glass-card" style={{ padding: '1.25rem', background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.05))', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>⚠️ Debt Collection Portfolio</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '0.25rem', color: '#ef4444' }}>GHS {totalOutstanding.toLocaleString()}</div>
        </div>
      </div>

      {/* Infrastructural & Enrollment Capacity Bar */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>Infrastructural &amp; Enrollment Capacity</h3>
        <div style={{ width: '100%', height: 14, background: 'var(--bg-secondary)', borderRadius: 7, overflow: 'hidden', marginBottom: '0.5rem' }}>
          <div style={{ height: '100%', width: `${capacityPct}%`, background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))', borderRadius: 7, transition: 'width 0.5s ease' }} />
        </div>
        <p className="text-muted" style={{ fontSize: '0.82rem' }}>
          School is currently at <strong style={{ color: 'var(--text-primary)' }}>{capacityPct}% total capacity</strong> ({enrollmentCount} enrolled students out of {totalCapacity || 100} desk openings across {classes.length} classes).
        </p>
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
                  <span className="text-muted">{classStudents.length} / {cls.capacity || 35} students</span>
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
