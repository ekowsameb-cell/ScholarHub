// src/components/RoleSwitcher.tsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import type { User } from '../data/mockData';
import { ChevronUp } from 'lucide-react';

export const RoleSwitcher: React.FC = () => {
  const { users, switchUserByRole, currentUser } = useAuth();
  const [open, setOpen] = useState(false);

  const handleSelect = (role: User['role']) => {
    switchUserByRole(role);
    setOpen(false);
  };

  return (
    <div className="role-switcher-container">
      <button
        className="role-switcher-btn"
        onClick={() => setOpen(!open)}
        title="Switch User Role"
      >
        {currentUser?.role?.charAt(0).toUpperCase() || 'U'}
      </button>
      {open && (
        <div className="role-switcher-menu">
          {users.map(u => (
            <div
              key={u.uid}
              className={`role-switcher-item ${currentUser?.uid === u.uid ? 'active' : ''}`}
              onClick={() => handleSelect(u.role)}
            >
              <span>{u.fullName} ({u.role})</span>
              {currentUser?.uid === u.uid && <ChevronUp size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
