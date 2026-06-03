import apiClient from './apiClient';
import type {
  EscalationRulesSettings,
  NotificationScheduleSettings,
} from '@/types';

export const settingsService = {
  getNotificationSchedule: () =>
    apiClient
      .get<NotificationScheduleSettings>('/settings/notification-schedule')
      .then((r) => r.data),

  updateNotificationSchedule: (value: NotificationScheduleSettings) =>
    apiClient
      .put<NotificationScheduleSettings>('/settings/notification-schedule', { value })
      .then((r) => r.data),

  getEscalationRules: () =>
    apiClient
      .get<EscalationRulesSettings>('/settings/escalation-rules')
      .then((r) => r.data),

  updateEscalationRules: (value: EscalationRulesSettings) =>
    apiClient
      .put<EscalationRulesSettings>('/settings/escalation-rules', { value })
      .then((r) => r.data),
};
