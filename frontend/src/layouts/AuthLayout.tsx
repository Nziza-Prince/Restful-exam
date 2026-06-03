import { Outlet } from 'react-router';

export function AuthLayout() {
  return (
    <div className="flex min-h-[100dvh] bg-zinc-100 dark:bg-zinc-950">
      {/* Brand panel — visible on lg+ */}
      <div className="hidden lg:flex lg:w-[44%] lg:flex-col lg:justify-between bg-zinc-950 px-12 py-10">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fire-700">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
              <path d="M12 2C9.5 7 7 9 7 13a5 5 0 0010 0c0-4-2.5-6-5-11z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-100">FEMS</span>
        </div>

        {/* Brand copy */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-fire-600 mb-4">
            Fire Extinguisher Management
          </p>
          <h1 className="text-3xl font-semibold leading-tight tracking-tight text-zinc-100">
            Safety records,
            <br />
            compliance tracking,
            <br />
            and renewal alerts.
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-zinc-400">
            Manage your entire extinguisher fleet from a single dashboard.
            Automated status tracking and compliance reporting, built for
            safety teams.
          </p>
        </div>

        {/* Footer note */}
        <p className="text-xs text-zinc-600">
          Fire Extinguisher Management System &mdash; FEMS
        </p>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 lg:px-16">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-fire-700">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
              <path d="M12 2C9.5 7 7 9 7 13a5 5 0 0010 0c0-4-2.5-6-5-11z" />
            </svg>
          </div>
          <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            FEMS
          </span>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white px-7 py-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
