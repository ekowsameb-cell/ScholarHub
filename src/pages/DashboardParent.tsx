import React, { useState, useEffect } from 'react';
import { dbGetStudents, dbGetGrades, dbGetTransactions, dbGetAttendance, dbRecordPayment, dbGetUsers } from '../dbAdapter';
import type { Student, Grade, FeeTransaction, User } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import { StudentProfileModal } from '../components/StudentProfileModal';
import { Users, DollarSign, TrendingUp, ClipboardCheck, Smartphone, Banknote, CheckCircle, Eye, FileText } from 'lucide-react';
import { generateParentReport } from '../utils/reportGenerator';
import { calculateWAECGrade } from '../data/mockData';

interface Props { tab: string; }

export const DashboardParent = ({ tab }: Props) => {
  const { currentUser } = useAuth();
  const [wards, setWards] = useState<Student[]>([]);
  const [selectedWard, setSelectedWard] = useState<Student | null>(null);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [payAmount, setPayAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'Cash' | 'MoMo'>('MoMo');
  const [payItems, setPayItems] = useState('Term 1 Tuition');
  const [paying, setPaying] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<FeeTransaction | null>(null);
  const [showPayDrawer, setShowPayDrawer] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [wardInputName, setWardInputName] = useState('');
  const [wardInputPhone, setWardInputPhone] = useState(currentUser?.phone || '');
  const [linkFeedback, setLinkFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [viewingStudentProfile, setViewingStudentProfile] = useState<Student | null>(null);

  const reload = () => {
    const allStudents = dbGetStudents();
    // Get manually linked wards from localStorage
    let linkedIds: string[] = [];
    try {
      linkedIds = JSON.parse(localStorage.getItem(`sh_linked_wards_${currentUser?.uid}`) || '[]');
    } catch { linkedIds = []; }

    const myWards = allStudents.filter(
      s => s.parentId === currentUser?.uid || linkedIds.includes(s.studentId)
    );
    setWards(myWards);
    if (myWards.length > 0 && !selectedWard) setSelectedWard(myWards[0]);
    setGrades(dbGetGrades());
    setTransactions(dbGetTransactions());
  };

  useEffect(() => { reload(); }, [currentUser?.uid, tab]);

  const wardGrades = grades.filter(g => selectedWard && g.studentId === selectedWard.studentId);
  const wardTxs = transactions.filter(t => selectedWard && t.studentId === selectedWard.studentId);
  const wardAttendance = dbGetAttendance().filter(a => selectedWard && a.records[selectedWard.studentId]);

  const presentCount = wardAttendance.filter(a => selectedWard && (a.records[selectedWard.studentId] === 'Present' || a.records[selectedWard.studentId] === 'Late')).length;
  const attRate = wardAttendance.length > 0 ? Math.round((presentCount / wardAttendance.length) * 1000) / 10 : (selectedWard?.attendanceRate || 0);

  const handlePayment = async () => {
    if (!selectedWard || !payAmount || parseFloat(payAmount) <= 0) return;
    setPaying(true);
    await new Promise(r => setTimeout(r, 600));
    try {
      const tx = dbRecordPayment(selectedWard.studentId, parseFloat(payAmount), payMethod, payItems);
      setLastReceipt(tx);
      setWards(dbGetStudents().filter(s => s.parentId === currentUser?.uid));
      setSelectedWard(prev => prev ? { ...prev, currentBalance: Math.max(0, prev.currentBalance - parseFloat(payAmount)) } : null);
      setTransactions(dbGetTransactions());
      setPayAmount('');
      setShowPayDrawer(false);
    } catch (e) { console.error(e); }
    setPaying(false);
  };

  const handleVerifyAndLinkWard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardInputName.trim() || !wardInputPhone.trim()) return;

    const allStudents = dbGetStudents();
    const cleanSearchName = wardInputName.trim().toLowerCase();
    const cleanPhone = wardInputPhone.replace(/\D/g, '');

    // Search for student matching name or student ID
    const matchedStudent = allStudents.find(s => {
      const nameMatch = s.fullName.toLowerCase().includes(cleanSearchName) || s.studentId.toLowerCase() === cleanSearchName;
      if (!nameMatch) return false;

      // Match phone against student's parent contact, parent user phone, or whatsapp number
      const parentUser = dbGetUsers().find((u: User) => u.uid === s.parentId);
      const parentPhoneClean = (parentUser?.phone || s.parentContact || s.whatsappNumber || '+233241234567').replace(/\D/g, '');

      // Match if last 8 digits of phone numbers match or phone contains query
      return parentPhoneClean.slice(-8) === cleanPhone.slice(-8) || parentPhoneClean.includes(cleanPhone) || cleanPhone.includes(parentPhoneClean.slice(-8));
    });

    if (matchedStudent) {
      // Save linked ward ID in localStorage
      let linkedIds: string[] = [];
      try {
        linkedIds = JSON.parse(localStorage.getItem(`sh_linked_wards_${currentUser?.uid}`) || '[]');
      } catch { linkedIds = []; }

      if (!linkedIds.includes(matchedStudent.studentId)) {
        linkedIds.push(matchedStudent.studentId);
        localStorage.setItem(`sh_linked_wards_${currentUser?.uid}`, JSON.stringify(linkedIds));
      }

      setLinkFeedback({
        type: 'success',
        text: `✓ Ward verified! Access unlocked for ${matchedStudent.fullName} (${matchedStudent.house}).`
      });
      setShowLinkForm(false);
      setWardInputName('');
      setSelectedWard(matchedStudent);
      reload();
    } else {
      setLinkFeedback({
        type: 'error',
        text: `❌ Verification failed. Could not find an enrolled ward matching "${wardInputName}" with registered phone "${wardInputPhone}". Please check the details or contact the school administration.`
      });
    }
  };

  const gradeColor = (grade: string) => {
    if (grade.startsWith('A')) return '#22c55e';
    if (grade.startsWith('B')) return '#6366f1';
    if (grade.startsWith('C')) return '#3b82f6';
    if (grade.startsWith('D') || grade === 'E8') return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Parent Portal</h1>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>Read-only ward performance, attendance &amp; fee statement</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {selectedWard && (
            <button
              className="btn btn-primary"
              onClick={() => generateParentReport(selectedWard, currentUser)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'linear-gradient(135deg, #4f46e5, #3b82f6)', boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)' }}
            >
              <FileText size={16} /> Generate Ward Terminal Report
            </button>
          )}
          <button
            className={`btn ${showLinkForm ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setShowLinkForm(v => !v)}
            style={{ fontSize: '0.82rem' }}
          >
            {showLinkForm ? '✕ Close Link Form' : '🔗 Link Ward by Registered Phone'}
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {linkFeedback && (
        <div style={{
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-sm)',
          background: linkFeedback.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          border: `1px solid ${linkFeedback.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: linkFeedback.type === 'success' ? '#10b981' : '#ef4444',
          fontWeight: 600, fontSize: '0.85rem'
        }}>
          {linkFeedback.text}
        </div>
      )}

      {/* Ward Link Verification Form */}
      {showLinkForm && (
        <div className="glass-card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.06))', border: '1px solid rgba(99,102,241,0.3)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            🔗 Verify &amp; Unlock Ward Profile Access
          </h3>
          <p className="text-muted" style={{ fontSize: '0.82rem', marginBottom: '1rem' }}>
            Enter your ward's full name and the telephone number registered with the school to unlock read-only access to their profile and academic report.
          </p>
          <form onSubmit={handleVerifyAndLinkWard} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', alignItems: 'end' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Ward's Full Name or Student ID:
              </label>
              <input
                className="input-field"
                placeholder="e.g. Kojo Awuah or s-001"
                value={wardInputName}
                onChange={e => setWardInputName(e.target.value)}
                required
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Registered Parent Phone Number:
              </label>
              <input
                className="input-field"
                placeholder="e.g. +233241234567 or 0241234567"
                value={wardInputPhone}
                onChange={e => setWardInputPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                Verify &amp; Access Read-Only Profile
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ward Selector */}
      {wards.length > 1 && (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {wards.map(w => (
            <button
              key={w.studentId}
              onClick={() => { setSelectedWard(w); setLastReceipt(null); }}
              style={{
                padding: '0.4rem 1rem', borderRadius: 'var(--radius-sm)',
                background: selectedWard?.studentId === w.studentId ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                color: selectedWard?.studentId === w.studentId ? '#fff' : 'var(--text-secondary)',
                border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', transition: 'all 0.2s'
              }}
            >{w.fullName}</button>
          ))}
        </div>
      )}

      {!selectedWard && wards.length === 0 && !showLinkForm && (
        <div className="glass-card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>No wards currently linked to your account.</p>
          <button className="btn btn-primary" onClick={() => setShowLinkForm(true)}>
            🔗 Verify Ward Name &amp; Phone Number
          </button>
        </div>
      )}

      {selectedWard && (
        <>
          {/* Ward Profile Card */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#a855f7,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>
                {selectedWard.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{selectedWard.fullName}</div>
                <div className="text-muted" style={{ fontSize: '0.82rem' }}>{selectedWard.house} · ID: {selectedWard.studentId}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setViewingStudentProfile(selectedWard)}
              >
                <Eye size={16} /> View Full Profile
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => generateParentReport(selectedWard, currentUser)}
              >
                <FileText size={16} /> Print Report
              </button>
              <button
                className="btn btn-primary"
                onClick={() => { setShowPayDrawer(v => !v); setLastReceipt(null); }}
              >
                <DollarSign size={16} /> {showPayDrawer ? 'Close' : 'Pay Fees'}
              </button>
            </div>
          </div>

          {/* Pay Drawer */}
          {showPayDrawer && (
            <div className="glass-card animate-fade-in" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Pay Outstanding Balance</h3>
              <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>Outstanding: GHS {selectedWard.currentBalance.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Amount (GHS)</label>
                  <input className="input-field" type="number" placeholder="0.00" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Payment Method</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {(['MoMo', 'Cash'] as const).map(m => (
                      <button key={m} onClick={() => setPayMethod(m)}
                        style={{ flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)', border: `2px solid ${payMethod === m ? 'var(--accent-primary)' : 'var(--glass-border)'}`, background: payMethod === m ? 'rgba(99,102,241,0.1)' : 'var(--bg-secondary)', color: payMethod === m ? 'var(--accent-primary)' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s' }}>
                        {m === 'MoMo' ? <Smartphone size={16} /> : <Banknote size={16} />} {m}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>For</label>
                  <input className="input-field" value={payItems} onChange={e => setPayItems(e.target.value)} />
                </div>
                <button className="btn btn-primary" onClick={handlePayment} disabled={paying || !payAmount || parseFloat(payAmount) <= 0}>
                  {paying ? '⏳ Processing…' : <><CheckCircle size={16} /> Confirm Payment</>}
                </button>
              </div>
              {lastReceipt && (
                <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  <p style={{ fontWeight: 700, color: '#22c55e', marginBottom: '0.25rem' }}>✓ Payment Confirmed</p>
                  <p><strong>Receipt:</strong> {lastReceipt.receiptNumber}</p>
                  <p><strong>Amount:</strong> GHS {lastReceipt.amountPaid.toLocaleString()} via {lastReceipt.paymentMethod}</p>
                </div>
              )}
            </div>
          )}

          {/* Stats Row */}
          <div className="dashboard-grid">
            <div className="glass-card stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}><TrendingUp size={22} color="#fff" /></div>
              <div>
                <div className="stat-label">Attendance Rate</div>
                <div className="stat-value" style={{ color: attRate >= 80 ? '#22c55e' : attRate >= 60 ? '#f59e0b' : '#ef4444' }}>{attRate}%</div>
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><ClipboardCheck size={22} color="#fff" /></div>
              <div>
                <div className="stat-label">Grades Recorded</div>
                <div className="stat-value">{wardGrades.length}</div>
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}><DollarSign size={22} color="#fff" /></div>
              <div>
                <div className="stat-label">Outstanding Balance</div>
                <div className="stat-value" style={{ color: selectedWard.currentBalance > 0 ? '#ef4444' : '#22c55e' }}>
                  GHS {selectedWard.currentBalance.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}><Users size={22} color="#fff" /></div>
              <div>
                <div className="stat-label">Payments Made</div>
                <div className="stat-value">{wardTxs.length}</div>
              </div>
            </div>
          </div>

          <div className="dashboard-two-col">
            {/* Grade Report */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Academic Report</h3>
              {wardGrades.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No grades recorded yet.</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {wardGrades.map(g => {
                  const waec = calculateWAECGrade(g.total);
                  return (
                    <div key={g.gradeId} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: 700 }}>{g.subjectId}</span>
                        <span style={{ fontWeight: 800, color: gradeColor(g.grade), fontSize: '1rem' }}>{g.grade}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        <span>CA1: {g.ca1}</span>
                        <span>CA2: {g.ca2}</span>
                        <span>Exam: {g.exam}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Total: {g.total}/100</span>
                      </div>
                      <div style={{ marginTop: '0.25rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{waec.remark} · {g.term}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment History */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Payment History</h3>
              {wardTxs.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No payments yet.</p>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: 360, overflowY: 'auto' }}>
                {wardTxs.map(tx => (
                  <div key={tx.transactionId} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                      <span style={{ fontWeight: 700, color: '#22c55e' }}>GHS {tx.amountPaid.toLocaleString()}</span>
                      <span className={`badge ${tx.paymentMethod === 'MoMo' ? 'badge-info' : 'badge-success'}`}>{tx.paymentMethod}</span>
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{tx.itemsPaidFor}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{tx.receiptNumber}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {/* STUDENT PROFILE DETAIL MODAL */}
      {viewingStudentProfile && (
        <StudentProfileModal
          student={viewingStudentProfile}
          onClose={() => setViewingStudentProfile(null)}
        />
      )}
    </div>
  );
};

export default DashboardParent;
