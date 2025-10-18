import { AuthService } from '../services/authService';

export const API_BASE_URL = 'http://localhost:8080/api';

let isRefreshing = false;
let refreshQueue: Array<{ resolve: (token: string | null) => void }> = [];

// Flaga aby trackować czy jesteśmy w środku refresh attempt
let refreshInProgress = false;

/**
 * Wykonaj queued requesty po udanym refresh
 */
function processQueue(token: string | null) {
  refreshQueue.forEach(item => item.resolve(token));
  refreshQueue = [];
}

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (AuthService.isTokenExpiringSoon() && !isRefreshing && AuthService.isAuthenticated()) {
    isRefreshing = true;
    refreshInProgress = true;
    try {
      await AuthService.refreshToken();
    } finally {
      isRefreshing = false;
      refreshInProgress = false;
    }
  }

  let token = AuthService.getToken();
  
  if (!token && AuthService.isAuthenticated() && !refreshInProgress) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshInProgress = true;
      try {
        token = await AuthService.refreshToken();
      } finally {
        isRefreshing = false;
        refreshInProgress = false;
        processQueue(token);
      }
    } else {
      token = await new Promise(resolve => {
        refreshQueue.push({ resolve });
      });
    }
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && AuthService.isAuthenticated() && !endpoint.includes('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshInProgress = true;
      try {
        const newToken = await AuthService.refreshToken();
        isRefreshing = false;
        refreshInProgress = false;
        processQueue(newToken);
        
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
        } else {
          AuthService.logout();
          window.location.href = '/auth';
          throw new Error('Session expired');
        }
      } catch (error) {
        isRefreshing = false;
        refreshInProgress = false;
        processQueue(null);
        AuthService.logout();
        window.location.href = '/auth';
        throw error;
      }
    } else {
      // Czekaj na refresh z innego request'u
      const newToken = await new Promise(resolve => {
        refreshQueue.push({ resolve });
      });
      
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } else {
        AuthService.logout();
        window.location.href = '/auth';
        throw new Error('Session expired');
      }
    }
  }

  if (!response.ok) {
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