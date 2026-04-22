'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';
import type { User, AuthTokens, LoginInput, RegisterInput } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to check if JWT token is expired
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch (error) {
    return true; // If we can't decode it, consider it expired
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    // Load user from localStorage on mount and validate token
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('access_token');
    
    if (storedUser && token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        // Token expired, clear everything
        logout();
      } else {
        setUser(JSON.parse(storedUser));
      }
    }
    setLoading(false);
  }, []);

  // Set up global 401 handler
  useEffect(() => {
    const handleUnauthorized = (event: CustomEvent) => {
      logout();
      // Redirect to login page
      window.location.href = '/login';
    };

    window.addEventListener('auth:unauthorized' as any, handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized' as any, handleUnauthorized);
    };
  }, []);

  const login = async (input: LoginInput) => {
    const response = await api.post<{ user: User; tokens: AuthTokens }>('/api/auth/login', input);
    const { user, tokens } = response.data;
    
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const register = async (input: RegisterInput) => {
    const response = await api.post<{ user: User; tokens: AuthTokens }>('/api/auth/register', input);
    const { user, tokens } = response.data;
    
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
