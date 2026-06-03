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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) navigate('/dashboard');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9f6b22] dark:text-[#f4c775]">
          Operator access
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
          Sign in to FEMS
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Continue to extinguisher status, inspections, maintenance logs, and reports.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-medium">Could not sign you in</p>
          <p className="mt-1 text-red-600 dark:text-red-300/80">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@fems.local"
          autoComplete="email"
          required
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="pr-16"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-[31px] text-xs font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <Button type="submit" className="h-11 w-full rounded-md bg-[#18211d] hover:bg-[#243129] dark:bg-[#f4c775] dark:text-[#18211d] dark:hover:bg-[#e7b25e]" loading={loading}>
        Open dashboard
      </Button>

      <div className="rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/50 dark:text-zinc-400">
        <p className="font-semibold text-zinc-800 dark:text-zinc-200">Demo access</p>
        <p className="mt-1">Admin: admin@fems.local / Admin@123</p>
        <p>User: alice@example.com / Customer@123</p>
      </div>

      <p className="text-center text-sm text-zinc-500">
        New team member?{' '}
        <Link
          to="/register"
          className="font-semibold text-[#8a5a16] underline-offset-4 hover:underline dark:text-[#f4c775]"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
