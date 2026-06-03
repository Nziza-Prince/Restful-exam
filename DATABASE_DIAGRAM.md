# FEMS Database Diagram (Mermaid)

## Complete Entity Relationship Diagram

```mermaid
erDiagram
    %% Auth Database (fems_auth)
    USERS {
        uuid id PK
        varchar email UK
        varchar password
        varchar full_name
        enum role
        timestamp created_at
        timestamp updated_at
    }
    
    REFRESH_TOKENS {
        uuid id PK
        uuid user_id FK
        varchar token UK
        timestamp expires_at
        timestamp created_at
    }
    
    AUDIT_LOGS {
        uuid id PK
        uuid user_id FK
        varchar action
        varchar entity_type
        varchar entity_id
        json old_value
        json new_value
        varchar ip_address
        timestamp created_at
    }

    %% Customer Database (fems_customers)
    CUSTOMERS {
        uuid id PK
        varchar email UK
        varchar full_name
        varchar national_id UK
        varchar phone
        varchar address
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }

    %% Extinguisher Database (fems_extinguishers)
    FIRE_EXTINGUISHERS {
        uuid id PK
        varchar serial_number UK
        varchar type
        varchar capacity
        date purchase_date
        date expiry_date
        enum status
        uuid customer_id FK
        uuid created_by FK
        timestamp last_inspection_date
        timestamp created_at
        timestamp updated_at
    }
    
    INSPECTION_REVIEWS {
        uuid id PK
        uuid extinguisher_id FK
        uuid inspector_id FK
        date inspection_date
        enum inspection_type
        enum status
        text findings
        text recommendations
        text corrective_actions
        date next_inspection_date
        varchar attachments
        timestamp created_at
        timestamp updated_at
    }
    
    MAINTENANCE_HISTORY {
        uuid id PK
        uuid extinguisher_id FK
        uuid performed_by FK
        date maintenance_date
        enum maintenance_type
        text description
        decimal cost
        text parts_replaced
        enum status
        timestamp created_at
        timestamp updated_at
    }

    %% Notification Database (fems_notifications)
    NOTIFICATIONS {
        uuid id PK
        uuid customer_id FK
        uuid extinguisher_id FK
        text message
        enum type
        enum channel
        enum status
        timestamp sent_at
        timestamp read_at
        timestamp created_at
    }
    
    NOTIFICATION_DELIVERIES {
        uuid id PK
        uuid notification_id FK
        enum channel
        enum status
        timestamp sent_at
        timestamp delivered_at
        text error_message
    }
    
    SYSTEM_SETTINGS {
        varchar key PK
        json value
        timestamp updated_at
    }

    %% Renewal Database (fems_renewals)
    RENEWAL_REQUESTS {
        uuid id PK
        uuid customer_id FK
        uuid extinguisher_id FK
        enum request_type
        enum status
        text description
        decimal quoted_price
        date scheduled_date
        uuid approved_by FK
        timestamp approved_at
        timestamp created_at
        timestamp updated_at
    }

    %% Compliance Database (fems_compliance)
    COMPLIANCE_CASES {
        uuid id PK
        uuid customer_id FK
        uuid extinguisher_id FK
        enum case_status
        text escalation_notes
        timestamp escalated_at
        timestamp resolved_at
        timestamp created_at
        timestamp updated_at
    }

    %% Relationships
    USERS ||--o{ REFRESH_TOKENS : "has"
    USERS ||--o{ AUDIT_LOGS : "generates"
    USERS ||--o{ CUSTOMERS : "creates"
    USERS ||--o{ FIRE_EXTINGUISHERS : "creates"
    USERS ||--o{ INSPECTION_REVIEWS : "performs"
    USERS ||--o{ MAINTENANCE_HISTORY : "performs"
    USERS ||--o{ RENEWAL_REQUESTS : "approves"
    
    CUSTOMERS ||--o{ FIRE_EXTINGUISHERS : "owns"
    CUSTOMERS ||--o{ NOTIFICATIONS : "receives"
    CUSTOMERS ||--o{ RENEWAL_REQUESTS : "submits"
    CUSTOMERS ||--o{ COMPLIANCE_CASES : "has"
    
    FIRE_EXTINGUISHERS ||--o{ INSPECTION_REVIEWS : "undergoes"
    FIRE_EXTINGUISHERS ||--o{ MAINTENANCE_HISTORY : "has"
    FIRE_EXTINGUISHERS ||--o{ NOTIFICATIONS : "triggers"
    FIRE_EXTINGUISHERS ||--o{ RENEWAL_REQUESTS : "subject_of"
    FIRE_EXTINGUISHERS ||--o{ COMPLIANCE_CASES : "subject_of"
    
    NOTIFICATIONS ||--o{ NOTIFICATION_DELIVERIES : "has"
```

## Simplified View by Database

### 1. Auth Database (fems_auth)
```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : has
    USERS ||--o{ AUDIT_LOGS : generates
    
    USERS {
        uuid id
        varchar email
        varchar full_name
        enum role
    }
    
    REFRESH_TOKENS {
        uuid id
        uuid user_id
        varchar token
        timestamp expires_at
    }
    
    AUDIT_LOGS {
        uuid id
        uuid user_id
        varchar action
        varchar entity_type
    }
```

### 2. Customer Database (fems_customers)
```mermaid
erDiagram
    CUSTOMERS {
        uuid id
        varchar email
        varchar full_name
        varchar national_id
        varchar phone
        varchar address
        uuid created_by
    }
```

### 3. Extinguisher Database (fems_extinguishers)
```mermaid
erDiagram
    FIRE_EXTINGUISHERS ||--o{ INSPECTION_REVIEWS : undergoes
    FIRE_EXTINGUISHERS ||--o{ MAINTENANCE_HISTORY : has
    
    FIRE_EXTINGUISHERS {
        uuid id
        varchar serial_number
        varchar type
        varchar capacity
        date expiry_date
        enum status
        uuid customer_id
    }
    
    INSPECTION_REVIEWS {
        uuid id
        uuid extinguisher_id
        uuid inspector_id
        date inspection_date
        enum status
        text findings
    }
    
    MAINTENANCE_HISTORY {
        uuid id
        uuid extinguisher_id
        uuid performed_by
        date maintenance_date
        enum maintenance_type
        text description
    }
```

### 4. Notification Database (fems_notifications)
```mermaid
erDiagram
    NOTIFICATIONS ||--o{ NOTIFICATION_DELIVERIES : has
    
    NOTIFICATIONS {
        uuid id
        uuid customer_id
        uuid extinguisher_id
        text message
        enum type
        enum status
    }
    
    NOTIFICATION_DELIVERIES {
        uuid id
        uuid notification_id
        enum channel
        enum status
    }
    
    SYSTEM_SETTINGS {
        varchar key
        json value
    }
```

### 5. Renewal Database (fems_renewals)
```mermaid
erDiagram
    RENEWAL_REQUESTS {
        uuid id
        uuid customer_id
        uuid extinguisher_id
        enum request_type
        enum status
        text description
        decimal quoted_price
    }
```

### 6. Compliance Database (fems_compliance)
```mermaid
erDiagram
    COMPLIANCE_CASES {
        uuid id
        uuid customer_id
        uuid extinguisher_id
        enum case_status
        text escalation_notes
    }
```

## Key Points

### Logical Links (Cross-Database)
- `customers.email` ↔ `users.email` (resolved at runtime)
- `fire_extinguishers.customer_id` → references `customers.id`
- `notifications.customer_id` → references `customers.id`
- `renewal_requests.customer_id` → references `customers.id`
- `compliance_cases.customer_id` → references `customers.id`

### User Roles
- **Admin**: Full system access
- **Customer**: Limited to own records
- **Inspector** (future): Can perform inspections

### Status Enums
- **Extinguisher Status**: ACTIVE, EXPIRING_SOON, EXPIRED, UNDER_MAINTENANCE
- **Inspection Status**: PENDING, APPROVED, REJECTED, REQUIRES_ACTION
- **Maintenance Type**: ROUTINE, REPAIR, REFILL, REPLACEMENT
- **Request Type**: SERVICE, REPLACEMENT
- **Case Status**: OPEN, ESCALATED, RESOLVED, CLOSED
