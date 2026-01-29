# Example 11: Accessibility Profile (Python)

This example demonstrates comprehensive accessibility preferences for both digital (UI) and physical (real-world) services.

## What You'll Learn

- Digital accessibility: vision, motor, cognitive preferences
- Physical accessibility: allergies, mobility, service animals
- Service-specific data sharing
- Privacy-preserving accessibility support

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 11-accessibility-profile/main.py
```

## Code Overview

```python
from a2p import AccessibilityPreferences, PhysicalAccessibility

accessibility = AccessibilityPreferences(
    # Digital UI preferences
    vision={
        "colorVision": {"type": "deuteranopia"},
        "fontSize": "large",
        "reducedMotion": True,
    },
    motor={
        "largeClickTargets": True,
        "extendedTimeouts": True,
    },
    # Physical needs
    physical=PhysicalAccessibility(
        mobility={"wheelchair": True},
        allergies={"food": ["peanuts"], "severity": {"peanuts": "anaphylactic"}},
        dietary={"restrictions": ["vegetarian"]},
    ),
)
```

## Use Cases

| Service | Data Accessed |
|---------|---------------|
| UI Service | vision, motor, cognitive |
| Restaurant | allergies, dietary, mobility |
| Hotel | mobility, service animal |
| Healthcare | Full physical accessibility |
