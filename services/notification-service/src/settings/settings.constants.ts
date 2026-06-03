export const SETTING_KEYS = {
  NOTIFICATION_SCHEDULE: 'notification_schedule',
  ESCALATION_RULES: 'escalation_rules',
} as const;

export const DEFAULT_NOTIFICATION_SCHEDULE = {
  expiryDays: [90, 60, 30, 7, 0],
  reminderDays: [30, 15],
  defaultChannel: 'EMAIL',
};

export const DEFAULT_ESCALATION_RULES = {
  warningAfterDays: 60,
  finalWarningAfterDays: 75,
  escalateAfterDays: 90,
};
