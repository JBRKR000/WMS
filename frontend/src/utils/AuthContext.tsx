import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    AuthService.isAuthenticated()
  );

  useEffect(() => {
    setIsAuthenticated(AuthService.isAuthenticated());
  }, []);

  const login = async (username: string, password: string) => {
    await AuthService.login({ username, password });
    setIsAuthenticated(true);
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
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};