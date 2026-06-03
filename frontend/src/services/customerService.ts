import apiClient from './apiClient';
import type { Customer, ListQuery, PaginatedResult } from '@/types';

export interface CreateCustomerPayload {
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

export const customerService = {
  list: (params: ListQuery) =>
    apiClient
      .get<PaginatedResult<Customer>>('/customers', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    apiClient.get<Customer>(`/customers/${id}`).then((r) => r.data),

  create: (payload: CreateCustomerPayload) =>
    apiClient.post<Customer>('/customers', payload).then((r) => r.data),

  update: (id: string, payload: UpdateCustomerPayload) =>
    apiClient.patch<Customer>(`/customers/${id}`, payload).then((r) => r.data),

  remove: (id: string) =>
    apiClient.delete(`/customers/${id}`).then((r) => r.data),
};
