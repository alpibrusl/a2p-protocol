# Security Specification

This document specifies authentication, authorization, and security measures.

---

## Authentication

### Signature Header

```
Authorization: A2P-Signature 
  did="did:a2p:agent:local:my-agent",
  sig="<base64-signature>",
  ts="2025-12-25T10:00:00Z",
  nonce="abc123xyz789",
  exp="300"
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

## Replay Protection

| Check | Requirement |
|-------|-------------|
| Timestamp | Within ±300 seconds |
| Nonce | Unique, not seen in 5 minutes |
| Format | 16-32 alphanumeric characters |

---

## Rate Limiting

| Limit | Default |
|-------|---------|
| Requests/minute | 60 |
| Requests/hour | 1000 |
| Burst | 1.5x |

### Headers

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

---

## Key Management

### Rotation

| Trigger | Response Time |
|---------|---------------|
| Scheduled | Planned |
| Compromise | Immediate |
| Personnel change | 72 hours |

### Recovery

- Social recovery (Shamir)
- Backup keys
- Custodian recovery

---

## Encryption

| Layer | Algorithm |
|-------|-----------|
| Transport | TLS 1.3 |
| At rest | AES-256-GCM |
| Signatures | Ed25519 |

---

## Post-Quantum Roadmap

| Phase | Timeline |
|-------|----------|
| Preparation | 2025-2026 |
| Hybrid | 2026-2027 |
| Migration | 2027-2028 |
| PQ-native | 2029+ |

---

## Next Steps

- [Schemas](schemas.md) — JSON Schema files
- [Overview](overview.md) — Specification overview
