import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  dbGetMessages, dbSendMessage, dbGetAnnouncements,
  dbPostAnnouncement, dbGetStudents
} from '../dbAdapter';
import type { ChatMessage, Announcement } from '../data/mockData';
import { dbGetSMSLogs, sendSMS, type SMSLog } from '../services/smsService';
import { useRealtimeCollection } from '../utils/useRealtimeCollection';
import { Send, Megaphone, MessageSquare, CheckCircle2, PhoneCall, History } from 'lucide-react';

export const Messages: React.FC = () => {
  const { currentUser, users } = useAuth();

  // Internal chat state
  const [newMessage, setNewMessage] = useState('');
  const [newAnnouncement, setNewAnnouncement] = useState('');
  const [selectedReceiver, setSelectedReceiver] = useState('all');
  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [localAnnouncements, setLocalAnnouncements] = useState<Announcement[]>([]);

  // SMS state
  const [smsLogs, setSmsLogs] = useState<SMSLog[]>([]);
  const [smsPhone, setSmsPhone] = useState('');
  const [smsName, setSmsName] = useState('');
  const [smsContent, setSmsContent] = useState('');
  const [selectedStudentForSms, setSelectedStudentForSms] = useState('');

  // UI state
  const [activeTab, setActiveTab] = useState<'internal' | 'sms'>('internal');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const isAdminOrHead =
    currentUser?.role === 'Admin' ||
    currentUser?.role === 'Headmaster' ||
    currentUser?.role === 'Owner';

  // Live Firestore (optional sync when online)
  const { data: firestoreMessages } = useRealtimeCollection<ChatMessage>('messages');
  const { data: firestoreAnnouncements } = useRealtimeCollection<Announcement>('announcements');

  const reloadData = () => {
    setLocalMessages(dbGetMessages());
    setLocalAnnouncements(dbGetAnnouncements());
    setSmsLogs(dbGetSMSLogs());
  };

  useEffect(() => {
    reloadData();
    window.addEventListener('sh_data_updated', reloadData);
    return () => window.removeEventListener('sh_data_updated', reloadData);
  }, []);

  // Merge Firestore data when available
  const allMessages: ChatMessage[] = React.useMemo(() => {
    const combined = [...localMessages];
    if (firestoreMessages && firestoreMessages.length > 0) {
      firestoreMessages.forEach(fm => {
        if (!combined.some(m => m.id === fm.id)) combined.push(fm);
      });
    }
    return combined;
  }, [localMessages, firestoreMessages]);

  const allAnnouncements: Announcement[] = React.useMemo(() => {
    const combined = [...localAnnouncements];
    if (firestoreAnnouncements && firestoreAnnouncements.length > 0) {
      firestoreAnnouncements.forEach(fa => {
        if (!combined.some(a => a.id === fa.id)) combined.push(fa);
      });
    }
    return combined;
  }, [localAnnouncements, firestoreAnnouncements]);

  const filteredMessages = allMessages.filter(
    msg =>
      msg.senderId === currentUser?.uid ||
      msg.receiverId === currentUser?.uid ||
      msg.receiverId === 'all'
  );

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3500);
  };

  // ── Internal chat handlers ───────────────────────────────
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedReceiver || !currentUser) return;
    const text = newMessage.trim();
    setNewMessage('');
    await dbSendMessage({ senderId: currentUser.uid, receiverId: selectedReceiver, content: text });
    reloadData();
    showNotification('Message sent!');
  };

  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAnnouncement.trim() || !currentUser || !isAdminOrHead) return;
    const text = newAnnouncement.trim();
    setNewAnnouncement('');
    await dbPostAnnouncement({ content: text, authorRole: currentUser.role, authorName: currentUser.fullName });
    reloadData();
    showNotification('Announcement posted!');
  };

  // ── SMS handlers ─────────────────────────────────────────
  const handleSelectStudentForSms = (stId: string) => {
    setSelectedStudentForSms(stId);
    const st = dbGetStudents().find(s => s.studentId === stId);
    if (!st) return;
    const parentUser = users.find(u => u.uid === st.parentId);
    setSmsName(parentUser?.fullName || `Parent of ${st.fullName}`);
    setSmsPhone(parentUser?.phone || st.phone || '+233241234567');
    setSmsContent(
      st.currentBalance > 0
        ? `ScholarHub ERP Alert: Dear ${parentUser?.fullName || 'Parent'}, kindly note that ${st.fullName} has an outstanding fee balance of GHS ${st.currentBalance.toFixed(2)}. Please make payment at the Bursar office. Thank you.`
        : `ScholarHub ERP: Dear ${parentUser?.fullName || 'Parent'}, your ward ${st.fullName} has no outstanding fee balance. Thank you!`
    );
  };

  const handleSendDirectSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smsPhone || !smsContent.trim()) return;
    await sendSMS({
      recipientPhone: smsPhone,
      recipientName: smsName || 'Parent / Contact',
      messageType: 'Direct_Message',
      content: smsContent.trim()
    });
    setSmsContent('');
    reloadData();
    showNotification(`📲 SMS dispatched to ${smsPhone}`);
  };

  // ── Helpers ──────────────────────────────────────────────
  const formatTime = (ts: any) => {
    if (!ts) return 'Just now';
    try {
      const d = typeof ts === 'string' ? new Date(ts) : ts.toDate ? ts.toDate() : new Date(ts);
      if (isNaN(d.getTime())) return 'Just now';
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' · ' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric' })
      );
    } catch {
      return 'Just now';
    }
  };

  const smsTypeColor: Record<string, string> = {
    Receipt: '#10b981',
    Fee_Reminder: '#f59e0b',
    Announcement: '#6366f1',
    Direct_Message: '#3b82f6'
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

      {/* Tab Strip */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('internal')}
          className={`btn ${activeTab === 'internal' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <MessageSquare size={16} /> Internal Inbox &amp; Announcements
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`btn ${activeTab === 'sms' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ fontSize: '0.85rem' }}
        >
          <PhoneCall size={16} /> 📲 Parent SMS Dispatcher ({smsLogs.length})
        </button>
      </div>

      {/* Toast notification */}
      {statusMessage && (
        <div style={{
          background: 'rgba(16,185,129,0.15)',
          border: '1px solid var(--success)',
          color: 'var(--success)',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          fontSize: '0.85rem'
        }}>
          <CheckCircle2 size={18} /> {statusMessage}
        </div>
      )}

      {/* ── Tab: Internal Chat ── */}
      {activeTab === 'internal' && (
        <div className="dashboard-two-col">

          {/* Messages Column */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '520px', maxHeight: 'calc(100vh - 170px)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <MessageSquare size={20} color="var(--accent-primary)" /> Internal Staff &amp; Parent Inbox
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem', marginBottom: '1rem' }}>
              {filteredMessages.length === 0 ? (
                <p className="text-muted" style={{ padding: '1rem 0' }}>No messages in your inbox.</p>
              ) : (
                filteredMessages.map(msg => {
                  const isMine = msg.senderId === currentUser?.uid;
                  const senderUser = users.find(u => u.uid === msg.senderId);
                  const receiverUser = users.find(u => u.uid === msg.receiverId);
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        background: isMine ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'var(--bg-tertiary)',
                        color: isMine ? '#fff' : 'var(--text-primary)',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-md)',
                        maxWidth: '85%',
                        boxShadow: 'var(--shadow-sm)',
                        border: isMine ? 'none' : '1px solid var(--glass-border)'
                      }}
                    >
                      <div style={{ fontSize: '0.72rem', color: isMine ? 'rgba(255,255,255,0.8)' : 'var(--accent-secondary)', fontWeight: 600, marginBottom: '0.25rem', display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                        <span>
                          {isMine
                            ? `To: ${msg.receiverId === 'all' ? 'All Staff (Broadcast)' : receiverUser?.fullName || msg.receiverId}`
                            : `From: ${senderUser ? `${senderUser.fullName} (${senderUser.role})` : 'System'}`}
                        </span>
                        <span style={{ fontSize: '0.68rem', opacity: 0.8 }}>{formatTime(msg.timestamp)}</span>
                      </div>
                      <div style={{ fontSize: '0.88rem', lineHeight: 1.4, wordBreak: 'break-word' }}>{msg.content}</div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>To:</span>
                <select className="input-field" value={selectedReceiver} onChange={e => setSelectedReceiver(e.target.value)} style={{ flex: 1 }}>
                  <option value="all">📢 All Staff (Broadcast)</option>
                  {users.filter(u => u.uid !== currentUser?.uid).map(u => (
                    <option key={u.uid} value={u.uid}>{u.fullName} — [{u.role}]</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input className="input-field" style={{ flex: 1 }} value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Write a message..." />
                <button type="submit" className="btn btn-primary" disabled={!selectedReceiver || !newMessage.trim()}>
                  <Send size={16} /> Send
                </button>
              </div>
              {currentUser?.role === 'Parent' && (
                <div style={{ marginTop: '0.5rem', textAlign: 'center', fontSize: '0.8rem' }} className="text-muted">
                  Prefer instant chat?{' '}
                  <a href="https://wa.me/233244123456" target="_blank" rel="noopener noreferrer" style={{ color: '#25D366', fontWeight: 600 }}>
                    Connect on WhatsApp 💬
                  </a>
                </div>
              )}
            </form>
          </div>

          {/* Announcements Column */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', minHeight: '520px', maxHeight: 'calc(100vh - 170px)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Megaphone size={20} color="var(--warning)" /> Global School Announcements
            </h3>

            {isAdminOrHead && (
              <form onSubmit={handleSendAnnouncement} style={{ marginBottom: '1.25rem', display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                <input className="input-field" style={{ flex: 1 }} value={newAnnouncement} onChange={e => setNewAnnouncement(e.target.value)} placeholder="Publish new school announcement..." />
                <button type="submit" className="btn btn-secondary" disabled={!newAnnouncement.trim()}>Publish</button>
              </form>
            )}

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.25rem' }}>
              {allAnnouncements.length === 0 ? (
                <p className="text-muted" style={{ padding: '1rem 0' }}>No announcements yet.</p>
              ) : (
                allAnnouncements.map(ann => (
                  <div key={ann.id} style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 'var(--radius-md)', borderLeft: '4px solid var(--warning)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: 700 }}>
                        📢 {ann.authorName || ann.authorRole} ({ann.authorRole})
                      </span>
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{formatTime(ann.timestamp)}</span>
                    </div>
                    <div style={{ fontSize: '0.88rem', lineHeight: 1.5 }}>{ann.content}</div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── Tab: SMS Dispatcher ── */}
      {activeTab === 'sms' && (
        <div className="dashboard-two-col">

          {/* SMS Compose Panel */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 700 }}>
              <PhoneCall size={20} color="var(--accent-primary)" /> Send SMS Alert to Parent / Contact
            </h3>

            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                Quick-fill: Select Student to auto-populate parent's number &amp; message:
              </label>
              <select
                className="input-field"
                value={selectedStudentForSms}
                onChange={e => handleSelectStudentForSms(e.target.value)}
              >
                <option value="">Choose a student…</option>
                {dbGetStudents().map(s => (
                  <option key={s.studentId} value={s.studentId}>
                    {s.fullName} — Balance: GHS {s.currentBalance.toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            <form onSubmit={handleSendDirectSMS} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Parent / Recipient Name:
                </label>
                <input className="input-field" placeholder="e.g. Mr. Prince Awuah" value={smsName} onChange={e => setSmsName(e.target.value)} />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  Phone Number (Ghanaian / International):
                </label>
                <input className="input-field" placeholder="+233241234567" value={smsPhone} onChange={e => setSmsPhone(e.target.value)} required />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                  SMS Message:
                </label>
                <textarea
                  className="input-field"
                  rows={5}
                  placeholder="Type your SMS message here…"
                  value={smsContent}
                  onChange={e => setSmsContent(e.target.value)}
                  required
                  style={{ width: '100%', resize: 'vertical' }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '0.25rem' }}>
                  {smsContent.length} chars · {Math.ceil(smsContent.length / 160) || 1} SMS segment(s)
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }} disabled={!smsPhone || !smsContent.trim()}>
                <Send size={16} /> Dispatch SMS Alert
              </button>
            </form>

            <div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.08)', borderRadius: 'var(--radius-sm)', fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              ℹ️ Clicking <strong>Dispatch SMS Alert</strong> opens your device's native SMS app pre-filled with the message. All dispatched SMS are logged below for audit purposes.
            </div>
          </div>

          {/* SMS Audit Log */}
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '480px', maxHeight: 'calc(100vh - 170px)' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>
              <History size={20} color="var(--success)" /> SMS Dispatch Log ({smsLogs.length})
            </h3>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem', paddingRight: '0.25rem' }}>
              {smsLogs.length === 0 ? (
                <p className="text-muted" style={{ padding: '1rem 0' }}>No SMS messages dispatched yet.</p>
              ) : (
                smsLogs.map(log => (
                  <div
                    key={log.id}
                    style={{
                      background: 'var(--bg-tertiary)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      borderLeft: `4px solid ${smsTypeColor[log.messageType] || '#6366f1'}`,
                      fontSize: '0.82rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <strong>{log.recipientName}</strong>
                      <span style={{
                        padding: '0.15rem 0.55rem',
                        borderRadius: '999px',
                        background: `${smsTypeColor[log.messageType] || '#6366f1'}22`,
                        color: smsTypeColor[log.messageType] || '#6366f1',
                        fontWeight: 700,
                        fontSize: '0.72rem'
                      }}>
                        {log.messageType.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>{log.recipientPhone}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginBottom: '0.4rem' }}>{log.content}</div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Status: <strong style={{ color: '#10b981' }}>{log.status} ✓</strong></span>
                      <span>{formatTime(log.timestamp)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default Messages;

