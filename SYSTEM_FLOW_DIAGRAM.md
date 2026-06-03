# FEMS System Flow Diagrams

## 1. Overall System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer"]
        Browser["Web Browser"]
        Mobile["Mobile App (Future)"]
    end
    
    subgraph Frontend["Frontend (React)"]
        UI["UI Components"]
        Redux["Redux State"]
        API_Client["API Client (Axios)"]
    end
    
    subgraph Gateway["API Gateway :3000"]
        Proxy["HTTP Proxy"]
        Auth_MW["JWT Middleware"]
        CORS["CORS Handler"]
        Swagger["Swagger Docs"]
    end
    
    subgraph Services["Microservices"]
        Auth["Auth Service :3001"]
        Customer["Customer Service :3002"]
        Extinguisher["Extinguisher Service :3003"]
        Notification["Notification Service :3004"]
        Renewal["Renewal Service :3005"]
        Compliance["Compliance Service :3006"]
        Report["Report Service :3007"]
    end
    
    subgraph Database["PostgreSQL Databases"]
        DB_Auth[("fems_auth")]
        DB_Customer[("fems_customers")]
        DB_Extinguisher[("fems_extinguishers")]
        DB_Notification[("fems_notifications")]
        DB_Renewal[("fems_renewals")]
        DB_Compliance[("fems_compliance")]
    end
    
    subgraph External["External Services"]
        Email["Email (SMTP)"]
        SMS["SMS Provider (Future)"]
    end
    
    Browser --> UI
    Mobile -.-> UI
    UI --> Redux
    Redux --> API_Client
    API_Client --> Proxy
    
    Proxy --> Auth_MW
    Auth_MW --> CORS
    CORS --> Swagger
    
    Gateway --> Auth
    Gateway --> Customer
    Gateway --> Extinguisher
    Gateway --> Notification
    Gateway --> Renewal
    Gateway --> Compliance
    Gateway --> Report
    
    Auth --> DB_Auth
    Customer --> DB_Customer
    Extinguisher --> DB_Extinguisher
    Notification --> DB_Notification
    Renewal --> DB_Renewal
    Compliance --> DB_Compliance
    
    Notification --> Email
    Notification -.-> SMS
    
    Report --> Customer
    Report --> Extinguisher
    Report --> Notification
    Report --> Renewal
    Report --> Compliance
    
    style Gateway fill:#4A90E2
    style Services fill:#7ED321
    style Database fill:#F5A623
    style External fill:#D0021B
```

## 2. User Authentication Flow

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Gateway
    participant AuthService
    participant Database
    
    User->>Frontend: Enter credentials
    Frontend->>Gateway: POST /api/auth/login
    Gateway->>AuthService: Forward request
    AuthService->>Database: Verify credentials
    Database-->>AuthService: User record
    AuthService->>AuthService: Generate JWT + Refresh Token
    AuthService->>Database: Store refresh token
    AuthService-->>Gateway: Return tokens
    Gateway-->>Frontend: Return tokens
    Frontend->>Frontend: Store tokens
    Frontend-->>User: Show dashboard
    
    Note over Frontend,AuthService: Subsequent requests include JWT
    
    Frontend->>Gateway: GET /api/extinguishers (with JWT)
    Gateway->>Gateway: Verify JWT
    Gateway->>ExtinguisherService: Forward request
    ExtinguisherService-->>Gateway: Return data
    Gateway-->>Frontend: Return data
```

## 3. Fire Extinguisher Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Registered: Admin adds extinguisher
    
    Registered --> ACTIVE: Purchase date set
    
    ACTIVE --> EXPIRING_SOON: 90 days before expiry
    ACTIVE --> UNDER_MAINTENANCE: Maintenance scheduled
    
    EXPIRING_SOON --> EXPIRED: Past expiry date
    EXPIRING_SOON --> RENEWED: Serviced/Replaced
    
    EXPIRED --> COMPLIANCE_CASE: 60 days overdue
    EXPIRED --> RENEWED: Serviced/Replaced
    
    COMPLIANCE_CASE --> ESCALATED: Reported to authorities
    COMPLIANCE_CASE --> RESOLVED: Customer complies
    
    UNDER_MAINTENANCE --> ACTIVE: Maintenance completed
    UNDER_MAINTENANCE --> EXPIRED: Maintenance overdue
    
    RENEWED --> ACTIVE: New expiry date set
    
    RESOLVED --> ACTIVE: Back in compliance
    
    ACTIVE --> [*]: Extinguisher retired
    EXPIRED --> [*]: Extinguisher retired
```

## 4. Notification Flow

```mermaid
flowchart TD
    A[Cron Job Runs Daily] --> B{Check All Extinguishers}
    B --> C{Days Until Expiry?}
    
    C -->|90 days| D[Create 90-Day Alert]
    C -->|60 days| E[Create 60-Day Alert]
    C -->|30 days| F[Create 30-Day Alert]
    C -->|7 days| G[Create 7-Day Alert]
    C -->|0 days EXPIRED| H[Create Expiry Alert]
    C -->|15 days overdue| I[Create 15-Day Overdue]
    C -->|30 days overdue| J[Create 30-Day Warning]
    C -->|60 days overdue| K[Create 60-Day Escalation]
    
    D --> L[Save to notifications table]
    E --> L
    F --> L
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L
    
    L --> M{Send via channel}
    M -->|Email| N[Queue Email]
    M -->|SMS| O[Queue SMS Future]
    
    N --> P[Send Email via SMTP]
    O -.-> Q[Send SMS]
    
    P --> R[Log Delivery Status]
    Q -.-> R
    
    K --> S[Create Compliance Case]
    S --> T[Notify Authorities]
```

## 5. Inspection vs Maintenance Process

```mermaid
flowchart LR
    subgraph Inspection["Inspection Process"]
        direction TB
        I1[Visual Inspection] --> I2[Pressure Check]
        I2 --> I3[Safety Pin Check]
        I3 --> I4[Hose/Nozzle Check]
        I4 --> I5[Label Check]
        I5 --> I6{Pass or Fail?}
        I6 -->|Pass| I7[Approve - Set Next Inspection]
        I6 -->|Fail| I8[Reject - Schedule Maintenance]
    end
    
    subgraph Maintenance["Maintenance Process"]
        direction TB
        M1[Diagnose Issue] --> M2{Maintenance Type}
        M2 -->|Routine| M3[Clean & Check]
        M2 -->|Refill| M4[Refill Agent]
        M2 -->|Repair| M5[Fix Component]
        M2 -->|Replace| M6[Replace Parts]
        M3 --> M7[Record Cost & Parts]
        M4 --> M7
        M5 --> M7
        M6 --> M7
        M7 --> M8[Update Extinguisher Status]
        M8 --> M9[Schedule Next Inspection]
    end
    
    Extinguisher[Fire Extinguisher] --> Inspection
    I8 --> Maintenance
    Maintenance --> I1
    
    style Inspection fill:#E3F2FD
    style Maintenance fill:#FFF3E0
```

## 6. Report Generation Flow

```mermaid
flowchart TD
    A[Admin Requests Report] --> B{Report Type}
    
    B --> C[Expired Extinguishers]
    B --> D[Expiring Soon]
    B --> E[Customer Compliance]
    B --> F[Renewal Requests]
    B --> G[Notifications Log]
    B --> H[Maintenance History]
    B --> I[Inspection Reviews]
    
    C --> J[Fetch from Extinguisher Service]
    D --> J
    E --> K[Fetch from Multiple Services]
    F --> L[Fetch from Renewal Service]
    G --> M[Fetch from Notification Service]
    H --> N[Fetch from Extinguisher Service]
    I --> N
    
    J --> O{Output Format}
    K --> O
    L --> O
    M --> O
    N --> O
    
    O -->|CSV| P[Generate CSV]
    O -->|PDF| Q[Generate PDF]
    O -->|XLSX| R[Generate Excel]
    O -->|JSON| S[Return JSON]
    
    P --> T[Download File]
    Q --> T
    R --> T
    S --> T
```

## 7. Customer Self-Service Flow

```mermaid
flowchart TD
    A[Customer Logs In] --> B[View Dashboard]
    B --> C{Choose Action}
    
    C --> D[View My Extinguishers]
    C --> E[View Notifications]
    C --> F[Request Service]
    
    D --> G[See Extinguisher List]
    G --> H{Filter by Status}
    H --> I[ACTIVE]
    H --> J[EXPIRING_SOON]
    H --> K[EXPIRED]
    
    E --> L[See All Notifications]
    L --> M[Mark as Read]
    
    F --> N[Select Extinguisher]
    N --> O{Request Type}
    O --> P[Service]
    O --> Q[Replacement]
    P --> R[Submit Request]
    Q --> R
    R --> S[Admin Reviews]
    S --> T{Approve or Reject}
    T --> U[Schedule Service]
    T --> V[Reject with Reason]
    U --> W[Notify Customer]
    V --> W
```

## 8. Admin Workflow

```mermaid
flowchart TD
    A[Admin Logs In] --> B[Admin Dashboard]
    B --> C{Main Tasks}
    
    C --> D[Manage Customers]
    C --> E[Manage Extinguishers]
    C --> F[Review Inspections]
    C --> G[Process Renewals]
    C --> H[Generate Reports]
    C --> I[View Notifications]
    
    D --> D1[Add Customer]
    D --> D2[Edit Customer]
    D --> D3[View Customer Details]
    
    E --> E1[Register Extinguisher]
    E --> E2[Assign to Customer]
    E --> E3[Update Status]
    E --> E4[View History]
    
    F --> F1[List Pending Inspections]
    F1 --> F2[Review Findings]
    F2 --> F3{Decision}
    F3 --> F4[Approve]
    F3 --> F5[Reject - Require Maintenance]
    
    G --> G1[View Renewal Requests]
    G1 --> G2[Review Request]
    G2 --> G3{Decision}
    G3 --> G4[Approve & Quote]
    G3 --> G5[Reject]
    
    H --> H1[Select Report Type]
    H1 --> H2[Choose Date Range]
    H2 --> H3[Generate & Download]
```

## 9. Service-to-Service Communication

```mermaid
sequenceDiagram
    participant Cron as Cron Job
    participant ExtSvc as Extinguisher Service
    participant NotifSvc as Notification Service
    participant CustSvc as Customer Service
    participant CompSvc as Compliance Service
    
    Note over Cron,CompSvc: Daily Status Check
    
    Cron->>ExtSvc: Check expiring extinguishers
    ExtSvc->>ExtSvc: Update statuses
    ExtSvc->>NotifSvc: POST /internal/notifications/trigger
    
    NotifSvc->>CustSvc: GET /internal/customers/:id
    CustSvc-->>NotifSvc: Customer details
    
    NotifSvc->>NotifSvc: Create notification
    NotifSvc->>NotifSvc: Send email
    
    alt 60 days overdue
        NotifSvc->>CompSvc: POST /internal/compliance/escalate
        CompSvc->>CompSvc: Create compliance case
        CompSvc-->>NotifSvc: Case created
    end
    
    NotifSvc-->>ExtSvc: Notification sent
```

## Key Differences: Inspection vs Maintenance

### **Inspection Reviews**
- **Purpose**: Safety verification, compliance check
- **Performed by**: Inspector (can be internal staff or external)
- **Frequency**: Regular intervals (monthly, quarterly, annually)
- **Result**: Pass/Fail status, recommendations
- **Action**: Approve for continued use OR flag for maintenance
- **Records**: Findings, photos, next inspection date

### **Maintenance History**
- **Purpose**: Repair, service, refill, or replace
- **Performed by**: Technician or service provider
- **Trigger**: Failed inspection, scheduled service, or customer request
- **Result**: Extinguisher restored to working condition
- **Action**: Physical work done, parts replaced, agent refilled
- **Records**: Cost, parts used, work description, status update

### **Simple Analogy**
- **Inspection** = Doctor's checkup (looking for problems)
- **Maintenance** = Medical treatment (fixing problems)
