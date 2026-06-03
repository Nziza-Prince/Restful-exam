import { NavLink, Outlet } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import { useDarkMode } from '@/hooks/useDarkMode';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { cn } from '@/utils';

// ── SVG icon components ───────────────────────────────────────────────────────

function IconGrid() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconPeople() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <circle cx="9" cy="7" r="3.5" />
      <path d="M2 20c0-4 3.1-7 7-7s7 3 7 7" strokeLinecap="round" />
      <path d="M19 7c0 2-1.3 3.5-3 3.5" strokeLinecap="round" />
      <path d="M22 20c0-3.5-2-6-5-7" strokeLinecap="round" />
    </svg>
  );
}

function IconCylinder() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <rect x="8" y="7" width="8" height="13" rx="3.5" />
      <path d="M12 7V4M10 4h4" strokeLinecap="round" />
      <path d="M16 10h2a1.5 1.5 0 010 3h-2" strokeLinecap="round" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 00-4-5.66V5a2 2 0 10-4 0v.34A6 6 0 006 11v3.2c0 .53-.21 1.04-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10.5 20a1.5 1.5 0 003 0" strokeLinecap="round" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 9A8 8 0 006.3 6.3L4 9M4 15a8 8 0 0013.7 2.7L20 15" strokeLinecap="round" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <path d="M12 3l8 3.5v5c0 4.5-3.3 8.7-8 10-4.7-1.3-8-5.5-8-10v-5L12 3z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconDocument() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinejoin="round" />
      <path d="M14 2v6h6M9 17v-5M12 17v-3M15 17v-1" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" strokeLinecap="round" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <path d="M17 16l4-4-4-4M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconSun() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
    </svg>
  );
}

function IconMoon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} className="h-4 w-4">
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Nav definitions ───────────────────────────────────────────────────────────

const adminLinks = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconGrid },
  { to: '/customers', label: 'Users', Icon: IconPeople },
  { to: '/extinguishers', label: 'Extinguishers', Icon: IconCylinder },
  { to: '/notifications', label: 'Notifications', Icon: IconBell },
  { to: '/renewals', label: 'Renewals', Icon: IconRefresh },
  { to: '/compliance', label: 'Compliance', Icon: IconShield },
  { to: '/reports', label: 'Reports', Icon: IconDocument },
  { to: '/settings', label: 'Settings', Icon: IconSettings },
  { to: '/profile', label: 'Profile', Icon: IconUser },
];

const customerLinks = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconGrid },
  { to: '/extinguishers', label: 'My Extinguishers', Icon: IconCylinder },
  { to: '/notifications', label: 'Notifications', Icon: IconBell },
  { to: '/profile', label: 'Profile', Icon: IconUser },
];

const inspectorLinks = [
  { to: '/dashboard', label: 'Dashboard', Icon: IconGrid },
  { to: '/extinguishers', label: 'Extinguishers', Icon: IconCylinder },
  { to: '/profile', label: 'Profile', Icon: IconUser },
];

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function Sidebar() {
  const { user, isAdmin, isInspector } = useAuth();
  const { toggleTheme, isDark } = useDarkMode();
  const dispatch = useAppDispatch();
  const links = isAdmin ? adminLinks : isInspector ? inspectorLinks : customerLinks;

  return (
    <aside className="flex h-full w-60 flex-col bg-zinc-950">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-fire-700">
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
            <path d="M12 2C9.5 7 7 9 7 13a5 5 0 0010 0c0-4-2.5-6-5-11z" />
            <path d="M12 14c-1 0-2-.7-2-1.5S11 11 12 11s2 .7 2 1.5S13 14 12 14z" opacity="0.6" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold tracking-tight text-zinc-100">FEMS</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
            Safety Portal
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2">
        <div className="space-y-0.5">
          {links.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-zinc-800 text-zinc-100'
                    : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'transition-colors duration-150',
                      isActive ? 'text-fire-500' : 'text-zinc-500 group-hover:text-zinc-300',
                    )}
                  >
                    <Icon />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-zinc-800 px-3 py-4">
        {/* User info */}
        <div className="mb-3 rounded-lg bg-zinc-900 px-3 py-2.5">
          <p className="truncate text-sm font-medium text-zinc-200">{user?.fullName}</p>
          <p className="truncate text-xs text-zinc-500">{user?.email}</p>
          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="inline-block rounded bg-fire-700/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-fire-500">
              {user?.role}
            </span>
            <NavLink
              to="/profile"
              className="text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-200 hover:underline"
            >
              Manage
            </NavLink>
          </div>
        </div>

        {/* Controls */}
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-zinc-700 hover:text-zinc-200"
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <IconSun /> : <IconMoon />}
            {isDark ? 'Light' : 'Dark'}
          </button>
          <button
            onClick={() => dispatch(logout())}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-zinc-800 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-red-900 hover:bg-red-950/40 hover:text-red-400"
            title="Sign out"
          >
            <IconLogout />
            Sign out
          </button>
        </div>
      </div>
    </aside>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export function AppLayout() {
  return (
    <div className="flex min-h-[100dvh] bg-zinc-100 dark:bg-zinc-950">
      {/* Sidebar — always dark, always fixed on md+ */}
      <div className="hidden md:block">
        <div className="fixed inset-y-0 left-0 z-30 w-60">
          <Sidebar />
        </div>
      </div>

      {/* Main content — offset by sidebar width on md+ */}
      <main className="flex-1 overflow-auto md:ml-60">
        {/* Mobile top bar */}
        <div className="flex items-center gap-3 border-b border-zinc-200 bg-white px-4 py-3 md:hidden dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-fire-700">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5 text-white">
              <path d="M12 2C9.5 7 7 9 7 13a5 5 0 0010 0c0-4-2.5-6-5-11z" />
            </svg>
          </div>
          <p className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            FEMS
          </p>
        </div>

        <Outlet />
      </main>
    </div>
  );
}
