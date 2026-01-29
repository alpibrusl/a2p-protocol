# OpenAI Assistants Adapter

Use a2p profiles with OpenAI Assistants API.

---

## Installation

```bash
npm install @a2p/openai
```

---

## Quick Start

```typescript
import { A2POpenAIAdapter } from '@a2p/openai';
import OpenAI from 'openai';

const openai = new OpenAI();
const adapter = new A2POpenAIAdapter({
  userDid: 'did:a2p:user:local:alice',
  agentDid: 'did:a2p:agent:local:my-assistant'
});

// Get enhanced system instructions
const instructions = await adapter.getSystemInstructions();

// Create assistant with user context
const assistant = await openai.beta.assistants.create({
  name: 'My Assistant',
  instructions,
  model: 'gpt-4-turbo'
});
```

---

## Features

### System Instructions

```typescript
const instructions = await adapter.getSystemInstructions();
// Includes user preferences, language, style, etc.
```

### Function Tools

```typescript
const tools = adapter.getTools();
// Returns a2p function definitions for:
// - propose_memory
// - get_user_preference
```

### Memory Proposals

```typescript
// Handle function calls
if (functionName === 'propose_memory') {
  await adapter.handleProposeMemory(functionArgs);
}
```

---

## Next Steps

- [LangChain Adapter](langchain.md)
- [Adapter Overview](overview.md)
