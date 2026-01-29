# Example 10: Entity Hierarchy with Enforced Policies

This example demonstrates how organizations, departments, and teams can use a2p entity profiles with hierarchical policy enforcement.

## What You'll Learn

- Creating entity profiles (organization, department, team)
- Defining enforced policies that children cannot override
- Policy inheritance and resolution
- User membership and policy application

## Scenario

ACME Corporation sets up a2p entity profiles:

1. **Organization level**: ACME Corp sets corporate-wide policies (GDPR, data residency)
2. **Department level**: Engineering adds development policies (code review)
3. **Team level**: ML Team narrows AI model allowlist
4. **User level**: Alice inherits all policies from her team hierarchy

## Key Concepts

### Enforced Policy Types

| Type | Meaning | Example |
|------|---------|---------|
| `locked` | Cannot be changed | GDPR must be enabled |
| `min` | Floor value | Encryption ≥ 256 bits |
| `max` | Ceiling value | Retention ≤ 36 months |
| `subset` | Must be subset | AI models can only be reduced |
| `additive` | Can only add | Blocklist can grow, not shrink |

### Policy Resolution

When a user's effective policies are computed:

1. Start from top of hierarchy (organization)
2. Apply each level's enforced policies
3. Respect enforcement types (locked, min, max, etc.)
4. Result is the user's effective policy set

## Running

```bash
pnpm install
pnpm start
```

## License

EUPL-1.2
