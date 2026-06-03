import { type FormEvent, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppDispatch } from '@/store/hooks';
import { setCredentials } from '@/store/slices/authSlice';

export function SetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  if (!token) {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Invalid Link
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            This invitation link is missing or malformed.
          </p>
        </div>
        <p className="text-sm text-zinc-400">
          Please check the link in your email or contact your administrator.
        </p>
      </div>
    );
  }

  const validate = () => {
    const errors: { password?: string; confirm?: string } = {};
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (password !== confirm) {
      errors.confirm = 'Passwords do not match.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          Array.isArray(data.message)
            ? data.message.join('. ')
            : data.message ?? 'Failed to set password. The link may have expired.',
        );
        return;
      }

      // Auto-login: store credentials in Redux and navigate to dashboard
      dispatch(setCredentials({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken }));
      navigate('/dashboard');
    } catch {
      setError('A network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Set Your Password
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Create a secure password to activate your TZW LTD account.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <Input
        label="New password"
        type="password"
        value={password}
        placeholder="Min. 8 characters"
        onChange={(e) => {
          setPassword(e.target.value);
          if (fieldErrors.password && e.target.value.length >= 8) {
            setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }
        }}
        error={fieldErrors.password}
        required
      />

      <Input
        label="Confirm password"
        type="password"
        value={confirm}
        placeholder="Repeat your password"
        onChange={(e) => {
          setConfirm(e.target.value);
          if (fieldErrors.confirm && e.target.value === password) {
            setFieldErrors((prev) => ({ ...prev, confirm: undefined }));
          }
        }}
        error={fieldErrors.confirm}
        required
      />

      <Button type="submit" className="w-full" loading={loading}>
        Activate Account
      </Button>

      <p className="text-center text-xs text-zinc-400">
        Already have a password?{' '}
        <a href="/login" className="font-medium text-fire-700 underline-offset-2 hover:underline dark:text-fire-500">
          Sign in
        </a>
      </p>
    </form>
  );
}
