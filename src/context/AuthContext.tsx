import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../data/mockData';
import { dbGetUsers, dbUpdateUser } from '../dbAdapter';

interface AuthContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  login: (uid: string) => boolean;
  logout: () => void;
  switchUserByRole: (role: User['role']) => void;
  users: User[];
  refreshUsers: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const refreshUsers = () => {
    setUsers(dbGetUsers());
  };

  useEffect(() => {
    refreshUsers();
    // Default login as Owner for easy preview
    const allUsers = dbGetUsers();
    const defaultUser = allUsers.find(u => u.role === 'Owner') || allUsers[0];
    if (defaultUser) {
      setCurrentUser(defaultUser);
    }
  }, []);

  const login = (uid: string): boolean => {
    const allUsers = dbGetUsers();
    const user = allUsers.find(u => u.uid === uid);
    if (user && user.isActive) {
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const switchUserByRole = (role: User['role']) => {
    const allUsers = dbGetUsers();
    let user = allUsers.find(u => u.role === role);
    if (!user) {
      user = {
        uid: `u-${role.toLowerCase()}-default`,
        fullName: `${role} Account`,
        role: role,
        phone: '+233200000000',
        isActive: true,
        email: `${role.toLowerCase()}@scholarhub.edu.gh`
      };
      dbUpdateUser(user);
      setUsers(dbGetUsers());
    }
    setCurrentUser(user);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      setCurrentUser,
      login,
      logout,
      switchUserByRole,
      users,
      refreshUsers
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
