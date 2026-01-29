# a2p — Agent 2 Profile Protocol

<p align="center">
  <img src="docs/assets/a2p-logo.svg" alt="a2p Protocol" width="200"/>
</p>

<p align="center">
  <strong>User-Owned Profiles for AI Agents</strong>
</p>

<p align="center">
  <a href="#overview">Overview</a> •
  <a href="#key-features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#documentation">Docs</a> •
  <a href="#sdks">SDKs</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <a href="https://github.com/a2p-protocol/a2p/actions/workflows/test.yml"><img src="https://github.com/a2p-protocol/a2p/actions/workflows/test.yml/badge.svg" alt="Tests"></a>
  <a href="https://codecov.io/gh/a2p-protocol/a2p"><img src="https://codecov.io/gh/a2p-protocol/a2p/branch/main/graph/badge.svg" alt="Coverage"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-EUPL--1.2-blue.svg" alt="License: EUPL-1.2"></a>
  <img src="https://img.shields.io/badge/version-0.1.0--alpha-orange.svg" alt="Version: 0.1.0-alpha">
</p>

---

## Overview

**a2p (Agent 2 Profile)** is an open protocol that puts users in control of their AI interaction data. Instead of each AI agent maintaining its own siloed memory about you, a2p lets you own a unified profile that you selectively share with agents.

### The Problem

Today's AI agents each maintain their own memory about users:

- 🔒 **Siloed** — Your preferences are locked inside each agent's system
- 🚫 **No portability** — Switch agents, lose your context
- ❓ **Opaque** — You don't know what agents remember about you
- 🎯 **No consent granularity** — It's all-or-nothing

### The Solution

a2p flips the model:

- ✅ **User-owned** — You control your profile data
- ✅ **Portable** — One profile works with any a2p-compatible agent
- ✅ **Transparent** — See exactly what's stored about you
- ✅ **Granular consent** — Share only what you want, with whom you want
- ✅ **Proposal-based** — Agents suggest memories, you approve them

---

## Key Features

### 🎭 Multiple Profiles

Maintain separate profiles for work, personal, health contexts — with shared base information.

### 🔐 Granular Consent

Control exactly what each agent can see:

- Static preferences
- Specific memory categories
- Propose-only access
- Full read/write

### 📝 Memory Proposals

Agents can suggest new memories. You review and approve before they're added.

### 🔗 Decentralized Identity

Built on DIDs (Decentralized Identifiers) for self-sovereign identity.

### 📦 Standard Schema

Predefined categories for interoperability: identity, preferences, interests, professional, health.

### 🔄 Memory Consolidation

Automatic deduplication, conflict resolution, and confidence decay.

### 🏢 Entity Profiles

Organizations, teams, and departments can define policies that are inherited by members:

- **Hierarchical**: Orgs → Departments → Teams → Users
- **Enforced Policies**: Compliance rules that children cannot override
- **Flexible Types**: Organization, department, team, project, guild, or custom

### ♿ Accessibility Preferences

Standardized accessibility settings for adaptive UI and real-world services:

- **Vision**: Color blindness, screen reader, high contrast, font size
- **Hearing**: Captions, sign language, visual alerts
- **Motor**: Keyboard navigation, large targets, extended timeouts
- **Cognitive**: Simplified UI, reading assistance, reduced motion
- **Physical**: Wheelchair, service animal, allergies, dietary needs
- **Special Assistance**: Early boarding, interpreter, seating preferences

### 👶 Children & Guardianship

Comprehensive support for minor profiles:

- **Age Context**: Age group, jurisdiction, consent status
- **Parental Controls**: Content safety, chat restrictions, purchases
- **Screen Time**: Daily limits, bedtime, break reminders
- **Enforced Policies**: Parent-set rules children cannot override
- **Legal Compliance**: COPPA, GDPR Article 8, AADC

---

## Profile Types

| Type | DID Pattern | Purpose |
|------|-------------|---------|
| **Human** | `did:a2p:user:*` | Individual user profiles |
| **Entity** | `did:a2p:entity:*` | Organizations, teams, departments |
| **Agent** | `did:a2p:agent:*` | AI agents and services |

### Entity Hierarchy Example

```
ACME Corp (organization)
├── ENFORCES: GDPR compliance, EU data residency (locked)
│
├── Engineering (department)
│   ├── INHERITS: corporate policies
│   ├── ADDS: code review required
│   │
│   ├── ML Team (team)
│   │   └── Alice (user) → gets all inherited policies
│   │
│   └── Platform Team (team)
│       └── Bob (user)
│
└── Sales (department)
    └── Charlie (user)
```

---

## Beyond AI Agents

While a2p was designed with AI agents in mind, the protocol is **service-agnostic** and works with any system that needs user context:

| Use Case | Examples |
|----------|----------|
| **AI Agents** | ChatGPT, Claude, custom assistants |
| **ML Models** | Recommendation engines, personalization |
| **Web Services** | E-commerce, news, streaming platforms |
| **IoT Devices** | Smart home, wearables, connected cars |
| **Healthcare** | Patient preferences across providers |
| **Enterprise** | Employee profiles, tool personalization |

### Why One Profile for Everything?

Today, every service learns about you separately:

- Spotify learns your music taste
- Netflix learns your viewing habits  
- Your AI assistant learns your preferences

With a2p, **you own one profile** that services read from (with your permission). When Spotify learns you like jazz, that knowledge can benefit your AI assistant too — if you choose to share it.

```
┌─────────────────────────────────────────────────────────────┐
│                     YOUR a2p PROFILE                        │
├─────────────────────────────────────────────────────────────┤
│   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│   │   AI    │ │   ML    │ │   Web   │ │   IoT   │          │
│   │ Agents  │ │ Models  │ │Services │ │ Devices │          │
│   └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│        └───────────┴─────┬─────┴───────────┘               │
│                          ▼                                  │
│              ┌───────────────────────┐                     │
│              │   a2p Protocol        │                     │
│              │   (Consent-based)     │                     │
│              └───────────────────────┘                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### For Users

**Using the Python SDK:**

```python
from a2p import create_user_client

# Create your profile
client = create_user_client()
profile = await client.create_profile(display_name="Alice")

# Add preferences
await client.add_memory(
    content="Prefers concise responses with code examples",
    category="a2p:preferences.communication"
)

# Review pending proposals
proposals = client.get_pending_proposals()
```

> **Note:** A CLI tool is planned for future releases. See [examples/](examples/) for more usage patterns.

### For Agent Developers

**TypeScript:**

```typescript
import { A2PClient } from '@a2p/sdk';

const client = new A2PClient({
  agentDid: 'did:a2p:agent:my-agent',
  privateKey: process.env.A2P_PRIVATE_KEY
});

// Request access to user profile
const profile = await client.getProfile({
  userDid: 'did:a2p:user:alice',
  scopes: ['a2p:preferences', 'a2p:interests']
});

// Propose a new memory
await client.proposeMemory({
  userDid: 'did:a2p:user:alice',
  content: 'Prefers concise responses with code examples',
  category: 'a2p:preferences.communication',
  confidence: 0.85
});
```

**Python:**

```python
from a2p import A2PClient

client = A2PClient(
    agent_did="did:a2p:agent:my-agent",
    private_key=os.environ["A2P_PRIVATE_KEY"]
)

# Request access to user profile
profile = await client.get_profile(
    user_did="did:a2p:user:alice",
    scopes=["a2p:preferences", "a2p:interests"]
)

# Propose a new memory
await client.propose_memory(
    user_did="did:a2p:user:alice",
    content="Prefers concise responses with code examples",
    category="a2p:preferences.communication",
    confidence=0.85
)
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [Protocol Specification](docs/content/spec/index.md) | Complete protocol specification |
| [Profile Schema](docs/content/spec/schemas.md) | JSON Schema definitions |
| [API Reference](docs/content/specification/api.md) | REST API documentation |
| [Security Model](docs/content/spec/security.md) | Authentication and encryption |
| [Legal Compliance](docs/content/legal/gdpr.md) | GDPR, CCPA compliance guide |

---

## SDKs

| Language | Package | Status |
|----------|---------|--------|
| TypeScript/JavaScript | [`@a2p/sdk`](packages/sdk/typescript) | ✅ Available |
| Python | [`a2p-sdk`](packages/sdk/python) | ✅ Available |
| Rust | `a2p-sdk` | 🚧 Planned |
| Go | `a2p-sdk` | 🚧 Planned |

### Framework Adapters

| Framework | Package | Description |
|-----------|---------|-------------|
| LangGraph | [`@a2p/langgraph`](packages/adapters/langgraph/typescript) | Memory store integration |
| CrewAI | [`a2p-crewai`](packages/adapters/crewai/python) | Agent memory integration |
| Mastra | [`@a2p/mastra`](packages/adapter-mastra) | Tool provider integration |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         a2p PROTOCOL STACK                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │
│  │   Agent A   │   │   Agent B   │   │   Agent C   │               │
│  │  (Claude)   │   │  (ChatGPT)  │   │  (Custom)   │               │
│  └──────┬──────┘   └──────┬──────┘   └──────┬──────┘               │
│         │                 │                 │                       │
│         └────────────┬────┴─────────────────┘                       │
│                      ▼                                              │
│         ┌────────────────────────────┐                              │
│         │   a2p GATEWAY / SDK        │  ← Consent, Auth, Filtering  │
│         └────────────┬───────────────┘                              │
│                      │                                              │
│         ┌────────────▼───────────────┐                              │
│         │   USER PROFILE STORE       │                              │
│         │   ─────────────────────    │                              │
│         │   • Static Profile         │  (preferences, style)        │
│         │   • Memories               │  (facts learned over time)   │
│         │   • Pending Proposals      │  (agent suggestions)         │
│         │   • Consent Policies       │  (access control)            │
│         └────────────────────────────┘                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Storage Options

a2p is storage-agnostic. Profiles can be stored:

| Option | Best For | Privacy Level |
|--------|----------|---------------|
| **Local** | Maximum privacy | ⭐⭐⭐⭐⭐ |
| **Solid Pod** | Decentralized, W3C standard | ⭐⭐⭐⭐ |
| **IPFS/Ceramic** | Censorship-resistant | ⭐⭐⭐⭐ |
| **Cloud (encrypted)** | Convenience | ⭐⭐⭐ |

---

## Legal Compliance

a2p is designed with privacy regulations in mind:

### 🇪🇺 GDPR (EU)

- ✅ Right to access (user owns profile)
- ✅ Right to rectification (user can edit)
- ✅ Right to erasure (user can delete)
- ✅ Right to portability (standard JSON format)
- ✅ Consent management (granular policies)

### 🇺🇸 CCPA/CPRA (California)

- ✅ Right to know
- ✅ Right to delete
- ✅ Right to opt-out
- ✅ Non-discrimination

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/a2p-protocol/a2p.git
cd a2p

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

---

## License

**EUPL v1.2** (European Union Public Licence) — see [LICENSE](LICENSE) for details.

We chose the EUPL because:

- 🇪🇺 Designed for EU legal frameworks
- 🌍 Available in 23 EU languages (legally equivalent)
- 🔒 Weak copyleft ensures improvements stay open
- ☁️ Covers SaaS/network use (important for AI agents)
- 🤝 Compatible with GPL, LGPL, AGPL, MPL, EPL

---

## Community

- 🌐 [Website](https://a2p.protocol)
- 📖 [Documentation](https://docs.a2p.protocol)
- 💬 [Discord](https://discord.gg/a2p)
- 🐦 [Twitter](https://twitter.com/a2p_protocol)

---

<p align="center">
  <sub>Built with ❤️ for user data sovereignty</sub>
</p>
