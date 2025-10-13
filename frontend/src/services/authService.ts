import { fetchApi } from "../utils/api";

interface LoginRequest {
  username: string;
  password: string;
}

interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface LoginResponse {
  token: string;
  refreshToken: string;
  expiresInMs: number;
  refreshExpiresInMs: number;
}

interface RefreshResponse {
  token: string;
  expiresInMs: number;
}

export const AuthService = {

  // LOGOWANIE
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await fetchApi<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    localStorage.setItem('authToken', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('tokenExpiry', String(Date.now() + response.expiresInMs));
    localStorage.setItem('refreshTokenExpiry', String(Date.now() + response.refreshExpiresInMs));
    
    return response;
  },

  // REFRESH TOKEN
  refreshToken: async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    const refreshExpiry = localStorage.getItem('refreshTokenExpiry');
    
    if (!refreshToken || !refreshExpiry || Date.now() >= Number(refreshExpiry)) {
      AuthService.logout();
      return null;
    }

    try {
      const response = await fetchApi<RefreshResponse>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
      
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('tokenExpiry', String(Date.now() + response.expiresInMs));
      
      return response.token;
    } catch (error) {
      AuthService.logout();
      return null;
    }
  },

  // REJESTRACJA
  register: async (userData: RegisterRequest): Promise<void> => {
    await fetchApi<void>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // WYLOGOWYWANIE SIĘ
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('refreshTokenExpiry');
  },

  getToken: (): string | null => {
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (token && expiry && Date.now() < Number(expiry)) {
      return token;
    }
    
    // Token wygasł - spróbuj odświeżyć
    return null;
  },

  isAuthenticated: (): boolean => {
    // Sprawdź czy refresh token jest ważny
    const refreshToken = localStorage.getItem('refreshToken');
    const refreshExpiry = localStorage.getItem('refreshTokenExpiry');
    
    return refreshToken !== null && refreshExpiry !== null && Date.now() < Number(refreshExpiry);
  },
}