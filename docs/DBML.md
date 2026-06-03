# FEMS DBML for dbdiagram.io

Paste the DBML below into dbdiagram.io. Services own separate PostgreSQL databases, so cross-service references are documented as logical references.

```dbml
Enum user_role {
  admin
  user
  inspector
}

Enum extinguisher_status {
  ACTIVE
  EXPIRING_SOON
  EXPIRED
  RENEWED
}

Enum inspection_status {
  PENDING
  IN_PROGRESS
  COMPLETED_PENDING_ADMIN_REVIEW
  APPROVED
  REJECTED
  REQUIRES_MAINTENANCE
}

Enum renewal_request_type {
  SERVICE
  REPLACEMENT
  INSPECTION
}

Enum renewal_request_status {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
}

Enum compliance_case_status {
  OPEN
  IN_PROGRESS
  RESOLVED
  ESCALATED
}

Table users {
  id uuid [pk]
  first_name varchar(100)
  last_name varchar(100)
  full_name varchar(200)
  email varchar(255) [unique]
  password varchar(255)
  role user_role
  created_at timestamptz
  updated_at timestamptz
}

Table refresh_tokens {
  id uuid [pk]
  user_id uuid
  token_hash varchar(64)
  expires_at timestamptz
  revoked_at timestamptz
  created_at timestamptz
}

Table audit_logs {
  id uuid [pk]
  user_id uuid
  action varchar(100)
  entity varchar(100)
  entity_id uuid
  metadata jsonb
  created_at timestamptz
}

Table customers {
  id uuid [pk]
  full_name varchar(200)
  national_id varchar(100)
  phone varchar(30)
  email varchar(255) [unique]
  address text
  created_by uuid
  invitation_token_hash varchar(64)
  invitation_expires_at timestamptz
  created_at timestamptz
  updated_at timestamptz
}

Table fire_extinguishers {
  id uuid [pk]
  serial_number varchar(100) [unique]
  type varchar(100) // Water, CO2, Foam, Dry Chemical
  location varchar(200)
  size varchar(50) // 2.5lbs, 5lbs, 9lbs, 12lbs
  capacity varchar(50) // legacy alias for size
  installation_date date
  purchase_date date // legacy alias for installation_date
  expiry_date date
  status extinguisher_status
  customer_id uuid
  created_by uuid
  created_at timestamptz
  updated_at timestamptz
}

Table extinguisher_inspections {
  id uuid [pk]
  extinguisher_id uuid
  scheduled_at timestamptz
  requested_by uuid
  inspector_id uuid
  status inspection_status
  notes text
  report_condition text
  report_notes text
  actions_taken text
  inspection_result varchar(100)
  inspection_date date
  admin_review_notes text
  created_at timestamptz
  updated_at timestamptz
}

Table maintenance_logs {
  id uuid [pk]
  extinguisher_id uuid
  actions_taken text
  action_date date
  conditions_noted text
  logged_by uuid
  created_at timestamptz
  updated_at timestamptz
}

Table renewal_requests {
  id uuid [pk]
  customer_id uuid
  extinguisher_id uuid
  request_type renewal_request_type
  status renewal_request_status
  notes text
  created_at timestamptz
  updated_at timestamptz
}

Table compliance_cases {
  id uuid [pk]
  customer_id uuid
  extinguisher_id uuid
  case_status compliance_case_status
  issue text
  resolution text
  created_at timestamptz
  updated_at timestamptz
}

Table notifications {
  id uuid [pk]
  customer_id uuid
  extinguisher_id uuid
  type varchar(50)
  status varchar(50)
  message text
  created_at timestamptz
  updated_at timestamptz
}

Table notification_deliveries {
  id uuid [pk]
  notification_id uuid
  channel varchar(30)
  recipient varchar(255)
  status varchar(50)
  error text
  created_at timestamptz
  updated_at timestamptz
}

Ref: refresh_tokens.user_id > users.id
Ref: audit_logs.user_id > users.id
Ref: fire_extinguishers.customer_id > customers.id
Ref: extinguisher_inspections.extinguisher_id > fire_extinguishers.id
Ref: maintenance_logs.extinguisher_id > fire_extinguishers.id
Ref: renewal_requests.customer_id > customers.id
Ref: renewal_requests.extinguisher_id > fire_extinguishers.id
Ref: compliance_cases.customer_id > customers.id
Ref: compliance_cases.extinguisher_id > fire_extinguishers.id
Ref: notifications.customer_id > customers.id
Ref: notifications.extinguisher_id > fire_extinguishers.id
Ref: notification_deliveries.notification_id > notifications.id
```
