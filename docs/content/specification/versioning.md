# Versioning

Protocol versioning and migration strategy.

---

## Current Version

**a2p Protocol Version: 1.0**

---

## Semantic Versioning

```
MAJOR.MINOR.PATCH
```

| Component | Meaning | Example |
|-----------|---------|---------|
| MAJOR | Breaking changes | 2.0.0 |
| MINOR | New features (backward compatible) | 1.1.0 |
| PATCH | Bug fixes | 1.0.1 |

---

## Version Negotiation

### Request Header

```http
A2P-Version: 1.0
A2P-Version-Min: 1.0
A2P-Version-Max: 1.1
```

### Response Header

```http
A2P-Version: 1.0
A2P-Version-Supported: 1.0, 1.1
```

### Negotiation Algorithm

1. If `A2P-Version` specified → use if supported
2. Else if `A2P-Version-Max` specified → use highest ≤ max
3. Else → use latest supported

---

## Compatibility

### Backward Compatibility Window

- **2 major versions** backward supported
- **24 months** minimum support for previous major

### Change Types

| Change | Backward Compatible |
|--------|---------------------|
| Add optional field | ✅ Yes |
| Add new endpoint | ✅ Yes |
| Add enum value | ✅ Yes |
| Remove field | ❌ No |
| Change field type | ❌ No |
| Remove endpoint | ❌ No |

---

## Deprecation Policy

```
Announcement → Warning → Sunset → Removal
   6 months     3 months   3 months
```

### Deprecation Header

```http
Deprecation: true
Sunset: Sat, 01 Jul 2027 00:00:00 GMT
Link: <https://a2p.protocol/migration/v2>; rel="successor-version"
```

---

## Migration

### Migration Endpoint

```http
POST /a2p/v1/migrate
```

**Request:**

```json
{
  "fromVersion": "1.0",
  "toVersion": "2.0",
  "dryRun": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "changes": [
      {
        "field": "memories.a2p:health",
        "action": "restructure",
        "description": "Health memories moved to new schema"
      }
    ],
    "warnings": [],
    "rollbackSupported": true
  }
}
```

### Rollback

Within 30 days of migration:

```http
POST /a2p/v1/migrate/rollback
```

---

## Next Steps

- [API Reference](api.md) — Endpoint documentation
- [Schemas](schemas.md) — Schema definitions
