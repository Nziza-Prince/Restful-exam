import apiClient from './apiClient';
import type { Customer, ListQuery, PaginatedResult } from '@/types';

/**
 * CUSTOMER SERVICE
 * 
 * API methods for managing customer/user accounts (admin operations).
 * 
 * FEATURES:
 * - List customers with pagination and search
 * - Create new customer accounts
 * - Update customer details
 * - Delete customer accounts
 * - Get single customer by ID
 * 
 * ACCESS:
 * - Admin-only endpoints (requires ADMIN role)
 */

// ── Type definitions ──────────────────────────────────────────────────────────

export interface CreateCustomerPayload {
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
}

export type UpdateCustomerPayload = Partial<CreateCustomerPayload>;

// ── Service methods ───────────────────────────────────────────────────────────

export const customerService = {
  /**
   * List all customers with pagination
   * - Supports search, filtering, and pagination
   * - Returns paginated result with metadata
   */
  list: (params: ListQuery) =>
    apiClient
      .get<PaginatedResult<Customer>>('/customers', { params })
      .then((r) => r.data),

  /**
   * Fetch single customer by ID
   */
  getById: (id: string) =>
    apiClient.get<Customer>(`/customers/${id}`).then((r) => r.data),

  /**
   * Create new customer account
   * - Requires: full name, national ID, phone, email, address
   */
  create: (payload: CreateCustomerPayload) =>
    apiClient.post<Customer>('/customers', payload).then((r) => r.data),

  /**
   * Update existing customer
   * - Partial update (only provided fields are updated)
   */
  update: (id: string, payload: UpdateCustomerPayload) =>
    apiClient.patch<Customer>(`/customers/${id}`, payload).then((r) => r.data),

  /**
   * Delete customer account
   * - Removes customer and unassigns their extinguishers
   */
  remove: (id: string) =>
    apiClient.delete(`/customers/${id}`).then((r) => r.data),
};
