# API Reference

Complete HTTP REST API specification.

---

## Base URL

```
https://gateway.example.com/a2p/v1
```

---

## Authentication

All requests require signature authentication:

```http
Authorization: A2P-Signature 
  did="did:a2p:agent:local:my-agent",
  sig="eyJhbGciOiJFZERTQSJ9...",
  ts="2025-12-25T10:00:00Z",
  nonce="abc123xyz789"
```

---

## Common Headers

### Request

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | A2P-Signature header |
| `Content-Type` | Yes* | `application/json` |
| `A2P-Version` | No | Requested version (default: latest) |

### Response

| Header | Description |
|--------|-------------|
| `A2P-Version` | Protocol version |
| `X-RateLimit-Limit` | Rate limit |
| `X-RateLimit-Remaining` | Remaining requests |
| `X-Request-Id` | Request identifier |

---

## Endpoints

### Get Profile

Retrieve a user's profile (filtered by policies).

```http
GET /a2p/v1/profile/{did}
```

**Parameters:**

| Name | In | Type | Required | Description |
|------|----|----|----------|-------------|
| `did` | path | string | Yes | User DID |
| `scopes` | query | string | No | Comma-separated scopes |

**Response:**

```json
{
  "success": true,
  "data": {
    "id": "did:a2p:user:local:alice",
    "profileType": "human",
    "version": "1.0",
    "common": {
      "preferences": { ... }
    },
    "memories": { ... }
  },
  "meta": {
    "requestId": "req_xxx",
    "timestamp": "2025-12-25T10:00:00Z"
  }
}
```

---

### Request Access

Request access to a user's profile.

```http
POST /a2p/v1/profile/{did}/access
```

**Request Body:**

```json
{
  "scopes": ["a2p:preferences", "a2p:interests"],
  "purpose": {
    "type": "personalization",
    "description": "To personalize responses",
    "legalBasis": "consent",
    "retention": "session_only"
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "receiptId": "rcpt_xxx",
    "grantedScopes": ["a2p:preferences"],
    "deniedScopes": ["a2p:interests"],
    "expiresAt": "2025-12-26T10:00:00Z"
  }
}
```

---

### List Memories

Get memories from a profile.

```http
GET /a2p/v1/profile/{did}/memories
```

**Parameters:**

| Name | In | Type | Description |
|------|----|----|-------------|
| `category` | query | string | Filter by category |
| `limit` | query | integer | Max results (default: 50) |
| `offset` | query | integer | Pagination offset |

**Response:**

```json
{
  "success": true,
  "data": {
    "a2p:professional": {
      "occupation": "Engineer",
      "skills": ["TypeScript", "Python"]
    },
    "a2p:episodic": [
      {
        "id": "mem_001",
        "content": "Prefers concise responses",
        "confidence": 0.9
      }
    ]
  }
}
```

---

### Propose Memory

Submit a memory proposal.

```http
POST /a2p/v1/profile/{did}/memories/propose
```

**Request Body:**

```json
{
  "content": "Prefers TypeScript for new projects",
  "category": "a2p:professional.preferences",
  "confidence": 0.85,
  "context": "Based on coding conversation"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "proposalId": "prop_xxx",
    "status": "pending",
    "expiresAt": "2026-01-01T10:00:00Z"
  }
}
```

---

### List Proposals

Get pending proposals (for user).

```http
GET /a2p/v1/profile/{did}/proposals
```

**Parameters:**

| Name | In | Type | Description |
|------|----|----|-------------|
| `status` | query | string | Filter: pending, approved, rejected |

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "prop_xxx",
      "agentDid": "did:a2p:agent:local:assistant",
      "content": "Prefers TypeScript",
      "category": "a2p:professional",
      "confidence": 0.85,
      "status": "pending",
      "proposedAt": "2025-12-25T10:00:00Z"
    }
  ],
  "meta": {
    "count": 1
  }
}
```

---

### Review Proposal

Approve or reject a proposal.

```http
POST /a2p/v1/profile/{did}/proposals/{proposalId}/review
```

**Request Body:**

```json
{
  "action": "approve",
  "editedContent": "Prefers TypeScript for web projects"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "proposalId": "prop_xxx",
    "status": "approved",
    "memoryId": "mem_yyy"
  }
}
```

---

## Error Responses

```json
{
  "success": false,
  "error": {
    "code": "A2P004",
    "message": "Consent required for scope: a2p:health",
    "details": {
      "deniedScopes": ["a2p:health.*"]
    }
  }
}
```

### Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| A2P001 | 401 | Unauthorized |
| A2P002 | 403 | Forbidden |
| A2P003 | 404 | Not Found |
| A2P004 | 403 | Consent Required |
| A2P005 | 429 | Rate Limited |
| A2P006 | 400 | Invalid Request |
| A2P007 | 401 | Timestamp Invalid |
| A2P008 | 401 | Nonce Reused |

---

## Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| GET /profile | 100 | per hour |
| POST /access | 30 | per hour |
| POST /propose | 20 | per hour |
| POST /review | 50 | per hour |

---

## Implementation-Specific Endpoints

Implementations MAY provide additional endpoints beyond those specified in this protocol. These endpoints are **not part of the protocol specification** and are implementation-specific.

### When to Use Implementation-Specific Endpoints

Implementation-specific endpoints are appropriate for:

1. **User-Facing Operations**:
   - User dashboards (e.g., `/api/dashboard`)
   - Profile management UI (e.g., `/api/profiles`)
   - Administrative operations (e.g., `/api/admin/*`)

2. **Convenience Features**:
   - Token-based profile access (e.g., `/a2p/v1/profile` without DID in path)
   - Batch operations (e.g., `/api/profiles/batch`)
   - Analytics endpoints (e.g., `/api/analytics`)

3. **Custom Features**:
   - Service-specific functionality
   - Integration with other systems
   - Extended capabilities

### Protocol vs Implementation Endpoints

**Protocol Endpoints** (`/a2p/v1/*`):
- MUST be implemented by all conformant implementations
- MUST follow protocol specifications exactly
- MUST use A2P-Signature authentication (or connection tokens)
- MUST have DID in path (for profile operations, unless using connection tokens)
- Are interoperable across all implementations

**Implementation-Specific Endpoints** (`/api/*`, custom paths):
- MAY be implemented by implementations
- Can use different authentication (tokens, sessions, etc.)
- Can use different URL patterns
- Are NOT interoperable (agents cannot rely on them)
- SHOULD be clearly documented as implementation-specific

### Examples

**Valid Implementation-Specific Endpoints**:

```http
# User-facing dashboard
GET /api/profiles                    # List user's profiles (token-based)
GET /api/profiles/:did               # Get specific profile
POST /api/profiles                   # Create profile

# Convenience protocol endpoints (optional)
GET /a2p/v1/profile                 # Profile access without DID in path (token-based)
POST /a2p/v1/profile/memories/propose  # Propose memory without DID in path

# Administrative
GET /api/admin/users                 # Admin operations
POST /api/admin/agents/verify       # Agent verification
```

**Note**: While implementations MAY provide token-based protocol endpoints (without DID in path), agents SHOULD use the standard protocol endpoints (with DID in path) for maximum interoperability.

### Interoperability Considerations

- **Agents** SHOULD only use protocol-standard endpoints (`/a2p/v1/profile/:did`)
- **Users** MAY use implementation-specific endpoints (e.g., `/api/profiles`)
- **Conformance tests** only verify protocol-standard endpoints
- **Custom endpoints** do not affect protocol conformance

---

## Next Steps

- [Schemas](schemas.md) — Data structures
- [Security](../documentation/security.md) — Authentication details
