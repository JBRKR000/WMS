import { fetchApi } from "../utils/api";

interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt?: string;
  updatedAt?: string;
}

export const UserService = {
  async registerUser(userData: RegisterRequest): Promise<any> {
    await fetchApi<void>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  getAllUsers: async (): Promise<User[]> => {
    return await fetchApi<User[]>('/users', {
      method: 'GET',
    });
  },

  getUserById: async (id: number): Promise<User> => {
    return await fetchApi<User>(`/users/${id}`, {
      method: 'GET',
    });
  },

  // Aktualizacja użytkownika
  updateUser: async (id: number, userData: Partial<RegisterRequest>): Promise<User> => {
    return await fetchApi<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  // Usunięcie użytkownika
  deleteUser: async (id: number): Promise<void> => {
    await fetchApi<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};