import apiClient from './apiClient';
import type { Notification, NotificationFilters, PaginatedResult } from '@/types';

export const notificationService = {
  listAll: (params: NotificationFilters) =>
    apiClient
      .get<PaginatedResult<Notification>>('/notifications', { params })
      .then((r) => r.data),

  listMine: (params: NotificationFilters) =>
    apiClient
      .get<PaginatedResult<Notification>>('/notifications/me', { params })
      .then((r) => r.data),

  markRead: (id: string, isAdmin: boolean) =>
    apiClient
      .patch<Notification>(
        isAdmin ? `/notifications/admin/${id}/read` : `/notifications/${id}/read`,
      )
      .then((r) => r.data),
};
