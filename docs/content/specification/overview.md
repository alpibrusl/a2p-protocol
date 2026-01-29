# Protocol Specification

Technical specification of the a2p protocol.

---

## Overview

a2p is an open protocol for user-sovereign AI agent profiles. This specification defines:

- **Data Models** — Profile, memory, consent structures
- **API Endpoints** — HTTP REST API
- **Security** — Authentication, authorization, encryption
- **Versioning** — Version negotiation and migration

---

## Protocol Version

**Current Version:** 1.0

```http
A2P-Version: 1.0
```

---

## Terminology

| Term | Definition |
|------|------------|
| **User** | Human owner of a profile |
| **Agent** | AI system accessing profiles |
| **Entity** | Organization, team, or group |
| **Profile** | User-owned data container |
| **Memory** | Piece of information in a profile |
| **Proposal** | Agent-suggested memory awaiting approval |
| **Policy** | Access control rule |
| **DID** | Decentralized Identifier |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       User Layer                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ Profile │  │ Profile │  │ Profile │                     │
│  │  (Web)  │  │ (Mobile)│  │  (CLI)  │                     │
│  └────┬────┘  └────┬────┘  └────┬────┘                     │
└───────┼────────────┼────────────┼───────────────────────────┘
        │            │            │
        ▼            ▼            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Gateway Layer                           │
│                  (HTTP REST API)                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│   Agent 1   │  │   Agent 2   │  │   Agent 3   │
│  (ChatGPT)  │  │  (Claude)   │  │  (Custom)   │
└─────────────┘  └─────────────┘  └─────────────┘
```

---

## Data Models

### Profile

```json
{
  "id": "did:a2p:user:local:alice",
  "version": "1.0",
  "profileType": "human | agent | entity",
  "created": "ISO8601",
  "updated": "ISO8601",
  "identity": { ... },
  "common": { ... },
  "memories": { ... },
  "accessPolicies": [ ... ],
  "pendingProposals": [ ... ]
}
```

See [Schemas](schemas.md) for complete definitions.

### Memory

```json
{
  "id": "mem_xxx",
  "content": "string or object",
  "category": "a2p:category.subcategory",
  "confidence": 0.0-1.0,
  "source": { ... },
  "sensitivity": "low | standard | high",
  "created": "ISO8601"
}
```

### Consent Policy

```json
{
  "id": "policy_xxx",
  "name": "string",
  "agentPattern": "DID pattern with wildcards",
  "allow": ["scope patterns"],
  "deny": ["scope patterns"],
  "permissions": ["read_public", "read_scoped", "propose", ...],
  "conditions": { ... }
}
```

---

## API Endpoints

### Base URL

```
https://gateway.example.com/a2p/v1
```

### Authentication

All requests require signature:

```http
Authorization: A2P-Signature 
  did="did:a2p:agent:local:xxx",
  sig="base64",
  ts="ISO8601",
  nonce="string"
```

### Endpoints

**Protocol Endpoints** (required for conformance):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/profile/:did` | Get profile |
| POST | `/profile/:did/access` | Request access |
| GET | `/profile/:did/memories` | List memories |
| POST | `/profile/:did/memories/propose` | Propose memory |
| GET | `/profile/:did/proposals` | List proposals |
| POST | `/profile/:did/proposals/:id/review` | Review proposal |

**Note**: Implementations MAY provide additional implementation-specific endpoints (e.g., `/api/profiles` for user-facing operations). These are not part of the protocol specification. See [API Reference](api.md) for details.

---

## Security

### Transport

- TLS 1.3 required
- Certificate validation required

### Authentication

- DID-based identity
- Ed25519 signatures (default)
- Timestamp + nonce replay protection

### Authorization

- Policy-based access control
- Scope filtering
- Purpose validation

See [Security](../documentation/security.md) for details.

---

## Versioning

### Header

```http
A2P-Version: 1.0
A2P-Version-Supported: 1.0, 1.1
```

### Compatibility

- MAJOR: Breaking changes
- MINOR: Backward compatible additions
- PATCH: Bug fixes

See [Versioning](versioning.md) for migration details.

---

## Conformance

Implementations must:

1. Support all required endpoints
2. Validate signatures correctly
3. Enforce rate limits
4. Return proper error codes
5. Include version headers

See conformance test suite for validation.

---

## Next Steps

- [Schemas](schemas.md) — Complete JSON schemas
- [API Reference](api.md) — Endpoint details
- [Versioning](versioning.md) — Version migration
