import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';

import { toast } from 'sonner';
import api from '../lib/api';

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  hub_id?: string;
  phone?: string;
  profile_image?: string;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('accessToken');

    if (savedToken) {
      setToken(savedToken);

      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${savedToken}`;

      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const { data } = await api.get('/auth/me');

      setUser(data.user || data.data?.user || null);
    } catch (error: any) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data } = await api.post('/auth/login', {
        email,
        password,
      });

      const accessToken =
        data.accessToken || data.token || data.data?.accessToken;

      const userData =
        data.user || data.data?.user;

      if (!accessToken) {
        throw new Error('Access token missing');
      }

      localStorage.setItem('accessToken', accessToken);

      setToken(accessToken);
      setUser(userData);

      api.defaults.headers.common[
        'Authorization'
      ] = `Bearer ${accessToken}`;

      toast.success('Login successful!');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Invalid credentials or server error';

      toast.error(errorMessage);

      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');

    setToken(null);
    setUser(null);

    delete api.defaults.headers.common[
      'Authorization'
    ];

    api.post('/auth/logout').catch(() => {});

    toast.success('Logged out successfully');

    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return context;
};
