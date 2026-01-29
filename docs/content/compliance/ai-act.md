# EU AI Act Compliance

How a2p supports EU AI Act requirements.

---

## Agent Classification

Agent profiles include AI Act fields:

```json
{
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

---

## Risk Levels

| Level | Description | a2p Support |
|-------|-------------|-------------|
| Minimal | Low risk AI | ✅ Basic profile |
| Limited | Transparency needed | ✅ Transparency fields |
| High | Significant impact | ✅ Full compliance fields |
| Unacceptable | Prohibited | ❌ Not supported |

---

## Transparency (Article 52)

| Obligation | Implementation |
|------------|---------------|
| User notification | `transparencyObligations` array |
| AI content marking | Declared in profile |
| Capability disclosure | Agent capabilities field |

---

## Human Oversight (Article 14)

```json
{
  "humanOversight": {
    "required": true,
    "mechanism": "human_on_the_loop",
    "interventionCapability": true
  }
}
```

Memory proposals implement human-in-the-loop by default.

---

## Next Steps

- [GDPR](gdpr.md) — GDPR compliance
- [DPIA Guide](dpia.md) — Assessment guide
