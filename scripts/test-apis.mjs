/**
 * FEMS API smoke test — run through gateway at localhost:3000/api
 * Usage: node scripts/test-apis.mjs
 */
import net from 'net';

const BASE = process.env.API_BASE || 'http://localhost:3000/api';

const REQUIRED_PORTS = [
  { port: 3000, name: 'api-gateway' },
  { port: 3001, name: 'auth-service' },
  { port: 3002, name: 'customer-service' },
  { port: 3003, name: 'extinguisher-service' },
  { port: 3004, name: 'notification-service' },
  { port: 3005, name: 'renewal-service' },
  { port: 3006, name: 'compliance-service' },
  { port: 3007, name: 'report-service' },
];

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ port, host: '127.0.0.1' });
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('error', () => resolve(false));
    socket.setTimeout(1500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function assertServicesRunning() {
  const checks = await Promise.all(
    REQUIRED_PORTS.map(async ({ port, name }) => ({
      port,
      name,
      up: await isPortOpen(port),
    })),
  );
  const down = checks.filter((c) => !c.up);
  if (down.length) {
    console.error('Missing backend services (start all with: npm run dev:services):\n');
    down.forEach((s) => console.error(`  ✗ port ${s.port} — ${s.name}`));
    console.error('');
    process.exit(1);
  }
}

const results = [];
let adminToken = '';
let adminRefresh = '';
let customerToken = '';
let customerRefresh = '';

async function request(method, path, { body, token, expectStatus, label, raw } = {}) {
  const url = `${BASE}${path}`;
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  let data;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (raw) {
      data = await res.arrayBuffer();
    } else {
      const text = await res.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = text;
      }
    }
  } catch (err) {
    results.push({ label, method, path, status: 'ERR', ok: false, detail: err.message });
    return null;
  }

  const ok = expectStatus ? res.status === expectStatus : res.ok;
  results.push({
    label,
    method,
    path,
    status: res.status,
    ok,
    detail: ok ? 'OK' : JSON.stringify(data)?.slice(0, 120),
  });
  return { res, data };
}

function printSummary() {
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok);
  console.log('\n' + '='.repeat(60));
  console.log(`API TEST SUMMARY: ${passed}/${results.length} passed`);
  console.log('='.repeat(60));
  for (const r of results) {
    console.log(`${r.ok ? '✓' : '✗'} [${r.status}] ${r.method} ${r.path} — ${r.label}${!r.ok ? ` (${r.detail})` : ''}`);
  }
  if (failed.length) {
    console.log('\nFailed tests:');
    failed.forEach((r) => console.log(`  - ${r.label}: ${r.detail}`));
    process.exit(1);
  }
  console.log('\nAll API tests passed. Safe to start the frontend.');
}

async function main() {
  await assertServicesRunning();
  console.log(`Testing FEMS APIs at ${BASE}\n`);

  // Gateway
  await request('GET', '/health', { label: 'Gateway health', expectStatus: 200 });
  await request('GET', '', { label: 'Gateway root info', expectStatus: 200 });

  // Auth — admin login
  const login = await request('POST', '/auth/login', {
    label: 'Admin login',
    expectStatus: 201,
    body: { email: 'admin@fems.local', password: 'Admin@123' },
  });
  if (login?.data) {
    adminToken = login.data.accessToken;
    adminRefresh = login.data.refreshToken;
  }

  // Auth — customer login
  const custLogin = await request('POST', '/auth/login', {
    label: 'Customer login (alice)',
    expectStatus: 201,
    body: { email: 'alice@example.com', password: 'Customer@123' },
  });
  if (custLogin?.data) {
    customerToken = custLogin.data.accessToken;
    customerRefresh = custLogin.data.refreshToken;
  }

  await request('GET', '/users/me', { label: 'GET users/me (admin)', token: adminToken, expectStatus: 200 });
  await request('GET', '/users?page=1&limit=10', { label: 'GET users list (admin)', token: adminToken, expectStatus: 200 });
  await request('PATCH', '/users/me', {
    label: 'PATCH users/me profile',
    token: adminToken,
    expectStatus: 200,
    body: { firstName: 'System', lastName: 'Administrator' },
  });

  if (adminRefresh) {
    const refreshed = await request('POST', '/auth/refresh', {
      label: 'Refresh token',
      expectStatus: 201,
      body: { refreshToken: adminRefresh },
    });
    if (refreshed?.data?.accessToken) {
      adminToken = refreshed.data.accessToken;
      adminRefresh = refreshed.data.refreshToken;
    }
  }

  // Customers
  const customers = await request('GET', '/customers?page=1&limit=10', {
    label: 'GET customers (admin)',
    token: adminToken,
    expectStatus: 200,
  });
  await request('GET', '/customers/me', {
    label: 'GET customers/me (customer)',
    token: customerToken,
    expectStatus: 200,
  });

  const customerId = customers?.data?.data?.[0]?.id;
  if (customerId) {
    await request('GET', `/customers/${customerId}`, {
      label: 'GET customer by id',
      token: adminToken,
      expectStatus: 200,
    });
  }

  // Extinguishers
  const exts = await request('GET', '/extinguishers?page=1&limit=10', {
    label: 'GET extinguishers (admin)',
    token: adminToken,
    expectStatus: 200,
  });
  await request('GET', '/extinguishers/mine', {
    label: 'GET extinguishers/mine (customer)',
    token: customerToken,
    expectStatus: 200,
  });
  await request('GET', '/extinguishers?status=EXPIRED&page=1&limit=5', {
    label: 'GET extinguishers filter EXPIRED',
    token: adminToken,
    expectStatus: 200,
  });

  const extId = exts?.data?.data?.[0]?.id;
  if (extId) {
    await request('GET', `/extinguishers/${extId}`, {
      label: 'GET extinguisher by id',
      token: adminToken,
      expectStatus: 200,
    });
    const inspection = await request('POST', `/extinguishers/${extId}/inspections`, {
      label: 'POST schedule inspection',
      token: adminToken,
      expectStatus: 201,
      body: {
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        notes: 'Smoke-test inspection schedule',
      },
    });
    const inspectionId = inspection?.data?.id;
    await request('GET', `/extinguishers/${extId}/inspections?page=1&limit=10`, {
      label: 'GET extinguisher inspections',
      token: adminToken,
      expectStatus: 200,
    });
    if (inspectionId) {
      await request('PATCH', `/extinguishers/inspections/${inspectionId}`, {
        label: 'PATCH inspection status',
        token: adminToken,
        expectStatus: 200,
        body: { status: 'COMPLETED', notes: 'Smoke test completed' },
      });
    }
    await request('POST', `/extinguishers/${extId}/maintenance`, {
      label: 'POST maintenance log',
      token: adminToken,
      expectStatus: 201,
      body: {
        actionsTaken: 'Visual check and pressure verification',
        actionDate: new Date().toISOString().slice(0, 10),
        conditionsNoted: 'No visible corrosion; pressure acceptable',
      },
    });
    await request('GET', `/extinguishers/${extId}/maintenance?page=1&limit=10`, {
      label: 'GET maintenance history',
      token: adminToken,
      expectStatus: 200,
    });
  }

  // Notifications
  const custNotifs = await request('GET', '/notifications/me', {
    label: 'GET notifications/me (customer)',
    token: customerToken,
    expectStatus: 200,
  });
  await request('GET', '/notifications?page=1&limit=10', {
    label: 'GET notifications (admin)',
    token: adminToken,
    expectStatus: 200,
  });

  const notifId = custNotifs?.data?.data?.[0]?.id;
  if (notifId && customerToken) {
    await request('PATCH', `/notifications/${notifId}/read`, {
      label: 'PATCH notification read (customer)',
      token: customerToken,
      expectStatus: 200,
    });
  }

  // Renewals
  const renewals = await request('GET', '/renewals?page=1&limit=10', {
    label: 'GET renewals (admin)',
    token: adminToken,
    expectStatus: 200,
  });
  await request('GET', '/renewals/mine', {
    label: 'GET renewals/mine (customer)',
    token: customerToken,
    expectStatus: 200,
  });

  const renewalId = renewals?.data?.data?.[0]?.id;
  if (renewalId) {
    await request('GET', `/renewals/${renewalId}`, {
      label: 'GET renewal by id',
      token: adminToken,
      expectStatus: 200,
    });
  }

  // Compliance
  const cases = await request('GET', '/compliance/cases?page=1&limit=10', {
    label: 'GET compliance cases (admin)',
    token: adminToken,
    expectStatus: 200,
  });
  const caseId = cases?.data?.data?.[0]?.id;
  if (caseId) {
    await request('GET', `/compliance/cases/${caseId}`, {
      label: 'GET compliance case by id',
      token: adminToken,
      expectStatus: 200,
    });
  }

  // Settings
  await request('GET', '/settings/notification-schedule', {
    label: 'GET notification schedule',
    token: adminToken,
    expectStatus: 200,
  });
  await request('GET', '/settings/escalation-rules', {
    label: 'GET escalation rules',
    token: adminToken,
    expectStatus: 200,
  });

  // Reports — JSON dashboard
  await request('GET', '/reports/dashboard-summary', {
    label: 'GET dashboard-summary',
    token: adminToken,
    expectStatus: 200,
  });

  // Reports — CSV exports
  for (const report of [
    'expired-extinguishers',
    'expiring-soon',
    'customer-compliance',
    'renewal-requests',
    'notifications',
    'daily',
    'monthly',
    'yearly',
    'inspection-status',
    'maintenance-history',
  ]) {
    await request('GET', `/reports/${report}?format=csv`, {
      label: `GET report ${report} (csv)`,
      token: adminToken,
      expectStatus: 200,
      raw: true,
    });
  }
  await request('GET', '/reports/total-stock', {
    label: 'GET report total-stock',
    token: adminToken,
    expectStatus: 200,
  });

  // Auth logout
  if (adminRefresh) {
    await request('POST', '/auth/logout', {
      label: 'POST auth/logout',
      token: adminToken,
      expectStatus: 201,
      body: { refreshToken: adminRefresh },
    });
  }

  printSummary();
}

main().catch((err) => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
