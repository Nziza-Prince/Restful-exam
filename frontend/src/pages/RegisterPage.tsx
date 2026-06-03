import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, register } from '@/store/slices/authSlice';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(register({ fullName, email, password }));
    if (register.fulfilled.match(result)) navigate('/login');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Create account
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Register to manage fire extinguishers
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <Input
        label="Full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        placeholder="Jane Smith"
        required
      />
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
        placeholder="Min. 8 characters"
        minLength={8}
        required
      />

      <Button type="submit" className="w-full" loading={loading}>
        Create account
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-fire-700 underline-offset-2 hover:underline dark:text-fire-500"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}

