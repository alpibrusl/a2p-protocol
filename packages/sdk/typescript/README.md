# @a2p/sdk

TypeScript SDK for the a2p (Agent 2 Profile) protocol.

## Installation

```bash
npm install @a2p/sdk
# or
pnpm add @a2p/sdk
# or
yarn add @a2p/sdk
```

## Quick Start

### For Agent Developers

```typescript
import { A2PClient, createAgentClient } from '@a2p/sdk';

// Create a client for your agent
const client = createAgentClient({
  agentDid: 'did:a2p:agent:my-assistant',
  privateKey: process.env.A2P_PRIVATE_KEY,
});

// Request access to a user's profile
const profile = await client.getProfile({
  userDid: 'did:a2p:user:alice',
  scopes: ['a2p:preferences', 'a2p:interests'],
});

console.log(profile.common?.preferences?.communication?.style);

// Propose a new memory
await client.proposeMemory({
  userDid: 'did:a2p:user:alice',
  content: 'Prefers TypeScript over JavaScript',
  category: 'a2p:professional.preferences',
  confidence: 0.85,
  context: 'User mentioned this during our conversation',
});
```

### For Users

```typescript
import { A2PUserClient, createUserClient } from '@a2p/sdk';

// Create a user client
const user = createUserClient();

// Create a new profile
const profile = await user.createProfile({
  displayName: 'Alice',
});

// Add a memory manually
await user.addMemory({
  content: 'I work as a software engineer at Acme Corp',
  category: 'a2p:professional',
  sensitivity: 'standard',
});

// Review pending proposals
const proposals = user.getPendingProposals();
for (const proposal of proposals) {
  console.log(`${proposal.proposedBy.agentName}: ${proposal.memory.content}`);
  
  // Approve or reject
  await user.approveProposal(proposal.id);
  // or: await user.rejectProposal(proposal.id, 'Not accurate');
}

// Export your profile
const json = user.exportProfile();
```

## Core Concepts

### Profiles

A profile contains:

- **Identity**: DID, display name, pronouns
- **Common**: Shared preferences across all contexts
- **Memories**: Structured and episodic memories
- **Sub-Profiles**: Context-specific variations (work, personal, etc.)
- **Access Policies**: Who can access what

### Scopes

Scopes control what data an agent can access:

```typescript
import { STANDARD_SCOPES } from '@a2p/sdk';

// Common scopes
STANDARD_SCOPES.PREFERENCES          // 'a2p:preferences'
STANDARD_SCOPES.INTERESTS            // 'a2p:interests'
STANDARD_SCOPES.PROFESSIONAL         // 'a2p:professional'
STANDARD_SCOPES.HEALTH               // 'a2p:health' (sensitive)
```

### Proposals

Agents can propose memories, but users must approve:

```typescript
// Agent proposes
await client.proposeMemory({
  userDid: 'did:a2p:user:alice',
  content: 'Likes jazz music',
  category: 'a2p:interests.music',
  confidence: 0.75,
});

// User reviews
const proposals = user.getPendingProposals();
await user.approveProposal(proposals[0].id);
```

## API Reference

### A2PClient (for agents)

| Method | Description |
|--------|-------------|
| `getProfile(options)` | Get filtered user profile |
| `proposeMemory(request)` | Propose a new memory |
| `checkPermission(userDid, permission, scope?)` | Check if agent has permission |
| `setAgentProfile(profile)` | Set agent profile for trust evaluation |

### A2PUserClient (for users)

| Method | Description |
|--------|-------------|
| `createProfile(options?)` | Create a new profile |
| `loadProfile(did)` | Load existing profile |
| `addMemory(memory)` | Add a memory manually |
| `getPendingProposals()` | Get proposals awaiting review |
| `approveProposal(id, options?)` | Approve a proposal |
| `rejectProposal(id, reason?)` | Reject a proposal |
| `exportProfile()` | Export to JSON |
| `importProfile(json)` | Import from JSON |

## License

EUPL-1.2
