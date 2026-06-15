import { api } from './client';
import type { User, LoginResponse, RegisterResponse } from '../types';

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login/', { username, password }),

  register: (data: {
    username: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    role?: string;
  }) => api.post<RegisterResponse>('/auth/register/', data),

  logout: (refresh: string) =>
    api.post<void>('/auth/logout/', { refresh }),

  me: () => api.get<User>('/auth/me/'),

  updateProfile: (data: { first_name?: string; last_name?: string; phone?: string }) =>
    api.patch<User>('/auth/me/', data),
};
