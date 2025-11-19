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
  role: string | null;
  isAdmin: boolean;
  isProduction: boolean;
  isWarehouse: boolean;
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
  const [role, setRole] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isProduction, setIsProduction] = useState<boolean>(false);
  const [isWarehouse, setIsWarehouse] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const determineRoleFlags = (userRole: string) => {
    setIsAdmin(userRole === 'ROLE_ADMIN');
    setIsProduction(userRole === 'ROLE_PRODUCTION');
    setIsWarehouse(userRole === 'ROLE_WAREHOUSE');
  };

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

              const user = await fetchApi<{ 
                username: string;
                role: { roleName: string } | string;
              }>(`/users/${userId}`);
              
              setUsername(user.username);

              // Obsługujemy zarówno role jako string jak i jako obiekt
              const userRole = typeof user.role === 'string' 
                ? user.role 
                : user.role?.roleName || 'ROLE_USER';
              
              setRole(userRole);
              determineRoleFlags(userRole);
            } catch (error) {
              console.error('Error fetching user data:', error);
              logout();
            }
          } else {
            logout();
          }
        } else {
          setUsername(null);
          setRole(null);
          setIsAdmin(false);
          setIsProduction(false);
          setIsWarehouse(false);
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

        const user = await fetchApi<{ 
          username: string;
          role: { roleName: string } | string;
        }>(`/users/${userId}`);
        
        setUsername(user.username);

        const userRole = typeof user.role === 'string' 
          ? user.role 
          : user.role?.roleName || 'ROLE_USER';
        
        setRole(userRole);
        determineRoleFlags(userRole);
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
    setRole(null);
    setIsAdmin(false);
    setIsProduction(false);
    setIsWarehouse(false);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        isAuthenticated, 
        username, 
        role,
        login, 
        register, 
        logout, 
        isAdmin,
        isProduction,
        isWarehouse,
        isLoading 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};