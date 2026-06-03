import apiClient from './apiClient';
import type {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types';

/**
 * AUTH SERVICE
 * 
 * API methods for user authentication and profile management.
 * 
 * ENDPOINTS:
 * - login: Authenticate user with email/password
 * - register: Create new user account
 * - logout: Invalidate refresh token
 * - getMe: Fetch current authenticated user profile
 * - updateProfile: Update user name/email
 * - changePassword: Change user password with current password verification
 */

// ── Type definitions ──────────────────────────────────────────────────────────

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ── Service methods ───────────────────────────────────────────────────────────

export const authService = {
  /**
   * Authenticate user with email and password
   * Returns access token, refresh token, and user profile
   */
  login: (payload: LoginPayload) =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  /**
   * Register new user account
   * Returns access token, refresh token, and user profile
   */
  register: (payload: RegisterPayload) =>
    apiClient.post<AuthResponse>('/auth/register', payload).then((r) => r.data),

  /**
   * Logout user by invalidating refresh token
   */
  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refreshToken }).then((r) => r.data),

  /**
   * Fetch current authenticated user profile
   */
  getMe: () => apiClient.get<User>('/users/me').then((r) => r.data),

  /**
   * Update current user profile (name, email)
   */
  updateProfile: (payload: UpdateProfilePayload) =>
    apiClient.patch<User>('/users/me', payload).then((r) => r.data),

  /**
   * Change user password (requires current password verification)
   */
  changePassword: (payload: ChangePasswordPayload) =>
    apiClient.post<{ success: boolean }>('/users/me/change-password', payload).then((r) => r.data),
};
