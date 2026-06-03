import apiClient from './apiClient';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types';

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data),

  getMe: () => apiClient.get<User>('/users/me').then((r) => r.data),
};
