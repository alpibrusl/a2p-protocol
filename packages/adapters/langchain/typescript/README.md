# @a2p/langchain

LangChain adapter for the a2p protocol. Enables LangChain chains and agents to use a2p profiles for memory and personalization.

## Installation

```bash
npm install @a2p/langchain langchain
# or
pnpm add @a2p/langchain langchain
```

## Quick Start

```typescript
import { A2PMemory, createA2PMemory } from '@a2p/langchain';
import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { MemoryStorage } from '@a2p/sdk';

// Create a2p memory
const memory = createA2PMemory({
  agentDid: 'did:a2p:agent:my-langchain-agent',
  userDid: 'did:a2p:user:alice',
  storage: new MemoryStorage(),
  scopes: ['a2p:preferences', 'a2p:interests', 'a2p:professional'],
  proposeMemories: true,
});

// Use with LangChain
const chain = new ConversationChain({
  llm: new ChatOpenAI(),
  memory: memory,
});

// The chain now has access to user context from a2p
const response = await chain.call({ input: 'Hello!' });
```

## Features

### A2PMemory

Implements LangChain's `BaseMemory` interface to provide:

- **User Context**: Automatically loads user preferences, interests, and context
- **Conversation History**: Maintains conversation history
- **Memory Proposals**: Optionally proposes learned information as new memories

```typescript
const memory = new A2PMemory({
  agentDid: 'did:a2p:agent:my-agent',
  userDid: 'did:a2p:user:alice',
  storage: new MemoryStorage(),
  
  // Optional configuration
  scopes: ['a2p:preferences', 'a2p:interests'],
  proposeMemories: true,
  minProposalConfidence: 0.8,
  inputKey: 'input',
  outputKey: 'output',
});
```

### Memory Variables

The memory provides these variables to chains:

- `a2p_context`: Formatted user context from the a2p profile
- `chat_history`: Conversation history

### Profile Refresh

```typescript
// Refresh cached profile
await memory.refreshProfile();

// Get current profile
const profile = memory.getProfile();
```

### Manual Memory Proposals

```typescript
// Propose a memory explicitly
await memory.proposeMemory(
  'User prefers TypeScript',
  'a2p:professional.preferences',
  0.9
);
```

### System Prompt Generation

```typescript
import { getA2PSystemPrompt, createAgentClient } from '@a2p/langchain';

const client = createAgentClient(
  { agentDid: 'did:a2p:agent:my-agent' },
  storage
);

const systemPrompt = await getA2PSystemPrompt(
  client,
  'did:a2p:user:alice',
  ['a2p:preferences', 'a2p:professional']
);

// Use in your LLM call
```

## Integration Examples

### With ConversationChain

```typescript
import { ConversationChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { A2PMemory } from '@a2p/langchain';

const memory = new A2PMemory({ /* config */ });

const chain = new ConversationChain({
  llm: new ChatOpenAI({ temperature: 0 }),
  memory: memory,
});

await chain.call({ input: 'What programming languages do I know?' });
```

### With Agents

```typescript
import { initializeAgentExecutorWithOptions } from 'langchain/agents';
import { A2PMemory } from '@a2p/langchain';

const memory = new A2PMemory({ /* config */ });

const executor = await initializeAgentExecutorWithOptions(tools, llm, {
  agentType: 'chat-conversational-react-description',
  memory: memory,
});
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `agentDid` | `DID` | required | Agent DID for authentication |
| `userDid` | `DID` | required | User DID whose profile to access |
| `storage` | `Storage` | required | a2p storage implementation |
| `scopes` | `string[]` | `['a2p:preferences', 'a2p:interests', 'a2p:context']` | Scopes to request |
| `proposeMemories` | `boolean` | `true` | Whether to propose learned information |
| `minProposalConfidence` | `number` | `0.8` | Minimum confidence for proposals |
| `inputKey` | `string` | `'input'` | Key for input in chain |
| `outputKey` | `string` | `'output'` | Key for output in chain |

## License

EUPL-1.2
