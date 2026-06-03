import apiClient from './apiClient';
import type { ComplianceCase, ComplianceFilters, PaginatedResult } from '@/types';

export interface CreateCompliancePayload {
  customerId: string;
  extinguisherId: string;
  caseStatus?: ComplianceCase['caseStatus'];
  notes?: string;
}

export type UpdateCompliancePayload = Partial<
  Pick<ComplianceCase, 'caseStatus' | 'notes'>
>;

export const complianceService = {
  list: (params: ComplianceFilters) =>
    apiClient
      .get<PaginatedResult<ComplianceCase>>('/compliance/cases', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<ComplianceCase>(`/compliance/cases/${id}`).then((r) => r.data),

  create: (payload: CreateCompliancePayload) =>
    apiClient.post<ComplianceCase>('/compliance/cases', payload).then((r) => r.data),

  update: (id: string, payload: UpdateCompliancePayload) =>
    apiClient
      .patch<ComplianceCase>(`/compliance/cases/${id}`, payload)
      .then((r) => r.data),

  close: (id: string, notes?: string) =>
    apiClient
      .post<ComplianceCase>(`/compliance/cases/${id}/close`, { notes })
      .then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/compliance/cases/${id}`).then((r) => r.data),
};
