# API Reference

This document covers all API endpoints in the Polyglot SaaS Foundation. Endpoints are divided into two categories:

- **Internal API** (`/api/*`) — session-authenticated, used by the app's own frontend
- **Public API** (`/api/v1/*`) — API key-authenticated, for external integrations

## Authentication

### Internal Endpoints

Internal endpoints use Supabase session cookies. These are set automatically when a user logs in. All internal endpoints require an active session — unauthenticated requests receive a `401` response.

### Public API Endpoints

Public API endpoints use Bearer token authentication with API keys:

```
Authorization: Bearer pk_live_abc123def456...
```

API keys are created in the app at `/app/api-keys` (Pro plan only). Each key is scoped to a single organization.

---

## Public API

### `GET /api/v1/me`

Returns information about the organization associated with the API key.

**Authentication**: Bearer token (API key)

**Rate limit**: 100 requests/minute per API key

**Response** `200`:

```json
{
	"organization": {
		"id": "uuid",
		"name": "Acme Corp"
	}
}
```

**Error responses**:

| Status | Body                | Reason                          |
| ------ | ------------------- | ------------------------------- |
| 401    | `Unauthorized`      | Missing or invalid Bearer token |
| 429    | `Too Many Requests` | Rate limit exceeded             |
| 500    | `Internal error`    | Organization lookup failed      |

---

## Internal API

### Stripe

#### `POST /api/stripe/checkout`

Creates a Stripe Checkout session for upgrading to Pro.

**Rate limit**: 10 requests/minute per IP

**Request body**: None

**Response** `200`:

```json
{
	"url": "https://checkout.stripe.com/c/pay/..."
}
```

The client should redirect to the returned URL.

**Behavior**:

- Creates a new Stripe customer if one doesn't exist (stores `organization_id` in customer metadata)
- Reuses the existing customer if the org already has one
- Blocks checkout if the org already has an active or trialing subscription
- Uses an idempotency key to prevent duplicate sessions

**Error responses**:

| Status | Body                                    | Reason                 |
| ------ | --------------------------------------- | ---------------------- |
| 401    | `Unauthorized`                          | Not logged in          |
| 400    | `No active organization`                | User has no active org |
| 400    | `Organization already has an active...` | Already subscribed     |

---

#### `POST /api/stripe/webhook`

Receives and processes Stripe webhook events. This endpoint is called by Stripe, not by the frontend.

**Authentication**: Stripe webhook signature (verified via `STRIPE_WEBHOOK_SECRET`)

**Handled events**:

| Event                           | Action                            |
| ------------------------------- | --------------------------------- |
| `customer.subscription.created` | Upsert `org_billing` row          |
| `customer.subscription.updated` | Update subscription status/period |
| `customer.subscription.deleted` | Mark subscription as canceled     |
| `invoice.payment_succeeded`     | Confirm active billing            |
| `invoice.payment_failed`        | Update billing status             |

**Response**: Always `200` (Stripe retries on non-2xx)

---

#### `POST /api/stripe/portal`

Creates a Stripe Customer Portal session for managing the subscription.

**Request body**: None

**Response** `200`:

```json
{
	"url": "https://billing.stripe.com/p/session/..."
}
```

**Error responses**:

| Status | Body                      | Reason                   |
| ------ | ------------------------- | ------------------------ |
| 401    | `Unauthorized`            | Not logged in            |
| 400    | `No active organization`  | User has no active org   |
| 400    | `No billing record found` | Org has never subscribed |

---

### Organizations

#### `POST /api/organizations/switch`

Switches the user's active organization.

**Request body**:

```json
{
	"organizationId": "uuid"
}
```

**Response** `200`:

```json
{
	"ok": true
}
```

**Error responses**:

| Status | Body                                | Reason               |
| ------ | ----------------------------------- | -------------------- |
| 401    | `Unauthorized`                      | Not logged in        |
| 400    | `Missing organizationId`            | Missing field        |
| 403    | `Not a member of this organization` | User is not a member |

---

### Invites

#### `POST /api/invites/create`

Creates a team invitation and sends an invite email.

**Rate limit**: 5 requests/minute per IP

**Request body**:

```json
{
	"email": "teammate@example.com",
	"role": "member"
}
```

`role` is optional, defaults to `"member"`. Valid values: `"admin"`, `"member"`.

**Response** `200`:

```json
{
	"invite_link": "/invite/abc123def456..."
}
```

**Behavior**:

- Checks seat limit (free: 3, pro: 10) — counts members + pending invites
- Sends an invite email via Resend (or logs to console in dev)
- Invite expires in 7 days

**Error responses**:

| Status | Body                                            | Reason                |
| ------ | ----------------------------------------------- | --------------------- |
| 401    | `Unauthorized`                                  | Not logged in         |
| 400    | `Email is required`                             | Missing email         |
| 400    | `No active organization`                        | No active org         |
| 400    | `Seat limit reached for the X plan (N seats).`  | Seat limit hit        |
| 400    | `User already invited`                          | Pending invite exists |
| 400    | `User is already a member of this organization` | Already a member      |
| 403    | `Not allowed to invite members`                 | Not owner/admin       |

---

#### `DELETE /api/invites/[inviteId]`

Cancels a pending invite.

**URL params**: `inviteId` — UUID of the invite

**Response** `200`:

```json
{
	"ok": true
}
```

**Error responses**:

| Status | Body               | Reason                      |
| ------ | ------------------ | --------------------------- |
| 401    | `Unauthorized`     | Not logged in               |
| 403    | `Not allowed`      | Not owner/admin             |
| 404    | `Invite not found` | Invalid or already accepted |

---

### Members

#### `DELETE /api/members/[memberUserId]`

Removes a member from the organization.

**URL params**: `memberUserId` — UUID of the user to remove

**Response** `200`:

```json
{
	"ok": true
}
```

**Behavior**:

- Clears the removed user's `active_org_id` if it was set to this org
- Prevents removing yourself (use "Leave Organization" in settings instead)
- Prevents removing the last owner

**Error responses**:

| Status | Body                           | Reason                       |
| ------ | ------------------------------ | ---------------------------- |
| 401    | `Unauthorized`                 | Not logged in                |
| 403    | `Not allowed`                  | Not owner/admin              |
| 400    | `Cannot remove yourself`       | Use leave instead            |
| 400    | `Cannot remove the last owner` | Org needs at least one owner |

---

#### `PATCH /api/members/[memberUserId]/role`

Changes a member's role.

**URL params**: `memberUserId` — UUID of the user

**Request body**:

```json
{
	"role": "admin"
}
```

Valid values: `"owner"`, `"admin"`, `"member"`.

**Response** `200`:

```json
{
	"ok": true
}
```

**Error responses**:

| Status | Body                           | Reason                      |
| ------ | ------------------------------ | --------------------------- |
| 401    | `Unauthorized`                 | Not logged in               |
| 403    | `Not allowed`                  | Not an owner                |
| 400    | `Cannot change your own role`  | Self-demotion blocked       |
| 400    | `Cannot remove the last owner` | Demoting last owner blocked |

---

### API Keys

#### `GET /api/api-keys`

Lists all active (non-revoked) API keys for the current organization.

**Response** `200`:

```json
{
	"keys": [
		{
			"id": "uuid",
			"name": "Production Key",
			"prefix": "pk_live_abc12",
			"scopes": ["read"],
			"last_used_at": "2025-01-15T10:30:00Z",
			"expires_at": "2025-07-15T00:00:00Z",
			"created_at": "2025-01-15T00:00:00Z"
		}
	]
}
```

---

#### `POST /api/api-keys`

Creates a new API key. The full key is returned **once** in the response — it cannot be retrieved again.

**Rate limit**: 10 requests/minute per IP

**Request body**:

```json
{
	"name": "Production Key",
	"expires_in_days": 90
}
```

`expires_in_days` is optional. If omitted, the key does not expire.

**Response** `200`:

```json
{
	"key": "pk_live_abc123def456...",
	"prefix": "pk_live_abc12"
}
```

**Requirements**: Pro plan, owner or admin role.

**Error responses**:

| Status | Body                             | Reason          |
| ------ | -------------------------------- | --------------- |
| 401    | `Unauthorized`                   | Not logged in   |
| 403    | `API keys require a Pro plan`    | Free plan       |
| 403    | `Not allowed to manage API keys` | Not owner/admin |

---

#### `POST /api/api-keys/[keyId]/revoke`

Revokes an API key. The key will immediately stop working for authentication.

**URL params**: `keyId` — UUID of the API key

**Response** `200`:

```json
{
	"success": true
}
```

**Error responses**:

| Status | Body            | Reason                      |
| ------ | --------------- | --------------------------- |
| 401    | `Unauthorized`  | Not logged in               |
| 403    | `Not allowed`   | Not owner/admin             |
| 404    | `Key not found` | Invalid key ID or wrong org |

---

## Error Format

All error responses follow SvelteKit's standard error format:

```json
{
	"message": "Human-readable error message"
}
```

## Rate Limiting

When a rate limit is exceeded, the response includes:

```
HTTP/1.1 429 Too Many Requests
Retry-After: 45

{
  "error": "Too many requests. Try again in 45 seconds."
}
```

| Endpoint Group       | Limit       | Key        |
| -------------------- | ----------- | ---------- |
| Auth (login/signup)  | 10 req/min  | IP address |
| Invite creation      | 5 req/min   | IP address |
| API key creation     | 10 req/min  | IP address |
| Stripe checkout      | 10 req/min  | IP address |
| Public API (`/v1/*`) | 100 req/min | API key    |
