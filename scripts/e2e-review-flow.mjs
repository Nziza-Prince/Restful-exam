/**
 * Full inspection workflow check through the API gateway.
 * Requires services running and seeded demo accounts.
 *
 * Usage:
 *   npm run test:e2e
 */
const BASE = process.env.API_BASE || 'http://localhost:3000/api';

const results = [];

async function request(method, path, { token, body, expectStatus, label, raw } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = raw ? await res.arrayBuffer() : await readBody(res);
  const ok = expectStatus ? res.status === expectStatus : res.ok;
  results.push({ ok, status: res.status, method, path, label, detail: ok ? 'OK' : JSON.stringify(data).slice(0, 160) });
  if (!ok) throw new Error(`${label} failed: ${res.status} ${JSON.stringify(data)}`);
  return data;
}

async function readBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function login(email, password, label) {
  const data = await request('POST', '/auth/login', {
    label,
    expectStatus: 201,
    body: { email, password },
  });
  return data.accessToken;
}

function printSummary() {
  console.log('\nFull workflow test');
  console.log('='.repeat(60));
  for (const item of results) {
    console.log(`${item.ok ? '✓' : '✗'} [${item.status}] ${item.method} ${item.path} — ${item.label}`);
  }
  console.log(`\n${results.filter((r) => r.ok).length}/${results.length} checks passed.`);
}

async function main() {
  console.log(`Running workflow against ${BASE}`);
  const adminToken = await login('admin@fems.local', 'Admin@123', 'Admin login');
  const inspectorToken = await login('inspector@fems.local', 'Inspector@123', 'Inspector login');
  const userToken = await login('alice@example.com', 'Customer@123', 'Customer login');

  const customer = await request('GET', '/customers/me', {
    token: userToken,
    label: 'Load customer profile',
  });

  const serial = `AUTO-E2E-${Date.now()}`;
  const extinguisher = await request('POST', '/extinguishers', {
    token: adminToken,
    label: 'Admin registers extinguisher',
    expectStatus: 201,
    body: {
      serialNumber: serial,
      type: 'CO2',
      location: 'E2E Review Lab',
      size: '5lbs',
      installationDate: '2026-06-01',
      expiryDate: '2027-06-01',
      status: 'ACTIVE',
      customerId: customer.id,
    },
  });

  await request('POST', `/extinguishers/${extinguisher.id}/inspections`, {
    token: userToken,
    label: 'Customer requests inspection',
    expectStatus: 201,
    body: {
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
      notes: 'Automated workflow inspection request',
    },
  });

  const pending = await request('GET', '/extinguishers/inspections?status=PENDING&page=1&limit=20', {
    token: inspectorToken,
    label: 'Inspector sees pending request',
  });
  const inspection = pending.data.find((row) => row.extinguisherId === extinguisher.id);
  if (!inspection) throw new Error('Created inspection request was not visible to inspector.');

  await request('PATCH', `/extinguishers/inspections/${inspection.id}/start`, {
    token: inspectorToken,
    label: 'Inspector starts inspection',
  });

  await request('POST', `/extinguishers/inspections/${inspection.id}/report`, {
    token: inspectorToken,
    label: 'Inspector submits report',
    expectStatus: 201,
    body: {
      condition: 'Cylinder body intact and pressure gauge in operating range.',
      notes: 'No access issues observed.',
      actionsTaken: 'Checked pressure, pin, seal, hose, and signage.',
      result: 'PASS',
      inspectionDate: '2026-06-03',
    },
  });

  await request('PATCH', `/extinguishers/inspections/${inspection.id}/review`, {
    token: adminToken,
    label: 'Admin approves submitted report',
    body: {
      status: 'APPROVED',
      notes: 'Approved by automated workflow test.',
    },
  });

  await request('POST', `/extinguishers/${extinguisher.id}/maintenance`, {
    token: inspectorToken,
    label: 'Inspector logs maintenance',
    expectStatus: 201,
    body: {
      actionsTaken: 'Cleaned nozzle and verified wall bracket.',
      actionDate: '2026-06-03',
      conditionsNoted: 'Good condition after maintenance check.',
    },
  });

  await request('GET', '/reports/compliance-summary?format=csv', {
    token: adminToken,
    label: 'Admin exports compliance report',
    raw: true,
  });

  printSummary();
}

main().catch((err) => {
  printSummary();
  console.error(`\nE2E workflow failed: ${err.message}`);
  process.exit(1);
});
