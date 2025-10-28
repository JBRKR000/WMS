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

interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isFirst: boolean;
  isLast: boolean;
  hasNext: boolean;
  hasPrevious: boolean;
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

  getAllUsersPaginated: async (page: number = 0, size: number = 10): Promise<PageResponse<User>> => {
    return await fetchApi<PageResponse<User>>(`/users/paginated?page=${page}&size=${size}`, {
      method: 'GET',
    });
  },

  getUserById: async (id: number): Promise<User> => {
    return await fetchApi<User>(`/users/${id}`, {
      method: 'GET',
    });
  },

  updateUser: async (id: number, userData: Partial<RegisterRequest>): Promise<User> => {
    return await fetchApi<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  updateUserRole: async (id: number, roleName: string): Promise<User> => {
    return await fetchApi<User>(`/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ roleName }),
    });
  },

  updateUserData: async (id: number, userData: { username: string; email: string; firstName: string; lastName: string }): Promise<User> => {
    return await fetchApi<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id: number): Promise<void> => {
    await fetchApi<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};