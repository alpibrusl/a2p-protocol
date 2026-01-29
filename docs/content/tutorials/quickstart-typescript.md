# Quickstart: TypeScript

Build your first a2p integration in 5 minutes.

---

## Prerequisites

- Node.js 18+
- npm or pnpm

---

## Installation

```bash
npm install @a2p/sdk
```

---

## 1. Initialize the Client

```typescript
import { A2PClient, A2PUserClient } from '@a2p/sdk';

// For agents accessing user profiles
const agentClient = new A2PClient({
  agentDid: 'did:a2p:agent:local:my-agent',
  // Optional: custom gateway
  // gatewayUrl: 'https://gateway.example.com'
});

// For users managing their profiles
const userClient = new A2PUserClient();
```

---

## 2. Create a User Profile

```typescript
// Create a new profile
const profile = await userClient.createProfile({
  displayName: 'Alice',
  preferences: {
    language: 'en-US',
    timezone: 'Europe/Madrid',
    communication: {
      style: 'concise',
      formality: 'casual'
    }
  }
});

console.log('Created profile:', profile.id);
// did:a2p:user:local:abc123xyz
```

---

## 3. Request Access (Agent)

```typescript
// Agent requests access to user profile
const accessResult = await agentClient.requestAccess({
  userDid: 'did:a2p:user:local:alice',
  scopes: ['a2p:preferences', 'a2p:interests'],
  purpose: {
    type: 'personalization',
    description: 'Tailor responses to your preferences',
    legalBasis: 'consent'
  }
});

if (accessResult.granted) {
  console.log('Access granted for:', accessResult.grantedScopes);
} else {
  console.log('Access denied:', accessResult.reason);
}
```

---

## 4. Read User Profile (Agent)

```typescript
// Get user profile (filtered by permissions)
const userProfile = await agentClient.getProfile({
  userDid: 'did:a2p:user:local:alice',
  scopes: ['a2p:preferences', 'a2p:interests']
});

console.log('User preferences:', userProfile.common.preferences);
console.log('User interests:', userProfile.memories['a2p:interests']);
```

---

## 5. Propose a Memory (Agent)

```typescript
// Agent proposes a memory based on conversation
const proposal = await agentClient.proposeMemory({
  userDid: 'did:a2p:user:local:alice',
  content: 'Prefers TypeScript for new projects',
  category: 'a2p:professional.preferences',
  confidence: 0.85,
  context: 'Based on discussion about frameworks'
});

console.log('Proposal submitted:', proposal.id);
// User will review and approve/reject
```

---

## 6. Review Proposals (User)

```typescript
// User reviews pending proposals
const proposals = await userClient.getPendingProposals();

for (const proposal of proposals) {
  console.log(`From: ${proposal.agentDid}`);
  console.log(`Content: ${proposal.content}`);
  console.log(`Category: ${proposal.category}`);
  
  // Approve, reject, or edit
  await userClient.reviewProposal(proposal.id, {
    action: 'approve',
    // Optional: edit before approving
    // editedContent: 'Strongly prefers TypeScript'
  });
}
```

---

## 7. Set Consent Policies (User)

```typescript
// User defines access policies
await userClient.setPolicy({
  name: 'Work Assistants',
  agentPattern: 'did:a2p:agent:local:work-*',
  allow: [
    'a2p:preferences.*',
    'a2p:professional.*'
  ],
  deny: [
    'a2p:health.*',
    'a2p:financial.*'
  ],
  permissions: ['read_scoped', 'propose']
});
```

---

## Complete Example

```typescript
import { A2PClient, A2PUserClient } from '@a2p/sdk';

async function main() {
  // === User Setup ===
  const userClient = new A2PUserClient();
  
  // Create profile
  const profile = await userClient.createProfile({
    displayName: 'Alice',
    preferences: {
      language: 'en-US',
      communication: { style: 'concise' }
    }
  });
  
  // Set policy
  await userClient.setPolicy({
    name: 'Default',
    agentPattern: '*',
    allow: ['a2p:preferences.*'],
    permissions: ['read_scoped', 'propose']
  });
  
  // === Agent Access ===
  const agentClient = new A2PClient({
    agentDid: 'did:a2p:agent:local:my-assistant'
  });
  
  // Request access
  const access = await agentClient.requestAccess({
    userDid: profile.id,
    scopes: ['a2p:preferences'],
    purpose: {
      type: 'personalization',
      description: 'Personalize responses',
      legalBasis: 'consent'
    }
  });
  
  if (access.granted) {
    // Read profile
    const userProfile = await agentClient.getProfile({
      userDid: profile.id,
      scopes: ['a2p:preferences']
    });
    
    console.log('Got preferences:', userProfile.common.preferences);
    
    // Propose memory
    await agentClient.proposeMemory({
      userDid: profile.id,
      content: 'User is interested in AI',
      category: 'a2p:interests.topics',
      confidence: 0.9
    });
  }
  
  // === User Reviews ===
  const proposals = await userClient.getPendingProposals();
  for (const p of proposals) {
    await userClient.reviewProposal(p.id, { action: 'approve' });
  }
  
  console.log('Done!');
}

main().catch(console.error);
```

---

## Next Steps

- [Quickstart: Python](quickstart-python.md) — Python version
- [Agent Integration](agent-integration.md) — Deeper integration guide
- [LangChain Adapter](../adapters/langchain.md) — Use with LangChain
- [SDK Reference](../sdk/typescript.md) — Full API docs
