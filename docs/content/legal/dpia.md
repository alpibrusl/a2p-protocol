# DPIA Guidance

Data Protection Impact Assessment guidance for a2p implementations.

---

## When Is a DPIA Required?

A DPIA is required when processing:

- Large-scale personal data
- Special categories (health, beliefs)
- Automated decision-making
- Systematic monitoring

Most a2p implementations involving memory storage should conduct a DPIA.

---

## DPIA Template for a2p

### 1. Processing Description

| Item | Description |
|------|-------------|
| **Purpose** | User profile management for AI personalization |
| **Data processed** | Preferences, memories, interaction context |
| **Data subjects** | End users |
| **Recipients** | AI agents (with consent) |
| **Retention** | User-controlled |

### 2. Necessity Assessment

| Question | a2p Answer |
|----------|-----------|
| Is processing necessary? | Yes - enables personalization |
| Could less data achieve goal? | Users control scope |
| Is legal basis clear? | Yes - consent/contract |

### 3. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Unauthorized access | Low | High | DID auth, signatures |
| Data breach | Low | High | Encryption, access logs |
| Profile inference | Medium | Medium | Scope restrictions |
| Purpose creep | Low | Medium | Purpose validation |

### 4. Mitigation Measures

| Measure | Implementation |
|---------|---------------|
| **Access control** | Policy-based, scope filtering |
| **Encryption** | TLS 1.3, AES-256 at rest |
| **Minimization** | User-controlled scopes |
| **Transparency** | Consent receipts, audit logs |
| **User control** | Edit, delete, export capabilities |

---

## Risk Scoring

### Inherent Risk

```
Inherent Risk = Likelihood × Impact
```

| Score | Level | Action |
|-------|-------|--------|
| 1-4 | Low | Monitor |
| 5-9 | Medium | Mitigate |
| 10-16 | High | Significant measures |
| 17-25 | Very High | Reconsider processing |

### Residual Risk (After Mitigation)

| Risk | Inherent | After Mitigation |
|------|----------|-----------------|
| Unauthorized access | 12 (High) | 4 (Low) |
| Data breach | 12 (High) | 4 (Low) |
| Profile inference | 9 (Medium) | 3 (Low) |

---

## Consultation

### When to Consult DPA

- Residual risk remains high
- Novel technology
- Large scale processing
- Special categories without consent

### a2p Recommendation

Most implementations using standard a2p patterns will have **low residual risk** and not require DPA consultation.

---

## Documentation Template

```markdown
# DPIA: [Your Implementation]

## 1. Overview
- Processing activity: [Description]
- Data controller: [Name]
- DPO contact: [Email]

## 2. Processing Details
- Categories: [List]
- Subjects: [Number]
- Retention: [Period]

## 3. Legal Basis
- Primary: [Consent/Contract/...]
- Documentation: [Link]

## 4. Risk Assessment
[Table from above]

## 5. Mitigations
- Technical: [List]
- Organizational: [List]

## 6. Conclusion
- Residual risk: [Level]
- DPA consultation: [Required/Not required]

## 7. Review
- Next review: [Date]
- Trigger events: [List]
```

---

## Next Steps

- [GDPR Compliance](gdpr.md) — Full GDPR guidance
- [Security](../documentation/security.md) — Technical measures
