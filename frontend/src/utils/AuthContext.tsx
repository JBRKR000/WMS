import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import { fetchApi } from './api';
import { AuthService } from '../services/authService';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (userData: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => Promise<void>;
  logout: () => void;
  username: string | null;
  isAdmin: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initUser = async () => {
      try {
        const authenticated = AuthService.isAuthenticated();
        console.log('AuthProvider: checking authentication, authenticated:', authenticated);
        setIsAuthenticated(authenticated);

        if (authenticated) {
          let token = AuthService.getToken();
          if (!token) {
            token = await AuthService.refreshToken();
          }

          if (token) {
            try {
              type JwtPayload = { userId: number };
              const decoded = jwtDecode<JwtPayload>(token);
              const userId = decoded.userId;

              const user = await fetchApi<{ username: string }>(`/users/${userId}`);
              setUsername(user.username);

              const admin = await fetchApi<boolean>(`/users/isAdmin/${userId}`);
              setIsAdmin(admin);
            } catch (error) {
              console.error('Error fetching user data:', error);
              logout();
            }
          } else {
            logout();
          }
        } else {
          setUsername(null);
          setIsAdmin(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initUser();
  }, []);

  const login = async (username: string, password: string) => {
    await AuthService.login({ username, password });
    setIsAuthenticated(true);

    const token = AuthService.getToken();
    if (token) {
      try {
        type JwtPayload = { userId: number };
        const decoded = jwtDecode<JwtPayload>(token);
        const userId = decoded.userId;

        const user = await fetchApi<{ username: string }>(`/users/${userId}`);
        setUsername(user.username);

        const admin = await fetchApi<boolean>(`/users/isAdmin/${userId}`);
        setIsAdmin(admin);
      } catch (error) {
        console.error('Error fetching user data after login:', error);
      }
    }
  };

  const register = async (userData: {
    username: string;
    password: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }) => {
    await AuthService.register(userData);
    await login(userData.username, userData.password);
  };

  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUsername(null);
    setIsAdmin(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, username, login, register, logout, isAdmin, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};