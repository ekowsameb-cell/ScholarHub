import { useState, useEffect } from 'react';
import { dbGetStudents, dbGetTransactions, dbRecordPayment } from '../dbAdapter';
import type { Student, FeeTransaction } from '../data/mockData';
import { Search, DollarSign, Receipt, CheckCircle, Smartphone, Banknote } from 'lucide-react';

interface Props { tab: string; }

export const DashboardCashier = ({ tab }: Props) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<FeeTransaction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'Cash' | 'MoMo'>('Cash');
  const [items, setItems] = useState('Term 1 Tuition');
  const [processing, setProcessing] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<FeeTransaction | null>(null);

  const reload = () => {
    setStudents(dbGetStudents());
    setTransactions(dbGetTransactions());
  };

  useEffect(() => { reload(); }, [tab]);

  const filteredStudents = searchQuery.trim().length > 1
    ? students.filter(s => s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentId.includes(searchQuery))
    : [];

  const handleProcess = async () => {
    if (!selectedStudent || !amount || parseFloat(amount) <= 0) return;
    setProcessing(true);
    await new Promise(r => setTimeout(r, 500));
    try {
      const tx = dbRecordPayment(selectedStudent.studentId, parseFloat(amount), method, items);
      setLastReceipt(tx);
      reload();
      // Update selected student balance
      setSelectedStudent(prev => prev ? { ...prev, currentBalance: Math.max(0, prev.currentBalance - parseFloat(amount)) } : null);
      setAmount('');
    } catch (e) {
      console.error(e);
    }
    setProcessing(false);
  };

  const todayTotal = transactions.filter(t => t.timestamp.startsWith(new Date().toISOString().split('T')[0])).reduce((s, t) => s + t.amountPaid, 0);
  const todayCount = transactions.filter(t => t.timestamp.startsWith(new Date().toISOString().split('T')[0])).length;

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Cashier POS</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Fee collection point of sale — Cash &amp; Mobile Money</p>
      </div>

      {/* KPI Row */}
      <div className="dashboard-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)' }}><DollarSign size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Today's Revenue</div>
            <div className="stat-value">GHS {todayTotal.toLocaleString()}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)' }}><Receipt size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Transactions Today</div>
            <div className="stat-value">{todayCount}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}><CheckCircle size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Total Students</div>
            <div className="stat-value">{students.length}</div>
          </div>
        </div>
        <div className="glass-card stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#a855f7,#7c3aed)' }}><Banknote size={22} color="#fff" /></div>
          <div>
            <div className="stat-label">Outstanding (All)</div>
            <div className="stat-value">GHS {students.reduce((s, st) => s + st.currentBalance, 0).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="dashboard-two-col">
        {/* POS Panel */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Record Payment</h3>

          {/* Student Search */}
          <div style={{ position: 'relative', marginBottom: '0.75rem' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              className="input-field"
              placeholder="Search student by name or ID..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setLastReceipt(null); }}
              style={{ paddingLeft: '2rem' }}
            />
          </div>

          {/* Dropdown results */}
          {filteredStudents.length > 0 && !selectedStudent && (
            <div style={{ background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', maxHeight: 160, overflowY: 'auto' }}>
              {filteredStudents.map(s => (
                <div
                  key={s.studentId}
                  onClick={() => { setSelectedStudent(s); setSearchQuery(s.fullName); }}
                  style={{ padding: '0.6rem 0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--glass-border)', fontSize: '0.85rem' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ fontWeight: 600 }}>{s.fullName}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Balance: GHS {s.currentBalance.toLocaleString()} · {s.studentId}</div>
                </div>
              ))}
            </div>
          )}

          {/* Selected student card */}
          {selectedStudent && (
            <div style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', marginBottom: '0.75rem', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{selectedStudent.fullName}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>ID: {selectedStudent.studentId}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: selectedStudent.currentBalance > 0 ? '#ef4444' : '#22c55e' }}>
                    GHS {selectedStudent.currentBalance.toLocaleString()}
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Outstanding</div>
                </div>
              </div>
              <button
                onClick={() => { setSelectedStudent(null); setSearchQuery(''); }}
                style={{ marginTop: '0.5rem', fontSize: '0.72rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                ✕ Clear Selection
              </button>
            </div>
          )}

          {/* Payment Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Amount (GHS)</label>
              <input
                className="input-field"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Payment Method</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['Cash', 'MoMo'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    style={{
                      flex: 1, padding: '0.5rem', borderRadius: 'var(--radius-sm)',
                      border: `2px solid ${method === m ? 'var(--accent-primary)' : 'var(--glass-border)'}`,
                      background: method === m ? 'rgba(99,102,241,0.1)' : 'var(--bg-secondary)',
                      color: method === m ? 'var(--accent-primary)' : 'var(--text-secondary)',
                      cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s'
                    }}
                  >
                    {m === 'Cash' ? <Banknote size={16} /> : <Smartphone size={16} />} {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>Items Paid For</label>
              <input className="input-field" value={items} onChange={e => setItems(e.target.value)} />
            </div>
            <button
              className="btn btn-primary"
              onClick={handleProcess}
              disabled={processing || !selectedStudent || !amount || parseFloat(amount) <= 0}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {processing ? '⏳ Processing…' : <><CheckCircle size={16} /> Process Payment</>}
            </button>
          </div>

          {/* Receipt Preview */}
          {lastReceipt && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(34,197,94,0.1)', border: '1px solid #22c55e', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
              <p style={{ fontWeight: 700, color: '#22c55e', marginBottom: '0.25rem' }}>✓ Payment Successful</p>
              <p><strong>Receipt:</strong> {lastReceipt.receiptNumber}</p>
              <p><strong>Amount:</strong> GHS {lastReceipt.amountPaid.toLocaleString()} via {lastReceipt.paymentMethod}</p>
              <p><strong>Items:</strong> {lastReceipt.itemsPaidFor}</p>
              <a
                href={`https://wa.me/233000000000?text=${encodeURIComponent(
                  `📧 ScholarHub ERP - Fee Receipt\n` +
                  `Receipt: ${lastReceipt.receiptNumber}\n` +
                  `Student: ${selectedStudent?.fullName || 'N/A'}\n` +
                  `Amount Paid: GHS ${lastReceipt.amountPaid.toLocaleString()}\n` +
                  `Method: ${lastReceipt.paymentMethod}\n` +
                  `Items: ${lastReceipt.itemsPaidFor}\n` +
                  `Thank you for your payment!`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  marginTop: '0.75rem', padding: '0.5rem 1rem',
                  background: '#25D366', color: '#fff', borderRadius: 'var(--radius-sm)',
                  textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem'
                }}
              >
                📱 Send WhatsApp Receipt
              </a>
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>Recent Transactions</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 480, overflowY: 'auto' }}>
            {transactions.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No transactions yet.</p>}
            {transactions.map(tx => {
              const st = students.find(s => s.studentId === tx.studentId);
              return (
                <div key={tx.transactionId} style={{ padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                    <span style={{ fontWeight: 700 }}>{st?.fullName || tx.studentId}</span>
                    <span style={{ fontWeight: 700, color: '#22c55e' }}>GHS {tx.amountPaid.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="text-muted" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{tx.receiptNumber}</span>
                    <span className={`badge ${tx.paymentMethod === 'MoMo' ? 'badge-info' : 'badge-success'}`}>{tx.paymentMethod}</span>
                  </div>
                  <p className="text-muted" style={{ fontSize: '0.72rem', marginTop: '0.2rem' }}>{tx.itemsPaidFor}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardCashier;
