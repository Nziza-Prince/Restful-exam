import { Outlet } from 'react-router';

const panelStats = [
  { label: 'Live assets', value: '1,284' },
  { label: 'Due this week', value: '37' },
  { label: 'Compliance', value: '96%' },
];

export function AuthLayout() {
  return (
    <div className="grid min-h-[100dvh] bg-[#f4f6f3] text-zinc-950 dark:bg-zinc-950 dark:text-zinc-100 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">
      <div className="relative hidden overflow-hidden bg-[#18211d] px-10 py-9 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-[0.16]">
          <div className="h-full w-full bg-[linear-gradient(90deg,rgba(255,255,255,.15)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,.12)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#e7b25e] text-[#18211d] shadow-lg shadow-black/20">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                <path d="M12 2C9.5 7 7 9 7 13a5 5 0 0010 0c0-4-2.5-6-5-11z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">TWZ FEMS</p>
              <p className="text-xs text-white/55">Inspection command desk</p>
            </div>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/75">
            Secure portal
          </span>
        </div>

        <div className="relative max-w-xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#e7b25e]/30 bg-[#e7b25e]/10 px-3 py-1 text-xs font-semibold uppercase text-[#f4c775]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#f4c775]" />
            TWZ LTD fire safety operations
          </div>
          <h1 className="text-5xl font-semibold leading-[1.02]">
            Every extinguisher, inspection, and compliance deadline in one place.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/68">
            Register assets, schedule checks, log maintenance, and export reports from a focused safety workspace.
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            {panelStats.map((stat) => (
              <div key={stat.label} className="rounded-md border border-white/10 bg-white/[0.07] p-4">
                <p className="text-2xl font-semibold text-[#f4c775]">{stat.value}</p>
                <p className="mt-1 text-xs text-white/55">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center justify-between text-xs text-white/45">
          <span>Fire Extinguisher Management System</span>
          <span>Audit-ready records</span>
        </div>
      </div>

      <div className="flex min-h-[100dvh] flex-col px-5 py-6 sm:px-8 lg:px-14">
        <div className="mb-10 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#18211d] text-[#f4c775]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M12 2C9.5 7 7 9 7 13a5 5 0 0010 0c0-4-2.5-6-5-11z" />
              </svg>
            </div>
            <span className="text-sm font-semibold">TWZ FEMS</span>
          </div>
          <span className="text-xs font-medium text-zinc-500">Secure portal</span>
        </div>

        <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
          <div className="mb-7 hidden items-center gap-3 lg:flex">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-[#18211d] text-[#f4c775] dark:bg-[#f4c775] dark:text-[#18211d]">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M12 2C9.5 7 7 9 7 13a5 5 0 0010 0c0-4-2.5-6-5-11z" />
            </svg>
            </div>
            <div>
              <p className="text-sm font-semibold">TWZ FEMS</p>
              <p className="text-xs text-zinc-500">Fire safety management</p>
            </div>
          </div>

          <div className="rounded-lg border border-zinc-200/80 bg-white px-6 py-7 shadow-[0_24px_80px_rgba(24,33,29,0.10)] dark:border-zinc-800 dark:bg-zinc-900 sm:px-8 sm:py-8">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
