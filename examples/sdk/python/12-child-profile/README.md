# Example 12: Child Profile (Python)

This example demonstrates parental controls, content safety, and guardianship for children's profiles.

## What You'll Learn

- Creating profiles for minors
- Guardian management and permissions
- Content safety settings
- Screen time and purchase controls
- Legal compliance (COPPA, GDPR Art. 8)

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 12-child-profile/main.py
```

## Code Overview

```python
from a2p import Guardianship, AgeContext, ContentSafety, Guardian

# Age context
age_context = AgeContext(
    age_group="child",
    age_range="8-12",
    jurisdiction="ES",  # Spain
    digital_age_of_consent=14,
    consent_status="parental_consent",
)

# Guardian with permissions
guardian = Guardian(
    did=parent_profile.id,
    relationship="parent",
    permissions=["manage_profile", "approve_proposals", "set_policies"],
)

# Content safety
content_safety = ContentSafety(
    filter_explicit_content=True,
    filter_violence=True,
    safe_search="strict",
    screen_time={"dailyLimit": "2h", "bedtime": "20:00"},
    purchase_controls={"requireApproval": True},
)
```

## Enforced Policies (Child Cannot Override)

- Content filtering settings
- Chat restrictions (no strangers)
- Purchase approvals
- Screen time limits
- Digital bedtime
