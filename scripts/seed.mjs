/**
 * FEMS seed script — idempotent demo-data seeder.
 * Safe to re-run: uses INSERT … ON CONFLICT DO NOTHING so existing real data
 * is preserved. Only the fixed test accounts (admin / alice / bob / carol) are
 * guaranteed to be present after each run.
 *
 * Usage:  node scripts/seed.mjs
 * Requires the backend services to be running first (npm run dev:services) so
 * that TypeORM has already created the schema tables.
 */
import pg from 'pg';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

const { Client } = pg;
const DB_URL = process.env.DATABASE_URL_BASE
  ? process.env.DATABASE_URL_BASE
  : 'postgresql://postgres:ivan.2008@localhost:5432';

const ADMIN_PASSWORD = 'Admin@123';
const CUSTOMER_PASSWORD = 'Customer@123';

async function connect(dbName) {
  const client = new Client({ connectionString: `${DB_URL}/${dbName}` });
  await client.connect();
  return client;
}

async function tableExists(client, tableName) {
  const result = await client.query(
    `SELECT EXISTS (
       SELECT FROM information_schema.tables
       WHERE table_schema = 'public' AND table_name = $1
     ) AS exists`,
    [tableName],
  );
  return result.rows[0].exists;
}

async function requireTable(client, dbLabel, tableName) {
  if (!(await tableExists(client, tableName))) {
    throw new Error(
      `Table "${tableName}" not found in ${dbLabel}. ` +
        'Start backend services first so TypeORM creates schemas:\n' +
        '  npm run dev:services\n' +
        'Wait until services are running, then run:\n' +
        '  npm run seed',
    );
  }
}

/** Upsert a user; returns the row's id (existing or newly inserted). */
async function upsertUser(client, id, fullName, email, passwordHash, role) {
  await client.query(
    `INSERT INTO users (id, full_name, email, password, role, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (email) DO NOTHING`,
    [id, fullName, email, passwordHash, role],
  );
  const row = await client.query('SELECT id FROM users WHERE email = $1', [email]);
  return row.rows[0].id;
}

/** Upsert a customer; returns the row's id (existing or newly inserted). */
async function upsertCustomer(client, id, fullName, nationalId, phone, email, address, createdBy) {
  await client.query(
    `INSERT INTO customers (id, full_name, national_id, phone, email, address, created_by, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     ON CONFLICT (email) DO NOTHING`,
    [id, fullName, nationalId, phone, email, address, createdBy],
  );
  const row = await client.query('SELECT id FROM customers WHERE email = $1', [email]);
  return row.rows[0].id;
}

async function seedAuth() {
  const client = await connect('fems_auth');
  await requireTable(client, 'fems_auth', 'users');

  const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const customerHash = await bcrypt.hash(CUSTOMER_PASSWORD, 12);

  const adminId = await upsertUser(client, randomUUID(), 'System Administrator', 'admin@fems.local', adminHash, 'admin');
  const customerUser1Id = await upsertUser(client, randomUUID(), 'Alice Johnson', 'alice@example.com', customerHash, 'customer');
  const customerUser2Id = await upsertUser(client, randomUUID(), 'Bob Smith', 'bob@example.com', customerHash, 'customer');

  await client.end();
  console.log('✓ fems_auth seeded (admin@fems.local / Admin@123)');
  return { adminId, customerUser1Id, customerUser2Id };
}

async function seedCustomers(adminId) {
  const client = await connect('fems_customers');
  await requireTable(client, 'fems_customers', 'customers');

  // Ensure the column exists (safe on existing DBs)
  await client.query(`ALTER TABLE customers ADD COLUMN IF NOT EXISTS created_by UUID`);

  const aliceId = await upsertCustomer(client, randomUUID(), 'Alice Johnson', 'NAT-001', '0780000001', 'alice@example.com', 'Kigali, Rwanda', adminId);
  const bobId   = await upsertCustomer(client, randomUUID(), 'Bob Smith',     'NAT-002', '0780000002', 'bob@example.com',   'Musanze, Rwanda', adminId);
  const carolId = await upsertCustomer(client, randomUUID(), 'Carol Williams','NAT-003', '0780000003', 'carol@example.com', 'Huye, Rwanda',    adminId);

  await client.end();
  console.log('✓ fems_customers seeded (alice / bob / carol)');
  return { alice: aliceId, bob: bobId, carol: carolId };
}

async function seedExtinguishers(adminId, customerIds) {
  const client = await connect('fems_extinguishers');
  await requireTable(client, 'fems_extinguishers', 'fire_extinguishers');

  // Ensure the columns exist
  await client.query(`ALTER TABLE fire_extinguishers ADD COLUMN IF NOT EXISTS created_by UUID`);
  await client.query(`ALTER TABLE fire_extinguishers ALTER COLUMN customer_id DROP NOT NULL`);

  const today = new Date();
  const addDays = (d) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  };

  const extinguishers = [
    { serial: 'FE-001', type: 'ABC Dry Powder',  capacity: '6kg', purchase: addDays(-730), expiry: addDays(45),   status: 'EXPIRING_SOON', customerId: customerIds.alice },
    { serial: 'FE-002', type: 'CO2',              capacity: '5kg', purchase: addDays(-365), expiry: addDays(120),  status: 'ACTIVE',        customerId: customerIds.alice },
    { serial: 'FE-003', type: 'Foam',             capacity: '9L',  purchase: addDays(-900), expiry: addDays(-10),  status: 'EXPIRED',       customerId: customerIds.alice },
    { serial: 'FE-004', type: 'ABC Dry Powder',   capacity: '4kg', purchase: addDays(-400), expiry: addDays(15),   status: 'EXPIRING_SOON', customerId: customerIds.bob   },
    { serial: 'FE-005', type: 'Water Mist',       capacity: '6L',  purchase: addDays(-200), expiry: addDays(200),  status: 'ACTIVE',        customerId: customerIds.bob   },
    { serial: 'FE-006', type: 'CO2',              capacity: '2kg', purchase: addDays(-600), expiry: addDays(-45),  status: 'EXPIRED',       customerId: customerIds.bob   },
    { serial: 'FE-007', type: 'ABC Dry Powder',   capacity: '6kg', purchase: addDays(-300), expiry: addDays(60),   status: 'EXPIRING_SOON', customerId: customerIds.carol },
    { serial: 'FE-008', type: 'Foam',             capacity: '9L',  purchase: addDays(-100), expiry: addDays(365),  status: 'ACTIVE',        customerId: customerIds.carol },
    { serial: 'FE-009', type: 'CO2',              capacity: '5kg', purchase: addDays(-800), expiry: addDays(-90),  status: 'EXPIRED',       customerId: customerIds.carol },
    { serial: 'FE-010', type: 'ABC Dry Powder',   capacity: '2kg', purchase: addDays(-50),  expiry: addDays(7),    status: 'EXPIRING_SOON', customerId: customerIds.alice },
    { serial: 'FE-FREE-01', type: 'CO2 Available',   capacity: '5kg', purchase: addDays(-10), expiry: addDays(400), status: 'ACTIVE', customerId: null },
    { serial: 'FE-FREE-02', type: 'Foam Available',  capacity: '9L',  purchase: addDays(-5),  expiry: addDays(360), status: 'ACTIVE', customerId: null },
  ];

  for (const ext of extinguishers) {
    // Update dates on existing rows so they stay realistic across re-runs
    const existing = await client.query('SELECT id FROM fire_extinguishers WHERE serial_number = $1', [ext.serial]);
    if (existing.rowCount > 0) {
      await client.query(
        `UPDATE fire_extinguishers SET purchase_date=$1, expiry_date=$2, status=$3, customer_id=$4, updated_at=NOW() WHERE serial_number=$5`,
        [ext.purchase, ext.expiry, ext.status, ext.customerId, ext.serial],
      );
    } else {
      await client.query(
        `INSERT INTO fire_extinguishers (id, serial_number, type, capacity, purchase_date, expiry_date, status, customer_id, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())`,
        [randomUUID(), ext.serial, ext.type, ext.capacity, ext.purchase, ext.expiry, ext.status, ext.customerId, adminId],
      );
    }
  }

  await client.end();
  console.log('✓ fems_extinguishers seeded (12 extinguishers)');
}

async function seedNotifications(customerIds) {
  const client = await connect('fems_notifications');
  await requireTable(client, 'fems_notifications', 'notifications');

  // Insert system_settings (upsert by key)
  await client.query(
    `INSERT INTO system_settings (key, value, updated_at) VALUES
       ('notification_schedule', '{"preExpiryDays":[90,60,30,7],"postExpiryDays":[0,15,30],"escalationDay":60}', NOW()),
       ('escalation_rules', '{"warningDays":[15,30],"escalationDay":60}', NOW())
     ON CONFLICT (key) DO NOTHING`,
  );

  // Only add demo notification if alice has none yet
  const existing = await client.query('SELECT 1 FROM notifications WHERE customer_id = $1 LIMIT 1', [customerIds.alice]);
  if (existing.rowCount === 0) {
    const notifId = randomUUID();
    const extId = randomUUID();
    await client.query(
      `INSERT INTO notifications (id, customer_id, extinguisher_id, message, type, channel, status, sent_at, read_at, created_at)
       VALUES ($1, $2, $3, 'Your fire extinguisher FE-001 expires in 45 days.', 'EXPIRY_60', 'EMAIL', 'SENT', NOW(), NULL, NOW())`,
      [notifId, customerIds.alice, extId],
    );
    await client.query(
      `INSERT INTO notification_deliveries (id, notification_id, channel, status, sent_at, delivered_at, error_message)
       VALUES ($1, $2, 'EMAIL', 'DELIVERED', NOW(), NOW(), NULL)`,
      [randomUUID(), notifId],
    );
  }

  await client.end();
  console.log('✓ fems_notifications seeded');
}

async function seedRenewals(customerIds) {
  const client = await connect('fems_renewals');
  await requireTable(client, 'fems_renewals', 'renewal_requests');

  // Only add demo renewal if alice has none yet
  const existing = await client.query('SELECT 1 FROM renewal_requests WHERE customer_id = $1 LIMIT 1', [customerIds.alice]);
  if (existing.rowCount === 0) {
    await client.query(
      `INSERT INTO renewal_requests (id, customer_id, extinguisher_id, request_type, status, description, created_at, updated_at)
       VALUES ($1, $2, $3, 'SERVICE', 'PENDING', 'Annual service required for FE-003', NOW(), NOW())`,
      [randomUUID(), customerIds.alice, randomUUID()],
    );
  }

  await client.end();
  console.log('✓ fems_renewals seeded');
}

async function seedCompliance(customerIds) {
  const client = await connect('fems_compliance');
  await requireTable(client, 'fems_compliance', 'compliance_cases');

  // Only add demo case if bob has none yet
  const existing = await client.query('SELECT 1 FROM compliance_cases WHERE customer_id = $1 LIMIT 1', [customerIds.bob]);
  if (existing.rowCount === 0) {
    await client.query(
      `INSERT INTO compliance_cases (id, customer_id, extinguisher_id, case_status, created_at, updated_at)
       VALUES ($1, $2, $3, 'OPEN', NOW(), NOW())`,
      [randomUUID(), customerIds.bob, randomUUID()],
    );
  }

  await client.end();
  console.log('✓ fems_compliance seeded');
}

async function main() {
  console.log('Seeding FEMS databases (idempotent — existing real data is preserved)...\n');
  const { adminId } = await seedAuth();
  const customerIds = await seedCustomers(adminId);
  await seedExtinguishers(adminId, customerIds);
  await seedNotifications(customerIds);
  await seedRenewals(customerIds);
  await seedCompliance(customerIds);
  console.log('\nSeed complete!');
  console.log('Admin login:    admin@fems.local / Admin@123');
  console.log('Customer login: alice@example.com / Customer@123');
}

main().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
