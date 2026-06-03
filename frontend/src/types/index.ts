export type UserRole = 'admin' | 'customer' | 'technician';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role?: UserRole;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface Customer {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  address: string;
  createdAt: string;
  updatedAt: string;
}

export type ExtinguisherStatus =
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'EXPIRED'
  | 'RENEWED';

export interface FireExtinguisher {
  id: string;
  serialNumber: string;
  type: string;
  capacity: string;
  purchaseDate: string;
  expiryDate: string;
  status: ExtinguisherStatus;
  customerId: string;
  createdAt: string;
  updatedAt: string;
}

export type RenewalRequestType = 'SERVICE' | 'REPLACEMENT' | 'INSPECTION';
export type RenewalRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'COMPLETED';

export interface RenewalRequest {
  id: string;
  customerId: string;
  extinguisherId: string;
  requestType: RenewalRequestType;
  status: RenewalRequestStatus;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CaseStatus =
  | 'OPEN'
  | 'WARNING_SENT'
  | 'FINAL_WARNING'
  | 'ESCALATED'
  | 'CLOSED';

export interface ComplianceCase {
  id: string;
  customerId: string;
  extinguisherId: string;
  caseStatus: CaseStatus;
  closedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  customerId: string;
  extinguisherId: string;
  message: string;
  type: string;
  channel: string;
  status: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface DashboardSummary {
  charts: {
    expiredCount: number;
    expiringSoonCount: number;
    complianceIssues: number;
    pendingRenewals: number;
    recentNotifications: number;
  };
  breakdown: {
    expiredByMonth: Record<string, number>;
    expiringByDays: Record<string, number>;
    complianceByStatus: Record<string, number>;
  };
  generatedAt: string;
}

export type ReportFormat = 'pdf' | 'xlsx' | 'csv';

export type ReportType =
  | 'expired-extinguishers'
  | 'expiring-soon'
  | 'customer-compliance'
  | 'renewal-requests'
  | 'notifications';

export interface ApiError {
  message: string;
  statusCode?: number;
}

export interface NotificationScheduleSettings {
  expiryDays: number[];
  reminderDays: number[];
  defaultChannel: string;
}

export interface EscalationRulesSettings {
  warningAfterDays: number;
  finalWarningAfterDays: number;
  escalateAfterDays: number;
}

export interface ListQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ExtinguisherFilters extends ListQuery {
  status?: ExtinguisherStatus;
  customerId?: string;
  expiryFrom?: string;
  expiryTo?: string;
}

export interface RenewalFilters extends ListQuery {
  status?: RenewalRequestStatus;
  requestType?: RenewalRequestType;
  customerId?: string;
}

export interface ComplianceFilters extends ListQuery {
  caseStatus?: CaseStatus;
  customerId?: string;
}

export interface NotificationFilters extends ListQuery {
  status?: string;
  type?: string;
}
