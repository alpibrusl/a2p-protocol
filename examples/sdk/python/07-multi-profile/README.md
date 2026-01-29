# Example 07: Multi-Profile (Python)

This example demonstrates sub-profiles for different contexts (work vs personal).

## What You'll Learn

- Creating sub-profiles for different contexts
- Configuring context-specific data sharing
- Policy-based profile routing
- Inheritance and overrides

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 07-multi-profile/main.py
```

## Code Overview

```python
from a2p import add_sub_profile, SubProfile

# Create work sub-profile
work_profile = SubProfile(
    id=f"{profile.id}:work",
    name="Work",
    inherits_from=["common"],
    overrides={"identity.displayName": "Alex Chen"},
    specialized={
        "a2p:professional": {"title": "Senior Engineer"},
    },
    share_with=["did:a2p:agent:local:slack-*"],
)

profile = add_sub_profile(profile, work_profile)

# Create personal sub-profile
personal_profile = SubProfile(
    id=f"{profile.id}:personal",
    name="Personal",
    specialized={
        "a2p:interests": {"hobbies": ["Gaming", "Photography"]},
    },
    share_with=["did:a2p:agent:local:spotify-*"],
)
```

## Structure

```
Root Profile
├── Common preferences (language, timezone)
├── Work Sub-Profile
│   ├── Professional title
│   ├── Work projects
│   └── Shares with: work tools
└── Personal Sub-Profile
    ├── Hobbies, interests
    ├── Music preferences
    └── Shares with: entertainment apps
```
