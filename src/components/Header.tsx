import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../data/mockData';
import { Menu, Sparkles, LogOut, Shield, Crown, GraduationCap, BookOpen, UserCheck, DollarSign, Users, UserPlus } from 'lucide-react';

interface HeaderProps {
  onToggleMobileMenu: () => void;
  onProfileClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu, onProfileClick }) => {
  const { currentUser, logout } = useAuth();
  // Refresh avatar from localStorage on each render so it shows updated picture
  const avatarUrl = React.useMemo(
    () => {
      try {
        const users = JSON.parse(localStorage.getItem('sh_users') || '[]') as { uid: string; avatar?: string }[];
        return users.find(u => u.uid === currentUser?.uid)?.avatar || '';
      } catch { return ''; }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUser?.uid]
  );

  const getRoleIcon = (role?: User['role']) => {
    switch (role) {
      case 'Admin': return <UserPlus size={16} color="#3b82f6" />;
      case 'Owner': return <Crown size={16} color="#f59e0b" />;
      case 'Headmaster': return <GraduationCap size={16} color="#6366f1" />;
      case 'HOD': return <BookOpen size={16} color="#a855f7" />;
      case 'Teacher': return <UserCheck size={16} color="#22c55e" />;
      case 'Cashier': return <DollarSign size={16} color="#0ea5e9" />;
      case 'Parent': return <Users size={16} color="#ec4899" />;
      default: return <Shield size={16} />;
    }
  };



  return (
    <header className="app-header">
      <div className="header-left">
          <button className="mobile-menu-toggle" onClick={onToggleMobileMenu} title="Toggle Navigation Menu" style={{ marginRight: '0.5rem' }}>
            <Menu size={22} />
          </button>
        <div className="header-branding">
          <Sparkles size={20} className="brand-sparkle" />
          <span className="brand-title">ScholarHub ERP</span>
        </div>
      </div>



      {/* User Badge, Profile & Logout */}
      <div className="header-right">
        {currentUser && (
          <button
            onClick={onProfileClick}
            className="header-avatar-btn"
            title={`View Profile — ${currentUser.fullName}`}
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="avatar" className="header-avatar-img" />
            ) : (
              <div className="header-avatar-initials">
                {currentUser.fullName?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
              </div>
            )}
          </button>
        )}
        {currentUser && (
          <div className="header-user-badge">
            {getRoleIcon(currentUser.role)}
            <div className="user-text">
              <span className="user-name">{currentUser.fullName}</span>
              <span className="user-role">{currentUser.role}</span>
            </div>
          </div>
        )}
        <button onClick={logout} className="header-logout-btn" title="Sign Out">
          <LogOut size={16} />
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
