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
    localStorage.setItem('tokenExpiry', String(Date.now() + response.expiresInMs));
    
    return response;
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
    localStorage.removeItem('tokenExpiry');
  },

  getToken: (): string | null => {
    const token = localStorage.getItem('authToken');
    const expiry = localStorage.getItem('tokenExpiry');
    
    if (token && expiry && Date.now() < Number(expiry)) {
      return token;
    }
    
    // Token wygasł
    AuthService.logout();
    return null;
  },

  isAuthenticated: (): boolean => {
    return AuthService.getToken() !== null;
  },
}