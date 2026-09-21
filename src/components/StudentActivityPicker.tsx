import React, { useState } from 'react';
import { dbGetStudents } from '../dbAdapter';
import type { Student, User } from '../data/mockData';
import { StudentProfileModal } from './StudentProfileModal';
import { Search, UserCheck, Eye } from 'lucide-react';

interface Props {
  role: User['role'];
  onSelectStudent?: (student: Student) => void;
}

export const StudentActivityPicker: React.FC<Props> = ({ role, onSelectStudent }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [activeStudentModal, setActiveStudentModal] = useState<Student | null>(null);

  const students = dbGetStudents();

  const roleFunctionTitles: Record<string, string> = {
    Teacher: 'Gradebook, Attendance & Subject Performance',
    Cashier: 'Fee Statement, Payments & Receipt Issue',
    HOD: 'Department Academic Standing & Subject Ranking',
    Headmaster: '360° Student Executive Profile & Sign-off Status',
    Owner: 'Financial Clearance & Student Summary',
    Admin: 'Full Administrative File & Enrollment Details'
  };

  const handleSelect = (stId: string) => {
    setSelectedStudentId(stId);
    const st = students.find(s => s.studentId === stId);
    if (st) {
      if (onSelectStudent) {
        onSelectStudent(st);
      }
      setActiveStudentModal(st);
    }
  };

  return (
    <>
      <div className="glass-card" style={{
        padding: '0.85rem 1.25rem',
        marginBottom: '1.25rem',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(168,85,247,0.06))',
        border: '1px solid rgba(99,102,241,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', background: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff'
          }}>
            <UserCheck size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              Pick a Student to View Activities ({role})
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Function view: <strong style={{ color: 'var(--accent-primary)' }}>{roleFunctionTitles[role] || 'Student Activities'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, maxWidth: '400px', minWidth: '240px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <select
              className="input-field"
              value={selectedStudentId}
              onChange={e => handleSelect(e.target.value)}
              style={{ paddingLeft: '2rem', fontSize: '0.82rem', width: '100%', cursor: 'pointer' }}
            >
              <option value="">🔍 Choose student to inspect activities...</option>
              {students.map(s => (
                <option key={s.studentId} value={s.studentId}>
                  {s.fullName} ({s.house}) — Balance: GHS {s.currentBalance.toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {selectedStudentId && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                const st = students.find(s => s.studentId === selectedStudentId);
                if (st) setActiveStudentModal(st);
              }}
              style={{ fontSize: '0.78rem', padding: '0.4rem 0.75rem', whiteSpace: 'nowrap' }}
            >
              <Eye size={14} /> View Details
            </button>
          )}
        </div>
      </div>

      {/* Student Profile & Activity Modal */}
      {activeStudentModal && (
        <StudentProfileModal
          student={activeStudentModal}
          onClose={() => {
            setActiveStudentModal(null);
            setSelectedStudentId('');
          }}
        />
      )}
    </>
  );
};

