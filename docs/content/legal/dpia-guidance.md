# a2p Data Protection Impact Assessment (DPIA) Guidance

**Version:** 1.0.0-draft  
**Status:** Draft  
**Last Updated:** December 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [When DPIA is Required](#2-when-dpia-is-required)
3. [DPIA Template](#3-dpia-template)
4. [Risk Assessment](#4-risk-assessment)
5. [Mitigation Measures](#5-mitigation-measures)
6. [Documentation](#6-documentation)
7. [Review and Updates](#7-review-and-updates)

---

## 1. Overview

This document provides guidance for conducting Data Protection Impact Assessments (DPIAs) for a2p protocol implementations, as required by GDPR Article 35.

### 1.1 Purpose

A DPIA helps organizations:
- Identify and minimize data protection risks
- Demonstrate compliance with GDPR
- Build user trust through transparency
- Avoid costly remediation after deployment

### 1.2 Legal Basis

**GDPR Article 35** requires a DPIA when processing is "likely to result in a high risk to the rights and freedoms of natural persons."

---

## 2. When DPIA is Required

### 2.1 Mandatory DPIA Scenarios

| Scenario | Applies to a2p? | Rationale |
|----------|-----------------|-----------|
| Systematic profiling with legal effects | ⚠️ Possible | If agent decisions affect user access to services |
| Large-scale special categories | ⚠️ Possible | If health/biometric data in profiles |
| Systematic public monitoring | ❌ No | a2p doesn't monitor public spaces |
| New technologies | ✅ Yes | AI agents are considered new technology |
| Prevents rights exercise | ⚠️ Possible | If profile required for service access |
| Automated decision-making | ⚠️ Possible | If agents make automated decisions |
| Vulnerable subjects | ⚠️ Possible | Children's profiles, health contexts |
| Innovative use of data | ✅ Yes | Cross-agent profile sharing is innovative |

### 2.2 a2p-Specific Triggers

**DPIA Required** when implementing:
- Profile storage containing special category data (health, biometrics)
- Entity profiles with employee data
- Children's profiles (age verification needed)
- Cross-border data transfers
- Automated memory consolidation affecting user rights
- Agent certification systems with profiling

**DPIA Recommended** for:
- Any new a2p deployment
- Adding new memory categories
- Integrating new agents
- Changing storage backends

### 2.3 Decision Flowchart

```
Start
  │
  ├─ Does processing involve new technology (AI agents)? ──Yes──┐
  │                                                              │
  ├─ Does processing involve profiling? ───────────────Yes──────┤
  │                                                              │
  ├─ Does processing involve special category data? ───Yes──────┤
  │                                                              │
  ├─ Is processing large scale? ───────────────────────Yes──────┤
  │                                                              │
  ├─ Does processing involve vulnerable individuals? ──Yes──────┤
  │                                                              │
  No to all                                            ┌─────────┘
  │                                                    │
  ▼                                                    ▼
DPIA not mandatory                              DPIA REQUIRED
(but recommended)
```

---

## 3. DPIA Template

### 3.1 Project Description

```markdown
## 1. Project Information

**Project Name:** [e.g., "ACME Corp a2p Implementation"]
**Project Lead:** [Name, Contact]
**DPO Contact:** [Name, Email]
**Assessment Date:** [Date]
**Review Date:** [Next review date]

## 2. Processing Description

### 2.1 Nature of Processing
[Describe what the a2p implementation will do]

Example:
- Store employee profiles with preferences, interests, and work context
- Allow approved AI agents to access profiles for personalization
- Enable agents to propose memories for user review
- Synchronize profiles across multiple devices

### 2.2 Scope of Processing
- **Data subjects:** [e.g., 500 employees]
- **Data categories:** [List a2p categories used]
- **Geographic scope:** [Countries/regions]
- **Duration:** [How long data retained]

### 2.3 Context of Processing
- **Relationship with data subjects:** [e.g., employer-employee]
- **Control of data subjects:** [High - users control profiles]
- **Expectations of data subjects:** [Users expect personalization]

### 2.4 Purpose of Processing
[List specific, explicit, legitimate purposes]

Example:
1. Personalize AI assistant responses
2. Maintain consistent user context across agents
3. Enable user control over AI interaction data
```

### 3.2 Necessity and Proportionality

```markdown
## 3. Necessity Assessment

### 3.1 Legal Basis
- [ ] Consent (GDPR Art. 6(1)(a))
- [ ] Contract (GDPR Art. 6(1)(b))
- [ ] Legal obligation (GDPR Art. 6(1)(c))
- [ ] Vital interests (GDPR Art. 6(1)(d))
- [ ] Public task (GDPR Art. 6(1)(e))
- [ ] Legitimate interests (GDPR Art. 6(1)(f))

**Justification:** [Explain why this basis applies]

### 3.2 Necessity
Is this processing necessary for the purpose?
[Explain why less intrusive alternatives won't work]

### 3.3 Proportionality
Is the processing proportionate to the aim?
[Explain the balance between benefit and intrusion]

### 3.4 Data Minimization
How is data minimization achieved?
- Scoped access (only necessary categories)
- Purpose limitation (purpose field required)
- Retention limits (decay mechanism)
- User control (proposal workflow)
```

### 3.3 Risk Identification

```markdown
## 4. Risk Identification

### 4.1 Risk to Individuals

| Risk | Likelihood | Severity | Overall |
|------|------------|----------|---------|
| Unauthorized access to profile | [L/M/H] | [L/M/H] | [L/M/H] |
| Profile data breach | [L/M/H] | [L/M/H] | [L/M/H] |
| Inaccurate profiling by agents | [L/M/H] | [L/M/H] | [L/M/H] |
| Loss of control over personal data | [L/M/H] | [L/M/H] | [L/M/H] |
| Discrimination based on profile | [L/M/H] | [L/M/H] | [L/M/H] |
| Re-identification from profile data | [L/M/H] | [L/M/H] | [L/M/H] |
| Covert profiling without awareness | [L/M/H] | [L/M/H] | [L/M/H] |
| Excessive data retention | [L/M/H] | [L/M/H] | [L/M/H] |

### 4.2 Sources of Risk

- **Threat actors:** Malicious agents, external attackers, insider threats
- **Vulnerabilities:** Implementation flaws, configuration errors
- **Impacts:** Privacy harm, discrimination, financial loss
```

---

## 4. Risk Assessment

### 4.1 Likelihood Criteria

| Level | Criteria | Probability |
|-------|----------|-------------|
| **Low** | Unlikely to occur; strong controls in place | <25% |
| **Medium** | May occur; some controls in place | 25-75% |
| **High** | Likely to occur; limited controls | >75% |

### 4.2 Severity Criteria

| Level | Criteria | Impact Examples |
|-------|----------|-----------------|
| **Low** | Minor inconvenience | Time spent, minor frustration |
| **Medium** | Significant impact | Reputation damage, financial loss <€1000 |
| **High** | Severe impact | Discrimination, significant financial loss, health impact |

### 4.3 Risk Matrix

```
              Severity
              Low    Medium    High
         ┌─────────────────────────┐
    High │ Medium │ High   │ High   │
         ├────────┼────────┼────────┤
Likelihood Medium │ Low    │ Medium │ High   │
         ├────────┼────────┼────────┤
    Low  │ Low    │ Low    │ Medium │
         └─────────────────────────┘
```

### 4.4 a2p-Specific Risk Analysis

| Risk | a2p Mitigation | Residual Risk |
|------|----------------|---------------|
| Unauthorized access | DID authentication, consent policies | Low |
| Data breach | Encryption at rest and in transit | Medium |
| Inaccurate profiling | Proposal workflow, user review | Low |
| Loss of control | User owns profile, can delete | Low |
| Discrimination | Transparency, audit trails | Medium |
| Re-identification | Scoped access, sensitivity levels | Low |
| Covert profiling | Consent receipts, transparency | Low |
| Excessive retention | Decay mechanism, retention policies | Low |

---

## 5. Mitigation Measures

### 5.1 Technical Measures

| Risk | Measure | Implementation |
|------|---------|----------------|
| Unauthorized access | DID-based authentication | Required by a2p spec |
| Data breach | AES-256 encryption | Enable in storage config |
| Data breach | TLS 1.3 in transit | Configure endpoints |
| Inaccurate profiling | Proposal workflow | Use SDK proposal API |
| Loss of control | User-owned DIDs | Issue DIDs to users |
| Re-identification | Scoped access | Configure consent policies |
| Excessive retention | Memory decay | Enable decay in profile settings |

### 5.2 Organizational Measures

| Risk | Measure | Implementation |
|------|---------|----------------|
| General | Staff training | Annual a2p/privacy training |
| Data breach | Incident response | Follow breach-notification.md |
| Compliance | Regular audits | Quarterly security audits |
| Accountability | DPO appointment | Designate DPO if required |
| Transparency | Privacy notices | Update notices for a2p |

### 5.3 Contractual Measures

| Risk | Measure | Implementation |
|------|---------|----------------|
| Agent misuse | Agent agreements | Require a2p compliance |
| Third-party risk | Processor contracts | GDPR Art. 28 contracts |
| Cross-border | Transfer safeguards | SCCs or adequacy |

### 5.4 a2p-Specific Mitigations

```json
{
  "dpiaRecommendedSettings": {
    "profile": {
      "memorySettings": {
        "decayEnabled": true,
        "decayRate": 0.1,
        "decayInterval": "30d"
      },
      "privacySettings": {
        "defaultSensitivity": "standard",
        "allowAnonymousAccess": false
      }
    },
    "accessPolicies": [
      {
        "name": "Default Deny",
        "agentPattern": "*",
        "permissions": ["none"],
        "conditions": {
          "requireVerifiedOperator": true,
          "requireAudit": true
        }
      }
    ],
    "consentRequirements": {
      "purposeRequired": true,
      "retentionLimitRequired": true,
      "receiptGeneration": true
    }
  }
}
```

---

## 6. Documentation

### 6.1 Required Documentation

| Document | Content | Update Frequency |
|----------|---------|------------------|
| DPIA Report | This assessment | Annual or on change |
| Data Flow Diagram | Profile data flows | On change |
| Risk Register | Identified risks | Quarterly |
| Privacy Notice | User information | On change |
| Consent Records | Consent receipts | Continuous |
| Audit Logs | Access logs | Continuous |

### 6.2 DPIA Report Structure

```
1. Executive Summary
2. Project Description
3. Data Processing Details
4. Necessity and Proportionality
5. Risk Assessment
6. Mitigation Measures
7. Consultation Results (if any)
8. DPO Opinion
9. Approval and Sign-off
10. Appendices
```

### 6.3 Consultation Requirements

**Consult supervisory authority** when:
- High risks cannot be mitigated
- Novel processing with uncertain risks
- Required by national law

**Consult data subjects** when:
- Practical to do so
- Useful for understanding concerns
- Building trust is important

---

## 7. Review and Updates

### 7.1 Review Triggers

| Trigger | Action |
|---------|--------|
| Annual review date | Full DPIA review |
| New a2p version | Assess changes |
| New memory categories | Assess impact |
| New agent integration | Assess agent risks |
| Incident occurs | Review and update |
| Complaint received | Investigate and update |
| Regulatory change | Assess compliance |

### 7.2 Update Process

1. **Initiate**: Identify trigger, assign reviewer
2. **Assess**: Review current DPIA against changes
3. **Update**: Modify risk assessment and mitigations
4. **Approve**: DPO review and approval
5. **Implement**: Apply new mitigations
6. **Document**: Update DPIA record

### 7.3 Record Keeping

```json
{
  "dpiaRecords": {
    "currentVersion": "1.2",
    "createdAt": "2024-01-01",
    "lastReviewedAt": "2024-06-01",
    "nextReviewAt": "2025-01-01",
    "versions": [
      {
        "version": "1.0",
        "date": "2024-01-01",
        "author": "DPO",
        "changes": "Initial assessment"
      },
      {
        "version": "1.1",
        "date": "2024-03-15",
        "author": "Security Team",
        "changes": "Added health data category"
      },
      {
        "version": "1.2",
        "date": "2024-06-01",
        "author": "DPO",
        "changes": "Annual review"
      }
    ],
    "approvals": [
      {
        "role": "DPO",
        "name": "Jane Smith",
        "date": "2024-06-01",
        "signature": "hash:..."
      }
    ]
  }
}
```

---

## Appendix A: DPIA Checklist

### Pre-Assessment
- [ ] Identified project scope
- [ ] Assigned DPIA lead
- [ ] Gathered stakeholder input
- [ ] Reviewed previous DPIAs (if any)

### Assessment
- [ ] Described processing operations
- [ ] Identified legal basis
- [ ] Assessed necessity and proportionality
- [ ] Identified all risks
- [ ] Assessed likelihood and severity
- [ ] Identified mitigation measures

### Documentation
- [ ] Completed DPIA report
- [ ] Created data flow diagram
- [ ] Updated risk register
- [ ] Obtained DPO opinion

### Approval
- [ ] Presented to stakeholders
- [ ] Obtained management approval
- [ ] Filed DPIA record
- [ ] Scheduled next review

### Implementation
- [ ] Implemented technical measures
- [ ] Implemented organizational measures
- [ ] Updated privacy notices
- [ ] Trained staff

---

## Appendix B: Sample Privacy Notice Addition

```markdown
## AI Profile Data (a2p)

We use the a2p (Agent 2 Profile) protocol to manage how AI assistants 
interact with your data.

**What we collect:**
- Your preferences (language, communication style)
- Your interests (topics, hobbies)
- Context from your interactions with AI assistants

**How it's used:**
- To personalize AI assistant responses
- To remember your preferences across different AI tools
- To give you control over what AI systems know about you

**Your control:**
- You own your profile and can view it anytime
- You approve any new information before it's added
- You can delete your profile at any time
- You control which AI assistants can access your data

**Your rights:**
- Access, correct, or delete your profile data
- Restrict or object to processing
- Receive your data in portable format
- Withdraw consent at any time

Contact our DPO at [dpo@example.com] with questions.
```

---

## Appendix C: Supervisory Authority Consultation Template

```markdown
# Prior Consultation Request - GDPR Article 36

## 1. Controller Information
[Organization name, address, DPO contact]

## 2. Processing Description
[Summary of a2p implementation]

## 3. DPIA Summary
[Key findings from DPIA]

## 4. High Risks Identified
[List risks that cannot be fully mitigated]

## 5. Measures Taken
[List all mitigations implemented]

## 6. Residual Risks
[Explain remaining risks and why acceptable]

## 7. Consultation Request
[Specific questions for the authority]

## 8. Supporting Documents
- Full DPIA report
- Data flow diagrams
- Technical specifications
- Draft privacy notice
```

---

**Next:** See [Breach Notification](../spec/breach-notification.md) for incident response procedures.
