# Consent & Policies Specification

This document specifies access control and consent management.

---

## Consent Policies

Users define policies that control agent access.

### Policy Structure

```json
{
  "id": "policy_work",
  "name": "Work Assistants",
  "agentPattern": "did:a2p:agent:local:work-*",
  "allow": [
    "a2p:preferences.*",
    "a2p:professional.*"
  ],
  "deny": [
    "a2p:health.*",
    "a2p:financial.*"
  ],
  "permissions": ["read_scoped", "propose"],
  "conditions": {
    "requirePurpose": true,
    "maxRetention": "24h"
  },
  "validFrom": "2025-01-01T00:00:00Z",
  "validUntil": "2026-01-01T00:00:00Z"
}
```

---

## Permissions

| Permission | Description |
|------------|-------------|
| `read_public` | Read public information only |
| `read_scoped` | Read allowed categories |
| `read_full` | Read entire profile |
| `propose` | Propose new memories |
| `write` | Direct write access (rare) |

---

## Purpose Requirement

Access requests must include purpose:

```json
{
  "purpose": {
    "type": "personalization",
    "description": "Tailor responses to preferences",
    "legalBasis": "consent",
    "retention": "session_only",
    "automated": {
      "decisionMaking": false,
      "profiling": false
    }
  }
}
```

---

## Consent Receipts

When access is granted:

```json
{
  "receiptId": "rcpt_abc123",
  "userDid": "did:a2p:user:local:alice",
  "agentDid": "did:a2p:agent:local:assistant",
  "grantedScopes": ["a2p:preferences.*"],
  "deniedScopes": ["a2p:health.*"],
  "purpose": { ... },
  "grantedAt": "2025-12-25T10:00:00Z",
  "expiresAt": "2025-12-26T10:00:00Z"
}
```

---

## Next Steps

- [Security](security.md) — Security details
- [Profiles](profiles.md) — Profile structure
