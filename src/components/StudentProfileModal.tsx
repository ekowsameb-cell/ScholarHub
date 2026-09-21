import React, { useState } from 'react';
import {
  dbGetClasses, dbGetUsers, dbGetGrades, dbGetSubjects,
  dbGetAttendance, dbGetTransactions
} from '../dbAdapter';
import type { Student } from '../data/mockData';
import { sendSMS, sendFeeReminderSMS } from '../services/smsService';
import {
  X, User as UserIcon, BookOpen, ClipboardCheck, DollarSign,
  Shield, Award, Calendar, CheckCircle2
} from 'lucide-react';

interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'academics' | 'attendance' | 'fees'>('overview');
  const [toast, setToast] = useState<string | null>(null);

  // Load related data
  const classes = dbGetClasses();
  const users = dbGetUsers();
  const grades = dbGetGrades().filter(g => g.studentId === student.studentId);
  const subjects = dbGetSubjects();
  const attendanceRecords = dbGetAttendance();
  const transactions = dbGetTransactions().filter(t => t.studentId === student.studentId);

  const studentClass = classes.find(c => c.classId === student.classId);
  const parent = users.find(u => u.uid === student.parentId || u.role === 'Parent');
  const classTeacher = studentClass ? users.find(u => u.uid === studentClass.classTeacherId) : null;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  // Compute attendance stats
  let totalClassDays = 0;
  let presentDays = 0;
  attendanceRecords.forEach(att => {
    if (att.records && att.records[student.studentId]) {
      totalClassDays++;
      if (att.records[student.studentId] === 'Present' || att.records[student.studentId] === 'Late') {
        presentDays++;
      }
    }
  });

  const calculatedAttendanceRate = totalClassDays > 0
    ? ((presentDays / totalClassDays) * 100).toFixed(1)
    : student.attendanceRate.toFixed(1);

  // House Colors
  const houseColors: Record<string, { bg: string; border: string; text: string }> = {
    'Red House': { bg: 'rgba(239, 68, 68, 0.15)', border: '#ef4444', text: '#ef4444' },
    'Blue House': { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#3b82f6' },
    'Yellow House': { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#f59e0b' },
    'Green House': { bg: 'rgba(34, 197, 94, 0.15)', border: '#22c55e', text: '#22c55e' }
  };
  const houseStyle = houseColors[student.house] || { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#6366f1' };

  const handleSendSMSAlert = async () => {
    const parentPhone = parent?.phone || student.parentContact || '+233241234567';
    const parentName = parent?.fullName || 'Parent';
    if (student.currentBalance > 0) {
      await sendFeeReminderSMS({
        studentName: student.fullName,
        parentName,
        parentPhone,
        balance: student.currentBalance
      });
      showToast(`📲 Fee reminder SMS dispatched to ${parentPhone}`);
    } else {
      await sendSMS({
        recipientPhone: parentPhone,
        recipientName: parentName,
        messageType: 'Direct_Message',
        content: `ScholarHub ERP: Dear ${parentName}, your ward ${student.fullName} has an attendance rate of ${calculatedAttendanceRate}%. Thank you!`
      });
      showToast(`📲 Performance SMS dispatched to ${parentPhone}`);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(5px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem'
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%', maxWidth: '780px', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
      }}>

        {/* Modal Header */}
        <div style={{
          padding: '1.25rem 1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.1))',
          borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, color: '#fff'
            }}>
              {student.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{student.fullName}</h2>
                <span style={{
                  padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700,
                  background: houseStyle.bg, color: houseStyle.text, border: `1px solid ${houseStyle.border}55`
                }}>
                  {student.house}
                </span>
              </div>
              <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.15rem' }}>
                Student ID: <code style={{ color: 'var(--accent-primary)' }}>{student.studentId}</code> · Class: <strong>{studentClass?.name || student.classId}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.4rem' }}
          >
            <X size={22} />
          </button>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div style={{
            padding: '0.6rem 1rem', background: 'rgba(16,185,129,0.2)', borderBottom: '1px solid var(--success)',
            color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem'
          }}>
            <CheckCircle2 size={16} /> {toast}
          </div>
        )}

        {/* Modal Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--glass-border)', background: 'var(--bg-secondary)' }}>
          {[
            { id: 'overview', label: 'Overview', icon: <UserIcon size={16} /> },
            { id: 'academics', label: 'Grades & WASSCE', icon: <Award size={16} /> },
            { id: 'attendance', label: 'Attendance', icon: <ClipboardCheck size={16} /> },
            { id: 'fees', label: 'Fee Statement', icon: <DollarSign size={16} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                flex: 1, padding: '0.75rem 0.5rem', background: 'none', border: 'none',
                borderBottom: `3px solid ${activeTab === tab.id ? 'var(--accent-primary)' : 'transparent'}`,
                color: activeTab === tab.id ? 'var(--accent-primary)' : 'var(--text-muted)',
                fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.82rem',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem'
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="dashboard-grid">
                <div className="glass-card stat-card" style={{ padding: '1rem' }}>
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}><BookOpen size={18} color="#fff" /></div>
                  <div>
                    <div className="stat-label">Assigned Class</div>
                    <div className="stat-value" style={{ fontSize: '1rem' }}>{studentClass?.name || 'N/A'}</div>
                  </div>
                </div>
                <div className="glass-card stat-card" style={{ padding: '1rem' }}>
                  <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}><ClipboardCheck size={18} color="#fff" /></div>
                  <div>
                    <div className="stat-label">Attendance Rate</div>
                    <div className="stat-value" style={{ fontSize: '1rem' }}>{calculatedAttendanceRate}%</div>
                  </div>
                </div>
                <div className="glass-card stat-card" style={{ padding: '1rem' }}>
                  <div className="stat-icon" style={{ background: student.currentBalance > 0 ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)' }}>
                    <DollarSign size={18} color="#fff" />
                  </div>
                  <div>
                    <div className="stat-label">Fee Balance</div>
                    <div className="stat-value" style={{ fontSize: '1rem', color: student.currentBalance > 0 ? '#ef4444' : '#10b981' }}>
                      GHS {student.currentBalance.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Details List */}
              <div className="glass-card" style={{ padding: '1.25rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Shield size={16} color="var(--accent-primary)" /> Parent & Guardian Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Guardian / Parent Name</div>
                    <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{parent?.fullName || 'Mr. Prince Awuah'}</div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Contact Phone</div>
                    <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{parent?.phone || student.parentContact || '+233241234567'}</div>
                  </div>
                  <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Class Form Teacher</div>
                    <div style={{ fontWeight: 600, marginTop: '0.2rem' }}>{classTeacher?.fullName || 'Mr. Joseph Lamptey'}</div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <a
                    href={`https://wa.me/${(parent?.phone || student.whatsappNumber || '+233241234567').replace(/\+/g, '')}?text=${encodeURIComponent(`Hello ${parent?.fullName || 'Parent'}, regarding student ${student.fullName}:`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.5rem 0.9rem', background: '#25D366', color: '#fff',
                      borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.8rem'
                    }}
                  >
                    💬 WhatsApp Parent
                  </a>
                  <button
                    onClick={handleSendSMSAlert}
                    className="btn btn-secondary"
                    style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem' }}
                  >
                    📲 Dispatch SMS Alert
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC GRADES */}
          {activeTab === 'academics' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Term 1 Academic Performance & WAEC Grading</h4>
                <span className="badge badge-info">{grades.length} Subjects Evaluated</span>
              </div>

              {grades.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                  No academic grades recorded for this student yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                        <th style={{ padding: '0.65rem 0.85rem' }}>Subject</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>CA 1 (30)</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>CA 2 (20)</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>Exam (50)</th>
                        <th style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>Total Score</th>
                        <th style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>WAEC Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map(g => {
                        const sub = subjects.find(s => s.subjectId === g.subjectId);
                        return (
                          <tr key={g.gradeId} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                            <td style={{ padding: '0.65rem 0.85rem', fontWeight: 600 }}>{sub?.name || g.subjectId}</td>
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>{g.ca1}</td>
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>{g.ca2}</td>
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center' }}>{g.exam}</td>
                            <td style={{ padding: '0.65rem 0.5rem', textAlign: 'center', fontWeight: 700, color: 'var(--accent-primary)' }}>{g.total}%</td>
                            <td style={{ padding: '0.65rem 0.85rem', textAlign: 'center' }}>
                              <span style={{
                                padding: '0.2rem 0.6rem', borderRadius: '999px', fontWeight: 800, fontSize: '0.78rem',
                                background: g.total >= 70 ? 'rgba(34,197,94,0.15)' : g.total >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                                color: g.total >= 70 ? '#22c55e' : g.total >= 50 ? '#f59e0b' : '#ef4444',
                                border: `1px solid ${g.total >= 70 ? '#22c55e' : g.total >= 50 ? '#f59e0b' : '#ef4444'}55`
                              }}>
                                {g.grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{calculatedAttendanceRate}%</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Overall Term Attendance</div>
                </div>
                <div>
                  <span className="badge badge-success" style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}>
                    {presentDays} Days Present out of {totalClassDays || 1} Sessions
                  </span>
                </div>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginTop: '0.5rem' }}>Daily Attendance History</h4>
              {attendanceRecords.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>No daily attendance records logged yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {attendanceRecords.map(att => {
                    const stStatus = att.records ? att.records[student.studentId] : null;
                    if (!stStatus) return null;
                    return (
                      <div key={att.date} style={{
                        padding: '0.65rem 0.85rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <Calendar size={15} color="var(--text-muted)" />
                          <span>{att.date}</span>
                        </div>
                        <span style={{
                          fontWeight: 700, fontSize: '0.78rem', padding: '0.15rem 0.55rem', borderRadius: '999px',
                          background: stStatus === 'Present' ? 'rgba(34,197,94,0.15)' : stStatus === 'Late' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                          color: stStatus === 'Present' ? '#22c55e' : stStatus === 'Late' ? '#f59e0b' : '#ef4444'
                        }}>
                          {stStatus}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FEE STATEMENT */}
          {activeTab === 'fees' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="glass-card" style={{
                padding: '1.25rem', background: student.currentBalance > 0 ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
                border: `1px solid ${student.currentBalance > 0 ? '#ef4444' : '#22c55e'}55`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
                <div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Current Outstanding Fee Balance</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: student.currentBalance > 0 ? '#ef4444' : '#22c55e' }}>
                    GHS {student.currentBalance.toFixed(2)}
                  </div>
                </div>
                <button
                  onClick={handleSendSMSAlert}
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem' }}
                >
                  📲 Send SMS Reminder
                </button>
              </div>

              <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>Fee Transaction &amp; Payment History</h4>
              {transactions.length === 0 ? (
                <p className="text-muted" style={{ fontSize: '0.85rem' }}>No payment receipts recorded yet for this student.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {transactions.map(tx => (
                    <div key={tx.transactionId} style={{
                      padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.83rem'
                    }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{tx.itemsPaidFor}</div>
                        <div className="text-muted" style={{ fontSize: '0.75rem', fontFamily: 'monospace' }}>
                          Receipt: {tx.receiptNumber} · {new Date(tx.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, color: '#22c55e' }}>GHS {tx.amountPaid.toFixed(2)}</div>
                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{tx.paymentMethod}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '0.85rem 1.5rem', background: 'var(--bg-secondary)', borderTop: '1px solid var(--glass-border)',
          display: 'flex', justifyContent: 'flex-end', gap: '0.5rem'
        }}>
          <button className="btn btn-secondary" onClick={onClose}>Close Profile</button>
        </div>

      </div>
    </div>
  );
};

