import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types/user.types';
import { apiService } from '@/services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      await apiService.auth.logout();
    } finally {
      localStorage.removeItem('accessToken');
      setUser(null);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiService.auth.login(email, password);
    localStorage.setItem('accessToken', res.accessToken);
    setUser(res.user);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      setIsLoading(false);
      return;
    }

    apiService.auth
      .me()
      .then((userData) => {
        setUser({
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role as 'admin' | 'ops',
        });
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}