import apiClient from './apiClient';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types';

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export const authService = {
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data),

  getMe: () => apiClient.get<User>('/users/me').then((r) => r.data),

  updateProfile: (payload: UpdateProfilePayload) =>
    apiClient.patch<User>('/users/me', payload).then((r) => r.data),

  changePassword: (payload: ChangePasswordPayload) =>
    apiClient.post<{ success: boolean }>('/users/me/change-password', payload).then((r) => r.data),
};
