# Example 04: Consent Policies (Python)

This example demonstrates how to configure fine-grained access control policies for different agents.

## What You'll Learn

- Creating access control policies
- Pattern matching for agent DIDs
- Allowing/denying specific scopes
- Conditional access based on trust scores

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 04-consent-policies/main.py
```

## Code Overview

```python
from a2p import add_policy, evaluate_access, PermissionLevel

# Add a policy for work agents
profile = add_policy(
    profile,
    name="Work Agents",
    agent_pattern="did:a2p:agent:local:work-*",
    permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
    allow=["a2p:professional.*", "a2p:preferences.*"],
    deny=["a2p:health.*", "a2p:financial.*"],
    priority=10,
)

# Evaluate access for a specific agent
result = evaluate_access(profile, agent_did, requested_scopes)
if result.granted:
    print(f"Allowed: {result.allowed_scopes}")
```

## Policy Types

| Enforcement | Description |
|-------------|-------------|
| `locked` | Cannot be overridden |
| `min` | Value must be >= specified |
| `max` | Value must be <= specified |
| `subset` | Must be subset of allowed values |
