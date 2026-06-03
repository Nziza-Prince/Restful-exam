-- FEMS PostgreSQL databases
-- Run as superuser, e.g.:
--   psql -U postgres -f scripts/init-databases.sql          (port 5432)
--   psql -U postgres -p 5433 -f scripts/init-databases.sql  (if your server uses 5433)
CREATE DATABASE fems_auth;
CREATE DATABASE fems_customers;
CREATE DATABASE fems_extinguishers;
CREATE DATABASE fems_notifications;
CREATE DATABASE fems_renewals;
CREATE DATABASE fems_compliance;
