# FEMS Database Design

Each microservice owns its PostgreSQL database. TypeORM `synchronize: true` in development auto-creates schemas.

## fems_auth

### users
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| full_name | VARCHAR(255) | |
| email | VARCHAR(255) UNIQUE | |
| password | VARCHAR(255) | bcrypt hash |
| role | ENUM | ADMIN, CUSTOMER |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

### refresh_tokens
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK | |
| token_hash | VARCHAR | SHA-256 of raw token |
| expires_at | TIMESTAMP | |
| revoked_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | |

### audit_logs
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID | nullable |
| action | VARCHAR(255) | |
| entity | VARCHAR(255) | |
| entity_id | UUID | nullable |
| created_at | TIMESTAMP | |

## fems_customers

### customers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| full_name | VARCHAR(255) | |
| national_id | VARCHAR(50) | |
| phone | VARCHAR(20) | |
| email | VARCHAR(255) UNIQUE | Links to users.email |
| address | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## fems_extinguishers

### fire_extinguishers
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| serial_number | VARCHAR(100) | |
| type | VARCHAR(100) | |
| capacity | VARCHAR(50) | |
| purchase_date | DATE | |
| expiry_date | DATE | |
| status | ENUM | ACTIVE, EXPIRING_SOON, EXPIRED, RENEWED |
| customer_id | UUID | Reference to fems_customers |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## fems_notifications

### notifications
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| customer_id | UUID | |
| extinguisher_id | UUID | nullable |
| message | TEXT | |
| type | VARCHAR | EXPIRY_90, EXPIRY_60, etc. |
| channel | ENUM | EMAIL, SMS |
| status | ENUM | SENT, READ |
| sent_at | TIMESTAMP | |
| read_at | TIMESTAMP | nullable |
| created_at | TIMESTAMP | |

Unique constraint: `(type, extinguisher_id, customer_id)`

### notification_deliveries
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| notification_id | UUID FK | |
| channel | ENUM | EMAIL, SMS |
| status | ENUM | SENT, DELIVERED, FAILED |
| sent_at | TIMESTAMP | |
| delivered_at | TIMESTAMP | nullable |
| error_message | TEXT | nullable |

### system_settings
| Column | Type | Notes |
|--------|------|-------|
| key | VARCHAR PK | |
| value | JSONB | |
| updated_at | TIMESTAMP | |

## fems_renewals

### renewal_requests
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| customer_id | UUID | |
| extinguisher_id | UUID | |
| request_type | ENUM | SERVICE, REPLACEMENT, INSPECTION |
| status | ENUM | PENDING, APPROVED, REJECTED, COMPLETED |
| description | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## fems_compliance

### compliance_cases
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| customer_id | UUID | |
| extinguisher_id | UUID | |
| case_status | ENUM | OPEN, WARNING_SENT, FINAL_WARNING, ESCALATED, CLOSED |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## Initialization

```bash
psql -U postgres -f scripts/init-databases.sql
node scripts/seed.mjs
```
