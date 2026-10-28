import React, { createContext, useContext, useState } from 'react';

export interface AuthUser {
  email: string;
  name: string;
  role: string;
  title?: string;
  initials: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, role?: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      // Clear legacy stale persistent users so user starts unauthenticated
      localStorage.removeItem('edusmart_auth_user');
      const saved = sessionStorage.getItem('edusmart_auth_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = !!user;

  const login = async (email: string, role?: string, name?: string) => {
    // Determine name and role based on email or provided params
    let finalName = name || 'Utilisateur Académique';
    let finalRole = role || 'Enseignant';
    let initials = 'UA';

    if (email.includes('admin')) {
      finalName = 'Administrateur Ontologue';
      finalRole = 'Administrateur';
      initials = 'AO';
    } else if (email.includes('prof') || email.includes('sami')) {
      finalName = 'Dr. Sami Trabelsi';
      finalRole = 'Enseignant Chercheur';
      initials = 'ST';
    } else if (email.includes('etudiant') || email.includes('yassine')) {
      finalName = 'Yassine Ben Ali';
      finalRole = 'Étudiant Mastère';
      initials = 'YB';
    }

    const newUser: AuthUser = {
      email,
      name: finalName,
      role: finalRole,
      title: 'Plateforme EduSmart',
      initials,
    };

    setUser(newUser);
    try {
      sessionStorage.setItem('edusmart_auth_session', JSON.stringify(newUser));
    } catch {}
  };

  const logout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem('edusmart_auth_session');
      localStorage.removeItem('edusmart_auth_user');
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
