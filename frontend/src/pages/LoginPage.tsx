import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, login } from '@/store/slices/authSlice';

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) navigate('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Sign in
        </h2>
        <p className="mt-1 text-sm text-zinc-500">Access your fire safety dashboard</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />

      <Button type="submit" className="w-full" loading={loading}>
        Sign in
      </Button>

      <p className="text-center text-sm text-zinc-500">
        No account?{' '}
        <Link
          to="/register"
          className="font-medium text-fire-700 underline-offset-2 hover:underline dark:text-fire-500"
        >
          Register
        </Link>
      </p>
    </form>
  );
}
