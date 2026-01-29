# Children & Guardianship

a2p provides comprehensive support for minor profiles.

---

## Overview

- **Age context** — Age group, jurisdiction
- **Guardianship** — Parent/guardian management  
- **Content safety** — Age-appropriate filtering
- **Enforced policies** — Parent-set rules

---

## Legal Requirements

| Jurisdiction | Law | Age of Consent |
|--------------|-----|----------------|
| EU (default) | GDPR Art. 8 | 16 |
| Spain | LOPDGDD | 14 |
| UK | AADC | 13 |
| US | COPPA | 13 |

---

## Age Context

```json
{
  "identity": {
    "ageContext": {
      "ageGroup": "child",
      "ageRange": "8-12",
      "isMinor": true,
      "jurisdiction": "ES",
      "consentStatus": "parental_consent"
    }
  }
}
```

### Age Groups

| Group | Typical Age |
|-------|-------------|
| `infant` | 0-4 |
| `child` | 5-12 |
| `teen` | 13-17 |
| `adult` | 18+ |

---

## Guardianship

```json
{
  "guardianship": {
    "status": "minor",
    "guardians": [
      {
        "did": "did:a2p:user:local:parent-alice",
        "relationship": "parent",
        "permissions": ["manage_profile", "set_policies"],
        "isPrimary": true
      }
    ]
  }
}
```

### Permissions

| Permission | Description |
|------------|-------------|
| `manage_profile` | Full editing |
| `approve_proposals` | Review memories |
| `set_policies` | Define access rules |
| `manage_content_safety` | Set filters |
| `manage_screen_time` | Usage limits |

---

## Content Safety

```json
{
  "contentSafety": {
    "enabled": true,
    "maturityRating": "G",
    "filterExplicitContent": true,
    "safeSearch": "strict",
    "chatRestrictions": {
      "allowStrangers": false
    }
  }
}
```

---

## Screen Time

```json
{
  "screenTime": {
    "enabled": true,
    "dailyLimit": "2h",
    "bedtime": {
      "start": "20:00",
      "end": "07:00"
    }
  }
}
```

---

## Enforced Policies

Parents can lock settings:

```json
{
  "enforcedByGuardian": [
    {
      "field": "contentSafety.filterExplicitContent",
      "value": true,
      "cannotOverride": true
    }
  ]
}
```

---

## Privacy Defaults

| Setting | Adults | Minors |
|---------|--------|--------|
| Visibility | Public | Private |
| Proposals | Allowed | Guardian approval |
| Profiling | Allowed | Prohibited |

---

## Next Steps

- [Accessibility](accessibility.md)
- [Consent](consent.md)
