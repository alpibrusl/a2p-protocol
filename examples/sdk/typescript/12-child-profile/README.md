# Example 12: Child Profile with Parental Controls

This example demonstrates how to create and manage a child's profile with parental controls.

## Overview

a2p provides comprehensive support for minor profiles:

- **Age context**: Age group, jurisdiction, consent status
- **Guardianship**: Parent/guardian management
- **Content safety**: Age-appropriate filtering
- **Enforced policies**: Rules children cannot override

## Use Cases

- **Family profiles**: Parents manage children's AI interactions
- **Educational apps**: Age-appropriate content filtering
- **Gaming**: Parental controls for chat and purchases
- **Screen time**: Usage limits and bedtime settings

## Example Profiles

- `parent-profile.json` - Parent's profile
- `child-profile.json` - Child's profile with guardian link
- `family-policy.json` - Enforced family policies

## Running the Example

### TypeScript

```bash
cd typescript
npm install
npx ts-node index.ts
```

### Python

```bash
cd python
npm install
npm run 12:*
```

## Key Features Demonstrated

1. **Age context setup**: Defining age group and jurisdiction
2. **Guardian linking**: Connecting child to parent profile
3. **Content safety**: Setting maturity ratings and filters
4. **Screen time**: Daily limits and bedtime
5. **Enforced policies**: Parent-locked settings
6. **Agent consent**: Guardian approval for agent access

## Legal Compliance

This example shows compliance with:

- **COPPA** (US): Children under 13
- **GDPR Article 8** (EU): Digital age of consent
- **AADC** (UK): Age Appropriate Design Code
