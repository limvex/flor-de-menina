'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { customerAuthApi } from './api';

export interface CustomerUser {
  id: string;
  email: string;
  name: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
}

interface AuthContextValue {
  user: CustomerUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const data = await customerAuthApi.me();
      setUser(data as CustomerUser);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await customerAuthApi.login({ email, password });
    setUser((data as { user: CustomerUser }).user);
  }, []);

  const register = useCallback(
    async (form: { name: string; email: string; password: string; phone?: string }) => {
      await customerAuthApi.register(form);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await customerAuthApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const loginWithGoogle = useCallback(() => {
    customerAuthApi.getGoogleUrl().then((data: unknown) => {
      const { url } = data as { url: string };
      window.location.href = url;
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, loginWithGoogle, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
