# @a2p/langgraph

LangGraph adapter for the a2p (Agent 2 Profile) protocol.

## Installation

```bash
npm install @a2p/langgraph @a2p/sdk @langchain/langgraph
```

## Quick Start

```typescript
import { A2PMemorySaver, formatUserContextForPrompt } from '@a2p/langgraph';
import { StateGraph, MessagesAnnotation } from '@langchain/langgraph';

// Create the memory saver
const memorySaver = new A2PMemorySaver({
  clientConfig: {
    agentDid: 'did:a2p:agent:my-assistant',
  },
  defaultScopes: ['a2p:preferences', 'a2p:context', 'a2p:interests'],
  autoPropose: true,
});

// Load user context at the start of a conversation
const userDid = 'did:a2p:user:alice';
const userContext = await memorySaver.loadUserContext(userDid);

// Format for LLM prompt
const contextString = formatUserContextForPrompt(userContext);
console.log(contextString);
// Communication style: concise
// Formality: casual
// 
// User context:
// User works as: Software Engineer
// User interests: AI, distributed systems

// Use in your graph
const graph = new StateGraph(MessagesAnnotation)
  .addNode('chat', async (state) => {
    // Use userContext in your prompts
    const systemPrompt = `You are a helpful assistant.
    
User preferences:
${contextString}`;
    
    // ... rest of your logic
  });

// Propose memories from conversation
await memorySaver.proposeMemory(userDid, 'Prefers TypeScript for backend', {
  category: 'a2p:professional.preferences',
  confidence: 0.8,
  context: 'User mentioned during our coding session',
});
```

## API

### A2PMemorySaver

```typescript
const saver = new A2PMemorySaver({
  clientConfig: {
    agentDid: 'did:a2p:agent:my-agent',
    privateKey: process.env.A2P_PRIVATE_KEY,
  },
  defaultScopes: ['a2p:preferences'],
  autoPropose: true, // Auto-extract memories from conversations
});

// Load user context
const context = await saver.loadUserContext('did:a2p:user:alice');

// Propose a memory
await saver.proposeMemory('did:a2p:user:alice', 'Content here', {
  category: 'a2p:interests',
  confidence: 0.75,
});

// Get underlying client
const client = saver.getClient();
```

### formatUserContextForPrompt

Formats user context into a string suitable for LLM prompts:

```typescript
const contextString = formatUserContextForPrompt(userContext);
// Returns formatted string with preferences and memories
```

## License

EUPL-1.2
