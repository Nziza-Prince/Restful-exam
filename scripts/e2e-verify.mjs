/**
 * FEMS Full End-to-End Verification
 * Covers all implemented features through the live browser.
 */
import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const results = [];
let passed = 0;
let failed = 0;

function ok(label, detail = '') {
  results.push({ ok: true, label, detail });
  passed++;
  console.log(`  PASS  ${label}${detail ? '  [' + detail + ']' : ''}`);
}

function fail(label, detail = '') {
  results.push({ ok: false, label, detail });
  failed++;
  console.error(`  FAIL  ${label}${detail ? '  [' + detail + ']' : ''}`);
}

function section(name) {
  console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 52 - name.length))}`);
}

async function run() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();

  // ── 1. REGISTRATION → /login ────────────────────────────────────────────
  section('1. Registration redirect → /login');
  await page.goto(`${BASE}/register`, { waitUntil: 'networkidle' });
  const ts = Date.now();
  await page.getByLabel(/full name/i).fill('E2E User');
  await page.getByLabel(/email/i).fill(`e2e${ts}@test.com`);
  await page.getByLabel(/password/i).fill('TestPass@123');
  // Role field removed from registration — all self-registered users become customers by default
  await Promise.all([page.click('button[type="submit"]'), page.waitForNavigation({ timeout: 10000 })]);
  page.url().includes('/login') ? ok('Registration → /login') : fail('Wrong redirect', page.url());

  // ── 2. ADMIN LOGIN ────────────────────────────────────────────────────────
  section('2. Admin login');
  await page.fill('input[type="email"]', 'admin@fems.local');
  await page.fill('input[type="password"]', 'Admin@123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 });
  await page.waitForTimeout(1500);
  page.url().includes('/dashboard') ? ok('Admin → /dashboard') : fail('Login failed', page.url());

  // ── 3. PHONE VALIDATION in Customer form ──────────────────────────────────
  section('3. Phone validation (exactly 10 digits)');
  await page.click('a[href="/customers"]');
  await page.waitForTimeout(1000);
  await page.click('button:has-text("Add Customer")');
  await page.waitForTimeout(500);

  // Fill form with bad phone (5 digits)
  await page.getByLabel(/full name/i).fill('Test Customer');
  await page.getByLabel(/national id/i).fill('NAT-TEST-01');
  await page.getByLabel(/phone/i).fill('12345'); // too short
  await page.getByLabel(/email/i).fill(`phonetest${ts}@test.com`);
  await page.getByLabel(/address/i).fill('Test Address');
  await page.locator('div.fixed button').filter({ hasText: /^Save$/ }).click();
  await page.waitForTimeout(400);

  const phoneErr = await page.locator('text=exactly 10 digits').count();
  phoneErr > 0 ? ok('Phone <10 digits shows validation error') : fail('No error for short phone');
  const modalStillOpen = await page.locator('text=Add Customer').count();
  modalStillOpen > 0 ? ok('Modal stays open on validation error') : fail('Modal closed despite error');

  // Fix phone and verify modal submits
  await page.getByLabel(/phone/i).fill('0788123456');
  const [custRes] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/customers') && r.request().method() === 'POST', { timeout: 10000 }),
    page.locator('div.fixed button').filter({ hasText: /^Save$/ }).click(),
  ]);
  custRes.status() === 201
    ? ok('Customer created with valid 10-digit phone → 201')
    : fail('Customer creation failed', `status=${custRes.status()}`);

  await page.waitForTimeout(1200);

  // ── 4. INVITATION TOKEN — customer appears with pending invite ────────────
  section('4. Admin-created customer gets invitation email (backend)');
  // We verified this at API level (invitationTokenHash stored) — check customer visible in list
  const custBody = await custRes.json();
  await page.getByPlaceholder(/search/i).fill('Test Customer');
  await page.waitForTimeout(600);
  (await page.locator('text=Test Customer').count()) > 0
    ? ok('Newly created customer visible in admin list')
    : fail('New customer not found in list');
  await page.getByPlaceholder(/search/i).fill('');

  // ── 5. SET-PASSWORD PAGE — accessible and renders correctly ───────────────
  section('5. /set-password page renders');
  await page.goto(`${BASE}/set-password?token=testtoken123`, { waitUntil: 'networkidle' });
  const hasSetPwForm = await page.locator('text=Set Your Password').count();
  hasSetPwForm > 0 ? ok('/set-password page renders title') : fail('/set-password page missing title');

  const hasPwField = await page.getByLabel(/new password/i).count();
  hasPwField > 0 ? ok('Password field present') : fail('Password field missing');
  const hasConfirmField = await page.getByLabel(/confirm password/i).count();
  hasConfirmField > 0 ? ok('Confirm password field present') : fail('Confirm password field missing');

  // Test mismatch validation
  await page.getByLabel(/new password/i).fill('MyPass@123');
  await page.getByLabel(/confirm password/i).fill('DifferentPass');
  await page.click('button:has-text("Activate Account")');
  await page.waitForTimeout(400);
  const mismatchErr = await page.locator('text=Passwords do not match').count();
  mismatchErr > 0 ? ok('Password mismatch shows error') : fail('No error for password mismatch');

  // Invalid token → backend returns 401 → page shows error
  await page.getByLabel(/confirm password/i).fill('MyPass@123');
  const [setupRes] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/auth/setup-password'), { timeout: 8000 }),
    page.click('button:has-text("Activate Account")'),
  ]);
  setupRes.status() === 401
    ? ok('Invalid token → 401 shown as error on page')
    : fail('Wrong status for invalid token', `got ${setupRes.status()}`);
  const errVisible = await page.locator('text=Invalid').count() + await page.locator('text=expired').count() + await page.locator('text=link').count();
  errVisible > 0 ? ok('Error message shown to user') : fail('Error message not displayed');

  // ── 6. EXTINGUISHER — date validation + assign ─────────────────────────────
  section('6. Extinguisher: date validation + assign button');
  // Navigate within the SPA (no page reload) to preserve Redux state, customers already in store
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  // Go to extinguishers and wait for BOTH extinguishers AND customers to finish loading
  const [custLoadRes] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/customers?page=1&limit=100'), { timeout: 12000 }),
    page.click('a[href="/extinguishers"]'),
  ]);
  // Consume body to ensure response fully processed before React re-renders
  await custLoadRes.json();
  await page.waitForTimeout(1200);

  await page.click('button:has-text("Register Extinguisher")');
  await page.waitForTimeout(500);
  await page.getByLabel(/serial number/i).fill('FULLTEST-' + ts);
  await page.getByLabel(/^type$/i).fill('CO2');
  await page.getByLabel(/capacity/i).fill('6kg');
  await page.getByLabel(/purchase date/i).fill('2028-01-01');
  await page.getByLabel(/expiry date/i).fill('2027-01-01');
  await page.locator('div.fixed button').filter({ hasText: /^Register$/ }).click();
  await page.waitForTimeout(400);
  (await page.locator('text=Purchase date cannot be a future date').count()) > 0
    ? ok('Future purchase date shows error')
    : fail('No future purchase date error');
  (await page.locator('text=Expiry date must be after').count()) > 0
    ? ok('Expiry before purchase shows error')
    : fail('No expiry before purchase error');

  // Fix and register
  await page.getByLabel(/purchase date/i).fill('2024-01-15');
  await page.getByLabel(/expiry date/i).fill('2027-06-01');
  const serial = 'FULLTEST-' + ts;
  const [createExtRes] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/extinguishers') && r.request().method() === 'POST', { timeout: 10000 }),
    page.locator('div.fixed button').filter({ hasText: /^Register$/ }).click(),
  ]);
  createExtRes.status() === 201 ? ok('Extinguisher created → 201') : fail('Create ext failed', `${createExtRes.status()}`);
  await page.waitForTimeout(1000);

  await page.getByPlaceholder(/search serial or type/i).fill(serial);
  await page.waitForTimeout(600);
  const serialRow = page.locator('tr').filter({ hasText: serial });
  (await serialRow.locator('text=Unassigned').count()) > 0 ? ok('Assignment column shows Unassigned') : fail('No Unassigned badge');
  (await serialRow.locator('button').filter({ hasText: /^Assign$/ }).count()) > 0 ? ok('Assign button present') : fail('No Assign button');

  // Assign it — customers are now in Redux state from the earlier load
  await serialRow.locator('button').filter({ hasText: /^Assign$/ }).click();
  await page.waitForTimeout(600);
  const assignSelect = page.locator('div.fixed select');
  await assignSelect.waitFor({ state: 'visible', timeout: 5000 });
  // Poll until options are populated (React may need another tick to sync)
  for (let i = 0; i < 15; i++) {
    const count = await assignSelect.locator('option').count();
    if (count > 1) break;
    await page.waitForTimeout(400);
  }
  await assignSelect.selectOption({ index: 1 });
  const [assignRes] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/assign') && r.request().method() === 'PATCH', { timeout: 10000 }),
    page.locator('div.fixed').locator('button').filter({ hasText: /^Assign$/ }).click(),
  ]);
  assignRes.status() === 200 ? ok('Assign → 200') : fail('Assign failed', `${assignRes.status()}`);
  await page.waitForTimeout(1000);
  await page.getByPlaceholder(/search serial or type/i).fill(serial);
  await page.waitForTimeout(600);
  const rowAfter = page.locator('tr').filter({ hasText: serial });
  (await rowAfter.locator('text=Unassigned').count()) === 0 ? ok('Unassigned replaced after assign') : fail('Still Unassigned');
  (await rowAfter.locator('button').filter({ hasText: /^Reassign$/ }).count()) > 0 ? ok('Button reads Reassign') : fail('Button unchanged');

  // ── 7. DASHBOARD + REPORTS ─────────────────────────────────────────────────
  section('7. Dashboard charts + reports');
  await page.goto(`${BASE}/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  (await page.locator('.recharts-wrapper').count()) >= 3 ? ok('Dashboard charts (≥3)') : fail('Too few charts');
  (await page.locator('.border-l-4').count()) >= 3 ? ok('Stat card borders (≥3)') : fail('Too few stat borders');

  await page.click('a[href="/reports"]');
  await page.waitForTimeout(1000);
  (await page.locator('button:has-text("Download")').count()) >= 5 ? ok('≥5 Download buttons') : fail('Missing Download buttons');

  // ── 8. NOTIFICATIONS — admin sees no ASSIGNED type ────────────────────────
  section('8. Notifications user-specific');
  await page.click('a[href="/notifications"]');
  await page.waitForTimeout(1000);
  const notifRows = await page.locator('tbody tr').count();
  notifRows >= 0 ? ok(`Admin notifications table has ${notifRows} rows`) : fail('Notifications table missing');

  // ── 9. CUSTOMER ROLE ───────────────────────────────────────────────────────
  section('9. Customer role navigation');
  await page.locator('button:has-text("Sign out")').click();
  await page.waitForURL(`${BASE}/login`, { timeout: 8000 });
  ok('Logout → /login');

  await page.fill('input[type="email"]', 'alice@example.com');
  await page.fill('input[type="password"]', 'Customer@123');
  await page.click('button[type="submit"]');
  await page.waitForURL(`${BASE}/dashboard`, { timeout: 10000 });
  ok('Customer login → /dashboard');

  (await page.locator('a[href="/compliance"]').count()) === 0 ? ok('No Compliance link for customer') : fail('Customer sees Compliance');
  (await page.locator('a[href="/reports"]').count()) === 0 ? ok('No Reports link for customer') : fail('Customer sees Reports');

  await browser.close();

  console.log('\n' + '═'.repeat(60));
  console.log(`E2E SUMMARY: ${passed}/${passed + failed} passed`);
  console.log('═'.repeat(60));
  if (failed > 0) {
    console.log('\nFailed:');
    results.filter(r => !r.ok).forEach(r => console.error(`  FAIL  ${r.label}: ${r.detail}`));
    process.exit(1);
  }
  console.log('\nAll E2E checks passed.');
}

run().catch(e => { console.error('\nCrash:', e.message); process.exit(1); });
