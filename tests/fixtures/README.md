## Wealthfolio API fixture capture

- Capture date: 2026-05-14
- Instance: `http://localhost:8088`

### Authentication findings

- Attempted the provided ordered common test password candidates against `POST /api/v1/auth/login`; use `<password>` as the placeholder when referring to those attempts.
- All five attempts failed with `401 Unauthorized` and body `{ "code": 401, "message": "Invalid password" }` when paced to avoid rate limiting.
- Earlier rapid retries triggered rate limiting on the login endpoint with `429 Too Many Requests` and `retry-after` / `x-ratelimit-after` headers.
- No successful login was obtained, so no authenticated cookie was issued.
- Cookie name: not observed.
- Cookie attributes (`HttpOnly`, `Secure`, `SameSite`, `Path`, `Max-Age`/`Expires`): not observable because no `Set-Cookie` header was returned on failed login attempts.
- `expiresIn` unit: not observable because no successful login response was returned.
- CSRF tokens: none observed in responses or headers captured during this spike.

### Endpoint auth behavior

- Public without auth:
  - `GET /api/v1/healthz` → `ok`
  - `GET /api/v1/readyz` → `ok`
  - `GET /api/v1/auth/status` → `{ "requiresPassword": true }`
- Requires auth in this instance:
  - `GET /api/v1/openapi.json` → `401 Unauthorized`
  - `GET /api/v1/accounts` → `401 Unauthorized`
  - `GET /api/v1/holdings` → `401 Unauthorized`
  - `GET /api/v1/allocations` → `401 Unauthorized`
  - `GET /api/v1/performance/summary` → `401 Unauthorized`
  - `GET /api/v1/performance/history` → `401 Unauthorized`
  - `GET /api/v1/net-worth` → `401 Unauthorized`
  - `POST /api/v1/activities/search` with `{ "page": 1, "pageSize": 10 }` → `401 Unauthorized`

### Pagination shape

- Pagination request shape was confirmed from the endpoint contract used for capture: `POST /api/v1/activities/search` with body `{ "page": 1, "pageSize": 10 }`.
- Pagination response shape could not be observed because the endpoint returned `401 Unauthorized` without authentication.

### Empty portfolio response shapes

- Not observable in this environment because no valid password was available.
- Auth-protected portfolio endpoints returned only `{ "code": 401, "message": "Unauthorized" }`, so shapes like `accounts: []` or `holdings: []` could not be captured.
