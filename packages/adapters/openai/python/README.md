# a2p OpenAI Adapter (Python)

Integrate a2p user profiles with OpenAI APIs (Chat Completions and Assistants).

## Installation

```bash
pip install a2p-openai
```

## Quick Start

### Chat Completions API

```python
from a2p_openai import A2POpenAIAdapter
from openai import OpenAI

# Create adapter
adapter = A2POpenAIAdapter(
    agent_did="did:a2p:agent:my-assistant",
    default_scopes=["a2p:preferences", "a2p:professional"],
)

# Load user context
context = await adapter.load_user_context("did:a2p:user:alice")

# Create OpenAI client
client = OpenAI()

# Build personalized system prompt
system_prompt = adapter.build_system_prompt(
    base_prompt="You are a helpful coding assistant.",
    user_context=context,
)

# Use with OpenAI
response = client.chat.completions.create(
    model="gpt-4",
    messages=[
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "Help me with my Python project"},
    ]
)
```

### Assistants API

```python
from a2p_openai import A2PAssistantAdapter
from openai import OpenAI

client = OpenAI()

# Create adapter
adapter = A2PAssistantAdapter(
    agent_did="did:a2p:agent:my-assistant",
)

# Load user context
context = await adapter.load_user_context("did:a2p:user:alice")

# Build personalized instructions
instructions = adapter.build_instructions(
    base_instructions="You are a helpful coding assistant.",
    user_context=context,
)

# Create assistant with personalized instructions
assistant = client.beta.assistants.create(
    name="Personalized Assistant",
    instructions=instructions,
    model="gpt-4-turbo",
)
```

## Features

### Load User Context

```python
# Load specific scopes
context = await adapter.load_user_context(
    user_did="did:a2p:user:alice",
    scopes=["a2p:preferences", "a2p:professional", "a2p:interests"]
)

print(context)
# - Communication style: concise
# - Occupation: Software Engineer
# - Skills: Python, TypeScript, Rust
# - Interests: Machine Learning, Systems Programming
```

### Build Messages with Context

```python
# Automatically inject context into messages
messages = [
    {"role": "user", "content": "Help me optimize this code"},
]

messages_with_context = adapter.build_messages_with_context(
    messages=messages,
    user_context=context,
    base_system_prompt="You are a helpful coding assistant.",
)

response = client.chat.completions.create(
    model="gpt-4",
    messages=messages_with_context,
)
```

### Propose Memories

```python
# Propose a learned memory
await adapter.propose_memory(
    user_did="did:a2p:user:alice",
    content="Prefers functional programming style",
    category="a2p:preferences.development",
    confidence=0.85,
    context="User asked about functional approaches multiple times",
)
```

### Auto-Extract from Conversations

```python
# Extract and propose memories from conversation
messages = [
    {"role": "user", "content": "I work as a machine learning engineer"},
    {"role": "assistant", "content": "Great! How can I help with ML?"},
    {"role": "user", "content": "I prefer PyTorch over TensorFlow"},
]

proposals = await adapter.extract_and_propose(
    user_did="did:a2p:user:alice",
    messages=messages,
)
```

## Full Example

```python
import asyncio
from openai import OpenAI
from a2p_openai import A2POpenAIAdapter


async def main():
    # Setup
    adapter = A2POpenAIAdapter(
        agent_did="did:a2p:agent:coding-assistant",
        default_scopes=["a2p:preferences", "a2p:professional"],
    )
    client = OpenAI()
    user_did = "did:a2p:user:alice"
    
    # Load user context
    context = await adapter.load_user_context(user_did)
    print(f"Loaded context:\n{context}\n")
    
    # Chat loop
    messages = []
    system_prompt = adapter.build_system_prompt(
        "You are a helpful coding assistant.",
        context,
    )
    
    while True:
        user_input = input("You: ")
        if user_input.lower() == "quit":
            break
        
        messages.append({"role": "user", "content": user_input})
        
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                *messages,
            ]
        )
        
        assistant_message = response.choices[0].message.content
        messages.append({"role": "assistant", "content": assistant_message})
        
        print(f"Assistant: {assistant_message}\n")
    
    # Extract and propose memories
    proposals = await adapter.extract_and_propose(user_did, messages)
    print(f"Proposed {len(proposals)} memories")


if __name__ == "__main__":
    asyncio.run(main())
```

## API Reference

### `A2POpenAIAdapter`

Adapter for OpenAI Chat Completions API.

**Parameters:**

- `agent_did` (str): The agent's DID
- `default_scopes` (List[str]): Default scopes to request
- `auto_propose` (bool): Enable auto-proposal

**Methods:**

- `load_user_context(user_did, scopes)` - Load user context
- `build_system_prompt(base_prompt, user_context)` - Build system prompt
- `build_messages_with_context(messages, user_context)` - Inject context into messages
- `propose_memory(user_did, content, category, confidence, context)` - Propose memory
- `extract_and_propose(user_did, messages)` - Auto-extract memories

### `A2PAssistantAdapter`

Adapter for OpenAI Assistants API.

**Methods:**

- `load_user_context(user_did, scopes)` - Load user context
- `build_instructions(base_instructions, user_context)` - Build personalized instructions
- `propose_memory(...)` - Propose memory

## Related

- [a2p SDK Python](../sdk-python/)
- [LangChain Adapter](../adapter-langchain-python/)
- [Framework Examples](../../../examples/frameworks/openai/python/)
