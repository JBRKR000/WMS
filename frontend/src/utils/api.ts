export const API_BASE_URL = 'http://localhost:8080/api';

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('authToken');
  
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
      localStorage.removeItem('authToken');
      localStorage.removeItem('tokenExpiry');
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