import apiClient from './apiClient';
import type { DashboardSummary, ReportFormat, ReportType } from '@/types';

export interface ReportQuery {
  format?: ReportFormat;
  customerId?: string;
  from?: string;
  to?: string;
  days?: string;
}

export const reportService = {
  getDashboardSummary: (params?: ReportQuery) =>
    apiClient
      .get<DashboardSummary>('/reports/dashboard-summary', { params })
      .then((r) => r.data),

  downloadReport: async (type: ReportType, params: ReportQuery) => {
    const response = await apiClient.get(`/reports/${type}`, {
      params: { ...params, format: params.format ?? 'csv' },
      responseType: 'blob',
    });

    const disposition = response.headers['content-disposition'] as string | undefined;
    const filenameMatch = disposition?.match(/filename="(.+)"/);
    const filename =
      filenameMatch?.[1] ??
      `${type}.${params.format ?? 'csv'}`;

    return { blob: response.data as Blob, filename };
  },
};
