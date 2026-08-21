import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  dbGetSubjects, dbUpdateSubject, dbDeleteSubject, 
  dbGetClasses, dbUpdateClass, dbDeleteClass, 
  dbGetUsers, dbGetAssignments, dbUpdateAssignment, dbDeleteAssignment
} from '../dbAdapter';
import type { Assignment } from '../dbAdapter';
import type { Subject, Class, User } from '../data/mockData';
import { BookOpen, School, Plus, Trash2, ShieldAlert } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { currentUser } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'subjects' | 'classes' | 'assignments'>('subjects');
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  
  const teachers = users.filter(u => u.role === 'Teacher');

  // Load Data
  const loadData = () => {
    setSubjects(dbGetSubjects());
    setClasses(dbGetClasses());
    setUsers(dbGetUsers());
    setAssignments(dbGetAssignments());
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Subjects State ---
  const [newSubject, setNewSubject] = useState({ name: '', classId: '', teacherId: '' });
  
  // --- Classes State ---
  const [newClass, setNewClass] = useState({ name: '', capacity: 30, classTeacherId: '' });
  
  // --- Assignments State ---
  const [newAssignment, setNewAssignment] = useState({ subjectId: '', classId: '', teacherId: '' });

  // Security check
  if (currentUser?.role !== 'Admin') {
    return (
      <div className="animate-fade-in dashboard-two-col">
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
          <ShieldAlert size={48} color="var(--warning)" style={{ marginBottom: '1rem' }} />
          <h2>Access Denied</h2>
          <p className="text-muted">Only administrators can access this panel.</p>
        </div>
      </div>
    );
  }

  // --- Handlers ---
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.name) return;
    dbUpdateSubject({
      subjectId: `sub-${Date.now()}`,
      name: newSubject.name,
      classId: newSubject.classId,
      teacherId: newSubject.teacherId
    });
    setNewSubject({ name: '', classId: '', teacherId: '' });
    loadData();
  };

  const handleDeleteSubject = (id: string) => {
    if (window.confirm('Delete subject? Assignments for this subject will be soft-deleted.')) {
      dbDeleteSubject(id);
      loadData();
    }
  };

  const handleAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClass.name) return;
    dbUpdateClass({
      classId: `cls-${Date.now()}`,
      name: newClass.name,
      capacity: newClass.capacity,
      classTeacherId: newClass.classTeacherId,
      subjects: []
    });
    setNewClass({ name: '', capacity: 30, classTeacherId: '' });
    loadData();
  };

  const handleDeleteClass = (id: string) => {
    if (window.confirm('Delete class? Assignments for this class will be soft-deleted.')) {
      dbDeleteClass(id);
      loadData();
    }
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignment.subjectId || !newAssignment.classId) return;
    dbUpdateAssignment({
      assignmentId: `ass-${Date.now()}`,
      subjectId: newAssignment.subjectId,
      classId: newAssignment.classId,
      teacherId: newAssignment.teacherId,
      active: true,
      createdAt: new Date().toISOString()
    });
    setNewAssignment({ subjectId: '', classId: '', teacherId: '' });
    loadData();
  };

  const handleDeleteAssignment = (id: string) => {
    if (window.confirm('Delete assignment?')) {
      dbDeleteAssignment(id);
      loadData();
    }
  };
  
  const handleToggleAssignmentStatus = (ass: Assignment) => {
    dbUpdateAssignment({ ...ass, active: !ass.active });
    loadData();
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '0.25rem' }}>Admin Panel</h1>
        <p className="text-muted" style={{ fontSize: '0.85rem' }}>Manage Subjects, Classes, and Assignments</p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('subjects')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'subjects' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          Subjects
        </button>
        <button 
          onClick={() => setActiveTab('classes')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'classes' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          Classes
        </button>
        <button 
          onClick={() => setActiveTab('assignments')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, color: activeTab === 'assignments' ? 'var(--accent-primary)' : 'var(--text-muted)' }}
        >
          Assignments
        </button>
      </div>

      {/* Content */}
      <div className="dashboard-two-col">
        {/* Left Col: List */}
        <div className="glass-card" style={{ padding: '1.5rem' }}>
          {activeTab === 'subjects' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={18} /> Subjects</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {subjects.map(s => (
                  <div key={s.subjectId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Class: {classes.find(c => c.classId === s.classId)?.name || 'None'} | Teacher: {users.find(u => u.uid === s.teacherId)?.fullName || 'None'}</div>
                    </div>
                    <button onClick={() => handleDeleteSubject(s.subjectId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
                {subjects.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No subjects found.</p>}
              </div>
            </>
          )}

          {activeTab === 'classes' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><School size={18} /> Classes</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {classes.map(c => (
                  <div key={c.classId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Capacity: {c.capacity} | Teacher: {users.find(u => u.uid === c.classTeacherId)?.fullName || 'None'}</div>
                    </div>
                    <button onClick={() => handleDeleteClass(c.classId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                  </div>
                ))}
                {classes.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No classes found.</p>}
              </div>
            </>
          )}

          {activeTab === 'assignments' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><BookOpen size={18} /> Assignments</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {assignments.map(a => (
                  <div key={a.assignmentId} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)', opacity: a.active ? 1 : 0.5 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {subjects.find(s => s.subjectId === a.subjectId)?.name || 'Unknown Subject'} &rarr; {classes.find(c => c.classId === a.classId)?.name || 'Unknown Class'}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                        Teacher: {users.find(u => u.uid === a.teacherId)?.fullName || 'None'} | {a.active ? 'Active' : 'Inactive'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => handleToggleAssignmentStatus(a)} style={{ background: 'none', border: 'none', color: a.active ? 'var(--warning)' : 'var(--success)', cursor: 'pointer', fontSize: '0.75rem' }}>{a.active ? 'Disable' : 'Enable'}</button>
                      <button onClick={() => handleDeleteAssignment(a.assignmentId)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  </div>
                ))}
                {assignments.length === 0 && <p className="text-muted" style={{ fontSize: '0.85rem' }}>No assignments found.</p>}
              </div>
            </>
          )}
        </div>

        {/* Right Col: Forms */}
        <div className="glass-card" style={{ padding: '1.5rem', alignSelf: 'flex-start' }}>
          {activeTab === 'subjects' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}><Plus size={16} style={{ verticalAlign: 'middle' }} /> Add Subject</h3>
              <form onSubmit={handleAddSubject} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subject Name</label>
                  <input className="input-field" value={newSubject.name} onChange={e => setNewSubject({...newSubject, name: e.target.value})} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Default Class</label>
                  <select className="input-field" value={newSubject.classId} onChange={e => setNewSubject({...newSubject, classId: e.target.value})}>
                    <option value="">None</option>
                    {classes.map(c => <option key={c.classId} value={c.classId}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Default Teacher</label>
                  <select className="input-field" value={newSubject.teacherId} onChange={e => setNewSubject({...newSubject, teacherId: e.target.value})}>
                    <option value="">None</option>
                    {teachers.map(t => <option key={t.uid} value={t.uid}>{t.fullName}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Save Subject</button>
              </form>
            </>
          )}

          {activeTab === 'classes' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}><Plus size={16} style={{ verticalAlign: 'middle' }} /> Add Class</h3>
              <form onSubmit={handleAddClass} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Class Name</label>
                  <input className="input-field" value={newClass.name} onChange={e => setNewClass({...newClass, name: e.target.value})} required />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Capacity</label>
                  <input type="number" className="input-field" value={newClass.capacity} onChange={e => setNewClass({...newClass, capacity: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Class Teacher</label>
                  <select className="input-field" value={newClass.classTeacherId} onChange={e => setNewClass({...newClass, classTeacherId: e.target.value})}>
                    <option value="">None</option>
                    {teachers.map(t => <option key={t.uid} value={t.uid}>{t.fullName}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Save Class</button>
              </form>
            </>
          )}

          {activeTab === 'assignments' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}><Plus size={16} style={{ verticalAlign: 'middle' }} /> Assign Subject to Class</h3>
              <form onSubmit={handleAddAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Subject</label>
                  <select className="input-field" value={newAssignment.subjectId} onChange={e => setNewAssignment({...newAssignment, subjectId: e.target.value})} required>
                    <option value="">Select Subject...</option>
                    {subjects.map(s => <option key={s.subjectId} value={s.subjectId}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Class</label>
                  <select className="input-field" value={newAssignment.classId} onChange={e => setNewAssignment({...newAssignment, classId: e.target.value})} required>
                    <option value="">Select Class...</option>
                    {classes.map(c => <option key={c.classId} value={c.classId}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Teacher (Optional Override)</label>
                  <select className="input-field" value={newAssignment.teacherId} onChange={e => setNewAssignment({...newAssignment, teacherId: e.target.value})}>
                    <option value="">Default (or None)</option>
                    {teachers.map(t => <option key={t.uid} value={t.uid}>{t.fullName}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>Create Assignment</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
