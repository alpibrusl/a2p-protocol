# Agent Integration Guide

A complete guide to integrating a2p into your AI agent.

---

## Overview

This guide covers:

1. Setting up agent identity
2. Requesting user access
3. Reading profile data
4. Proposing memories
5. Handling consent

---

## 1. Agent Identity

Your agent needs a DID:

```typescript
// Generate or load agent DID
const agentDid = 'did:a2p:agent:local:my-agent';

// Initialize client
const client = new A2PClient({
  agentDid,
  privateKey: process.env.AGENT_PRIVATE_KEY
});
```

---

## 2. Requesting Access

Always request access with a purpose:

```typescript
const access = await client.requestAccess({
  userDid: 'did:a2p:user:local:alice',
  scopes: ['a2p:preferences', 'a2p:interests'],
  purpose: {
    type: 'personalization',
    description: 'Personalize our conversation',
    legalBasis: 'consent',
    retention: 'session_only'
  }
});

if (!access.granted) {
  // Handle denial gracefully
  console.log('User denied access');
}
```

---

## 3. Reading Profile

```typescript
const profile = await client.getProfile({
  userDid: 'did:a2p:user:local:alice',
  scopes: access.grantedScopes
});

// Use in prompts
const systemPrompt = `
User preferences:
- Language: ${profile.common.preferences.language}
- Style: ${profile.common.preferences.communication.style}
`;
```

---

## 4. Proposing Memories

```typescript
// After learning something about the user
await client.proposeMemory({
  userDid: 'did:a2p:user:local:alice',
  content: 'Prefers detailed technical explanations',
  category: 'a2p:preferences.communication',
  confidence: 0.85,
  context: 'User asked for more details multiple times'
});
```

---

## 5. Best Practices

| Practice | Description |
|----------|-------------|
| Request minimal scopes | Only what you need |
| Explain purpose clearly | Users read this |
| High confidence for proposals | Don't spam low-confidence |
| Handle denial gracefully | Don't break if denied |
| Cache reasonably | Respect TTL |

---

## Next Steps

- [Memory Proposals](memory-proposals.md) — Proposal patterns
- [Framework Adapters](../adapters/overview.md) — Use with LangChain, etc.
