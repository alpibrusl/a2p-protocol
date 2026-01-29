# Profiles

Profiles are the core data structure in a2p. This page covers profile types, structure, and management.

---

## Profile Types

a2p supports three profile types:

| Type | Use Case | Example |
|------|----------|---------|
| `human` | Individual users | Personal AI assistant user |
| `agent` | AI systems, bots, services | ChatGPT, Claude, custom agent |
| `entity` | Organizations, teams, groups | Company, department, project |

---

## Human Profile

The most common profile type, owned by individual users.

### Full Structure

```json
{
  "$schema": "https://a2p.protocol/schemas/v1/profile.json",
  "id": "did:a2p:user:local:alice",
  "version": "1.0",
  "profileType": "human",
  "created": "2025-01-01T00:00:00Z",
  "updated": "2025-12-25T10:00:00Z",
  
  "identity": {
    "did": "did:a2p:user:local:alice",
    "displayName": "Alice Chen",
    "pronouns": "she/her",
    "avatar": "https://example.com/alice.jpg",
    "email": "alice@example.com"
  },
  
  "common": {
    "preferences": {
      "language": "en-US",
      "timezone": "Europe/Madrid",
      "communication": {
        "style": "concise",
        "formality": "casual",
        "humor": true,
        "verbosity": "brief"
      },
      "accessibility": {
        "screenReader": false,
        "highContrast": false,
        "reducedMotion": false
      }
    },
    "context": {
      "currentFocus": "a2p protocol development",
      "recentTopics": ["AI agents", "privacy"]
    }
  },
  
  "memories": {
    "a2p:professional": {
      "occupation": "Software Engineer",
      "industry": "Technology",
      "skills": ["TypeScript", "Python", "AI/ML"],
      "experience": "10+ years"
    },
    "a2p:interests": {
      "topics": ["AI ethics", "privacy tech", "open source"],
      "music": {
        "genres": ["jazz", "electronic"],
        "favoriteArtists": ["Nils Frahm"]
      }
    },
    "a2p:episodic": [
      {
        "id": "mem_001",
        "content": "Prefers TypeScript for new projects",
        "confidence": 0.9,
        "source": {
          "agentDid": "did:a2p:agent:local:copilot",
          "timestamp": "2025-12-20T14:00:00Z"
        }
      }
    ]
  },
  
  "accessPolicies": [
    {
      "id": "policy_default",
      "name": "Default Policy",
      "agentPattern": "*",
      "allow": ["a2p:preferences.language", "a2p:preferences.timezone"],
      "deny": ["a2p:health.*", "a2p:financial.*"],
      "permissions": ["read_public"]
    }
  ],
  
  "pendingProposals": [],
  
  "subProfiles": [
    {
      "profileId": "did:a2p:user:local:alice:work",
      "name": "Work",
      "purpose": "Professional interactions"
    }
  ]
}
```

---

## Agent Profile

Describes an AI agent, bot, or service.

### Structure

```json
{
  "id": "did:a2p:agent:local:my-assistant",
  "version": "1.0",
  "profileType": "agent",
  "created": "2025-01-01T00:00:00Z",
  
  "agentInfo": {
    "name": "My Assistant",
    "description": "A helpful AI assistant",
    "version": "2.1.0",
    "capabilities": ["conversation", "analysis", "coding"],
    "category": "general_assistant"
  },
  
  "operator": {
    "did": "did:a2p:org:local:mycompany",
    "name": "MyCompany Inc.",
    "contactEmail": "support@mycompany.com",
    "privacyPolicyUrl": "https://mycompany.com/privacy"
  },
  
  "technical": {
    "a2pEndpoint": "https://api.mycompany.com/a2p",
    "supportedVersions": ["1.0"],
    "publicKey": "-----BEGIN PUBLIC KEY-----..."
  },
  
  "trust": {
    "certifications": ["a2p_certified_v1"],
    "verifiedOperator": true,
    "securityAudit": {
      "lastAudit": "2025-06-15",
      "auditor": "SecurityCorp"
    }
  },
  
  "dataPractices": {
    "dataRetention": "session_only",
    "thirdPartySharing": false,
    "storageLocation": "EU"
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
  }
}
```

### AI Act Compliance Fields

For EU AI Act compliance, agent profiles include:

| Field | Description |
|-------|-------------|
| `riskLevel` | `minimal`, `limited`, `high` |
| `transparencyObligations` | Required disclosures |
| `humanOversight` | Oversight mechanism |
| `conformityAssessment` | Assessment status |

---

## Entity Profile

For organizations, teams, departments, or projects.

### Structure

```json
{
  "id": "did:a2p:org:local:acme-corp",
  "version": "1.0",
  "profileType": "entity",
  
  "entityInfo": {
    "name": "Acme Corporation",
    "entityType": "organization",
    "description": "A technology company",
    "website": "https://acme.example.com"
  },
  
  "hierarchy": {
    "parent": null,
    "children": [
      "did:a2p:org:local:acme-corp:engineering",
      "did:a2p:org:local:acme-corp:sales"
    ]
  },
  
  "enforcedPolicies": {
    "allChildren": {
      "minRetention": "30d",
      "requiredAuditLog": true,
      "deniedCategories": ["a2p:health.*"]
    }
  },
  
  "defaultPolicies": {
    "recommendations": [
      {
        "name": "Standard Work Policy",
        "allow": ["a2p:professional.*"],
        "deny": ["a2p:personal.*"]
      }
    ]
  },
  
  "registeredAgents": [
    {
      "agentDid": "did:a2p:agent:local:acme-copilot",
      "role": "internal_assistant",
      "registeredAt": "2025-01-15T00:00:00Z"
    }
  ]
}
```

### Entity Hierarchy

Entities can form hierarchies:

```
Acme Corporation
├── Engineering Department
│   ├── Platform Team
│   └── AI Team
├── Sales Department
│   └── Enterprise Team
└── HR Department
```

Policies can be enforced from parent to children.

---

## Profile Operations

### Creating a Profile

=== "TypeScript"

    ```typescript
    import { A2PUserClient } from '@a2p/sdk';
    
    const client = new A2PUserClient();
    
    const profile = await client.createProfile({
      displayName: 'Alice',
      preferences: {
        language: 'en-US',
        timezone: 'Europe/Madrid'
      }
    });
    
    console.log('Created:', profile.id);
    ```

=== "Python"

    ```python
    from a2p import A2PUserClient
    
    client = A2PUserClient()
    
    profile = await client.create_profile(
        display_name="Alice",
        preferences={
            "language": "en-US",
            "timezone": "Europe/Madrid"
        }
    )
    
    print(f"Created: {profile.id}")
    ```

### Updating a Profile

=== "TypeScript"

    ```typescript
    await client.updateProfile({
      common: {
        preferences: {
          communication: { style: 'detailed' }
        }
      }
    });
    ```

=== "Python"

    ```python
    await client.update_profile(
        common={
            "preferences": {
                "communication": {"style": "detailed"}
            }
        }
    )
    ```

### Exporting a Profile

Profiles can be exported in JSON format for portability:

=== "TypeScript"

    ```typescript
    const exported = await client.exportProfile();
    // Save to file or transfer to new provider
    ```

---

## Sub-Profiles

Users can create sub-profiles for different contexts:

```typescript
const workProfile = await client.createSubProfile({
  name: 'Work',
  purpose: 'Professional interactions',
  inheritsFrom: mainProfile.id,
  overrides: {
    preferences: {
      communication: { formality: 'professional' }
    }
  }
});
```

### Inheritance Rules

| Data Type | Inheritance |
|-----------|-------------|
| `identity` | Inherited, can override `displayName` |
| `preferences` | Inherited, can override specific fields |
| `memories` | Not inherited by default |
| `policies` | Inherited, can add more restrictive |

---

## Next Steps

- [Memories & Proposals](memories.md) — Learn about memory management
- [Consent & Policies](consent.md) — Understand access control
