# @a2p/openai

OpenAI Assistants API adapter for the a2p protocol. Enables OpenAI Assistants to use a2p profiles for personalization.

## Installation

```bash
npm install @a2p/openai openai
# or
pnpm add @a2p/openai openai
```

## Quick Start

```typescript
import { A2POpenAIAdapter } from '@a2p/openai';
import { MemoryStorage } from '@a2p/sdk';
import OpenAI from 'openai';

const openai = new OpenAI();
const adapter = new A2POpenAIAdapter({
  agentDid: 'did:a2p:agent:my-openai-assistant',
  storage: new MemoryStorage(),
});

// Get personalized context for a user
const context = await adapter.getContext('did:a2p:user:alice');

// Create an assistant with a2p personalization
const assistant = await openai.beta.assistants.create({
  name: 'Personalized Assistant',
  instructions: context.instructions,
  model: 'gpt-4-turbo-preview',
  metadata: context.metadata,
});
```

## Features

### Personalized Instructions

The adapter automatically generates system instructions based on the user's a2p profile:

```typescript
const context = await adapter.getContext('did:a2p:user:alice');

console.log(context.instructions);
// Output:
// You are a helpful AI assistant.
//
// ## User Profile
//
// ### Communication Preferences
// - Preferred language: en-US
// - Response style: concise
// - Formality level: casual
//
// ### Professional Background
// - Occupation: Software Engineer
// - Skills: TypeScript, Python, Rust
// ...
```

### Function Tools

Add a2p capabilities to your assistant with function tools:

```typescript
const tools = adapter.getFunctionTools();

const assistant = await openai.beta.assistants.create({
  name: 'Learning Assistant',
  instructions: context.instructions,
  model: 'gpt-4-turbo-preview',
  tools: tools,
});

// Handle function calls in your run loop
if (run.required_action?.type === 'submit_tool_outputs') {
  const outputs = await Promise.all(
    run.required_action.submit_tool_outputs.tool_calls.map(async (call) => ({
      tool_call_id: call.id,
      output: await adapter.handleFunctionCall(
        userDid,
        call.function.name,
        JSON.parse(call.function.arguments)
      ),
    }))
  );

  await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
    tool_outputs: outputs,
  });
}
```

### Memory Proposals

Propose memories from assistant interactions:

```typescript
// During a conversation, when the assistant learns something about the user
await adapter.proposeMemory(
  'did:a2p:user:alice',
  'Prefers Python for data science work',
  'a2p:professional.preferences',
  0.85,
  'Mentioned during coding discussion'
);
```

## Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `agentDid` | `DID` | required | Agent DID for authentication |
| `storage` | `Storage` | required | a2p storage implementation |
| `scopes` | `string[]` | `['a2p:preferences', 'a2p:interests', 'a2p:professional', 'a2p:context']` | Scopes to request |
| `proposeMemories` | `boolean` | `true` | Whether to enable memory proposals |
| `minProposalConfidence` | `number` | `0.8` | Minimum confidence for proposals |

## Complete Example

```typescript
import { A2POpenAIAdapter } from '@a2p/openai';
import { MemoryStorage } from '@a2p/sdk';
import OpenAI from 'openai';

async function main() {
  const openai = new OpenAI();
  const storage = new MemoryStorage();
  
  const adapter = new A2POpenAIAdapter({
    agentDid: 'did:a2p:agent:assistant',
    storage,
    proposeMemories: true,
  });

  const userDid = 'did:a2p:user:alice';
  
  // Get personalized context
  const context = await adapter.getContext(userDid);
  
  // Create assistant with a2p tools
  const assistant = await openai.beta.assistants.create({
    name: 'Personal Assistant',
    instructions: context.instructions,
    model: 'gpt-4-turbo-preview',
    tools: adapter.getFunctionTools(),
  });

  // Create thread and run
  const thread = await openai.beta.threads.create();
  
  await openai.beta.threads.messages.create(thread.id, {
    role: 'user',
    content: 'Hello! I need help with my Python project.',
  });

  let run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id: assistant.id,
  });

  // Poll for completion
  while (run.status !== 'completed') {
    await new Promise(resolve => setTimeout(resolve, 1000));
    run = await openai.beta.threads.runs.retrieve(thread.id, run.id);

    // Handle tool calls
    if (run.status === 'requires_action') {
      const toolCalls = run.required_action!.submit_tool_outputs.tool_calls;
      const outputs = await Promise.all(
        toolCalls.map(async (call) => ({
          tool_call_id: call.id,
          output: await adapter.handleFunctionCall(
            userDid,
            call.function.name,
            JSON.parse(call.function.arguments)
          ),
        }))
      );

      run = await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
        tool_outputs: outputs,
      });
    }
  }

  // Get messages
  const messages = await openai.beta.threads.messages.list(thread.id);
  console.log(messages.data[0].content);
}

main();
```

## License

EUPL-1.2
