# Specification Overview

This is the technical specification for the a2p (Agent 2 Profile) protocol.

---

## Specification Documents

| Document | Description |
|----------|-------------|
| [Profiles](profiles.md) | Profile structure and types |
| [Memories](memories.md) | Memory categories and proposals |
| [Consent & Policies](consent.md) | Access control and consent |
| [Security](security.md) | Authentication and security |
| [Schemas](schemas.md) | JSON Schema definitions |

---

## Protocol Version

**Current Version**: 0.1.0 (Initial Release)  
**Status**: Initial Release  
**Last Updated**: January 2026

**Current Version:** 0.1.0 (Initial Release)  
**Status**: Initial Release  
**Last Updated**: January 2026

| Component | Version |
|-----------|---------|
| Protocol | 0.1 |
| Profile Schema | 0.1 |
| API | v1 |

---

## Transport

### Base URL

```
https://gateway.example.com/a2p/v1
```

### Content Type

All requests and responses use JSON:

```
Content-Type: application/json
```

### Version Header

```
A2P-Version: 1.0
```

---

## Endpoints

### Protocol Endpoints (Required)

**Profile Operations**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/profile/{did}` | Get profile |
| POST | `/profile/{did}/access` | Request access |
| GET | `/profile/{did}/memories` | List memories |
| POST | `/profile/{did}/memories/propose` | Propose memory |
| GET | `/profile/{did}/proposals` | List proposals |
| POST | `/profile/{did}/proposals/{id}/review` | Review proposal |

**Agent Operations**:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/agents/{did}` | Get agent profile |

### Implementation-Specific Endpoints

Implementations MAY provide additional endpoints for user-facing operations, administrative functions, or convenience features. These endpoints are **not part of the protocol specification** and should be clearly documented.

**Examples**:
- `/api/profiles` - User-facing profile management (token-based)
- `/api/dashboard` - Dashboard data
- `/a2p/v1/profile` - Convenience endpoint without DID in path (token-based)

**Note**: While implementations MAY provide token-based protocol endpoints (without DID in path), agents SHOULD use the standard protocol endpoints (with DID in path) for maximum interoperability.

See [API Reference](../specification/api.md) for complete details.

---

## Authentication

All requests must include a signature header:

```
Authorization: A2P-Signature 
  did="did:a2p:agent:local:my-agent",
  sig="<base64-signature>",
  ts="2025-12-25T10:00:00Z",
  nonce="abc123xyz789"
```

### Signature Computation

```
signature = sign(privateKey, sha256(
  method + "\n" +
  path + "\n" +
  timestamp + "\n" +
  nonce + "\n" +
  sha256(body)
))
```

---

## Error Responses

### Error Format

```json
{
  "error": {
    "code": "A2P003",
    "message": "Profile not found",
    "details": { ... }
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| A2P001 | 401 | Authentication failed |
| A2P002 | 403 | Access denied |
| A2P003 | 404 | Resource not found |
| A2P004 | 400 | Invalid request |
| A2P005 | 429 | Rate limited |
| A2P006 | 400 | Validation error |
| A2P007 | 401 | Timestamp invalid |

---

## Rate Limiting

### Default Limits

| Limit | Value |
|-------|-------|
| Requests per minute | 60 |
| Requests per hour | 1000 |
| Burst allowance | 1.5x |

### Response Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

---

## Conformance

Implementations must:

1. ✅ Support all required endpoints
2. ✅ Validate signatures correctly
3. ✅ Enforce consent policies
4. ✅ Require purpose in access requests
5. ✅ Generate consent receipts
6. ✅ Support standard memory categories

---

## Next Steps

- [Profiles](profiles.md) — Profile specification
- [Consent](consent.md) — Consent and policies
- [Security](security.md) — Security details
