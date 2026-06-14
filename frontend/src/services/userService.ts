import apiClient from './apiClient';
import type { ListQuery, PaginatedResult, User, UserRole } from '@/types';

export interface ListUsersQuery extends ListQuery {
  search?: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}

export type UpdateUserPayload = Partial<CreateUserPayload>;

export const userService = {
  list: (params: ListUsersQuery) =>
    apiClient.get<PaginatedResult<User>>('/users', { params }).then((r) => r.data),

  create: (payload: CreateUserPayload) =>
    apiClient.post<User>('/users', payload).then((r) => r.data),

  update: (id: string, payload: UpdateUserPayload) =>
    apiClient.patch<User>(`/users/${id}`, payload).then((r) => r.data),

  remove: (id: string) => apiClient.delete<{ success: boolean }>(`/users/${id}`).then((r) => r.data),
};
