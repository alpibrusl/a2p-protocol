# GDPR Compliance

How a2p implements GDPR requirements.

---

## Overview

a2p is designed with GDPR compliance built-in:

| GDPR Principle | a2p Implementation |
|----------------|-------------------|
| Purpose limitation | Required purpose field |
| Consent | Granular consent policies |
| Data minimization | Scoped access |
| Transparency | Audit trails |
| Data subject rights | User-owned profiles |

---

## Article Mapping

### Article 5: Principles

| Principle | Implementation |
|-----------|---------------|
| Purpose limitation | `purpose.type` and `purpose.description` required |
| Data minimization | Scope-based access, only request what's needed |
| Storage limitation | `purpose.retention` declaration |

### Article 6: Lawful Basis

```json
{
  "purpose": {
    "legalBasis": "consent"  // or contract, etc.
  }
}
```

### Articles 15-22: Data Subject Rights

| Right | Implementation |
|-------|---------------|
| Access | User views own profile |
| Rectification | User edits profile |
| Erasure | User deletes memories |
| Portability | JSON export |
| Object | Revoke consent per agent |

---

## Consent Receipts

Every access creates a receipt:

```json
{
  "receiptId": "rcpt_abc123",
  "grantedAt": "2025-12-25T10:00:00Z",
  "purpose": { ... },
  "grantedScopes": ["a2p:preferences.*"]
}
```

---

## Next Steps

- [EU AI Act](ai-act.md) — AI Act compliance
- [DPIA Guide](dpia.md) — Assessment guide
