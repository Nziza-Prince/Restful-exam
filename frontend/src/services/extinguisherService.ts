import apiClient from './apiClient';
import type {
  ExtinguisherFilters,
  FireExtinguisher,
  PaginatedResult,
} from '@/types';

export interface CreateExtinguisherPayload {
  serialNumber: string;
  type: string;
  location: string;
  size: string;
  installationDate: string;
  expiryDate: string;
  status?: FireExtinguisher['status'];
  customerId?: string;
}

export type UpdateExtinguisherPayload = Partial<
  CreateExtinguisherPayload & { status: FireExtinguisher['status'] }
>;

export interface ScheduleInspectionPayload {
  scheduledAt: string;
  notes?: string;
}

export const extinguisherService = {
  listAll: (params: ExtinguisherFilters) =>
    apiClient
      .get<PaginatedResult<FireExtinguisher>>('/extinguishers', { params })
      .then((r) => r.data),

  listMine: (params: ExtinguisherFilters) =>
    apiClient
      .get<PaginatedResult<FireExtinguisher>>('/extinguishers/mine', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<FireExtinguisher>(`/extinguishers/${id}`).then((r) => r.data),

  create: (payload: CreateExtinguisherPayload) =>
    apiClient.post<FireExtinguisher>('/extinguishers', payload).then((r) => r.data),

  update: (id: string, payload: UpdateExtinguisherPayload) =>
    apiClient.patch<FireExtinguisher>(`/extinguishers/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/extinguishers/${id}`).then((r) => r.data),

  buy: (id: string) =>
    apiClient.patch<FireExtinguisher>(`/extinguishers/${id}/buy`).then((r) => r.data),

  assign: (id: string, customerId: string) =>
    apiClient
      .patch<FireExtinguisher>(`/extinguishers/${id}/assign`, { customerId })
      .then((r) => r.data),

  scheduleInspection: (id: string, payload: ScheduleInspectionPayload) =>
    apiClient.post(`/extinguishers/${id}/inspections`, payload).then((r) => r.data),
};
