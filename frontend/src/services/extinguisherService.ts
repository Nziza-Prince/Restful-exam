import apiClient from './apiClient';
import type {
  ExtinguisherInspection,
  ExtinguisherFilters,
  FireExtinguisher,
  InspectionStatus,
  MaintenanceLog,
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

export interface UpdateInspectionPayload {
  status?: InspectionStatus;
  notes?: string;
}

export interface SubmitInspectionReportPayload {
  condition: string;
  notes?: string;
  actionsTaken: string;
  result: string;
  inspectionDate: string;
}

export interface AdminReviewInspectionPayload {
  status: Extract<InspectionStatus, 'APPROVED' | 'REJECTED' | 'REQUIRES_MAINTENANCE'>;
  notes?: string;
}

export interface LogMaintenancePayload {
  actionsTaken: string;
  actionDate: string;
  conditionsNoted: string;
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

  listInspections: (params: { page?: number; limit?: number; status?: InspectionStatus } = {}) =>
    apiClient
      .get<PaginatedResult<ExtinguisherInspection>>('/extinguishers/inspections', { params })
      .then((r) => r.data),

  updateInspection: (id: string, payload: UpdateInspectionPayload) =>
    apiClient
      .patch<ExtinguisherInspection>(`/extinguishers/inspections/${id}`, payload)
      .then((r) => r.data),

  startInspection: (id: string) =>
    apiClient
      .patch<ExtinguisherInspection>(`/extinguishers/inspections/${id}/start`)
      .then((r) => r.data),

  submitInspectionReport: (id: string, payload: SubmitInspectionReportPayload) =>
    apiClient
      .post<ExtinguisherInspection>(`/extinguishers/inspections/${id}/report`, payload)
      .then((r) => r.data),

  reviewInspection: (id: string, payload: AdminReviewInspectionPayload) =>
    apiClient
      .patch<ExtinguisherInspection>(`/extinguishers/inspections/${id}/review`, payload)
      .then((r) => r.data),

  logMaintenance: (id: string, payload: LogMaintenancePayload) =>
    apiClient.post<MaintenanceLog>(`/extinguishers/${id}/maintenance`, payload).then((r) => r.data),

  listMaintenance: (id: string, params: { page?: number; limit?: number } = {}) =>
    apiClient
      .get<PaginatedResult<MaintenanceLog>>(`/extinguishers/${id}/maintenance`, { params })
      .then((r) => r.data),

  listAllMaintenance: (params: { page?: number; limit?: number } = {}) =>
    apiClient
      .get<PaginatedResult<MaintenanceLog>>('/extinguishers/maintenance', { params })
      .then((r) => r.data),
};
