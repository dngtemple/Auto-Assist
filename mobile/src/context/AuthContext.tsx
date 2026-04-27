import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export type UserRole = 'CAR_OWNER' | 'MECHANIC' | 'ADMIN';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatar?: string | null;
  isOnline?: boolean;
  specialization?: string;
  rating?: number;
  totalJobs?: number;
  isApproved?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  specialization?: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({ user: null, token: null, isLoading: true });

  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setState({ user: null, token: null, isLoading: false });
    }, 8000);

    (async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        console.log('[Auth] token found:', !!token);
        if (token) {
          const { data } = await api.get('/users/me');
          clearTimeout(safetyTimer);
          setState({ user: data, token, isLoading: false });
        } else {
          clearTimeout(safetyTimer);
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch (e) {
        console.log('[Auth] startup error:', e);
        try { await AsyncStorage.removeItem('token'); } catch {}
        clearTimeout(safetyTimer);
        setState({ user: null, token: null, isLoading: false });
      }
    })();

    return () => clearTimeout(safetyTimer);
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    await AsyncStorage.setItem('token', data.token);
    setState({ user: data.user, token: data.token, isLoading: false });
  };

  const signup = async (signupData: SignupData) => {
    const { data } = await api.post('/auth/signup', signupData);
    await AsyncStorage.setItem('token', data.token);
    setState({ user: data.user, token: data.token, isLoading: false });
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    setState({ user: null, token: null, isLoading: false });
  };

  const updateUser = (updates: Partial<User>) => {
    setState((s) => ({ ...s, user: s.user ? { ...s.user, ...updates } : null }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
