import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios';
import type { AuthResponse } from '@/types';
import { tokenStorage } from '@/utils/storage';

/**
 * API CLIENT
 * 
 * Centralized Axios instance for all API requests to the backend gateway.
 * 
 * FEATURES:
 * - Automatic JWT token attachment to requests
 * - Automatic token refresh on 401 errors
 * - Error message extraction and formatting
 * - Request/response interceptors for auth handling
 * 
 * FLOW:
 * 1. Request interceptor: Attaches access token from storage
 * 2. On 401 error: Attempts to refresh token using refresh token
 * 3. If refresh succeeds: Retries original request with new token
 * 4. If refresh fails: Clears tokens and dispatches logout event
 */

// ── Configuration ─────────────────────────────────────────────────────────────
const baseURL = import.meta.env.VITE_API_URL || '/api';

// ── Refresh promise cache (prevents multiple concurrent refresh calls) ────────
let refreshPromise: Promise<string | null> | null = null;

// ── Create Axios instance ─────────────────────────────────────────────────────
export const apiClient: AxiosInstance = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * REQUEST INTERCEPTOR
 * Attaches JWT access token to every outgoing request
 */
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Refresh access token using stored refresh token
 * - Calls /auth/refresh endpoint with refresh token
 * - Stores new tokens on success
 * - Clears tokens and returns null on failure
 */
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<AuthResponse>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } },
    );
    tokenStorage.setAccessToken(data.accessToken);
    tokenStorage.setRefreshToken(data.refreshToken);
    return data.accessToken;
  } catch {
    tokenStorage.clear();
    return null;
  }
}

/**
 * RESPONSE INTERCEPTOR
 * Handles 401 errors by attempting token refresh
 * - On 401 error: Attempts to refresh access token
 * - If refresh succeeds: Retries original request with new token
 * - If refresh fails: Dispatches logout event to clear app state
 * - Uses promise caching to prevent multiple concurrent refresh calls
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ message?: string | string[] }>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      // Use cached refresh promise to prevent multiple simultaneous refresh calls
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }

      const newToken = await refreshPromise;
      if (newToken) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      }

      // Refresh failed - dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    const message = extractErrorMessage(error);
    return Promise.reject(new Error(message));
  },
);

/**
 * Extract human-readable error message from API error response
 * - Handles string or array message formats
 * - Falls back to generic message if no specific error provided
 */
function extractErrorMessage(error: AxiosError<{ message?: string | string[] }>) {
  const data = error.response?.data;
  if (data?.message) {
    return Array.isArray(data.message) ? data.message.join(', ') : data.message;
  }
  if (error.message) return error.message;
  return 'An unexpected error occurred';
}

export default apiClient;
