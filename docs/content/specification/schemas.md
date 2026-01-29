# JSON Schemas

Complete JSON Schema definitions for a2p data structures.

---

## Schema Locations

All schemas are available at:

```
https://a2p.protocol/schemas/v1/{schema}.json
```

---

## Profile Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://a2p.protocol/schemas/v1/profile.json",
  "title": "A2P Profile",
  "type": "object",
  "required": ["id", "version", "profileType"],
  
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^did:",
      "description": "DID of the profile owner"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+$"
    },
    "profileType": {
      "type": "string",
      "enum": ["human", "agent", "entity"]
    },
    "created": {
      "type": "string",
      "format": "date-time"
    },
    "updated": {
      "type": "string",
      "format": "date-time"
    },
    "identity": {
      "$ref": "#/$defs/identity"
    },
    "common": {
      "$ref": "#/$defs/common"
    },
    "memories": {
      "type": "object",
      "additionalProperties": true
    },
    "accessPolicies": {
      "type": "array",
      "items": { "$ref": "#/$defs/policy" }
    }
  }
}
```

---

## Memory Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://a2p.protocol/schemas/v1/memory.json",
  "title": "A2P Memory",
  "type": "object",
  "required": ["id", "content", "category"],
  
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^mem_"
    },
    "content": {
      "oneOf": [
        { "type": "string" },
        { "type": "object" }
      ]
    },
    "category": {
      "type": "string",
      "pattern": "^(a2p|ext):[a-zA-Z0-9_.]+"
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1
    },
    "sensitivity": {
      "type": "string",
      "enum": ["low", "standard", "high"],
      "default": "standard"
    },
    "source": {
      "$ref": "#/$defs/source"
    },
    "scope": {
      "type": "array",
      "items": { "type": "string" }
    },
    "metadata": {
      "type": "object"
    }
  }
}
```

---

## Proposal Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://a2p.protocol/schemas/v1/proposal.json",
  "title": "A2P Memory Proposal",
  "type": "object",
  "required": ["id", "userDid", "agentDid", "content", "category", "status"],
  
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^prop_"
    },
    "userDid": {
      "type": "string",
      "pattern": "^did:"
    },
    "agentDid": {
      "type": "string",
      "pattern": "^did:"
    },
    "content": {
      "type": "string",
      "maxLength": 10000
    },
    "category": {
      "type": "string",
      "pattern": "^(a2p|ext):"
    },
    "confidence": {
      "type": "number",
      "minimum": 0,
      "maximum": 1,
      "default": 0.8
    },
    "context": {
      "type": "string",
      "maxLength": 500
    },
    "status": {
      "type": "string",
      "enum": ["pending", "approved", "rejected", "expired"]
    },
    "proposedAt": {
      "type": "string",
      "format": "date-time"
    },
    "expiresAt": {
      "type": "string",
      "format": "date-time"
    }
  }
}
```

---

## Access Request Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://a2p.protocol/schemas/v1/access-request.json",
  "title": "A2P Access Request",
  "type": "object",
  "required": ["agentDid", "userDid", "scopes", "purpose"],
  
  "properties": {
    "agentDid": {
      "type": "string",
      "pattern": "^did:"
    },
    "userDid": {
      "type": "string",
      "pattern": "^did:"
    },
    "scopes": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 1
    },
    "purpose": {
      "type": "object",
      "required": ["type", "description", "legalBasis"],
      "properties": {
        "type": {
          "type": "string",
          "enum": [
            "personalization",
            "recommendation",
            "analysis",
            "support",
            "research",
            "compliance",
            "other"
          ]
        },
        "description": {
          "type": "string",
          "maxLength": 500
        },
        "legalBasis": {
          "type": "string",
          "enum": [
            "consent",
            "contract",
            "legal_obligation",
            "vital_interests",
            "public_task",
            "legitimate_interests"
          ]
        },
        "retention": {
          "type": "string"
        }
      }
    }
  }
}
```

---

## Consent Policy Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://a2p.protocol/schemas/v1/consent-policy.json",
  "title": "A2P Consent Policy",
  "type": "object",
  "required": ["id", "name", "agentPattern"],
  
  "properties": {
    "id": {
      "type": "string",
      "pattern": "^policy_"
    },
    "name": {
      "type": "string",
      "maxLength": 100
    },
    "priority": {
      "type": "integer",
      "default": 0
    },
    "agentPattern": {
      "type": "string"
    },
    "allow": {
      "type": "array",
      "items": { "type": "string" }
    },
    "deny": {
      "type": "array",
      "items": { "type": "string" }
    },
    "permissions": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "read_public",
          "read_scoped",
          "read_full",
          "propose",
          "write"
        ]
      }
    },
    "conditions": {
      "type": "object"
    }
  }
}
```

---

## Schema Downloads

- [profile.schema.json](https://github.com/a2p-protocol/a2p/blob/main/schemas/profile.schema.json)
- [memory.schema.json](https://github.com/a2p-protocol/a2p/blob/main/schemas/memory.schema.json)
- [proposal.schema.json](https://github.com/a2p-protocol/a2p/blob/main/schemas/proposal.schema.json)
- [consent-policy.schema.json](https://github.com/a2p-protocol/a2p/blob/main/schemas/consent-policy.schema.json)
- [access-request.schema.json](https://github.com/a2p-protocol/a2p/blob/main/schemas/access-request.schema.json)

---

## Next Steps

- [API Reference](api.md) — Endpoint documentation
- [Versioning](versioning.md) — Schema versioning
