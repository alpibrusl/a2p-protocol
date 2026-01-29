# EU AI Act Compliance

How a2p supports EU AI Act requirements.

---

## Overview

The EU AI Act establishes rules for AI systems. a2p helps agents comply through:

- **Risk classification** in agent profiles
- **Transparency obligations** built-in
- **Human oversight** mechanisms
- **Technical documentation** support

---

## Risk Classification

Agent profiles include AI Act risk level:

```json
{
  "aiActCompliance": {
    "riskLevel": "limited",
    "transparencyObligations": [
      "user_notification",
      "ai_generated_content_marking"
    ]
  }
}
```

### Risk Levels

| Level | Examples | Requirements |
|-------|----------|--------------|
| Minimal | Spam filters | None |
| Limited | Chatbots | Transparency |
| High | CV screening | Full compliance |
| Unacceptable | Social scoring | Prohibited |

---

## Transparency (Article 52)

### User Notification

Agents must disclose AI nature:

```json
{
  "transparency": {
    "isAI": true,
    "disclosure": "I am an AI assistant powered by..."
  }
}
```

### Content Marking

AI-generated content must be marked:

```json
{
  "transparencyObligations": [
    "ai_generated_content_marking"
  ],
  "contentMarking": {
    "method": "watermark",
    "visible": true
  }
}
```

---

## Human Oversight

For high-risk systems:

```json
{
  "humanOversight": {
    "required": true,
    "mechanism": "human_on_the_loop",
    "escalationThreshold": 0.7,
    "reviewProcess": "Manual review of flagged decisions"
  }
}
```

### Oversight Mechanisms

| Type | Description |
|------|-------------|
| `human_in_the_loop` | Human approves each decision |
| `human_on_the_loop` | Human monitors, can intervene |
| `human_in_command` | Human can override anytime |

---

## Conformity Assessment

For high-risk systems:

```json
{
  "conformityAssessment": {
    "completed": true,
    "assessor": "Notified Body XYZ",
    "date": "2025-06-15",
    "certificateId": "CE-2025-12345",
    "validUntil": "2030-06-15"
  }
}
```

---

## Technical Documentation

a2p profiles can link to required documentation:

```json
{
  "documentation": {
    "technicalDocumentation": "https://example.com/docs/tech",
    "riskAssessment": "https://example.com/docs/risk",
    "testingResults": "https://example.com/docs/tests"
  }
}
```

---

## Implementation Checklist

- [ ] Risk level declared in agent profile
- [ ] Transparency obligations listed
- [ ] AI disclosure implemented
- [ ] Content marking (if applicable)
- [ ] Human oversight (if high-risk)
- [ ] Conformity assessment (if high-risk)
- [ ] Documentation links provided

---

## Next Steps

- [GDPR Compliance](gdpr.md) — Data protection
- [DPIA Guidance](dpia.md) — Impact assessments
