# a2p Protocol Specification

**Version:** 0.1.0  
**Status:** Initial Release  
**Last Updated:** January 2026

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Terminology](#2-terminology)
3. [Protocol Overview](#3-protocol-overview)
4. [Identity Layer](#4-identity-layer)
5. [Profile Structure](#5-profile-structure)
6. [DID Method Specification](#6-did-method-specification)
7. [Memory System](#7-memory-system)
8. [Accessibility](#8-accessibility)
9. [Children & Guardianship](#9-children--guardianship)
10. [Consent & Access Control](#10-consent--access-control)
11. [Agent Integration](#11-agent-integration)
12. [Transport & API](#12-transport--api)
13. [Security Considerations](#13-security-considerations)
14. [Offline Support](#14-offline-support)
15. [Extensibility](#15-extensibility)

---

## 1. Introduction

### 1.1 Purpose

The Agent 2 Profile (a2p) protocol defines a standard for user-owned profiles that can be shared with AI agents. It enables:

- **User sovereignty**: Users own and control their profile data
- **Portability**: Profiles work across different AI agents and platforms
- **Transparency**: Users see exactly what agents know about them
- **Consent**: Granular control over what data is shared with whom
- **Interoperability**: Standard schemas enable cross-agent compatibility

### 1.2 Design Principles

1. **User-First**: The user is always in control
2. **Privacy by Design**: Minimal data exposure by default
3. **Decentralized**: No single point of control or failure
4. **Interoperable**: Works with existing standards (DIDs, A2A, MCP)
5. **Extensible**: Support for custom schemas and storage backends
6. **Practical**: Easy to implement for agent developers

### 1.3 Scope

This specification covers:
- Profile data structure and schemas
- Memory management and proposals
- Consent and access control
- Agent authentication and authorization
- API endpoints and transport
- Security requirements

Out of scope:
- Specific storage implementations
- UI/UX guidelines
- Business logic for memory consolidation algorithms

### 1.4 Applicability

While the protocol uses "agent" terminology, a2p is designed for **any service** that needs user context:

| Service Type | Examples | Use Cases |
|--------------|----------|-----------|
| **AI Agents** | LLM assistants, chatbots, autonomous agents | Personalized responses, context retention |
| **ML Systems** | Recommendation engines, personalization models | Cross-platform preferences, behavioral learning |
| **Traditional Services** | Web apps, mobile apps, APIs | User preferences, settings portability |
| **IoT Devices** | Smart home, wearables, connected vehicles | Routine learning, environment personalization |
| **Healthcare** | EHR systems, patient portals | Patient preference portability |
| **Enterprise** | HR systems, collaboration tools | Employee profile sharing |

The term "agent" in a2p encompasses any autonomous or semi-autonomous system that:

1. **Needs user context** to function better
2. **Can learn from interactions** and propose insights
3. **Should respect user consent** and data sovereignty

Throughout this specification, "agent" and "service" may be used interchangeably. The protocol's core mechanisms — DIDs, consent policies, memory proposals — apply equally to all service types.

#### Example: ML Recommendation System

A music streaming service can use a2p to:

```json
{
  "operation": "propose_memory",
  "agentDid": "did:a2p:service:music-streamify",
  "memory": {
    "content": "Prefers instrumental jazz for focus work",
    "category": "a2p:interests.music",
    "confidence": 0.85,
    "source": {
      "type": "behavioral_analysis",
      "context": "Based on 3 months of listening patterns"
    }
  }
}
```

Once approved by the user, this preference benefits all a2p-compatible services — not just the one that learned it.

---

## 2. Terminology

| Term | Definition |
|------|------------|
| **User** | A human who owns one or more profiles |
| **Agent** | An AI system or service that interacts with users and may access profiles |
| **Entity** | An organization, team, department, project, or other collective |
| **Profile** | A structured collection of data, preferences, and memories |
| **Memory** | A discrete piece of information about a user |
| **Proposal** | A suggested memory addition from an agent, pending user approval |
| **Consent Policy** | Rules defining what an agent can access |
| **Enforced Policy** | A policy mandated by a parent entity that children cannot override |
| **DID** | Decentralized Identifier, a self-sovereign identity |
| **Scope** | A permission category (e.g., `a2p:preferences`) |

---

## 3. Protocol Overview

### 3.1 Actors

```
┌────────────────────────────────────────────────────────────────────────┐
│                            a2p ECOSYSTEM                                │
├────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   ┌─────────┐     ┌─────────┐                    ┌─────────┐           │
│   │  USER   │     │ ENTITY  │                    │  AGENT  │           │
│   │ (Human) │     │(Org/Team)│                   │(AI/Svc) │           │
│   └────┬────┘     └────┬────┘                    └────┬────┘           │
│        │               │                               │                │
│        │ owns          │ defines                       │ has            │
│        ▼               ▼                               ▼                │
│   ┌─────────┐     ┌──────────┐                   ┌─────────┐           │
│   │ PROFILE │     │ ENTITY   │                   │ PROFILE │           │
│   │ (Human) │◄────│ PROFILE  │──── enforces ────►│ (Agent) │           │
│   └─────────┘     └──────────┘                   └─────────┘           │
│        │               │                                                │
│        │ inherits from │                                                │
│        └───────────────┘                                                │
│                                                                         │
└────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Profile Types

| Profile Type | DID Pattern | Owner | Purpose |
|--------------|-------------|-------|---------|
| **Human** | `did:a2p:user:*` | Individual | Personal preferences, memories |
| **Entity** | `did:a2p:entity:*` | Organization/Team | Policies, hierarchy, membership |
| **Agent** | `did:a2p:agent:*` | Service operator | Capabilities, trust metrics |

### 3.3 Entity Hierarchy

Entities can form hierarchies with enforced policies:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ENTITY HIERARCHY                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│   ACME Corp (organization)                                           │
│   ├── ENFORCES: gdpr=true, dataResidency=EU (locked)                │
│   │                                                                  │
│   ├── Engineering (department)                                       │
│   │   ├── INHERITS: gdpr, dataResidency                             │
│   │   ├── ADDS: codeReview=required (locked for teams)              │
│   │   │                                                              │
│   │   ├── ML Team (team)                                            │
│   │   │   ├── INHERITS: all above                                   │
│   │   │   └── Alice (user) ──► gets all policies                    │
│   │   │                                                              │
│   │   └── Platform Team (team)                                       │
│   │       └── Bob (user)                                             │
│   │                                                                  │
│   └── Sales (department)                                             │
│       └── Charlie (user)                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Enforced Policy Types

| Type | Meaning | Use Case |
|------|---------|----------|
| `locked` | Cannot be changed | Compliance requirements |
| `min` | Floor value | Minimum encryption bits |
| `max` | Ceiling value | Maximum retention period |
| `subset` | Must be subset | Restrict AI model list |
| `additive` | Can only add | Extend blocklists |

### 3.2 Core Flows

#### Flow 1: Profile Access

```
User                    a2p Gateway                 Agent
  │                          │                        │
  │                          │◄─── 1. Request ────────│
  │                          │     (user_did, scopes) │
  │                          │                        │
  │◄─── 2. Consent Check ────│                        │
  │     (show agent info)    │                        │
  │                          │                        │
  │──── 3. Approve ─────────►│                        │
  │                          │                        │
  │                          │──── 4. Profile ───────►│
  │                          │     (filtered by scope)│
  │                          │                        │
```

#### Flow 2: Memory Proposal

```
User                    a2p Gateway                 Agent
  │                          │                        │
  │                          │◄─── 1. Propose ────────│
  │                          │     (memory content)   │
  │                          │                        │
  │◄─── 2. Notification ─────│                        │
  │     (new proposal)       │                        │
  │                          │                        │
  │──── 3. Review ──────────►│                        │
  │     (approve/reject/edit)│                        │
  │                          │                        │
  │                          │──── 4. Confirmation ──►│
  │                          │     (accepted/rejected)│
  │                          │                        │
```

### 3.3 Profile Types

| Type | Description | Owner |
|------|-------------|-------|
| `human` | End-user profile with preferences and memories | User |
| `agent` | AI agent identity and capabilities | Agent operator |
| `organization` | Company/team profile with policies | Organization |
| `collective` | Shared profile for groups/families | Group members |

---

## 4. Identity Layer

### 4.1 Decentralized Identifiers (DIDs)

All entities in a2p are identified using DIDs. The protocol supports multiple DID methods:

```
did:a2p:user:gaugid:abc123              # a2p native user (namespaced)
did:a2p:agent:gaugid:my-assistant      # a2p native agent (namespaced)
did:a2p:user:local:alice               # a2p local user profile
did:key:z6Mk...                        # did:key method
did:web:example.com                    # did:web method
```

**Note**: For a2p native DIDs, see [Section 6: DID Method Specification](#6-did-method-specification) for the complete specification.

### 4.2 DID Document Structure

```json
{
  "@context": ["https://www.w3.org/ns/did/v1", "https://a2p.protocol/ns/v1"],
  "id": "did:a2p:user:gaugid:abc123",
  "controller": "did:a2p:user:gaugid:abc123",
  "verificationMethod": [
    {
      "id": "did:a2p:user:gaugid:abc123#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:a2p:user:gaugid:abc123",
      "publicKeyMultibase": "z6Mk..."
    }
  ],
  "authentication": ["did:a2p:user:gaugid:abc123#key-1"],
  "service": [
    {
      "id": "did:a2p:user:gaugid:abc123#a2p-profile",
      "type": "A2PProfileService",
      "serviceEndpoint": "https://profiles.example.com/abc123"
    }
  ]
}
```

### 4.3 Agent Authentication

Agents MUST authenticate when accessing profiles:

1. **Request Signing**: All requests are signed with the agent's private key
2. **DID Resolution**: The user's client resolves the agent's DID
3. **Verification**: The signature is verified against the agent's public key
4. **Trust Check**: Agent profile is checked for trust metrics

### 4.4 DID Format Validation

All DIDs MUST be validated before processing requests.

#### 4.4.1 General DID Pattern

All a2p native DIDs MUST include a namespace component:

```
^did:a2p:(user|agent|org|entity|service):[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$
```

**Format**: `did:a2p:<type>:<namespace>:<identifier>`

**Components**:
- `<type>`: Entity type (`user`, `agent`, `org`, `entity`, `service`)
- `<namespace>`: Provider namespace (mandatory)
- `<identifier>`: Unique identifier within namespace

**Note**: For complete DID method specification, see [Section 6: DID Method Specification](#6-did-method-specification).

#### 4.4.2 Type-Specific Patterns

| Type | Pattern | Example |
|------|---------|---------|
| User | `^did:a2p:user:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$` | `did:a2p:user:gaugid:alice` |
| Agent | `^did:a2p:agent:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$` | `did:a2p:agent:gaugid:my-assistant` |
| Organization | `^did:a2p:org:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$` | `did:a2p:org:gaugid:acme-corp` |
| Entity | `^did:a2p:entity:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$` | `did:a2p:entity:gaugid:team-alpha` |
| Service | `^did:a2p:service:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$` | `did:a2p:service:gaugid:music-app` |

#### 4.4.3 Validation Requirements

Implementations MUST:

1. Validate DID format on all protocol endpoints
2. Return `A2P010` error for invalid DID format
3. Reject requests with malformed DIDs before further processing

#### 4.4.4 Valid DID Examples

✅ Valid:
- `did:a2p:agent:gaugid:my-assistant` (provider namespace)
- `did:a2p:agent:gaugid:trusted-ai` (provider namespace)
- `did:a2p:agent:gaugid:agent_123` (provider namespace)
- `did:a2p:agent:company:team.agent` (custom namespace)
- `did:a2p:user:gaugid:alice` (provider namespace)
- `did:a2p:user:local:alice` (local namespace for self-hosted)
- `did:a2p:org:gaugid:acme-corp` (provider namespace)

❌ Invalid:
- `did:a2p:agent:my-assistant` (missing namespace)
- `did:a2p:agent:gaugid:` (empty identifier)
- `agent:gaugid:my-assistant` (missing `did:a2p` prefix)
- `did:a2p:agent:gaugid:agent with spaces` (invalid characters in identifier)
- `did:a2p:unknown:gaugid:test` (invalid type)
- `did:a2p:agent:gaugid` (missing identifier)

---

## 5. Profile Structure

### 5.1 Root Profile Schema

```json
{
  "$schema": "https://a2p.protocol/schemas/v1/profile.json",
  "id": "did:a2p:user:abc123",
  "version": "1.0",
  "profileType": "human",
  "created": "2024-01-15T10:30:00Z",
  "updated": "2024-12-24T14:00:00Z",
  
  "identity": { },
  "common": { },
  "memories": { },
  "subProfiles": [ ],
  "pendingProposals": [ ],
  "accessPolicies": [ ],
  "audit": { }
}
```

### 5.2 Identity Section

```json
{
  "identity": {
    "did": "did:a2p:user:abc123",
    "displayName": "Alice",
    "publicKeys": [
      {
        "id": "#key-1",
        "type": "Ed25519",
        "publicKeyMultibase": "z6Mk..."
      }
    ],
    "recoveryMethods": ["email:alice@example.com"]
  }
}
```

### 5.3 Common Section (Shared Across Sub-Profiles)

```json
{
  "common": {
    "preferences": {
      "language": "en-US",
      "timezone": "Europe/Madrid",
      "communication": {
        "style": "concise",
        "formality": "casual",
        "humor": true
      },
      "content": {
        "format": "markdown",
        "codeStyle": "commented",
        "exampleLanguage": "python"
      }
    }
  }
}
```

### 5.4 Standard Memory Categories

The protocol defines standard namespaced categories:

| Namespace | Category | Description | Sensitivity |
|-----------|----------|-------------|-------------|
| `a2p:identity` | Core identity | Name, pronouns, location | Standard |
| `a2p:preferences` | Communication preferences | Style, format, language | Public |
| `a2p:professional` | Work information | Job, skills, company | Standard |
| `a2p:interests` | Personal interests | Hobbies, music, books | Standard |
| `a2p:context` | Current context | Projects, goals, recent topics | Standard |
| `a2p:health` | Health information | Allergies, conditions | Sensitive |
| `a2p:financial` | Financial information | Budget preferences | Restricted |
| `a2p:relationships` | Relationships | Family, friends | Sensitive |
| `a2p:episodic` | Free-form memories | Agent-learned facts | Varies |

### 5.5 Sub-Profiles

Users can maintain multiple sub-profiles for different contexts:

```json
{
  "subProfiles": [
    {
      "id": "did:a2p:user:abc123:work",
      "name": "Work",
      "inheritsFrom": ["common"],
      "overrides": {
        "identity.displayName": "Alice Chen"
      },
      "specialized": {
        "a2p:professional": {
          "title": "Software Architect",
          "company": "Acme Corp"
        }
      },
      "shareWith": ["agent:*:work-category"]
    },
    {
      "id": "did:a2p:user:abc123:personal",
      "name": "Personal",
      "inheritsFrom": ["common"],
      "specialized": {
        "a2p:interests": {
          "music": ["jazz", "electronic"]
        }
      },
      "shareWith": ["agent:spotify:*"]
    }
  ]
}
```

---

## 6. DID Method Specification

### 6.1 Method Name

The DID method name is: `a2p`

### 6.2 DID Syntax

All DIDs in the a2p method follow this format:

```
did:a2p:<type>:<namespace>:<identifier>
```

**Components:**
- `did`: Literal string "did"
- `a2p`: Method identifier
- `<type>`: Entity type, one of: `agent`, `user`, `entity`, `service`, `org`
- `<namespace>`: Provider namespace (mandatory)
- `<identifier>`: Unique identifier within namespace

**Examples:**
```
did:a2p:agent:gaugid:my-assistant
did:a2p:user:gaugid:AbC123XyZ789
did:a2p:entity:gaugid:acme-corp
did:a2p:service:gaugid:travel-service
did:a2p:user:local:alice
```

### 6.3 DID Generation

**Unified Rules for All Types:**

1. Provider chooses a unique namespace (e.g., `gaugid`, `company-name`, `domain.com`, `local`)
2. Provider generates a unique identifier within the namespace
3. Provider ensures identifier uniqueness (detect collisions, retry if needed)
4. Format: `did:a2p:<type>:<namespace>:<identifier>`

**Identifier Generation (Provider Choice):**

Providers MAY choose any method to generate identifiers:
- **Name-based**: Sanitized names (e.g., `my-assistant`, `acme-corp`)
- **Random**: Random alphanumeric (e.g., `AbC123XyZ789`)
- **UUID-based**: Standard UUIDs
- **Key-based**: Hash of public key (base58 encoded)
- **Combination**: Any combination of above

**Requirements:**
- Identifier MUST be unique within namespace
- Provider MUST detect and handle collisions
- Identifier MUST match pattern: `[a-zA-Z0-9._-]+`
- Namespace MUST match pattern: `[a-zA-Z0-9._-]+`

### 6.4 Uniqueness Guarantees

**Two-Level Guarantee:**

1. **Namespace Level**: Each provider uses a unique namespace
   - Prevents collisions between providers
   - Enables routing for resolution
   - Examples: `gaugid`, `company-name`, `domain.com`, `local`

2. **Identifier Level**: Provider ensures identifier uniqueness within namespace
   - Provider MUST verify uniqueness before registration
   - Provider MUST handle collisions (retry or reject)
   - Provider chooses identifier generation method

**Requirements:**
- Providers MUST use a unique namespace
- Providers MUST verify identifier uniqueness before registration
- Providers MUST handle collisions gracefully

### 6.5 DID Resolution

**Standard Resolution Endpoint:**

All implementations MAY provide (optional for single-provider, recommended for federation):

```
GET /a2p/v1/did/:did
```

**Resolution Process:**

1. Parse DID to extract namespace
2. If namespace matches local provider: Resolve from local database
3. If namespace is external: Query external provider's resolution endpoint
4. Return W3C-compliant DID document

**DID Document Structure:**

```json
{
  "@context": [
    "https://www.w3.org/ns/did/v1",
    "https://w3id.org/security/suites/ed25519-2020/v1"
  ],
  "id": "did:a2p:agent:gaugid:my-assistant",
  "verificationMethod": [
    {
      "id": "did:a2p:agent:gaugid:my-assistant#key-1",
      "type": "Ed25519VerificationKey2020",
      "controller": "did:a2p:agent:gaugid:my-assistant",
      "publicKeyMultibase": "z<base64-encoded-public-key>"
    }
  ],
  "authentication": ["did:a2p:agent:gaugid:my-assistant#key-1"],
  "assertionMethod": ["did:a2p:agent:gaugid:my-assistant#key-1"]
}
```

**Note**: Public keys are stored in the DID document, not in the DID identifier itself. This follows W3C DID standard practice.

### 6.6 DID Updates

**Key Rotation:**
- DIDs MAY be updated to rotate keys
- Update MUST require cryptographic proof of ownership (signature)
- DID identifier remains the same
- Only `verificationMethod` in DID document changes

**Namespace Changes:**
- Namespace CANNOT be changed (it's part of the DID)
- To change namespace: Create new DID and migrate data

**Identifier Changes:**
- Identifier CANNOT be changed (it's part of the DID)
- To change identifier: Create new DID and migrate data

### 6.7 Ownership & Verification

**Ownership is proven via DID document, not DID format:**

1. **DID Document** contains public key(s) in `verificationMethod`
2. **Authentication** uses signature verification against public key
3. **Updates** require cryptographic proof (Ed25519 signature)
4. **DID format** provides routing (namespace) and uniqueness (identifier)

**This follows W3C DID standard:**
- DID = Persistent identifier
- DID Document = Contains keys, services, metadata
- Verification = Uses keys from DID document, not DID format

### 6.8 Security Considerations

**Collision Prevention:**
1. Namespace requirement prevents inter-provider collisions
2. Provider ensures identifier uniqueness within namespace
3. Providers MUST implement collision detection

**Ownership Verification:**
1. Agents: Updates require Ed25519 signature proof
2. Users: Controlled by provider authentication
3. Entities/Services: Provider-managed

**Resolution Security:**
1. HTTPS MUST be used for resolution (except local namespace)
2. Certificate validation MUST be performed
3. Cache with TTL for performance (optional)

### 6.9 Namespace Verification

**Provider Namespaces:**
- Namespace typically matches domain (e.g., `gaugid` → `gaugid.com`)
- HTTPS certificate verifies domain ownership
- DID resolution via HTTPS endpoint
- Certificate authority (CA) validates domain control

**Local Namespaces:**
- `local` namespace for self-hosted profiles
- No domain verification required
- Direct SDK access or self-hosted gateway
- User controls their own server/storage
- See [Section 13: Offline Support](#13-offline-support) for details

**Custom Namespaces:**
- User-defined namespaces (e.g., `my-server`, `home-gateway`)
- User controls resolution endpoint
- Self-signed or Let's Encrypt certificates
- Trust model depends on user's setup

### 6.10 Local Profile Support

For users who store profiles locally (no cloud provider):

**DID Format:**
```
did:a2p:user:local:alice
did:a2p:agent:local:my-agent
```

**Resolution:**
- **Direct Access**: SDK accesses profile directly (no network resolution)
- **Self-Hosted**: User provides resolution endpoint (optional)
- **No HTTPS Required**: Local network or direct access

**Trust Model:**
1. **User Control**: User controls their local storage/server
2. **No Namespace Verification**: Not needed for local-only access
3. **Signature Verification**: Still required (cryptographic)
4. **Agent Trust**: User explicitly grants access

**Use Cases:**
- Development and testing
- Privacy-conscious users
- Single-user scenarios
- Offline-first applications

---

## 7. Memory System

### 7.1 Memory Object Structure

```json
{
  "id": "mem_abc123",
  "content": "Prefers dark mode for coding",
  "category": "a2p:preferences.ui",
  "source": {
    "type": "agent_proposal",
    "agentDid": "did:a2p:agent:claude",
    "sessionId": "sess_xyz",
    "timestamp": "2024-12-24T10:30:00Z"
  },
  "confidence": 0.92,
  "status": "approved",
  "sensitivity": "public",
  "scope": ["general"],
  "metadata": {
    "approvedAt": "2024-12-24T10:35:00Z",
    "lastUsed": "2024-12-24T14:00:00Z",
    "useCount": 5
  }
}
```

### 7.2 Memory Sources

| Source Type | Description |
|-------------|-------------|
| `user_manual` | User manually added |
| `user_import` | Imported from external source |
| `agent_proposal` | Proposed by agent, approved by user |
| `agent_direct` | Directly written by agent (if permitted) |
| `system_derived` | Derived from other memories |

### 7.3 Memory Status

| Status | Description |
|--------|-------------|
| `pending` | Proposed by agent, awaiting user review |
| `approved` | Approved and active |
| `rejected` | Rejected by user |
| `archived` | Moved to archive (not actively shared) |
| `expired` | Confidence decayed below threshold |

### 7.4 Confidence Decay

Memories have a confidence score (0.0 to 1.0) that decays over time if not reconfirmed:

```
Initial confidence: 0.95
After 30 days without use: 0.85
After 90 days without use: 0.70
After 180 days without use: 0.50 (flagged for review)
After 365 days without use: 0.30 (auto-archived)
```

Configuration:
```json
{
  "memorySettings": {
    "decayEnabled": true,
    "decayRate": 0.1,
    "decayInterval": "30d",
    "reviewThreshold": 0.5,
    "archiveThreshold": 0.3
  }
}
```

### 7.5 Memory Consolidation

The protocol supports these consolidation operations:

| Operation | Description |
|-----------|-------------|
| `merge` | Combine duplicate memories |
| `resolve` | User picks correct version from conflicts |
| `promote` | Move episodic memory to structured category or semantic type |
| `reclassify` | Change memory type (episodic ↔ semantic ↔ procedural) |
| `archive` | Move to archive |
| `delete` | Permanently remove |

### 7.6 Memory Types

The a2p protocol supports three memory types that organize memories by how they are stored, retrieved, and used:

#### 7.6.1 Episodic Memory

**Purpose**: Store specific events and interactions with temporal context.

**Characteristics**:
- Time-stamped events
- Contextual information
- Event-specific details
- Historical record of interactions

**Examples**:
- "User asked about Python async on 2026-01-15"
- "User completed onboarding on 2026-01-10"
- "User mentioned interest in Rust during conversation"

**Use Cases**:
- Conversation history
- Specific interactions
- Time-bound events
- Session-based information

#### 7.6.2 Semantic Memory

**Purpose**: Store abstracted knowledge and facts about the user.

**Characteristics**:
- Abstracted from multiple episodes
- Timeless information
- General knowledge
- Factual statements

**Examples**:
- "User is a Python expert" (abstracted from many episodes)
- "User prefers technical explanations" (generalized preference)
- "User works in distributed systems" (factual knowledge)

**Use Cases**:
- User expertise and skills
- General preferences
- Factual information
- Long-term knowledge

**Derivation**: Typically derived from multiple episodic memories through abstraction.

#### 7.6.3 Procedural Memory

**Purpose**: Store behavioral patterns and how-to information.

**Characteristics**:
- Pattern-based
- Behavioral information
- Preference-driven
- "How the user does things"

**Examples**:
- "User prefers code examples with type hints"
- "User always asks for pros/cons before decisions"
- "User follows a morning routine: coffee, emails, coding"

**Use Cases**:
- Behavioral patterns
- Communication preferences
- Workflow patterns
- Decision-making styles

**Derivation**: Typically derived from repeated behaviors across multiple episodes.

#### 7.6.4 Memory Types and Categories

**Important**: Memory types (`episodic`, `semantic`, `procedural`) are **orthogonal** to memory categories (`a2p:preferences`, `a2p:professional`, etc.).

- **Memory Type**: Determines how the memory is stored, retrieved, and used
- **Memory Category**: Determines the domain/context of the memory

A memory can be:
- **Semantic** memory in the **preferences** category
- **Procedural** memory in the **professional** category
- **Episodic** memory in the **interests** category

**Example**:
```json
{
  "memories": {
    "a2p:semantic": [
      {
        "id": "mem_001",
        "content": "User prefers dark mode for coding",
        "category": "a2p:preferences.ui",
        "confidence": 0.9,
        "status": "approved"
      }
    ],
    "a2p:procedural": [
      {
        "id": "mem_002",
        "content": "User always asks for pros/cons before decisions",
        "category": "a2p:preferences.communication",
        "confidence": 0.85,
        "status": "approved"
      }
    ],
    "a2p:episodic": [
      {
        "id": "mem_003",
        "content": "User asked about Python async on 2026-01-15",
        "category": "a2p:interests.technology",
        "confidence": 0.8,
        "status": "approved"
      }
    ]
  }
}
```

#### 7.6.5 Memory Type Classification

Agents need to classify memories into types when proposing them. The following decision tree provides guidance:

1. **Is it a specific event or interaction with a timestamp/context?**
   - YES → `episodic`
   - NO → Continue

2. **Is it abstracted/generalized knowledge derived from multiple episodes?**
   - YES → `semantic`
   - NO → Continue

3. **Is it a behavioral pattern, preference, or "how-to" information?**
   - YES → `procedural`
   - NO → Default to `episodic`

**Classification Examples**:

| Content | Type | Reasoning |
|---------|------|-----------|
| "User asked about Python async on 2026-01-15" | `episodic` | Specific event with timestamp |
| "User completed onboarding on 2026-01-10" | `episodic` | Specific event |
| "User is a Python expert" | `semantic` | Abstracted from many episodes |
| "User prefers technical explanations" | `semantic` | Generalized preference |
| "User works in distributed systems" | `semantic` | Factual knowledge |
| "User prefers code examples with type hints" | `procedural` | Behavioral pattern |
| "User always asks for pros/cons before decisions" | `procedural` | Behavioral pattern |
| "User follows morning routine: coffee, emails, coding" | `procedural` | How-to/pattern |

**Edge Cases**:
- **Unclear cases**: Default to `episodic` (can be reclassified later)
- **Multiple types possible**: Choose the most specific type
- **Agent uncertainty**: Use lower confidence score, let user review

#### 7.6.6 Memory Type Reclassification

Memories can be reclassified from one type to another:

**Reclassification Methods**:
1. **User Action**: User manually reclassifies in dashboard
2. **Agent Proposal**: Agent proposes reclassification (requires approval)
3. **Automatic Promotion**: System can promote episodic → semantic based on:
   - High confidence (>0.9)
   - High use count (>10)
   - Multiple similar episodes

**Reclassification Rules**:
- **User-approved memories**: Reclassification requires user approval
- **Agent-proposed memories**: Agent can propose reclassification
- **Automatic promotion**: System can promote based on criteria above

---

## 8. Accessibility

### 7.1 Overview

a2p includes standardized accessibility preferences that enable services to automatically adapt their interfaces for users with disabilities. These preferences are part of the core `a2p:preferences.accessibility` namespace.

### 7.2 Accessibility Categories

| Category | Description | Examples |
|----------|-------------|----------|
| **Vision** | Visual impairments | Screen reader, magnification, color blindness |
| **Hearing** | Auditory impairments | Captions, visual alerts, sign language |
| **Motor** | Physical impairments | Keyboard-only, voice control, switch access |
| **Cognitive** | Cognitive needs | Simplified UI, reading assistance, memory aids |
| **Sensory** | Sensory processing | Reduce flashing, reduce motion, quiet mode |
| **Physical** | Real-world accessibility | Wheelchair, allergies, dietary, service animal |

### 7.3 Vision Preferences

```json
{
  "preferences": {
    "accessibility": {
      "vision": {
        "screenReader": true,
        "magnification": 1.5,
        "highContrast": "high",
        "colorVision": {
          "type": "deuteranopia",
          "severity": "moderate"
        },
        "prefersDarkMode": true,
        "fontSize": "large",
        "reducedMotion": true
      }
    }
  }
}
```

#### Color Vision Types

| Type | Description | UI Adaptation |
|------|-------------|---------------|
| `protanopia` | Red-blind | Avoid red/green distinctions |
| `deuteranopia` | Green-blind | Avoid red/green distinctions |
| `tritanopia` | Blue-blind | Avoid blue/yellow distinctions |
| `achromatopsia` | Complete color blindness | Use patterns/shapes, not just color |
| `protanomaly` | Red-weak | Use high contrast red |
| `deuteranomaly` | Green-weak | Use high contrast green |

### 7.4 Hearing Preferences

```json
{
  "preferences": {
    "accessibility": {
      "hearing": {
        "deaf": false,
        "hardOfHearing": true,
        "prefersVisualAlerts": true,
        "captions": {
          "enabled": true,
          "style": "large",
          "background": "solid",
          "language": "en"
        },
        "signLanguage": "ASL",
        "audioDescriptions": true
      }
    }
  }
}
```

### 7.5 Motor Preferences

```json
{
  "preferences": {
    "accessibility": {
      "motor": {
        "keyboardOnly": true,
        "voiceControl": false,
        "reducedMotion": true,
        "largeClickTargets": true,
        "extendedTimeouts": true,
        "dwellClick": true,
        "dwellTime": 1500
      }
    }
  }
}
```

### 7.6 Cognitive Preferences

```json
{
  "preferences": {
    "accessibility": {
      "cognitive": {
        "simplifiedUI": true,
        "reducedAnimations": true,
        "readingAssistance": {
          "dyslexiaFont": true,
          "lineSpacing": "wide",
          "focusMode": true
        },
        "memoryAids": true,
        "plainLanguage": true,
        "contentWarnings": true
      }
    }
  }
}
```

### 7.7 Generative UI Integration

When an agent or service with generative UI capabilities receives accessibility preferences:

```
┌────────────────────────────────────────────────────────────────────┐
│                    GENERATIVE UI FLOW                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Service requests a2p:preferences.accessibility                 │
│                                                                     │
│  2. User profile returns:                                          │
│     { vision: { colorVision: { type: "deuteranopia" } } }         │
│                                                                     │
│  3. Generative UI adapts:                                          │
│     - Uses accessible color palette (no red/green)                 │
│     - Adds patterns to distinguish elements                        │
│     - Ensures sufficient contrast                                  │
│     - Includes text labels, not just colors                        │
│                                                                     │
│  4. Result: Personalized accessible interface                      │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 7.8 Privacy Considerations

Accessibility preferences can reveal sensitive health information. Recommended policies:

```json
{
  "accessPolicies": [
    {
      "name": "Accessibility Sharing",
      "agentPattern": "*",
      "allow": ["a2p:preferences.accessibility"],
      "conditions": {
        "onlyForUIAdaptation": true,
        "noStorageAllowed": true,
        "noThirdPartySharing": true
      }
    }
  ]
}
```

### 7.9 Physical Accessibility

For real-world services (reservations, travel, healthcare), the protocol includes physical accessibility needs:

```json
{
  "preferences": {
    "accessibility": {
      "physical": {
        "mobility": {
          "wheelchair": true,
          "wheelchairType": "electric",
          "requiresAccessibleEntrance": true,
          "requiresElevator": true
        },
        "serviceAnimal": {
          "has": true,
          "type": "guide_dog",
          "name": "Max"
        },
        "allergies": {
          "food": ["peanuts", "shellfish"],
          "severity": {
            "peanuts": "anaphylactic",
            "shellfish": "moderate"
          },
          "epiPenCarrier": true
        },
        "dietary": {
          "restrictions": ["vegetarian", "halal"],
          "intolerances": ["lactose"],
          "medicalDiets": ["diabetic"]
        },
        "specialAssistance": {
          "earlyBoarding": true,
          "preferredSeating": "aisle",
          "companion": true
        }
      }
    }
  }
}
```

#### Physical Accessibility Components

| Component | Use Case | Examples |
|-----------|----------|----------|
| `mobility` | Venue, hotel, transport | Wheelchair, walker, accessible entrance |
| `serviceAnimal` | Hotels, restaurants, venues | Guide dog, hearing dog |
| `medicalDevices` | Security, MRI, travel | Pacemaker, insulin pump, oxygen |
| `allergies` | Restaurants, hotels, events | Food, medication, environmental |
| `dietary` | Restaurants, catering, airlines | Vegetarian, halal, kosher, diabetic |
| `specialAssistance` | Travel, events, venues | Early boarding, interpreter, seating |
| `emergencyInfo` | Healthcare, emergencies | Contact, conditions, blood type |

#### Use Case Examples

| Service | Data Used |
|---------|-----------|
| **Restaurant** | Allergies (with severity), dietary restrictions |
| **Hotel** | Wheelchair room, service animal, CPAP, allergies |
| **Airline** | Wheelchair, oxygen, early boarding, dietary, seating |
| **Hospital** | All medical info, allergies, devices, emergency contact |
| **Event venue** | Accessible seating, interpreter, companion |

### 7.10 Standards Alignment

a2p accessibility preferences align with:

- **WCAG 2.2** — Web Content Accessibility Guidelines
- **WAI-ARIA** — Accessible Rich Internet Applications
- **ISO 9241-171** — Ergonomics of human-system interaction
- **EN 301 549** — European accessibility requirements
- **ADA** — Americans with Disabilities Act (physical accessibility)
- **EU Accessibility Act** — European accessibility requirements

---

## 9. Children & Guardianship

### 8.1 Overview

a2p provides comprehensive support for minor profiles, including:

- **Age context** — Age group, jurisdiction, consent status
- **Guardianship** — Parent/guardian management
- **Content safety** — Age-appropriate filtering
- **Enforced policies** — Parent-set rules children cannot override

### 8.2 Legal Requirements

| Jurisdiction | Law | Digital Age of Consent |
|--------------|-----|------------------------|
| EU (default) | GDPR Article 8 | 16 |
| Spain | LOPDGDD | 14 |
| UK | AADC | 13 |
| US | COPPA | 13 |
| Germany | GDPR | 16 |
| France | GDPR | 15 |

### 8.3 Age Context

Part of the `identity` section:

```json
{
  "identity": {
    "displayName": "Jamie",
    "ageContext": {
      "ageGroup": "child",
      "ageRange": "8-12",
      "isMinor": true,
      "jurisdiction": "ES",
      "digitalAgeOfConsent": 14,
      "consentStatus": "parental_consent"
    }
  }
}
```

#### Age Groups

| Group | Typical Age | Implications |
|-------|-------------|--------------|
| `infant` | 0-4 | Full guardian control |
| `child` | 5-12 | Guardian control, limited autonomy |
| `teen` | 13-17 | Increasing autonomy, guardian oversight |
| `adult` | 18+ | Full autonomy |
| `senior` | Variable | Optional accessibility defaults |

### 8.4 Guardianship Structure

```json
{
  "guardianship": {
    "status": "minor",
    "guardians": [
      {
        "did": "did:a2p:user:parent-alice",
        "relationship": "parent",
        "permissions": [
          "manage_profile",
          "approve_proposals",
          "set_policies",
          "manage_content_safety"
        ],
        "consentGiven": "2025-01-01T00:00:00Z",
        "consentMethod": "id_verification",
        "isPrimary": true
      },
      {
        "did": "did:a2p:user:parent-bob",
        "relationship": "parent",
        "permissions": ["view_activity", "approve_proposals"],
        "consentGiven": "2025-01-01T00:00:00Z"
      }
    ],
    "primaryGuardian": "did:a2p:user:parent-alice"
  }
}
```

#### Guardian Permissions

| Permission | Description |
|------------|-------------|
| `manage_profile` | Full profile editing |
| `approve_proposals` | Review memory proposals |
| `set_policies` | Define access policies |
| `view_activity` | See activity reports |
| `manage_consent` | Grant/revoke agent consent |
| `delete_profile` | Delete the profile |
| `manage_content_safety` | Set content filters |
| `manage_screen_time` | Set usage limits |

### 8.5 Content Safety

```json
{
  "guardianship": {
    "contentSafety": {
      "enabled": true,
      "maturityRating": "G",
      "filterExplicitContent": true,
      "filterViolence": true,
      "filterProfanity": true,
      "safeSearch": "strict",
      "chatRestrictions": {
        "allowStrangers": false,
        "moderatedChats": true,
        "allowPrivateMessages": false,
        "approvedContacts": ["did:a2p:user:friend-1"]
      },
      "purchaseRestrictions": {
        "allowPurchases": false,
        "requireApproval": true
      }
    }
  }
}
```

### 8.6 Screen Time

```json
{
  "guardianship": {
    "screenTime": {
      "enabled": true,
      "dailyLimit": "2h",
      "weekdayLimit": "1h30m",
      "weekendLimit": "3h",
      "bedtime": {
        "enabled": true,
        "start": "20:00",
        "end": "07:00",
        "timezone": "Europe/Madrid"
      },
      "breaks": {
        "enabled": true,
        "intervalMinutes": 30
      }
    }
  }
}
```

### 8.7 Enforced Policies

Parents can set policies that children cannot override:

```json
{
  "guardianship": {
    "enforcedByGuardian": [
      {
        "policyId": "content_filter_locked",
        "setBy": "did:a2p:user:parent-alice",
        "field": "contentSafety.filterExplicitContent",
        "value": true,
        "cannotOverride": true,
        "reason": "Age-appropriate content only"
      },
      {
        "policyId": "chat_restriction_locked",
        "setBy": "did:a2p:user:parent-alice",
        "field": "contentSafety.chatRestrictions.allowStrangers",
        "value": false,
        "cannotOverride": true
      }
    ]
  }
}
```

### 8.8 Family Structure

```
┌────────────────────────────────────────────────────────────────────┐
│                       FAMILY STRUCTURE                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   Parent Alice                      Parent Bob                      │
│   (did:a2p:user:alice)             (did:a2p:user:bob)              │
│   ├── Primary guardian             └── Secondary guardian           │
│   ├── Full permissions                 └── View + approve           │
│   │                                                                 │
│   └──────────────┬─────────────────────┘                           │
│                  │ manages                                          │
│                  ▼                                                  │
│   ┌──────────────────────────────────────────────────────────────┐ │
│   │  Child Jamie (did:a2p:user:jamie)                             │ │
│   │  ├── ageContext: { ageGroup: "child", isMinor: true }        │ │
│   │  ├── contentSafety: { maturityRating: "G", ... }             │ │
│   │  └── screenTime: { dailyLimit: "2h", bedtime: "20:00" }      │ │
│   └──────────────────────────────────────────────────────────────┘ │
│                                                                     │
└────────────────────────────────────────────────────────────────────┘
```

### 8.9 Agent Access to Minor Profiles

Agents accessing minor profiles MUST:

1. **Check age context** before processing
2. **Respect content safety settings**
3. **Not profile or target advertising**
4. **Minimize data collection** (COPPA, GDPR-K)
5. **Obtain parental consent** for new permissions

```json
{
  "accessRequest": {
    "agentDid": "did:a2p:agent:game-assistant",
    "targetDid": "did:a2p:user:jamie",
    "scopes": ["a2p:preferences", "a2p:interests"],
    "minorProfile": true,
    "consentRequirements": {
      "requiresGuardianConsent": true,
      "guardianConsentRecord": {
        "guardianDid": "did:a2p:user:parent-alice",
        "consentGiven": "2025-01-01T00:00:00Z"
      }
    }
  }
}
```

### 8.10 Privacy Defaults for Minors

Minor profiles have stricter default policies:

| Setting | Default for Adults | Default for Minors |
|---------|-------------------|-------------------|
| Profile visibility | Public | Private |
| Memory proposals | Allowed | Requires guardian approval |
| Agent access | User consent | Guardian consent |
| Data retention | As declared | Minimized |
| Profiling | Allowed | Prohibited |
| Marketing | Allowed | Prohibited |

---

## 10. Consent & Access Control

### 9.1 Consent Levels

| Level | Permissions |
|-------|-------------|
| `none` | No access |
| `read_public` | Public categories only |
| `read_scoped` | Specific scopes only |
| `read_full` | All non-restricted categories |
| `propose` | Can propose new memories |
| `write` | Can directly add memories (rare) |

### 9.2 Access Policy Structure

```json
{
  "accessPolicies": [
    {
      "id": "policy_001",
      "name": "Work Agents",
      "agentPattern": "did:a2p:agent:*",
      "agentTags": ["work", "productivity"],
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
        "requireVerifiedOperator": true,
        "minTrustScore": 0.7
      },
      "expiry": null
    }
  ]
}
```

### 9.3 Scope Syntax

Scopes use a hierarchical dot notation:

#### Category Scopes

```
a2p:preferences              # All preferences (all memory types)
a2p:preferences.communication # Just communication preferences
a2p:preferences.communication.style # Just style preference
a2p:*                        # All standard categories
ext:spotify:*                # All custom Spotify data
```

#### Memory Type Scopes

```
a2p:episodic                 # All episodic memories (across all categories)
a2p:semantic                 # All semantic memories (across all categories)
a2p:procedural               # All procedural memories (across all categories)
```

#### Combined Scopes

```
a2p:semantic.preferences     # Semantic memories in preferences category
a2p:procedural.professional  # Procedural memories in professional category
a2p:episodic.*               # All episodic memories, all categories (same as a2p:episodic)
```

#### Scope Resolution Rules

1. **Memory type scope** (`a2p:episodic`) returns all memories of that type, regardless of category
2. **Category scope** (`a2p:preferences`) returns all memory types in that category
3. **Combined scope** (`a2p:semantic.preferences`) returns memories matching both type and category
4. **Default behavior**: If no memory type specified in scope, returns all types (backward compatible)

### 9.4 Consent Receipt

When consent is granted, a receipt is generated:

```json
{
  "receiptId": "rcpt_abc123",
  "userDid": "did:a2p:user:alice",
  "agentDid": "did:a2p:agent:claude",
  "grantedScopes": ["a2p:preferences", "a2p:interests"],
  "permissions": ["read_scoped", "propose"],
  "grantedAt": "2024-12-24T10:00:00Z",
  "expiresAt": null,
  "proofHash": "0x7f3a...",
  "proofLocation": "ipfs://Qm..."
}
```

---

## 11. Agent Integration

### 10.1 Agent Profile

Agents SHOULD publish an a2p profile describing their behavior:

```json
{
  "$schema": "https://a2p.protocol/schemas/v1/agent-profile.json",
  "id": "did:a2p:agent:my-assistant",
  "profileType": "agent",
  
  "identity": {
    "name": "My Assistant",
    "description": "A helpful AI assistant",
    "version": "2.1.0",
    "a2aCard": "https://myassistant.ai/.well-known/agent.json"
  },
  
  "operator": {
    "name": "Acme AI Inc.",
    "did": "did:a2p:org:acme-ai",
    "jurisdiction": "EU",
    "contact": "privacy@acme-ai.com",
    "privacyPolicy": "https://acme-ai.com/privacy"
  },
  
  "a2pSupport": {
    "protocolVersion": "1.0",
    "capabilities": {
      "canReadProfiles": true,
      "canProposeMemories": true,
      "canWriteMemories": false
    },
    "requestedScopes": [
      "a2p:preferences",
      "a2p:interests",
      "a2p:context"
    ],
    "dataRetention": {
      "sessionData": "24h",
      "persistentData": "none"
    }
  },
  
  "trustMetrics": {
    "verifiedOperator": true,
    "securityAudit": {
      "auditor": "SecurityCorp",
      "date": "2024-06-15",
      "report": "https://..."
    },
    "communityScore": 4.7
  }
}
```

### 10.2 Discovery

Agent profiles SHOULD be discoverable at:
```
https://{agent-domain}/.well-known/a2p-profile.json
```

### 10.3 Linking to A2A

The a2p agent profile can reference the A2A Agent Card:

```json
{
  "identity": {
    "a2aCard": "https://agent.example/.well-known/agent.json"
  }
}
```

---

## 12. Transport & API

### 12.1 Endpoints

Base URL: `https://{profile-host}/a2p/v1`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/profile/{did}` | Get profile (filtered by auth) |
| `POST` | `/profile/{did}/access` | Request access to profile |
| `GET` | `/profile/{did}/memories` | List memories |
| `POST` | `/profile/{did}/memories/propose` | Propose new memory |
| `GET` | `/profile/{did}/proposals` | List pending proposals |
| `POST` | `/profile/{did}/proposals/{id}/review` | Approve/reject proposal |
| `GET` | `/agents/{did}` | Get agent profile |
| `GET` | `/did/{did}` | Resolve DID to DID document (optional) |

**Note**: The `/did/{did}` endpoint is optional for v0.1.0. Implementations MAY provide this endpoint for DID resolution. See [Section 6.5: DID Resolution](#65-did-resolution) for details.

### 12.2 Authentication

All requests MUST include authentication:

```http
POST /a2p/v1/profile/did:a2p:user:gaugid:alice/memories/propose HTTP/1.1
Host: profiles.example.com
Content-Type: application/json
Authorization: A2P-Signature did="did:a2p:agent:gaugid:claude",sig="...",ts="..."

{
  "content": "...",
  "category": "..."
}
```

### 11.3 Response Format

```json
{
  "success": true,
  "data": { },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2024-12-24T10:00:00Z"
  }
}
```

### 11.4 Error Codes

#### 11.4.1 Protocol Error Codes (Required)

All implementations MUST support these error codes:

| Code | Name | Description |
|------|------|-------------|
| `A2P001` | `unauthorized` | Invalid or missing authentication |
| `A2P002` | `forbidden` | Insufficient permissions |
| `A2P003` | `not_found` | Profile or resource not found |
| `A2P004` | `consent_required` | User consent needed |
| `A2P005` | `rate_limited` | Too many requests |
| `A2P006` | `invalid_scope` | Requested scope not valid |
| `A2P007` | `invalid_timestamp` | Timestamp outside valid window (±300s) |
| `A2P008` | `nonce_reused` | Nonce already used (replay attack) |
| `A2P009` | `invalid_nonce` | Nonce format invalid (16-32 alphanumeric) |
| `A2P010` | `invalid_did_format` | DID does not match required format |
| `A2P023` | `invalid_memory_type` | Invalid memory type specified (must be episodic, semantic, or procedural) |
| `A2P024` | `memory_type_mismatch` | Memory stored in wrong array (e.g., semantic memory in episodic array) |
| `A2P025` | `memory_type_not_supported` | Memory type not supported by implementation |

#### 11.4.2 Implementation-Specific Error Codes (Optional)

Implementations MAY use these error codes for additional security features:

| Code | Name | Description | When to Use |
|------|------|-------------|-------------|
| `A2P011` | `agent_not_registered` | Agent must register before use | If registration is required |
| `A2P012` | `agent_not_verified` | Agent pending verification | If verification is required |
| `A2P013` | `token_did_mismatch` | Token DID doesn't match registered DID | If registration is required |

**Note:** Implementations that don't require agent registration SHOULD NOT return `A2P011-A2P013`.

### 11.5 Implementation-Specific Endpoints

Implementations MAY provide additional endpoints beyond those specified in this protocol. These endpoints are **not part of the protocol specification** and are implementation-specific.

#### When to Use Implementation-Specific Endpoints

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

#### Protocol vs Implementation Endpoints

**Protocol Endpoints** (`/a2p/v1/*`):
- MUST be implemented by all conformant implementations
- MUST follow protocol specifications exactly
- MUST use A2P-Signature authentication (or connection tokens as specified)
- MUST have DID in path (for profile operations, unless using connection tokens)
- Are interoperable across all implementations

**Implementation-Specific Endpoints** (`/api/*`, custom paths):
- MAY be implemented by implementations
- Can use different authentication (tokens, sessions, etc.)
- Can use different URL patterns
- Are NOT interoperable (agents cannot rely on them)
- SHOULD be clearly documented as implementation-specific

#### Examples

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

#### Documentation Requirements

Implementations that provide custom endpoints SHOULD:
- Clearly document which endpoints are protocol-standard vs implementation-specific
- Use different path prefixes (e.g., `/api/*` for implementation-specific)
- Document authentication methods for custom endpoints
- Note interoperability limitations

#### Interoperability Considerations

- **Agents** SHOULD only use protocol-standard endpoints (`/a2p/v1/profile/:did`)
- **Users** MAY use implementation-specific endpoints (e.g., `/api/profiles`)
- **Conformance tests** only verify protocol-standard endpoints
- **Custom endpoints** do not affect protocol conformance

---

## 13. Security Considerations

### 12.1 Encryption

- **At Rest**: Profiles MUST be encrypted at rest
- **In Transit**: All communications MUST use TLS 1.3+
- **End-to-End**: Optional E2E encryption for sensitive categories

### 12.2 Key Management

See [Key Management Specification](key-management.md) for complete details.

- Users SHOULD use hardware-backed keys when available
- Key rotation MUST be supported with grace periods
- Recovery methods MUST be available (social, backup, custodian)
- Key revocation MUST propagate immediately for compromised keys

### 12.3 Privacy

- Agents MUST NOT persist profile data beyond declared retention period
- Agents MUST NOT share profile data with third parties unless explicitly permitted
- Users MUST be able to audit all access

### 12.4 Trust Model

```
┌─────────────────────────────────────────────────────────────┐
│                    TRUST HIERARCHY                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   USER (highest trust)                                      │
│     │                                                       │
│     ├── User's own devices/apps                            │
│     │                                                       │
│     ├── Verified agents (audit passed)                     │
│     │     │                                                │
│     │     └── With explicit consent                        │
│     │                                                       │
│     ├── Unverified agents (limited access)                 │
│     │                                                       │
│     └── Unknown agents (no access)                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 12.5 Replay Attack Protection

All authenticated requests MUST include replay protection to prevent attackers from re-submitting captured requests.

#### 12.5.1 Authentication Header Format

```
Authorization: A2P-Signature 
  did="did:a2p:agent:my-agent",
  sig="<base64-signature>",
  ts="2024-12-24T10:00:00Z",
  nonce="abc123xyz789def456",
  exp="300"
```

| Field | Required | Description |
|-------|----------|-------------|
| `did` | Yes | Agent DID |
| `sig` | Yes | Base64-encoded signature of request |
| `ts` | Yes | ISO 8601 timestamp |
| `nonce` | Yes | Unique 16-32 character alphanumeric string |
| `exp` | No | Expiration in seconds (default: 300) |

#### 12.5.2 Validation Requirements

| Check | Requirement | Error Code |
|-------|-------------|------------|
| Timestamp | Within ±300 seconds of server time | `A2P007` |
| Nonce | Not seen in last 5 minutes | `A2P008` |
| Nonce Format | 16-32 alphanumeric characters | `A2P009` |
| Signature | Valid for request body + ts + nonce | `A2P001` |
| Expiration | Request not expired | `A2P010` |

#### 12.5.3 Nonce Storage

Servers MUST maintain a nonce cache:

```json
{
  "nonceCache": {
    "storage": "in_memory_or_distributed",
    "ttl": "5m",
    "cleanupInterval": "1m",
    "maxSize": "1000000"
  }
}
```

#### 12.5.4 Signature Computation

```
signature = sign(
  privateKey,
  sha256(
    method + "\n" +
    path + "\n" +
    timestamp + "\n" +
    nonce + "\n" +
    sha256(body)
  )
)
```

### 12.6 Rate Limiting

To prevent abuse and ensure fair access, all a2p endpoints MUST implement rate limiting.

#### 12.6.1 Global Limits

| Limit Type | Default | Configurable |
|------------|---------|--------------|
| Requests per minute (per agent) | 60 | Yes |
| Requests per hour (per agent) | 1000 | Yes |
| Burst allowance | 1.5x | Yes |

#### 12.6.2 Per-Operation Limits

| Operation | Limit | Window |
|-----------|-------|--------|
| Profile reads | 100 | per hour |
| Memory proposals | 20 | per hour |
| Memory writes | 50 | per hour |
| Policy updates | 10 | per hour |
| Consent requests | 30 | per hour |

#### 12.6.3 Enforcement Algorithm

Implementations SHOULD use the **Token Bucket** algorithm:

```json
{
  "rateLimiting": {
    "algorithm": "token_bucket",
    "bucketSize": 60,
    "refillRate": "1/second",
    "burstMultiplier": 1.5
  }
}
```

#### 12.6.4 Rate Limit Headers

Responses MUST include rate limit headers:

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1703419200
```

#### 12.6.5 Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1703419200

{
  "error": {
    "code": "A2P005",
    "message": "Rate limit exceeded",
    "retryAfter": 30
  }
}
```

#### 12.6.6 DDoS Mitigation

For high-load scenarios:

- Implement IP-based rate limiting at edge
- Use CAPTCHA for suspicious patterns
- Temporarily block repeated offenders
- Enable geographic restrictions if needed
- Monitor for distributed attack patterns

### 12.7 Security Levels

The a2p protocol defines a two-level security model to ensure baseline security while allowing implementations to add additional protections.

#### 12.7.1 Level 1: Protocol Requirements (MANDATORY)

All a2p-compliant implementations MUST:

1. **Validate DID Format**
   - Validate all DIDs against the patterns defined in Section 4.4
   - Return `A2P010` for invalid DID format
   - Reject malformed requests before further processing

2. **Require Authentication**
   - Require authentication tokens on all protocol endpoints
   - Validate token format and signature
   - Return `A2P001` for missing or invalid authentication

3. **Implement Replay Protection**
   - Validate timestamps within ±300 seconds
   - Track nonces to prevent replay attacks
   - Return `A2P007-A2P009` for replay protection failures

4. **Return Standard Error Codes**
   - Use error codes `A2P001-A2P010` as defined in Section 11.4.1

#### 12.7.2 Level 2: Implementation-Specific (OPTIONAL)

Implementations MAY add additional security layers:

| Feature | Description | Error Code |
|---------|-------------|------------|
| Agent Registration | Require agents to register before access | `A2P011` |
| Agent Verification | Require manual verification of registered agents | `A2P012` |
| Token-DID Binding | Verify token DID matches registered agent DID | `A2P013` |
| Enhanced Rate Limiting | Stricter limits than protocol minimum | `A2P005` |
| Audit Logging | Detailed access logs for compliance | N/A |
| IP Whitelisting | Restrict access by IP address | `A2P002` |
| Role-Based Access | Define agent roles with different permissions | `A2P002` |

#### 12.7.3 Implementation Guidance

```
┌─────────────────────────────────────────────────────────────┐
│              SECURITY VALIDATION FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Request ───► Token Valid? ──NO──► A2P001 (Unauthorized)   │
│                    │                                        │
│                   YES                                       │
│                    ▼                                        │
│              DID Format Valid? ─NO─► A2P010 (Invalid DID)   │
│                    │                                        │
│                   YES                                       │
│                    ▼                                        │
│              Replay Check OK? ─NO──► A2P007-009             │
│                    │                                        │
│                   YES                                       │
│                    ▼                                        │
│         [Optional: Registration Check]                      │
│              Agent Registered? ─NO─► A2P011 (Not Registered)│
│                    │                                        │
│                   YES                                       │
│                    ▼                                        │
│         [Optional: Verification Check]                      │
│              Agent Verified? ──NO──► A2P012 (Not Verified)  │
│                    │                                        │
│                   YES                                       │
│                    ▼                                        │
│              Process Request                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Implementations SHOULD document which optional security features they implement.

---

## 14. Offline Support

### 13.1 Overview

a2p implementations SHOULD support offline operation to ensure users can access their profiles without connectivity.

### 13.2 Profile Caching

#### 13.2.1 Cache Requirements

| Requirement | Specification |
|-------------|---------------|
| Storage | Encrypted local storage |
| Freshness | Configurable TTL (default: 24h) |
| Validation | Signature verification on load |
| Sync | Background sync when online |

#### 13.2.2 Cache Schema

```json
{
  "cache": {
    "profileDid": "did:a2p:user:alice",
    "cachedAt": "2024-12-24T10:00:00Z",
    "expiresAt": "2024-12-25T10:00:00Z",
    "version": "1.0",
    "hash": "sha256:...",
    "signature": "...",
    "data": { }
  }
}
```

### 13.3 Proposal Queuing

When offline, agents can queue proposals for later submission:

```json
{
  "pendingQueue": {
    "proposals": [
      {
        "queuedAt": "2024-12-24T10:00:00Z",
        "targetUser": "did:a2p:user:alice",
        "proposal": { },
        "retryCount": 0,
        "maxRetries": 3
      }
    ],
    "lastSync": "2024-12-24T09:00:00Z"
  }
}
```

### 13.4 Sync Protocol

#### 13.4.1 Sync Process

```
1. Client comes online
2. Compare local version with server
3. If server newer: pull changes
4. If local changes: push pending proposals
5. Resolve conflicts
6. Update cache
```

#### 13.4.2 Conflict Resolution

| Conflict Type | Resolution |
|---------------|------------|
| Memory added both | Keep both, mark for review |
| Policy changed both | Server wins, notify user |
| Memory deleted locally | Delete on server |
| Memory modified both | Server wins, keep local as proposal |

### 13.5 Offline Capabilities

| Feature | Offline Support | Notes |
|---------|-----------------|-------|
| View profile | ✅ Full | From cache |
| Edit memories | ⚠️ Queued | Synced when online |
| Add memories | ⚠️ Queued | Synced when online |
| Delete memories | ⚠️ Queued | Synced when online |
| Update policies | ❌ No | Requires online |
| Review proposals | ⚠️ Partial | Can approve locally, sync later |
| Agent access | ❌ No | Requires profile fetch |

---

## 15. Extensibility

### 14.1 Custom Categories

Developers can define custom categories using the `ext:` namespace:

```json
{
  "ext:myapp": {
    "$schema": "https://myapp.com/a2p/schema.json",
    "customField1": "value",
    "customField2": 123
  }
}
```

### 14.2 Schema Registry

Custom schemas SHOULD be registered:

```json
{
  "schemaRegistry": {
    "ext:spotify": {
      "version": "1.0",
      "spec": "https://spotify.com/a2p/schema/v1",
      "maintainer": "did:a2p:org:spotify"
    }
  }
}
```

### 14.3 Storage Backends

The protocol is storage-agnostic. Implementations MAY use:
- Local filesystem
- Solid Pods
- IPFS / Ceramic
- Cloud storage (encrypted)
- Custom backends

---

## Appendix A: JSON Schemas

See [schemas.md](schemas.md) for complete JSON Schema definitions.

## Appendix B: Example Implementations

See [examples/](../../examples/) for reference implementations.

## Appendix C: Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0-draft | 2024-12 | Initial draft specification |

---

## References

- [W3C Decentralized Identifiers (DIDs)](https://www.w3.org/TR/did-core/)
- [W3C Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
- [Google A2A Protocol](https://github.com/google/A2A)
- [Anthropic MCP](https://modelcontextprotocol.io/)
- [Solid Project](https://solidproject.org/)

---

**Authors:** a2p Protocol Team  
**License:** CC BY 4.0
