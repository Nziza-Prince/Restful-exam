import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { settingsService } from '@/services/settingsService';
import type { EscalationRulesSettings, NotificationScheduleSettings } from '@/types';

export function SettingsPage() {
  const [schedule, setSchedule] = useState<NotificationScheduleSettings>({
    expiryDays: [90, 60, 30, 7, 0],
    reminderDays: [30, 15],
    defaultChannel: 'EMAIL',
  });
  const [rules, setRules] = useState<EscalationRulesSettings>({
    warningAfterDays: 60,
    finalWarningAfterDays: 75,
    escalateAfterDays: 90,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'schedule' | 'rules' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [scheduleData, rulesData] = await Promise.all([
          settingsService.getNotificationSchedule(),
          settingsService.getEscalationRules(),
        ]);
        setSchedule({
          expiryDays: scheduleData.expiryDays ?? [90, 60, 30, 7, 0],
          reminderDays: scheduleData.reminderDays ?? [30, 15],
          defaultChannel: scheduleData.defaultChannel ?? 'EMAIL',
        });
        setRules({
          warningAfterDays: rulesData.warningAfterDays ?? 60,
          finalWarningAfterDays: rulesData.finalWarningAfterDays ?? 75,
          escalateAfterDays: rulesData.escalateAfterDays ?? 90,
        });
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveSchedule = async () => {
    setSaving('schedule');
    setError(null);
    try {
      await settingsService.updateNotificationSchedule(schedule);
      setMessage('Notification schedule saved');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(null);
    }
  };

  const saveRules = async () => {
    setSaving('rules');
    setError(null);
    try {
      await settingsService.updateEscalationRules(rules);
      setMessage('Escalation rules saved');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p className="text-sm italic text-zinc-400">Loading settings…</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Settings"
        description="Configure notification schedules and compliance escalation rules"
      />

      {message && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Notification Schedule" description="Days before expiry to send alerts">
          <div className="space-y-3">
            <Input
              label="Expiry alert days (comma-separated)"
              value={schedule.expiryDays.join(', ')}
              onChange={(e) =>
                setSchedule({
                  ...schedule,
                  expiryDays: e.target.value.split(',').map((v) => Number(v.trim())).filter(Boolean),
                })
              }
            />
            <Input
              label="Reminder days (comma-separated)"
              value={schedule.reminderDays.join(', ')}
              onChange={(e) =>
                setSchedule({
                  ...schedule,
                  reminderDays: e.target.value.split(',').map((v) => Number(v.trim())).filter(Boolean),
                })
              }
            />
            <Input
              label="Default channel"
              value={schedule.defaultChannel}
              onChange={(e) => setSchedule({ ...schedule, defaultChannel: e.target.value })}
            />
            <Button loading={saving === 'schedule'} onClick={saveSchedule}>
              Save Schedule
            </Button>
          </div>
        </Card>

        <Card title="Escalation Rules" description="Compliance escalation thresholds in days">
          <div className="space-y-3">
            <Input
              label="Warning after (days)"
              type="number"
              value={rules.warningAfterDays}
              onChange={(e) =>
                setRules({ ...rules, warningAfterDays: Number(e.target.value) })
              }
            />
            <Input
              label="Final warning after (days)"
              type="number"
              value={rules.finalWarningAfterDays}
              onChange={(e) =>
                setRules({ ...rules, finalWarningAfterDays: Number(e.target.value) })
              }
            />
            <Input
              label="Escalate after (days)"
              type="number"
              value={rules.escalateAfterDays}
              onChange={(e) =>
                setRules({ ...rules, escalateAfterDays: Number(e.target.value) })
              }
            />
            <Button loading={saving === 'rules'} onClick={saveRules}>
              Save Rules
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
