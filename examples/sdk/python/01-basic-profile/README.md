# Example 01: Basic Profile (Python)

This example demonstrates how to create and manage a user profile.

## What You'll Learn

- Creating a new profile
- Adding structured memories
- Updating preferences
- Exporting and importing profiles

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 01-basic-profile/main.py
```

## Code Overview

```python
from a2p import create_user_client, SensitivityLevel

# Create a user client
user = create_user_client()

# Create a profile
profile = await user.create_profile(display_name="Alice")

# Add memories
await user.add_memory(
    content="Works as a Software Engineer",
    category="a2p:professional",
    sensitivity=SensitivityLevel.STANDARD,
)

# Export profile
exported = user.export_profile()
```
