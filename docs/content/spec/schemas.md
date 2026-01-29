# JSON Schemas

This page lists all JSON Schema definitions for the a2p protocol.

---

## Schema Files

| Schema | Description |
|--------|-------------|
| `profile.schema.json` | User profile structure |
| `memory.schema.json` | Memory entry structure |
| `proposal.schema.json` | Memory proposal structure |
| `consent-policy.schema.json` | Access policy structure |
| `consent-receipt.schema.json` | Consent receipt structure |
| `agent-profile.schema.json` | Agent profile structure |
| `entity-profile.schema.json` | Entity profile structure |
| `access-request.schema.json` | Access request with purpose |

---

## Download

All schemas are available in the repository:

```
https://github.com/a2p-protocol/a2p/tree/main/schemas
```

---

## Example: Profile Schema

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
      "pattern": "^did:a2p:(user|agent|entity):.+"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+$"
    },
    "profileType": {
      "type": "string",
      "enum": ["human", "agent", "entity"]
    }
  }
}
```

---

## Validation

Use any JSON Schema validator:

=== "TypeScript"

    ```typescript
    import Ajv from 'ajv';
    import profileSchema from './schemas/profile.schema.json';
    
    const ajv = new Ajv();
    const validate = ajv.compile(profileSchema);
    
    const valid = validate(myProfile);
    if (!valid) {
      console.log(validate.errors);
    }
    ```

=== "Python"

    ```python
    import jsonschema
    import json
    
    with open('schemas/profile.schema.json') as f:
        schema = json.load(f)
    
    jsonschema.validate(my_profile, schema)
    ```

---

## Next Steps

- [Overview](overview.md) — Specification overview
- [Profiles](profiles.md) — Profile details
