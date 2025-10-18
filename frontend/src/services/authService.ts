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

// Flaga aby uniknąć wielokrotnych requestów refresh jednocześnie
let isRefreshingToken = false;
let refreshPromise: Promise<string | null> | null = null;

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

  // REFRESH TOKEN - pobiera nowy access token z backendu
  refreshToken: async (): Promise<string | null> => {
    const refreshToken = localStorage.getItem('refreshToken');
    const refreshExpiry = localStorage.getItem('refreshTokenExpiry');
    
    // 1. Sprawdź czy refresh token wygasł
    if (!refreshToken || !refreshExpiry || Date.now() >= Number(refreshExpiry)) {
      console.warn('Refresh token expired or missing');
      AuthService.logout();
      return null;
    }

    // 2. Jeśli już trwa refresh, czekaj na wynik zamiast requestować ponownie
    if (isRefreshingToken && refreshPromise) {
      return refreshPromise;
    }

    isRefreshingToken = true;
    try {
      // 3. Wyślij refresh token na backend aby uzyskać nowy access token
      refreshPromise = (async () => {
        try {
          const response = await fetch('http://localhost:8080/api/auth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            console.error('Refresh token request failed:', response.status);
            AuthService.logout();
            return null;
          }

          const data = await response.json() as RefreshResponse;
          
          // 4. Zapisz nowy access token
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('tokenExpiry', String(Date.now() + data.expiresInMs));
          
          return data.token;
        } catch (error) {
          console.error('Error refreshing token:', error);
          AuthService.logout();
          return null;
        }
      })();

      const result = await refreshPromise;
      return result;
    } finally {
      isRefreshingToken = false;
      refreshPromise = null;
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
    isRefreshingToken = false;
    refreshPromise = null;
  },

  // Zwróć token jeśli jest ważny, ALBO null jeśli wygasł
  getToken: (): string | null => {
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (token && expiry && Date.now() < Number(expiry)) {
      return token;
    }
    
    return null;
  },

  isTokenExpiringSoon: (): boolean => {
    const expiry = localStorage.getItem('tokenExpiry');
    if (!expiry) return true;
    
    const timeUntilExpiry = Number(expiry) - Date.now();
    return timeUntilExpiry < 60000;
  },

  isAuthenticated: (): boolean => {
    const refreshToken = localStorage.getItem('refreshToken');
    const refreshExpiry = localStorage.getItem('refreshTokenExpiry');
    
    return refreshToken !== null && refreshExpiry !== null && Date.now() < Number(refreshExpiry);
  },
}