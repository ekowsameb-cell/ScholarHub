import React from 'react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../data/mockData';
import Drawer from '@mui/material/Drawer';
import { Home, BarChart2, Users, BookOpen, DollarSign, ClipboardCheck, Award, Sparkles, X, UserCheck, ShieldCheck, UserPlus, Shield, Mail } from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen,
  setMobileOpen
}) => {
  const { currentUser, logout } = useAuth();

  const getMenuItems = (role?: User['role']) => {
    switch (role) {
      case 'Admin':
        return [
          { id: 'admin-students', label: 'Student Enrollment', icon: <UserPlus size={18} /> },
          { id: 'admin-staff', label: 'Staff Directory', icon: <Shield size={18} /> },
          { id: 'admin-overview', label: 'System Overview', icon: <Home size={18} /> },
          { id: 'admin-panel', label: 'Admin Panel', icon: <ShieldCheck size={18} /> },
          { id: 'messages', label: 'Inbox', icon: <Mail size={18} /> }
        ];
      case 'Owner':
        return [
          { id: 'overview', label: 'School Overview', icon: <Home size={18} /> },
          { id: 'revenue', label: 'Financial & Revenue', icon: <DollarSign size={18} /> },
          { id: 'approvals', label: 'Pending Approvals', icon: <ShieldCheck size={18} /> },
          { id: 'staff', label: 'Staff Management', icon: <Users size={18} /> },
          { id: 'messages', label: 'Inbox', icon: <Mail size={18} /> }
        ];
      case 'Headmaster':
        return [
          { id: 'hm-overview', label: 'Executive Summary', icon: <Home size={18} /> },
          { id: 'hm-approvals', label: 'Approval Workflows', icon: <UserCheck size={18} /> },
          { id: 'hm-performance', label: 'School Performance', icon: <BarChart2 size={18} /> },
          { id: 'messages', label: 'Inbox', icon: <Mail size={18} /> }
        ];
      case 'HOD':
        return [
          { id: 'hod-analytics', label: 'Dept Analytics', icon: <BarChart2 size={18} /> },
          { id: 'hod-grades', label: 'Grade Distribution', icon: <Award size={18} /> },
          { id: 'hod-plans', label: 'Lesson Plan Queue', icon: <BookOpen size={18} /> },
          { id: 'messages', label: 'Inbox', icon: <Mail size={18} /> }
        ];
      case 'Teacher':
        return [
          { id: 'teacher-roster', label: 'Class Roster & Attendance', icon: <ClipboardCheck size={18} /> },
          { id: 'teacher-gradebook', label: 'Score Gradebook', icon: <Award size={18} /> },
          { id: 'teacher-aipicker', label: 'AI Lesson Planner', icon: <Sparkles size={18} /> },
          { id: 'messages', label: 'Inbox', icon: <Mail size={18} /> }
        ];
      case 'Cashier':
        return [
          { id: 'cashier-pos', label: 'Fee POS Terminal', icon: <DollarSign size={18} /> },
          { id: 'cashier-transactions', label: 'Transaction Logs', icon: <BarChart2 size={18} /> },
          { id: 'messages', label: 'Inbox', icon: <Mail size={18} /> }
        ];
      case 'Parent':
        return [
          { id: 'parent-wards', label: 'Ward Academic Report', icon: <Award size={18} /> },
          { id: 'parent-fees', label: 'Pay School Fees', icon: <DollarSign size={18} /> },
          { id: 'messages', label: 'Inbox', icon: <Mail size={18} /> }
        ];
      default:
        return [{ id: 'overview', label: 'Overview', icon: <Home size={18} /> }, { id: 'messages', label: 'Inbox', icon: <Mail size={18} /> }];
    }
  };

  const menuItems = getMenuItems(currentUser?.role);


  return (
    <>
      {/* Mobile drawer uses MUI Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }} // Better open performance on mobile.
        sx={{
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            borderRight: '1px solid var(--glass-border)',
            backgroundColor: 'var(--bg-primary)',
          },
          display: { xs: 'block', md: 'block' },
        }}
      >
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Sparkles size={20} color="#fff" />
            </div>
            <span>ScholarHub</span>
          </div>
          <button
            className="mobile-close-btn"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Navigation Menu */}
        <div className="sidebar-menu">
          <div className="sidebar-section-title">Navigation Menu</div>
          {menuItems.map(item => (
            <button
              key={item.id}
              className={`sidebar-link ${currentTab === item.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentTab(item.id);
                setMobileOpen(false);
              }}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* User Profile Card at Sidebar Bottom */}
        {currentUser && (
          <div className="sidebar-profile">
            <div className="sidebar-avatar">
              {currentUser.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{currentUser.fullName}</div>
              <div className="sidebar-user-role">{currentUser.role}</div>
            </div>
            <button
              onClick={logout}
              className="sidebar-logout-btn"
              title="Sign Out"
            >
              Logout
            </button>
          </div>
        )}
      </Drawer>
    </>
  );
};

export default Sidebar;
