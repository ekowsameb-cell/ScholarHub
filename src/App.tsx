import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import { DashboardAdmin } from './pages/DashboardAdmin';
import { DashboardOwner } from './pages/DashboardOwner';
import { DashboardHeadmaster } from './pages/DashboardHeadmaster';
import { DashboardHOD } from './pages/DashboardHOD';
import { DashboardTeacher } from './pages/DashboardTeacher';
import { DashboardCashier } from './pages/DashboardCashier';
import { DashboardParent } from './pages/DashboardParent';
import { StaffProfile } from './pages/StaffProfile';
import { Messages } from './pages/Messages';
import { AdminPanel } from './pages/AdminPanel';
import { Sparkles, Key, LogIn } from 'lucide-react';
import OfflineBanner from './components/OfflineBanner';

const AppContent: React.FC = () => {
  const { currentUser, login, users } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');
  const [selectedLoginUid, setSelectedLoginUid] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  // Sync tab selection when role changes
  useEffect(() => {
    if (!currentUser) return;
    switch (currentUser.role) {
      case 'Admin':
        setCurrentTab('admin-students');
        break;
      case 'Owner':
        setCurrentTab('overview');
        break;
      case 'Headmaster':
        setCurrentTab('hm-overview');
        break;
      case 'HOD':
        setCurrentTab('hod-analytics');
        break;
      case 'Teacher':
        setCurrentTab('teacher-roster');
        break;
      case 'Cashier':
        setCurrentTab('cashier-pos');
        break;
      case 'Parent':
        setCurrentTab('parent-wards');
        break;
    }
  }, [currentUser?.role]);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLoginUid) {
      login(selectedLoginUid);
    }
  };

  // Render Login UI if not authenticated
  if (!currentUser) {
    return (
      <div 
        style={{ 
          margin: 'auto', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '460px'
        }}
      >
        <div className="glass-card animate-fade-in" style={{ width: '100%', padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)',
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Sparkles size={32} color="#fff" />
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800 }}>ScholarHub ERP</h2>
            <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>West African School Management System</p>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                Select Role Account to Sign In:
              </label>
              <select
                className="input-field"
                value={selectedLoginUid}
                onChange={e => setSelectedLoginUid(e.target.value)}
                style={{ background: 'var(--bg-primary)' }}
                required
              >
                <option value="">Choose Profile...</option>
                {users.map(u => (
                  <option key={u.uid} value={u.uid}>{u.fullName} — [{u.role}]</option>
                ))}
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
              <LogIn size={18} /> Sign In
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <p style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Key size={14} /> Offline-First simulated credentials initialized.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Dashboard based on role tab
  const renderDashboardContent = () => {
    // Profile page is available for ALL roles
    if (currentTab === 'profile') return <StaffProfile />;
    if (currentTab === 'messages') return <Messages />;
    if (currentTab === 'admin-panel') return <AdminPanel />;

    switch (currentUser.role) {
      case 'Admin':
        return <DashboardAdmin tab={currentTab} />;
      case 'Owner':
        return <DashboardOwner tab={currentTab} />;
      case 'Headmaster':
        return <DashboardHeadmaster tab={currentTab} />;
      case 'HOD':
        return <DashboardHOD tab={currentTab} />;
      case 'Teacher':
        return <DashboardTeacher tab={currentTab} />;
      case 'Cashier':
        return <DashboardCashier tab={currentTab} />;
      case 'Parent':
        return <DashboardParent tab={currentTab} />;
      default:
        return <div>Role unauthorized or tab not configured.</div>;
    }
  };

  return (
    <div className="app-container">
      <OfflineBanner />
      <Header onToggleMobileMenu={() => setMobileOpen(prev => !prev)} onProfileClick={() => setCurrentTab('profile')} />
      <div className="app-layout">
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main className="main-content">
          {renderDashboardContent()}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
