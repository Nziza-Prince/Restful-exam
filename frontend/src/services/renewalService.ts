import apiClient from './apiClient';
import type {
  PaginatedResult,
  RenewalFilters,
  RenewalRequest,
  RenewalRequestType,
} from '@/types';

export interface CreateRenewalPayload {
  extinguisherId: string;
  requestType: RenewalRequestType;
  description?: string;
}

export interface CompleteRenewalPayload {
  newExpiryDate: string;
}

export interface RejectRenewalPayload {
  reason?: string;
}

export const renewalService = {
  listAll: (params: RenewalFilters) =>
    apiClient
      .get<PaginatedResult<RenewalRequest>>('/renewals', { params })
      .then((r) => r.data),

  listMine: (params: RenewalFilters) =>
    apiClient
      .get<PaginatedResult<RenewalRequest>>('/renewals/mine', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<RenewalRequest>(`/renewals/${id}`).then((r) => r.data),

  create: (payload: CreateRenewalPayload) =>
    apiClient.post<RenewalRequest>('/renewals', payload).then((r) => r.data),

  approve: (id: string) =>
    apiClient.patch<RenewalRequest>(`/renewals/${id}/approve`).then((r) => r.data),

  reject: (id: string, payload: RejectRenewalPayload) =>
    apiClient
      .patch<RenewalRequest>(`/renewals/${id}/reject`, payload)
      .then((r) => r.data),

  complete: (id: string, payload: CompleteRenewalPayload) =>
    apiClient
      .patch<RenewalRequest>(`/renewals/${id}/complete`, payload)
      .then((r) => r.data),
};
