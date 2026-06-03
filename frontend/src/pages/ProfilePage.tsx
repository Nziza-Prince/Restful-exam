import { type FormEvent, useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { authService } from '@/services/authService';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/authSlice';
import { useAuth } from '@/hooks/useAuth';

export function ProfilePage() {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName);
    setLastName(user.lastName);
    setEmail(user.email);
  }, [user]);

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileSaving(true);
    setProfileError('');
    setProfileMessage('');

    try {
      const updated = await authService.updateProfile({ firstName, lastName, email });
      dispatch(setUser(updated));
      setProfileMessage('Profile updated successfully.');
    } catch (error) {
      setProfileError((error as Error).message);
    } finally {
      setProfileSaving(false);
    }
  };

  const savePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      setPasswordSaving(false);
      return;
    }

    try {
      await authService.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMessage('Password changed successfully.');
    } catch (error) {
      setPasswordError((error as Error).message);
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="page-container">
      <PageHeader
        title="Profile"
        description="Manage your account details and password"
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <Card title="Account Details" description="Update your account information">
          <form onSubmit={saveProfile} className="space-y-4">
            {profileError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {profileError}
              </p>
            )}
            {profileMessage && (
              <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
                {profileMessage}
              </p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
                required
              />
              <Input
                label="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
                required
              />
            </div>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />

            <div className="flex justify-end">
              <Button type="submit" loading={profileSaving}>
                Save profile
              </Button>
            </div>
          </form>
        </Card>

        <div className="space-y-5">
          <Card title="Account Summary">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Signed in as</p>
                <p className="mt-1 font-medium text-zinc-900 dark:text-zinc-100">{user?.fullName}</p>
                <p className="text-zinc-500">{user?.email}</p>
              </div>
              <div className="flex items-center justify-between rounded-md bg-zinc-50 px-3 py-2 dark:bg-zinc-950/60">
                <span className="text-zinc-500">Role</span>
                <span className="rounded bg-fire-700/10 px-2 py-1 text-xs font-semibold uppercase text-fire-700 dark:text-fire-500">
                  {user?.role}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-5">
        <Card title="Password" description="Change your password using your current password">
          <form onSubmit={savePassword} className="grid gap-4 lg:grid-cols-3">
            {passwordError && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300 lg:col-span-3">
                {passwordError}
              </p>
            )}
            {passwordMessage && (
              <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300 lg:col-span-3">
                {passwordMessage}
              </p>
            )}

            <Input
              label="Current password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
            <Input
              label="New password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <Input
              label="Confirm password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />

            <div className="flex justify-end lg:col-span-3">
              <Button type="submit" loading={passwordSaving}>
                Change password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
