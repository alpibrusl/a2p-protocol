# Architecture

This page describes the high-level architecture of the a2p protocol.

---

## System Overview

```mermaid
graph TB
    subgraph "Users"
        U1[User App]
        U2[User Wallet]
    end
    
    subgraph "a2p Infrastructure"
        GW[Gateway / API]
        PS[Profile Storage]
        AR[Agent Registry]
    end
    
    subgraph "AI Agents"
        A1[Agent 1]
        A2[Agent 2]
        A3[Agent 3]
    end
    
    U1 --> GW
    U2 --> GW
    GW --> PS
    GW --> AR
    A1 --> GW
    A2 --> GW
    A3 --> GW
```

---

## Core Components

### 1. User Profile

The central data structure owned by the user:

```
┌─────────────────────────────────────────┐
│              User Profile               │
├─────────────────────────────────────────┤
│ Identity        │ DID, display name     │
│ Preferences     │ Language, style       │
│ Memories        │ Categorized facts     │
│ Policies        │ Consent rules         │
│ Pending         │ Proposals to review   │
└─────────────────────────────────────────┘
```

### 2. Gateway / API

Handles all protocol operations:

- Profile retrieval (with access control)
- Access requests (with purpose)
- Memory proposals
- Consent management

### 3. Profile Storage

Pluggable storage backends:

| Option | Use Case |
|--------|----------|
| **Local** | User's device |
| **Cloud** | Managed service |
| **Decentralized** | IPFS, Solid pods |

### 4. Agent Registry

Optional directory of verified agents:

- Agent profiles and capabilities
- Trust/reputation information
- Certification status

---

## Request Flow

### Reading a Profile

```mermaid
sequenceDiagram
    participant Agent
    participant Gateway
    participant Storage
    participant PolicyEngine

    Agent->>Gateway: GET /profile/{did}<br/>Authorization: A2P-Signature
    Gateway->>Gateway: Verify signature
    Gateway->>Storage: Fetch profile
    Storage-->>Gateway: Full profile
    Gateway->>PolicyEngine: Apply policies(agentDid, profile)
    PolicyEngine-->>Gateway: Filtered profile
    Gateway-->>Agent: 200 OK + filtered profile
```

### Proposing a Memory

```mermaid
sequenceDiagram
    participant Agent
    participant Gateway
    participant Storage
    participant User

    Agent->>Gateway: POST /profile/{did}/memories/propose
    Gateway->>Gateway: Verify signature
    Gateway->>Gateway: Validate proposal
    Gateway->>Storage: Store pending proposal
    Storage-->>Gateway: proposalId
    Gateway-->>Agent: 201 Created
    Gateway->>User: Notify (webhook/push)
```

---

## Data Model

### Profile Schema

```json
{
  "id": "did:a2p:user:local:...",
  "version": "1.0",
  "profileType": "human",
  "created": "2025-01-01T00:00:00Z",
  "updated": "2025-12-25T10:00:00Z",
  
  "identity": { ... },
  "common": {
    "preferences": { ... },
    "interests": { ... }
  },
  "memories": {
    "a2p:professional": { ... },
    "a2p:episodic": [ ... ]
  },
  "accessPolicies": [ ... ],
  "pendingProposals": [ ... ]
}
```

### Relationships

```mermaid
erDiagram
    PROFILE ||--o{ MEMORY : contains
    PROFILE ||--o{ POLICY : defines
    PROFILE ||--o{ PROPOSAL : has_pending
    AGENT ||--o{ PROPOSAL : creates
    POLICY ||--o{ CONSENT_RECEIPT : generates
    AGENT }|--|| AGENT_PROFILE : has
```

---

## Security Architecture

### Defense in Depth

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1: Network                         │
│  TLS 1.3, WAF, DDoS mitigation                             │
├─────────────────────────────────────────────────────────────┤
│                    Layer 2: Transport                       │
│  Rate limiting, IP filtering                               │
├─────────────────────────────────────────────────────────────┤
│                    Layer 3: Authentication                  │
│  DID signatures, nonce validation, timestamp checks        │
├─────────────────────────────────────────────────────────────┤
│                    Layer 4: Authorization                   │
│  Consent policies, scope checking, purpose validation      │
├─────────────────────────────────────────────────────────────┤
│                    Layer 5: Data Protection                 │
│  Encryption at rest, encryption in transit                 │
└─────────────────────────────────────────────────────────────┘
```

### Key Management

Users control cryptographic keys:

- **Primary key** — Signs all operations
- **Recovery key** — Backup for key loss
- **Delegation keys** — For specific agents

---

## Deployment Options

### Option 1: Self-Hosted

User runs their own profile storage:

```
User Device
├── a2p Client
├── Local Storage
└── DID Keys
```

### Option 2: Managed Service

Profile hosted by a2p-compatible provider:

```
a2p Cloud
├── Gateway
├── Storage
└── User Dashboard
```

### Option 3: Hybrid

Local for sensitive, cloud for convenience:

```
User Device (sensitive)          Cloud (general)
├── Health data                  ├── Preferences
├── Financial data               ├── Interests
└── Private keys                 └── General memories
```

---

## Interoperability

### With A2A Protocol

a2p complements [A2A (Agent2Agent)](https://a2a-protocol.org/):

```mermaid
graph LR
    User[User] --> Profile[a2p Profile]
    Profile --> Agent1[Agent A]
    Agent1 <--> |A2A| Agent2[Agent B]
    Agent2 <--> |A2A| Agent3[Agent C]
```

- **a2p**: Agent accesses user context
- **A2A**: Agents communicate with each other

### With MCP

a2p profiles can be exposed as MCP resources:

```
MCP Server
└── a2p Resource Provider
    ├── profile://user/preferences
    └── profile://user/context
```

---

## Scalability

### Horizontal Scaling

```
Load Balancer
├── Gateway 1 ──┐
├── Gateway 2 ──┼── Storage Cluster
└── Gateway 3 ──┘
```

### Caching Strategy

| Data | Cache TTL | Invalidation |
|------|-----------|--------------|
| Public profile | 1 hour | On update |
| Policies | 5 minutes | On change |
| Agent registry | 1 hour | On verification |

### Rate Limits

| Operation | Limit |
|-----------|-------|
| Profile reads | 100/hour |
| Proposals | 20/hour |
| Policy updates | 10/hour |

---

## Next Steps

- [Specification Overview](../spec/overview.md) — Detailed protocol spec
- [Security Spec](../spec/security.md) — Security details
- [Quickstart](../tutorials/quickstart-typescript.md) — Build an integration
