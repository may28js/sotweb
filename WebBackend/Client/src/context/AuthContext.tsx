'use client';

import React, { createContext, useState, useEffect, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { jwtDecode } from 'jwt-decode';
import api from '@/lib/api';

interface User {
  id: string;
  username: string;
  email: string;
  accessLevel: number;
  points: number;
}

interface AuthContextType {
  user: User | null;
  login: (token: string) => void;
  logout: () => void;
  updatePoints: (points: number) => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseUser = (decoded: any): User => {
  return {
    id: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.nameid || decoded.sub,
    username: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.unique_name || decoded.name,
    email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email,
    accessLevel: parseInt(decoded.AccessLevel || '0'),
    points: parseInt(decoded.Points || '0'),
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          // Check if token is expired
          if (decoded.exp * 1000 < Date.now()) {
            logout();
          } else {
            // Initial load from token
            setUser(parseUser(decoded));

            // Fetch latest data from server
            try {
              const { data } = await api.get('/Auth/me');
              if (data) {
                setUser({
                    id: data.id?.toString() || decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || decoded.nameid,
                    username: data.username,
                    email: data.email,
                    accessLevel: data.accessLevel,
                    points: data.points
                });
              }
            } catch (apiError) {
              console.error("Failed to fetch fresh user data", apiError);
            }
          }
        } catch (error) {
          console.error("Invalid token:", error);
          localStorage.removeItem('token');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (token: string) => {
    localStorage.setItem('token', token);
    const decoded: any = jwtDecode(token);
    setUser(parseUser(decoded));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/'); // Redirect to home on logout
  };

  const updatePoints = (points: number) => {
    if (user) {
      setUser({ ...user, points });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updatePoints, isLoading }}>
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