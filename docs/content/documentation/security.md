# Security

a2p implements defense-in-depth security with multiple layers of protection.

---

## Security Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Network                         │
│  TLS 1.3 • WAF • DDoS mitigation                           │
├─────────────────────────────────────────────────────────────┤
│                    Layer 2: Authentication                  │
│  DID-based identity • Signature verification               │
├─────────────────────────────────────────────────────────────┤
│                    Layer 3: Replay Protection               │
│  Timestamp validation • Nonce checking                     │
├─────────────────────────────────────────────────────────────┤
│                    Layer 4: Authorization                   │
│  Consent policies • Scope validation • Purpose checking    │
├─────────────────────────────────────────────────────────────┤
│                    Layer 5: Rate Limiting                   │
│  Per-agent limits • Per-user limits • Global limits        │
├─────────────────────────────────────────────────────────────┤
│                    Layer 6: Data Protection                 │
│  Encryption at rest • Encryption in transit                │
└─────────────────────────────────────────────────────────────┘
```

---

## Authentication

### DID-Based Identity

All actors (users, agents, entities) are identified by DIDs:

```
did:a2p:user:local:alice
did:a2p:agent:local:my-assistant
did:a2p:org:local:mycompany
```

DIDs are:

- **Self-sovereign** — You control your own identity
- **Cryptographic** — Backed by key pairs
- **Verifiable** — Anyone can verify signatures
- **Portable** — Not tied to any provider

### Request Signing

All API requests must be signed:

```http
POST /a2p/v1/profile/did:a2p:user:local:alice/memories/propose
Authorization: A2P-Signature 
  did="did:a2p:agent:local:my-agent",
  sig="eyJhbGciOiJFZERTQSJ9...",
  ts="2025-12-25T10:00:00Z",
  nonce="abc123xyz789def456",
  exp="300"
Content-Type: application/json
A2P-Version: 1.0

{...}
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

### Timestamp Validation

| Check | Requirement |
|-------|-------------|
| Format | ISO 8601 |
| Window | ±5 minutes from server time |
| Precision | Seconds |

### Nonce Validation

| Check | Requirement |
|-------|-------------|
| Format | 16-32 alphanumeric characters |
| Uniqueness | Not seen in last 5 minutes |
| Storage | Server maintains nonce cache |

### Example Implementation

=== "TypeScript"

    ```typescript
    import { createHash, sign } from 'crypto';
    
    function signRequest(privateKey: string, method: string, path: string, body: object) {
      const timestamp = new Date().toISOString();
      const nonce = crypto.randomUUID().replace(/-/g, '');
      const bodyHash = createHash('sha256')
        .update(JSON.stringify(body))
        .digest('hex');
      
      const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${bodyHash}`;
      const signature = sign('sha256', Buffer.from(message), privateKey);
      
      return {
        timestamp,
        nonce,
        signature: signature.toString('base64')
      };
    }
    ```

---

## Rate Limiting

### Default Limits

| Scope | Limit | Window |
|-------|-------|--------|
| Global (per IP) | 1000 | per hour |
| Per agent | 100 | per hour |
| Per user profile | 60 | per minute |

### Per-Operation Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| Profile reads | 100 | per hour |
| Memory proposals | 20 | per hour |
| Memory writes | 50 | per hour |
| Policy updates | 10 | per hour |
| Consent grants | 30 | per hour |

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1735126800
Retry-After: 60
```

---

## Key Management

### Supported Algorithms

| Algorithm | Use | Status |
|-----------|-----|--------|
| Ed25519 | Signatures | ✅ Recommended |
| secp256k1 | Signatures | ✅ Supported |
| P-256 | Signatures | ✅ Supported |
| X25519 | Key exchange | ✅ Recommended |

### Key Rotation

Keys should be rotated:

- **Scheduled**: Every 12 months
- **On compromise**: Immediately
- **On personnel change**: Within 72 hours

```json
{
  "keyRotation": {
    "gracePeriod": "7d",
    "notification": {
      "method": "webhook",
      "advanceNotice": "24h"
    }
  }
}
```

### Key Recovery

Multiple recovery methods supported:

| Method | Description |
|--------|-------------|
| Social recovery | Shamir secret sharing with trusted contacts |
| Backup key | Encrypted backup stored securely |
| Custodian | Trusted third-party recovery service |

---

## Data Protection

### Encryption at Rest

| Data | Encryption |
|------|------------|
| Profile data | AES-256-GCM |
| Keys | Hardware security module (HSM) |
| Backups | AES-256-GCM + envelope encryption |

### Encryption in Transit

| Protocol | Requirement |
|----------|-------------|
| TLS | 1.3 required, 1.2 minimum |
| Cipher suites | AEAD only (AES-GCM, ChaCha20-Poly1305) |
| Certificate | Valid, trusted CA |

---

## Privacy Protection

### DID Enumeration Protection

Prevent attackers from discovering valid DIDs:

1. **Constant-time responses** — Same timing for exists/not-exists
2. **Consistent errors** — Same error message for all "not found" cases
3. **Rate limiting** — Block scanning attempts

### Data Minimization

- Only request scopes you need
- Use shortest practical retention
- Delete data when no longer needed

---

## Error Codes

| Code | Name | Description |
|------|------|-------------|
| A2P001 | Unauthorized | Missing or invalid authentication |
| A2P002 | Forbidden | Valid auth but insufficient permissions |
| A2P003 | Not Found | Resource doesn't exist |
| A2P004 | Consent Required | Need user consent for this scope |
| A2P005 | Rate Limited | Too many requests |
| A2P006 | Invalid Request | Malformed request |
| A2P007 | Timestamp Invalid | Timestamp outside acceptable window |
| A2P008 | Nonce Reused | Nonce already seen |

---

## Security Best Practices

### For Agent Developers

- ✅ Keep private keys secure (HSM or secure enclave)
- ✅ Rotate keys regularly
- ✅ Use minimum required scopes
- ✅ Implement proper error handling
- ✅ Log access for audit trails
- ❌ Don't log sensitive data
- ❌ Don't store user data beyond stated retention

### For Gateway Operators

- ✅ Use TLS 1.3
- ✅ Implement rate limiting
- ✅ Maintain nonce cache
- ✅ Regular security updates
- ✅ Monitor for anomalies
- ✅ Regular penetration testing

### For Users

- ✅ Use strong policies
- ✅ Review consent receipts regularly
- ✅ Revoke unused agent access
- ✅ Keep recovery methods secure
- ✅ Use sub-profiles for sensitive contexts

---

## Post-Quantum Roadmap

a2p has a defined path to post-quantum security:

| Phase | Timeline | Actions |
|-------|----------|---------|
| Preparation | 2025-2026 | Hybrid key support |
| Migration | 2027-2028 | Transition to PQ algorithms |
| PQ-Native | 2029+ | Classical algorithms deprecated |

### Supported PQ Algorithms

| Algorithm | Type | Status |
|-----------|------|--------|
| Dilithium | Signatures | Planned |
| Falcon | Signatures | Alternative |
| SPHINCS+ | Signatures | High-security option |
| Kyber | Key encapsulation | Planned |

---

## Reporting Security Issues

**Do not report security vulnerabilities publicly.**

Email: security@a2p.protocol

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Your contact information

Response timeline:
- Critical: 4 hours
- High: 24 hours
- Medium: 72 hours
- Low: 7 days

---

## Next Steps

- [Specification: API](../specification/api.md) — API security details
- [Legal: GDPR](../legal/gdpr.md) — Privacy compliance
