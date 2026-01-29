# a2p Protocol Governance

**Version:** 1.0.0-draft  
**Status:** Draft  
**Last Updated:** December 2024

---

## Table of Contents

1. [Overview](#1-overview)
2. [Governance Structure](#2-governance-structure)
3. [Decision Making](#3-decision-making)
4. [RFC Process](#4-rfc-process)
5. [Security Disclosure](#5-security-disclosure)
6. [Namespace Registry](#6-namespace-registry)
7. [Contribution Guidelines](#7-contribution-guidelines)
8. [Code of Conduct](#8-code-of-conduct)

---

## 1. Overview

### 1.1 Mission

The a2p (Agent 2 Profile) protocol aims to establish a user-sovereign identity and memory layer for AI agents and services, giving individuals control over their digital identity across AI interactions.

### 1.2 Goals

- **Open Standard**: Develop an open, interoperable protocol specification
- **Privacy First**: Ensure user privacy and data sovereignty
- **Community Driven**: Enable broad participation in protocol development
- **Practical**: Build production-ready implementations

### 1.3 Scope

This governance document covers:
- Protocol specification development
- Reference implementations
- SDK and adapter maintenance
- Namespace registration
- Security vulnerability handling

---

## 2. Governance Structure

### 2.1 Working Groups

```
┌─────────────────────────────────────────────────────────┐
│                   Steering Committee                     │
│            (Strategic direction, final arbiter)          │
└────────────────────────┬────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│    Core     │  │   Security  │  │   Legal &   │
│   Protocol  │  │   Working   │  │  Compliance │
│    WG       │  │    Group    │  │     WG      │
└─────────────┘  └─────────────┘  └─────────────┘
         │               │               │
         ▼               ▼               ▼
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│Implementation│ │   Registry  │  │  Community  │
│    WG       │  │     WG      │  │     WG      │
└─────────────┘  └─────────────┘  └─────────────┘
```

### 2.2 Steering Committee

**Responsibilities:**
- Strategic direction and vision
- Final decision authority on disputed matters
- Working group creation and dissolution
- External partnerships and representation

**Composition:**
- 5-7 members elected by active contributors
- 2-year terms, staggered elections
- Diverse representation encouraged

### 2.3 Working Groups

| Working Group | Focus | Meetings |
|---------------|-------|----------|
| **Core Protocol** | Specification development, schemas | Weekly |
| **Security** | Security audits, vulnerability response | Bi-weekly |
| **Legal & Compliance** | GDPR, AI Act, regulatory alignment | Monthly |
| **Implementation** | SDKs, adapters, reference implementations | Weekly |
| **Registry** | Namespace, DID method, schema registry | Monthly |
| **Community** | Outreach, documentation, onboarding | Bi-weekly |

### 2.4 Roles

| Role | Description | Requirements |
|------|-------------|--------------|
| **Contributor** | Anyone who contributes | Sign CLA |
| **Reviewer** | Can review PRs | 10+ merged PRs |
| **Maintainer** | Can merge PRs | Nominated by WG |
| **WG Chair** | Leads working group | Elected by WG members |
| **Steering Member** | Steering committee | Elected by contributors |

---

## 3. Decision Making

### 3.1 Decision Types

| Type | Examples | Decision Process |
|------|----------|------------------|
| **Editorial** | Typos, formatting | Maintainer approval |
| **Minor** | Bug fixes, clarifications | 2 maintainer approvals |
| **Significant** | New features, API changes | RFC + WG consensus |
| **Breaking** | Breaking changes | RFC + SC approval |
| **Governance** | Process changes | SC vote (supermajority) |

### 3.2 Consensus Model

1. **Lazy Consensus**: Editorial and minor changes proceed after 72 hours without objection
2. **Working Group Consensus**: Significant changes require WG discussion and agreement
3. **Steering Committee Vote**: Breaking changes and disputes escalate to SC

### 3.3 Voting

When consensus cannot be reached:

| Vote Type | Threshold | Quorum |
|-----------|-----------|--------|
| WG decisions | Simple majority | 50% of active members |
| SC decisions | 2/3 majority | 4 of 7 members |
| Governance changes | 3/4 majority | 5 of 7 members |

### 3.4 Conflict Resolution

1. **Discussion**: Attempt resolution in WG meetings
2. **Mediation**: WG Chair facilitates compromise
3. **Escalation**: Bring to Steering Committee
4. **Final Decision**: SC makes binding decision

---

## 4. RFC Process

### 4.1 RFC Stages

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│  Draft  │───▶│ Proposed │───▶│ Accepted │───▶│ Published │
└─────────┘    └──────────┘    └──────────┘    └───────────┘
                    │                               │
                    ▼                               ▼
               ┌──────────┐                   ┌───────────┐
               │ Rejected │                   │ Deprecated│
               └──────────┘                   └───────────┘
```

### 4.2 RFC Template

```markdown
# RFC-XXXX: [Title]

## Summary
[One paragraph summary]

## Motivation
[Why is this needed?]

## Detailed Design
[Technical details]

## Alternatives Considered
[Other approaches and why rejected]

## Compatibility
[Breaking changes, migration path]

## Security Considerations
[Security implications]

## Implementation
[Implementation plan]

## References
[Related documents, prior art]
```

### 4.3 RFC Lifecycle

| Stage | Duration | Requirements |
|-------|----------|--------------|
| **Draft** | Unlimited | Author develops proposal |
| **Proposed** | 2-4 weeks | WG review period |
| **Final Comment** | 2 weeks | Community feedback |
| **Accepted/Rejected** | - | WG decision |
| **Published** | - | Merged into spec |

### 4.4 RFC Repository

RFCs are tracked at: `https://github.com/a2p-protocol/rfcs`

---

## 5. Security Disclosure

### 5.1 Reporting Vulnerabilities

**DO NOT** report security vulnerabilities publicly.

**Email:** security@a2p.protocol  
**PGP Key:** [Available at https://a2p.protocol/.well-known/security.txt]

### 5.2 Response Timeline

| Severity | Initial Response | Fix Timeline |
|----------|------------------|--------------|
| Critical | 4 hours | 24-48 hours |
| High | 24 hours | 7 days |
| Medium | 72 hours | 30 days |
| Low | 7 days | 90 days |

### 5.3 Disclosure Process

```
Day 0: Vulnerability reported
Day 1: Acknowledgment sent
Day 2-7: Assessment and triage
Day 7-X: Fix development (per severity)
Day X: Fix released
Day X+7: Public disclosure (coordinated)
```

### 5.4 Acknowledgment

Reporters who follow responsible disclosure will be:
- Acknowledged in security advisories
- Listed in Hall of Fame (if desired)
- Eligible for bug bounty (when program available)

### 5.5 Security Advisories

Published at: `https://github.com/a2p-protocol/security-advisories`

---

## 6. Namespace Registry

### 6.1 Standard Namespaces

Reserved namespaces managed by a2p:

| Namespace | Purpose | Status |
|-----------|---------|--------|
| `a2p:` | Core protocol categories | Stable |
| `ext:` | Third-party extensions | Open |
| `test:` | Testing purposes | Reserved |
| `deprecated:` | Deprecated categories | Reserved |

### 6.2 Extension Registration

Third parties may register `ext:` namespaces:

```json
{
  "namespace": "ext:mycompany",
  "owner": {
    "name": "My Company Inc.",
    "did": "did:a2p:org:local:mycompany",
    "contact": "a2p@mycompany.com"
  },
  "description": "Custom categories for MyCompany services",
  "schema": "https://mycompany.com/a2p/schema.json",
  "version": "1.0.0",
  "registeredAt": "2024-12-24T00:00:00Z"
}
```

### 6.3 Registration Process

1. **Submit**: Create PR to namespace registry
2. **Review**: Registry WG reviews application
3. **Approve**: Namespace assigned (7-day window)
4. **Publish**: Namespace added to registry

### 6.4 Namespace Requirements

- Unique identifier (3-32 characters, lowercase, alphanumeric + hyphen)
- Valid contact information
- Published schema
- Maintenance commitment

### 6.5 Namespace Disputes

- First-come, first-served for new registrations
- Trademark holders may claim related namespaces
- Registry WG arbitrates disputes

---

## 7. Contribution Guidelines

### 7.1 How to Contribute

1. **Discuss**: Open issue or RFC for significant changes
2. **Fork**: Create personal fork of repository
3. **Branch**: Create feature branch
4. **Develop**: Make changes following style guide
5. **Test**: Ensure tests pass
6. **PR**: Submit pull request
7. **Review**: Address reviewer feedback
8. **Merge**: Maintainer merges

### 7.2 Contributor License Agreement

All contributors must sign the CLA before their first PR is merged.

**CLA Summary:**
- You retain copyright of your contributions
- You grant a2p perpetual, worldwide license to use contributions
- You confirm you have rights to contribute the code
- Contributions are provided "as is"

### 7.3 Development Setup

```bash
# Clone repository
git clone https://github.com/a2p-protocol/a2p.git
cd a2p

# Install dependencies
pnpm install

# Run tests
pnpm test

# Build all packages
pnpm build
```

### 7.4 Commit Messages

Follow Conventional Commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### 7.5 Pull Request Guidelines

- Clear title and description
- Reference related issues
- Include tests for new functionality
- Update documentation as needed
- Ensure CI passes

---

## 8. Code of Conduct

### 8.1 Our Pledge

We pledge to make participation in the a2p community a harassment-free experience for everyone.

### 8.2 Standards

**Positive behaviors:**
- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behaviors:**
- Trolling, insulting/derogatory comments
- Public or private harassment
- Publishing others' private information
- Other conduct which could reasonably be considered inappropriate

### 8.3 Enforcement

1. **Warning**: Private, written warning
2. **Temporary Ban**: Temporary exclusion from community spaces
3. **Permanent Ban**: Permanent exclusion from community spaces

### 8.4 Reporting

Report violations to: conduct@a2p.protocol

Reports will be reviewed by the Community WG.

---

## Appendix A: Meeting Schedule

| Meeting | Day | Time (UTC) | Cadence |
|---------|-----|------------|---------|
| Core Protocol WG | Tuesday | 16:00 | Weekly |
| Security WG | Thursday | 15:00 | Bi-weekly |
| Implementation WG | Wednesday | 17:00 | Weekly |
| Steering Committee | First Friday | 16:00 | Monthly |

---

## Appendix B: Communication Channels

| Channel | Purpose | Access |
|---------|---------|--------|
| GitHub Issues | Bug reports, feature requests | Public |
| GitHub Discussions | General discussion | Public |
| Discord | Real-time chat | Public |
| Mailing List | Announcements | Public |
| Security Email | Vulnerability reports | Private |

---

**Contact:** governance@a2p.protocol  
**License:** This document is CC BY 4.0
