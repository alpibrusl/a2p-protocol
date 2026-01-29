# Profile Specification

This document specifies the structure of a2p profiles.

---

## Profile Types

| Type | Description | Use Case |
|------|-------------|----------|
| `human` | Individual users | Personal profiles |
| `agent` | AI agents and services | Bot/assistant profiles |
| `entity` | Organizations, teams | Company profiles |

---

## Human Profile

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | DID | Profile owner's DID |
| `version` | string | Schema version (e.g., "1.0") |
| `profileType` | string | Must be "human" |
| `identity` | object | Basic identity info |

### Full Schema

```json
{
  "id": "did:a2p:user:local:alice123",
  "version": "1.0",
  "profileType": "human",
  "created": "2025-01-01T00:00:00Z",
  "updated": "2025-12-25T10:00:00Z",
  
  "identity": {
    "did": "did:a2p:user:local:alice123",
    "displayName": "Alice",
    "pronouns": "she/her",
    "avatar": "https://example.com/avatar.jpg"
  },
  
  "common": {
    "preferences": {
      "language": "en-US",
      "timezone": "Europe/Madrid",
      "dateFormat": "DD/MM/YYYY",
      "communication": {
        "style": "concise",
        "formality": "casual",
        "humor": true
      }
    },
    "accessibility": {
      "screenReader": false,
      "highContrast": false,
      "reducedMotion": false
    }
  },
  
  "memories": {
    "a2p:professional": {
      "occupation": "Software Engineer",
      "company": "Tech Corp",
      "skills": ["TypeScript", "Python", "Rust"]
    },
    "a2p:interests": {
      "topics": ["AI", "distributed systems"],
      "music": { "genres": ["jazz", "electronic"] }
    },
    "a2p:episodic": [
      {
        "id": "mem_abc123",
        "content": "Prefers TypeScript for new projects",
        "confidence": 0.88,
        "source": { "type": "proposal", "agentDid": "did:a2p:agent:local:claude" },
        "createdAt": "2025-12-20T14:30:00Z"
      }
    ]
  },
  
  "accessPolicies": [
    {
      "id": "policy_default",
      "name": "Default Policy",
      "agentPattern": "*",
      "allow": ["a2p:preferences.*"],
      "deny": ["a2p:health.*", "a2p:financial.*"],
      "permissions": ["read_public"]
    }
  ],
  
  "pendingProposals": [ ... ]
}
```

---

## Agent Profile

Agents have their own profiles describing capabilities.

```json
{
  "id": "did:a2p:agent:local:my-assistant",
  "version": "1.0",
  "profileType": "agent",
  
  "identity": {
    "name": "My Assistant",
    "description": "A helpful AI assistant",
    "icon": "https://example.com/icon.png"
  },
  
  "operator": {
    "did": "did:a2p:entity:local:company",
    "name": "Company Inc.",
    "contact": "support@company.com",
    "jurisdiction": "EU"
  },
  
  "capabilities": [
    "conversation",
    "code_generation",
    "summarization"
  ],
  
  "dataHandling": {
    "storage": "session_only",
    "encryption": true,
    "retention": "24h",
    "thirdPartySharing": false
  },
  
  "aiActCompliance": {
    "riskLevel": "limited",
    "transparencyObligations": [
      "user_notification",
      "ai_generated_content_marking"
    ],
    "humanOversight": {
      "required": true,
      "mechanism": "human_on_the_loop"
    }
  },
  
  "requestedScopes": [
    "a2p:preferences.*",
    "a2p:interests.*"
  ],
  
  "trustIndicators": {
    "verified": true,
    "certifications": ["a2p-certified"],
    "operatorVerified": true
  }
}
```

---

## Entity Profile

For organizations with hierarchical structure.

```json
{
  "id": "did:a2p:entity:local:acme-corp",
  "version": "1.0",
  "profileType": "entity",
  
  "entityType": "organization",
  
  "identity": {
    "name": "Acme Corporation",
    "description": "Global technology company"
  },
  
  "hierarchy": {
    "parent": null,
    "children": [
      "did:a2p:entity:local:acme-engineering",
      "did:a2p:entity:local:acme-sales"
    ]
  },
  
  "enforcedPolicies": [
    {
      "id": "policy_no_health",
      "rule": {
        "field": "deny",
        "enforcement": "additive",
        "value": ["a2p:health.*"]
      },
      "appliesTo": "all_descendants"
    }
  ],
  
  "members": [
    {
      "did": "did:a2p:user:local:alice",
      "role": "employee"
    }
  ]
}
```

---

## Multi-Profile Support

Users can have multiple profiles:

```
Base Profile (did:a2p:user:local:alice)
├── Work Profile (did:a2p:user:local:alice:work)
│   └── Inherits base, adds work context
├── Personal Profile (did:a2p:user:local:alice:personal)
│   └── Inherits base, different policies
└── Health Profile (did:a2p:user:local:alice:health)
    └── Strict access controls
```

### Inheritance

Sub-profiles inherit from base and can:
- Add new memories
- Override preferences
- Define stricter policies

---

## Validation Rules

| Rule | Description |
|------|-------------|
| DID format | Must match `^did:a2p:(user\|agent\|entity):.+$` |
| Version | Must be semantic version |
| Timestamps | Must be ISO 8601 |
| Categories | Must match `^(a2p\|ext):[a-zA-Z0-9_.]+$` |

---

## Next Steps

- [Memories](memories.md) — Memory specification
- [Consent](consent.md) — Access policies
- [Schemas](schemas.md) — JSON Schema files
