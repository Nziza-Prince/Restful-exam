-- FEMS PostgreSQL databases
-- Run with your existing exam user:
--   psql -U exam -d examdb -f scripts/init-databases.sql
-- Or as postgres superuser if exam doesn't have create DB privileges:
--   psql -U postgres -f scripts/init-databases.sql

-- Create databases if they don't exist
SELECT 'CREATE DATABASE fems_auth' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fems_auth')\gexec
SELECT 'CREATE DATABASE fems_customers' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fems_customers')\gexec
SELECT 'CREATE DATABASE fems_extinguishers' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fems_extinguishers')\gexec
SELECT 'CREATE DATABASE fems_notifications' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fems_notifications')\gexec
SELECT 'CREATE DATABASE fems_renewals' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fems_renewals')\gexec
SELECT 'CREATE DATABASE fems_compliance' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'fems_compliance')\gexec

-- Grant privileges to exam user (if running as postgres)
GRANT ALL PRIVILEGES ON DATABASE fems_auth TO exam;
GRANT ALL PRIVILEGES ON DATABASE fems_customers TO exam;
GRANT ALL PRIVILEGES ON DATABASE fems_extinguishers TO exam;
GRANT ALL PRIVILEGES ON DATABASE fems_notifications TO exam;
GRANT ALL PRIVILEGES ON DATABASE fems_renewals TO exam;
GRANT ALL PRIVILEGES ON DATABASE fems_compliance TO exam;
