# Security Policy

## Supported Versions

| Version | Supported |
| ------- | --------- |
| latest  | ✅        |

Only the latest release receives security fixes. Pin to a specific release tag and update regularly.

## Reporting a Vulnerability

Open a [GitHub issue](https://github.com/wirux/mcp-wealthfolio/issues) and label it **security**. Include:

- A description of the vulnerability and its potential impact
- Steps to reproduce or a minimal proof-of-concept
- Any suggested mitigations

Expect an initial response within 72 hours. If the issue is confirmed, a fix will be released as soon as practical and credited to the reporter unless anonymity is requested.

## Security Measures

### Path Traversal Prevention

The `WEALTHFOLIO_PASSWORD_FILE` path is validated before the file is read. Any path containing `../` is rejected with an error, preventing directory traversal attacks that could expose files outside the intended location. The read is wrapped in a `try/catch` so filesystem errors surface as explicit messages rather than unhandled exceptions.

### Response Size Limit

All HTTP responses from the Wealthfolio API are checked against a **10 MB** ceiling using the `Content-Length` header. Responses exceeding this limit throw a `ResponseTooLargeError` before the body is parsed, protecting against memory exhaustion from unexpectedly large payloads.

### Loopback-Only HTTP Enforcement

When the Wealthfolio URL uses the `http:` scheme, the hostname must resolve to a loopback address (`127.0.0.1`, `localhost`, or `::1`). Connections to non-loopback hosts over plain HTTP are rejected at startup unless `WEALTHFOLIO_ALLOW_INSECURE=true` is explicitly set, reducing the risk of credential exposure over unencrypted network links.

### Cookie Validation

After a successful login, the `set-cookie` header is parsed and validated before use:

- The cookie string must contain an `=` sign at a non-zero position.
- Both the cookie name and value must be non-empty strings.

Malformed cookies cause an `AuthenticationError` rather than silently propagating an invalid session token.

### Authentication Timeout

Login requests are issued with a 10-second `AbortController` deadline. If the Wealthfolio server does not respond within this window, the request is aborted and a `ConnectionError` is raised. This prevents indefinite hangs during authentication.

### Read-Only Enforcement

`WealthfolioClient.assertReadOnly()` maintains an explicit whitelist of POST endpoints that are permitted:

- `/api/v1/auth/*` — authentication
- `/api/v1/activities/search` — read-only search
- `/api/v1/performance/summary` and `/api/v1/performance/history` — read-only analytics
- `/api/v1/market-data/sync` — price synchronisation (explicitly opt-in)

Any other non-GET request throws a `ValidationError`, ensuring the MCP server cannot inadvertently mutate Wealthfolio data.

### No Credentials in Logs

`console.log` is forbidden throughout the codebase. All diagnostic output is written to `stderr`, which keeps credentials and session tokens out of the stdio JSON-RPC transport stream and prevents accidental credential leakage in log aggregation pipelines.
