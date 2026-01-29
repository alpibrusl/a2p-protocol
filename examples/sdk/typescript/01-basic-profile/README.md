# Example 01: Basic Profile (TypeScript)

This example demonstrates how to create and manage a user profile.

## What You'll Learn

- Creating a new profile
- Adding structured memories
- Updating preferences
- Exporting and importing profiles

## Run

```bash
cd examples/sdk/typescript
npm install
npm run 01:basic-profile
```

## Code Overview

```typescript
import { createUserClient, SensitivityLevel } from '@a2p/sdk';

// Create a user client
const user = createUserClient();

// Create a profile
const profile = await user.createProfile({ displayName: 'Alice' });

// Add memories
await user.addMemory({
  content: 'Works as a Software Engineer',
  category: 'a2p:professional',
  sensitivity: 'standard' as SensitivityLevel,
});

// Export profile
const exported = user.exportProfile();
```
