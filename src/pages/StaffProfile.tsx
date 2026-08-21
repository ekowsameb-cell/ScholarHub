import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { dbGetUsers, dbGetSubjects, dbGetClasses } from '../dbAdapter';
import type { User } from '../data/mockData';
import { ProfilePictureUploader } from '../components/ProfilePictureUploader';
import {
  User as UserIcon, Mail, Phone, Shield, BookOpen,
  Building2, CheckCircle, XCircle, Calendar
} from 'lucide-react';

const InfoRow: React.FC<{ icon: React.ReactNode; label: string; value: string | React.ReactNode }> = ({ icon, label, value }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    padding: '0.85rem 1rem',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.87rem'
  }}>
    <div style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>{icon}</div>
    <div style={{ color: 'var(--text-muted)', minWidth: '120px', fontWeight: 600 }}>{label}</div>
    <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{value}</div>
  </div>
);

export const StaffProfile: React.FC = () => {
  const { currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [avatarKey, setAvatarKey] = useState(0);

  const reload = () => {
    const u = dbGetUsers().find(u => u.uid === currentUser?.uid);
    setProfile(u || null);
  };

  useEffect(() => { reload(); }, [currentUser?.uid]);

  if (!profile) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '200px' }}>
      <p className="text-muted">Loading profile…</p>
    </div>
  );

  const subjects = dbGetSubjects();
  const classes = dbGetClasses();
  const assignedSubject = profile.subjectId ? subjects.find(s => s.subjectId === profile.subjectId) : null;
  const assignedClass = assignedSubject ? classes.find(c => c.classId === assignedSubject.classId) : null;

  const roleColors: Record<string, string> = {
    Admin: '#3b82f6', Owner: '#f59e0b', Headmaster: '#6366f1',
    HOD: '#a855f7', Teacher: '#22c55e', Cashier: '#0ea5e9', Parent: '#ec4899'
  };
  const roleColor = roleColors[profile.role] || '#6366f1';

  return (
    <div className="animate-fade-in" style={{ maxWidth: '760px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div className="glass-card" style={{
        padding: '2rem',
        background: `linear-gradient(135deg, rgba(99,102,241,0.15), rgba(168,85,247,0.08))`,
        border: '1px solid rgba(99,102,241,0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Avatar uploader — only editable field */}
          <ProfilePictureUploader
            key={avatarKey}
            onUploaded={() => { reload(); setAvatarKey(k => k + 1); }}
          />

          {/* Name & Role */}
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>
              {profile.fullName}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{
                padding: '0.3rem 0.9rem',
                borderRadius: '999px',
                background: `${roleColor}22`,
                border: `1px solid ${roleColor}55`,
                color: roleColor,
                fontWeight: 700,
                fontSize: '0.82rem'
              }}>
                {profile.role}
              </span>
              <span style={{
                padding: '0.3rem 0.9rem',
                borderRadius: '999px',
                background: profile.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                border: `1px solid ${profile.isActive ? '#10b981' : '#ef4444'}55`,
                color: profile.isActive ? '#10b981' : '#ef4444',
                fontWeight: 700,
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}>
                {profile.isActive
                  ? <><CheckCircle size={13} /> Active</>
                  : <><XCircle size={13} /> Inactive</>
                }
              </span>
            </div>
            <p className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
              Staff ID: <code style={{ color: 'var(--accent-primary)' }}>{profile.uid}</code>
            </p>
          </div>
        </div>
      </div>

      {/* Contact & Employment Details */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <UserIcon size={18} color="var(--accent-primary)" /> Staff Details
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400 }}>
            ✏️ Profile picture is the only editable field
          </span>
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <InfoRow icon={<UserIcon size={16} />} label="Full Name" value={profile.fullName} />
          <InfoRow icon={<Mail size={16} />} label="Email" value={profile.email || '—'} />
          <InfoRow icon={<Phone size={16} />} label="Phone" value={profile.phone || '—'} />
          <InfoRow icon={<Shield size={16} />} label="Role" value={profile.role} />
          {profile.departmentId && (
            <InfoRow icon={<Building2 size={16} />} label="Department" value={profile.departmentId} />
          )}
          {assignedSubject && (
            <InfoRow icon={<BookOpen size={16} />} label="Teaching Subject" value={assignedSubject.name} />
          )}
          {assignedClass && (
            <InfoRow icon={<Calendar size={16} />} label="Assigned Class" value={assignedClass.name} />
          )}
          <InfoRow
            icon={profile.isActive ? <CheckCircle size={16} color="#10b981" /> : <XCircle size={16} color="#ef4444" />}
            label="Account Status"
            value={
              <span style={{ color: profile.isActive ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                {profile.isActive ? 'Active' : 'Pending Activation'}
              </span>
            }
          />
        </div>
      </div>

      {/* Read-only notice */}
      <div style={{
        padding: '0.85rem 1rem',
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        🔒 To update your personal details, please contact the Admin or submit a request to your Headmaster.
      </div>
    </div>
  );
};

export default StaffProfile;

