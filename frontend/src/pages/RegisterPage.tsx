import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearAuthError, register } from '@/store/slices/authSlice';
import type { UserRole } from '@/types';

export function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('user');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    dispatch(clearAuthError());
    const result = await dispatch(register({ firstName, lastName, email, password, role }));
    if (register.fulfilled.match(result)) navigate('/login');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#9f6b22] dark:text-[#f4c775]">
          Join the safety desk
        </p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
          Create your FEMS account
        </h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Register as a facility user to view extinguisher status and schedule inspections.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          <p className="font-medium">Registration needs attention</p>
          <p className="mt-1 text-red-600 dark:text-red-300/80">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Jane"
            autoComplete="given-name"
            required
          />
          <Input
            label="Last name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Smith"
            autoComplete="family-name"
            required
          />
        </div>
        <Input
          label="Work email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
          required
        />
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Minimum 8 characters"
            minLength={8}
            autoComplete="new-password"
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
        <Select
          label="Account role"
          value={role}
          onChange={(e) => setRole(e.target.value as UserRole)}
          options={[
            { value: 'user', label: 'Facility user' },
            { value: 'inspector', label: 'Inspector' },
          ]}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-zinc-500">
        <span className="rounded-md bg-zinc-100 px-2 py-2 text-center dark:bg-zinc-800">JWT login</span>
        <span className="rounded-md bg-zinc-100 px-2 py-2 text-center dark:bg-zinc-800">Role access</span>
        <span className="rounded-md bg-zinc-100 px-2 py-2 text-center dark:bg-zinc-800">Inspection ready</span>
      </div>

      <Button type="submit" className="h-11 w-full rounded-md bg-[#18211d] hover:bg-[#243129] dark:bg-[#f4c775] dark:text-[#18211d] dark:hover:bg-[#e7b25e]" loading={loading}>
        Create secure account
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-[#8a5a16] underline-offset-4 hover:underline dark:text-[#f4c775]"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
