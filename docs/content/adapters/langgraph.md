# LangGraph Adapter

Use a2p profiles with LangGraph state persistence.

---

## Installation

```bash
npm install @a2p/langgraph
```

---

## Quick Start

```typescript
import { A2PMemorySaver } from '@a2p/langgraph';
import { StateGraph } from '@langchain/langgraph';

const memorySaver = new A2PMemorySaver({
  userDid: 'did:a2p:user:local:alice',
  agentDid: 'did:a2p:agent:local:my-agent'
});

const graph = new StateGraph({ ... })
  .addNode('chat', chatNode)
  .compile({ checkpointer: memorySaver });

// Run with user context
const result = await graph.invoke(
  { messages: [...] },
  { configurable: { thread_id: 'conversation-1' } }
);
```

---

## Features

### State Persistence

User context persists across graph invocations.

### Memory Proposals

```typescript
// In your node
async function myNode(state) {
  // Propose memory
  await memorySaver.proposeMemory({
    content: 'User asked about TypeScript',
    category: 'a2p:interests.topics',
    confidence: 0.8
  });
}
```

---

## Next Steps

- [LangChain Adapter](langchain.md)
- [Adapter Overview](overview.md)
