# GDPR Compliance

How a2p enables GDPR compliance for AI agents.

---

## Overview

a2p is designed with GDPR principles at its core:

| GDPR Principle | a2p Implementation |
|---------------|-------------------|
| Lawfulness | Purpose and legal basis required |
| Purpose limitation | Purpose declared in every request |
| Data minimization | Scope-based access control |
| Accuracy | User-controlled profiles |
| Storage limitation | Retention policies |
| Integrity | Cryptographic signatures |
| Accountability | Audit logs, consent receipts |

---

## Purpose Limitation (Article 5)

Every access request must declare purpose:

```json
{
  "purpose": {
    "type": "personalization",
    "description": "To tailor responses to preferences",
    "legalBasis": "consent",
    "retention": "session_only"
  }
}
```

Users can restrict access by purpose:

```json
{
  "purposeRequirements": {
    "allowedPurposes": ["personalization", "support"],
    "deniedPurposes": ["research", "marketing"]
  }
}
```

---

## Legal Basis (Article 6)

Agents must declare legal basis:

| Basis | When to Use |
|-------|-------------|
| `consent` | User explicitly agreed |
| `contract` | Necessary for service |
| `legal_obligation` | Required by law |
| `legitimate_interests` | Business need (balanced) |

```json
{
  "legalBasis": "consent",
  "consentDetails": {
    "method": "explicit_click",
    "timestamp": "2025-12-25T10:00:00Z",
    "withdrawable": true
  }
}
```

---

## Data Subject Rights

### Right of Access (Article 15)

```typescript
// User exports all their data
const data = await userClient.exportProfile();
```

### Right to Rectification (Article 16)

```typescript
// User corrects data
await userClient.updateMemory('mem_001', {
  content: 'Corrected information'
});
```

### Right to Erasure (Article 17)

```typescript
// User deletes data
await userClient.deleteMemory('mem_001');

// Delete all data from agent
await userClient.deleteMemoriesFrom('did:a2p:agent:local:xxx');
```

### Right to Portability (Article 20)

```typescript
// Export in machine-readable format
const portable = await userClient.exportProfile({
  format: 'json',
  include: ['memories', 'preferences']
});
```

---

## Consent Management

### Consent Receipts

Every access generates a receipt:

```json
{
  "receiptId": "rcpt_xxx",
  "userDid": "did:a2p:user:local:alice",
  "agentDid": "did:a2p:agent:local:assistant",
  "grantedScopes": ["a2p:preferences"],
  "purpose": "personalization",
  "legalBasis": "consent",
  "grantedAt": "2025-12-25T10:00:00Z",
  "proof": { ... }
}
```

### Consent Withdrawal

```typescript
// Revoke consent for agent
await userClient.revokeAccess('did:a2p:agent:local:xxx');

// Immediate effect
// Agent loses access
// Receipt marked revoked
```

---

## Data Breach Notification (Article 33)

### Detection

```json
{
  "breachDetection": {
    "monitoredEvents": [
      "unauthorized_access",
      "bulk_export",
      "unusual_pattern"
    ]
  }
}
```

### Notification

- **User notification:** Within 72 hours
- **DPA notification:** If high risk
- **Content:** Nature, scope, measures, contact

---

## Implementation Checklist

- [ ] Purpose required in all access requests
- [ ] Legal basis recorded
- [ ] Consent receipts generated
- [ ] Export endpoint available
- [ ] Delete endpoint available
- [ ] Breach notification system
- [ ] Audit logging enabled

---

## Next Steps

- [EU AI Act](ai-act.md) — AI-specific compliance
- [DPIA Guidance](dpia.md) — Impact assessments
