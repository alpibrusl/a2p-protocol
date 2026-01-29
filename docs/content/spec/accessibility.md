# Accessibility Specification

a2p includes standardized accessibility preferences for adaptive UI.

---

## Overview

Accessibility preferences enable services to automatically adapt interfaces for users with disabilities. Part of `a2p:preferences.accessibility`.

---

## Categories

| Category | Description |
|----------|-------------|
| **Vision** | Screen reader, magnification, color blindness |
| **Hearing** | Captions, visual alerts, sign language |
| **Motor** | Keyboard-only, voice control, switch access |
| **Cognitive** | Simplified UI, reading assistance |
| **Sensory** | Reduce flashing, quiet mode |
| **Physical** | Wheelchair, allergies, dietary, service animal |

---

## Vision Preferences

```json
{
  "vision": {
    "screenReader": true,
    "magnification": 1.5,
    "highContrast": "high",
    "colorVision": {
      "type": "deuteranopia",
      "severity": "moderate"
    },
    "prefersDarkMode": true,
    "fontSize": "large",
    "reducedMotion": true
  }
}
```

### Color Vision Types

| Type | Description | UI Adaptation |
|------|-------------|---------------|
| `protanopia` | Red-blind | Avoid red/green |
| `deuteranopia` | Green-blind | Avoid red/green |
| `tritanopia` | Blue-blind | Avoid blue/yellow |
| `achromatopsia` | Color blind | Use patterns |

---

## Hearing Preferences

```json
{
  "hearing": {
    "deaf": true,
    "captions": {
      "enabled": true,
      "style": "large"
    },
    "signLanguage": "ASL",
    "prefersVisualAlerts": true
  }
}
```

---

## Motor Preferences

```json
{
  "motor": {
    "keyboardOnly": true,
    "reducedMotion": true,
    "largeClickTargets": true,
    "extendedTimeouts": true
  }
}
```

---

## Cognitive Preferences

```json
{
  "cognitive": {
    "simplifiedUI": true,
    "readingAssistance": {
      "dyslexiaFont": true,
      "lineSpacing": "wide"
    },
    "plainLanguage": true
  }
}
```

---

## Generative UI Integration

Services with generative UI can adapt automatically:

1. Request `a2p:preferences.accessibility`
2. Receive user preferences
3. Generate adapted interface
4. Result: Personalized accessible UI

---

---

## Physical Accessibility

For real-world services (restaurants, hotels, travel, hospitals):

```json
{
  "physical": {
    "mobility": {
      "wheelchair": true,
      "wheelchairType": "electric",
      "requiresAccessibleEntrance": true
    },
    "serviceAnimal": {
      "has": true,
      "type": "guide_dog",
      "name": "Max"
    },
    "allergies": {
      "food": ["peanuts", "shellfish"],
      "severity": { "peanuts": "anaphylactic" },
      "epiPenCarrier": true
    },
    "dietary": {
      "restrictions": ["vegetarian", "halal"],
      "intolerances": ["lactose"]
    },
    "specialAssistance": {
      "earlyBoarding": true,
      "preferredSeating": "aisle"
    }
  }
}
```

### Use Cases

| Service | Uses |
|---------|------|
| **Restaurant** | Allergies, dietary |
| **Hotel** | Wheelchair room, service animal |
| **Airline** | Early boarding, seating, dietary |
| **Hospital** | All medical info, allergies |

---

## Standards Alignment

- **WCAG 2.2** — Web Content Accessibility Guidelines
- **WAI-ARIA** — Accessible Rich Internet Applications
- **EN 301 549** — European accessibility standard
- **ADA** — Americans with Disabilities Act

---

## Next Steps

- [Children & Guardianship](guardianship.md)
- [Profiles](profiles.md)
