# FEMS API Reference

Base URL: `http://localhost:3000/api`

Interactive documentation: http://localhost:3000/api/docs

## Authentication

All protected endpoints require `Authorization: Bearer <accessToken>`.

### POST /auth/register
Register a customer account.

Updated requirement endpoints:

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | /auth/register | Public | Register with firstName, lastName, email, password; role defaults to user/customer |
| POST | /auth/login | Public | Login and receive JWT access + refresh tokens |
| POST | /auth/logout | Authenticated | Revoke refresh token |
| POST | /auth/forgot-password | Public | Generate password reset token |
| POST | /auth/reset-password | Public | Reset password with token |
| GET | /users/me | Authenticated | View profile |
| PATCH | /users/me | Authenticated | Update firstName, lastName, or email |
| POST | /users/me/change-password | Authenticated | Change password |
| POST | /extinguishers | Admin | Register extinguisher: serialNumber, location, type, size, installationDate, expiryDate, status |
| GET | /extinguishers | Admin/User/Inspector | Paginated extinguisher list |
| GET | /extinguishers/:id | Admin/User/Inspector | Extinguisher details |
| PATCH | /extinguishers/:id | Admin | Update extinguisher |
| DELETE | /extinguishers/:id | Admin | Remove extinguisher |
| POST | /extinguishers/:id/inspections | User | Request inspection with date/time; new status is PENDING |
| GET | /extinguishers/inspections | Admin/Inspector | Paginated inspection requests; supports status filter |
| GET | /extinguishers/:id/inspections | Admin/Inspector | Paginated inspection list |
| PATCH | /extinguishers/inspections/:inspectionId | Admin | Administrative update of inspection status/assignment |
| PATCH | /extinguishers/inspections/:inspectionId/start | Inspector | Start inspection; status becomes IN_PROGRESS |
| POST | /extinguishers/inspections/:inspectionId/report | Inspector | Submit condition, notes, actionsTaken, result, inspectionDate; status becomes COMPLETED_PENDING_ADMIN_REVIEW |
| PATCH | /extinguishers/inspections/:inspectionId/review | Admin | Approve, reject, or mark REQUIRES_MAINTENANCE |
| POST | /extinguishers/:id/maintenance | Admin/Inspector | Log actions taken, action date, and conditions noted |
| GET | /extinguishers/:id/maintenance | Admin/Inspector | Paginated maintenance history |
| GET | /reports/total-stock | Admin | Total extinguisher count |
| GET | /reports/compliance-summary | Admin | Combined compliance report export with stock total, inspection status, expired extinguishers, and maintenance history |
| GET | /reports/daily | Admin | Daily extinguisher report, export with ?format=csv/pdf |
| GET | /reports/monthly | Admin | Monthly extinguisher report, export with ?format=csv/pdf |
| GET | /reports/yearly | Admin | Yearly extinguisher report, export with ?format=csv/pdf |
| GET | /reports/inspection-status | Admin | Inspection status report |
| GET | /reports/maintenance-history | Admin | Maintenance history export |

```json
{
  "fullName": "Alice Johnson",
  "email": "alice@example.com",
  "password": "SecurePass123!"
}
```

### POST /auth/login
```json
{
  "email": "admin@fems.local",
  "password": "Admin@123"
}
```

Response includes `accessToken` and `refreshToken`.

### POST /auth/refresh
```json
{ "refreshToken": "<token>" }
```

### POST /auth/logout
```json
{ "refreshToken": "<token>" }
```

## Users

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | /users/me | Any | Current user profile |
| GET | /users | Admin | Paginated user list |

## Customers

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | /customers | Admin | List with search/pagination |
| POST | /customers | Admin | Create customer |
| GET | /customers/:id | Admin | Get by ID |
| PATCH | /customers/:id | Admin | Update |
| DELETE | /customers/:id | Admin | Delete |
| GET | /customers/me | Customer | Own profile |

## Extinguishers

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | /extinguishers | Admin/User/Inspector | Paginated list with filters |
| GET | /extinguishers/mine | User | Own extinguishers |
| GET | /extinguishers/:id | Admin/User/Inspector | View extinguisher details |
| POST | /extinguishers | Admin | Register extinguisher |
| PATCH | /extinguishers/:id | Admin | Update |
| DELETE | /extinguishers/:id | Admin | Delete |
| POST | /extinguishers/:id/inspections | User | Request inspection with date/time |
| GET | /extinguishers/inspections | Admin/Inspector | View pending, assigned, or submitted inspection requests |
| PATCH | /extinguishers/inspections/:inspectionId/start | Inspector | Move request to IN_PROGRESS |
| POST | /extinguishers/inspections/:inspectionId/report | Inspector | Submit report and move to admin review |
| PATCH | /extinguishers/inspections/:inspectionId/review | Admin | Final decision: APPROVED, REJECTED, or REQUIRES_MAINTENANCE |
| POST | /extinguishers/:id/maintenance | Admin/Inspector | Log maintenance actions taken, action date, and conditions noted |

Query params: `status`, `customerId`, `expiryFrom`, `expiryTo`, `search`, `page`, `limit`

Inspection statuses: `PENDING`, `IN_PROGRESS`, `COMPLETED_PENDING_ADMIN_REVIEW`, `APPROVED`, `REJECTED`, `REQUIRES_MAINTENANCE`.

## Notifications

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | /notifications | Admin | All notifications |
| GET | /notifications/me | Customer | Own notifications |
| PATCH | /notifications/:id/read | Customer | Mark as read |

## Renewals

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | /renewals | Admin | All requests |
| GET | /renewals/mine | Customer | Own requests |
| POST | /renewals | Customer | Submit request |
| PATCH | /renewals/:id/approve | Admin | Approve |
| PATCH | /renewals/:id/reject | Admin | Reject |
| PATCH | /renewals/:id/complete | Admin | Complete |

## Compliance

| Method | Path | Role | Description |
|--------|------|------|-------------|
| GET | /compliance/cases | Admin | List cases |
| POST | /compliance/cases/:id/close | Admin | Close case |

## Reports

| Method | Path | Role | Format |
|--------|------|------|--------|
| GET | /reports/compliance-summary | Admin | ?format=pdf\|xlsx\|csv |
| GET | /reports/total-stock | Admin | JSON |
| GET | /reports/inspection-status | Admin | ?format=pdf\|xlsx\|csv |
| GET | /reports/maintenance-history | Admin | ?format=pdf\|xlsx\|csv |
| GET | /reports/dashboard-summary | Admin | JSON |

## Settings

| Method | Path | Role | Description |
|--------|------|------|-------------|
| PUT | /settings/notification-schedule | Admin | Configure alert days |
| PUT | /settings/escalation-rules | Admin | Configure escalation |

## Error Format

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed"
}
```

## Pagination

List endpoints return:

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```
