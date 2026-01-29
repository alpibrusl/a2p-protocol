# Example 10: Entity Hierarchy (Python)

This example demonstrates how organizations, departments, and teams can use a2p entity profiles with hierarchical policy enforcement.

## What You'll Learn

- Creating entity hierarchies (org → dept → team)
- Enforced policies that cascade down
- Different enforcement types (locked, min, max, subset)
- Policy validation and inheritance

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 10-entity-hierarchy/main.py
```

## Code Overview

```python
# Create organization with enforced policies
acme_corp = EntityProfile(
    id="did:a2p:entity:local:acme-corp",
    enforced_rules=[
        EnforcedRule("gdpr", "policies.compliance.gdpr", True, "locked"),
        EnforcedRule("encryption", "policies.security.minBits", 256, "min"),
    ],
)

# Teams inherit and can only narrow policies
ml_team = EntityProfile(
    parent="did:a2p:entity:local:acme-engineering",
    inherit_policies=True,
    policies={"ai": {"allowedModels": ["claude-3"]}},  # Valid subset
)

# Validate policy changes
result = validate_policy_change(ml_team.id, "policies.compliance.gdpr", False)
# Result: BLOCKED - locked by ACME Corp
```

## Enforcement Types

| Type | Description | Example |
|------|-------------|---------|
| `locked` | Cannot change | GDPR compliance |
| `min` | Must be >= value | Encryption bits |
| `max` | Must be <= value | Data retention |
| `subset` | Must be from allowed list | AI models |
| `additive` | Can only add, not remove | Blocklists |
