import { AuthService } from '../services/authService';

export const API_BASE_URL = 'http://localhost:8080/api';

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  let token = AuthService.getToken();
  
  // Jeśli token wygasł, spróbuj odświeżyć
  if (!token && AuthService.isAuthenticated()) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = AuthService.refreshToken();
    }
    
    if (refreshPromise) {
      token = await refreshPromise;
      isRefreshing = false;
      refreshPromise = null;
    }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      if (!isRefreshing && AuthService.isAuthenticated()) {
        isRefreshing = true;
        const newToken = await AuthService.refreshToken();
        isRefreshing = false;
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
          if (retryResponse.ok) {
            const responseText = await retryResponse.text();
            return responseText.trim() ? JSON.parse(responseText) : {} as T;
          }
        }
      }
      AuthService.logout();
      window.location.href = '/auth';
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const responseText = await response.text();
  
  if (!responseText.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(responseText);
  } catch (parseError) {
    console.warn('Response is not valid JSON:', responseText);
    throw new Error('Invalid JSON response from server');
  }
}