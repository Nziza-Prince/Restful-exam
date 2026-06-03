# FEMS API Reference

Base URL: `http://localhost:3000/api`

Interactive documentation: http://localhost:3000/api/docs

## Authentication

All protected endpoints require `Authorization: Bearer <accessToken>`.

### POST /auth/register
Register a customer account.

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
| GET | /extinguishers | Admin | List with filters |
| GET | /extinguishers/mine | Customer | Own extinguishers |
| POST | /extinguishers | Admin | Create |
| PATCH | /extinguishers/:id | Admin | Update |
| DELETE | /extinguishers/:id | Admin | Delete |

Query params: `status`, `customerId`, `expiryFrom`, `expiryTo`, `search`, `page`, `limit`

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
| GET | /reports/expired-extinguishers | Admin | ?format=pdf\|xlsx\|csv |
| GET | /reports/expiring-soon | Admin | ?format=pdf\|xlsx\|csv |
| GET | /reports/customer-compliance | Admin | ?format=pdf\|xlsx\|csv |
| GET | /reports/renewal-requests | Admin | ?format=pdf\|xlsx\|csv |
| GET | /reports/notifications | Admin | ?format=pdf\|xlsx\|csv |
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
