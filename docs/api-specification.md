# API Specification

## Status

This is the draft backend contract for the AWS order draft service.

The UI still runs locally today, so this spec is the target integration contract rather than a live deployed endpoint description.

## Base rules

- Version all public endpoints under `/v1`.
- Return JSON only.
- Keep error responses machine-readable.
- Keep the QR token opaque and at least 128 bits of entropy.

## Resource model

### Draft

```json
{
  "token": "base64url-token",
  "storeId": "mcdonald",
  "menuIds": [101, 201, 301],
  "status": "draft",
  "createdAt": "2026-08-16T09:00:00.000Z",
  "updatedAt": "2026-08-16T09:00:00.000Z"
}
```

### Completed order

```json
{
  "orderId": "ord_01J...",
  "token": "base64url-token",
  "storeId": "mcdonald",
  "menuIds": [101, 201, 301],
  "status": "completed",
  "completedAt": "2026-08-16T09:10:00.000Z"
}
```

## Endpoints

### `POST /v1/drafts`

Create a draft order and return the token that will be embedded in the QR URL.

Request body:

```json
{
  "storeId": "mcdonald",
  "menuIds": [101, 201, 301]
}
```

Response `201`:

```json
{
  "token": "base64url-token",
  "draft": {
    "storeId": "mcdonald",
    "menuIds": [101, 201, 301],
    "status": "draft"
  },
  "qrUrl": "https://example.com/v1/drafts/base64url-token"
}
```

### `GET /v1/drafts/{token}`

Fetch a draft by token.

Response `200`:

```json
{
  "token": "base64url-token",
  "storeId": "mcdonald",
  "menuIds": [101, 201, 301],
  "status": "draft",
  "createdAt": "2026-08-16T09:00:00.000Z"
}
```

### `POST /v1/drafts/{token}/complete`

Mark a draft as completed and create a separate order record.

Request body:

```json
{
  "source": "kiosk",
  "paymentRef": "optional-upstream-reference"
}
```

Response `201`:

```json
{
  "orderId": "ord_01J...",
  "token": "base64url-token",
  "status": "completed"
}
```

## Error shape

All errors should use the same envelope:

```json
{
  "error": {
    "code": "invalid_request",
    "message": "menuIds must contain at least one item"
  }
}
```

## Error codes

| HTTP | Code | Meaning |
|---|---|---|
| 400 | `invalid_request` | Body or token is malformed |
| 404 | `draft_not_found` | Token does not exist |
| 409 | `draft_already_completed` | Draft was already finalized |
| 410 | `draft_expired` | Draft is no longer valid |
| 500 | `internal_error` | Unexpected failure |

## CORS

- Allow only explicitly configured origins.
- Use environment variables for the allow-list.
- Keep local development and ChatGPT Sites origin entries separate.
- Do not use wildcard origins in production.

## Validation rules

- `storeId` must be a known store key.
- `menuIds` must be a non-empty array of positive integers.
- `token` must be opaque and must not encode menu data.
- The response body must never include personal or payment data.

## QR URL rule

The QR should contain the API lookup URL with the token only.

Example:

```text
https://api.example.com/v1/drafts/base64url-token
```

The QR must not include raw menu details, customer identity, or payment details.
