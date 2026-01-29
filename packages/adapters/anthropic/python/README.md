# a2p Anthropic Adapter

Integrate a2p user profiles with Anthropic's Claude API.

## Supported Models

- **Claude Opus 4.5** - Most capable, complex analysis and multi-step tasks
- **Claude Sonnet 4.5** - Balanced performance for agents and coding
- **Claude Haiku 4.5** - Fast, low latency for real-time applications

## Installation

```bash
pip install a2p-anthropic anthropic
```

## Quick Start

```python
from anthropic import Anthropic
from a2p_anthropic import A2PAnthropicAdapter, CLAUDE_SONNET_4_5

# Create clients
client = Anthropic()
adapter = A2PAnthropicAdapter(
    agent_did="did:a2p:agent:my-assistant",
    default_scopes=["a2p:preferences", "a2p:professional"],
)

# Load user context
context = await adapter.load_user_context("did:a2p:user:alice")

# Build personalized system prompt
system = adapter.build_system_prompt(
    "You are a helpful coding assistant.",
    context,
)

# Use with Claude
message = client.messages.create(
    model=CLAUDE_SONNET_4_5,
    max_tokens=4096,
    system=system,
    messages=[{"role": "user", "content": "Help me with my project"}],
)

print(message.content[0].text)
```

## Features

### Load User Context

```python
context = await adapter.load_user_context(
    user_did="did:a2p:user:alice",
    scopes=["a2p:preferences", "a2p:professional", "a2p:accessibility"]
)
```

### Build System Prompt

```python
system = adapter.build_system_prompt(
    base_prompt="You are a helpful assistant.",
    user_context=context,
)
```

### Propose Memories

```python
await adapter.propose_memory(
    user_did="did:a2p:user:alice",
    content="Prefers functional programming patterns",
    category="a2p:preferences.development",
    confidence=0.85,
)
```

### Auto-Extract Memories

```python
messages = [
    {"role": "user", "content": "I work as an ML engineer"},
    {"role": "assistant", "content": "Great! How can I help?"},
]

proposals = await adapter.extract_and_propose(
    user_did="did:a2p:user:alice",
    messages=messages,
)
```

### Streaming Responses

```python
with client.messages.stream(
    model=CLAUDE_SONNET_4_5,
    max_tokens=4096,
    system=system,
    messages=[{"role": "user", "content": "Explain RAG systems"}],
) as stream:
    for text in stream.text_stream:
        print(text, end="", flush=True)
```

### Extended Context (1M tokens)

Claude's 1M token context window is perfect for rich a2p profiles:

```python
# Load comprehensive user context
context = await adapter.load_user_context(
    user_did=user_did,
    scopes=[
        "a2p:preferences",
        "a2p:professional",
        "a2p:interests",
        "a2p:context",
        "a2p:episodic",  # Full conversation history
    ]
)
```

## Model Constants

```python
from a2p_anthropic import CLAUDE_OPUS_4_5, CLAUDE_SONNET_4_5, CLAUDE_HAIKU_4_5

# Use in API calls
client.messages.create(model=CLAUDE_OPUS_4_5, ...)
```

## API Reference

### `A2PAnthropicAdapter`

**Parameters:**

- `agent_did` (str): The agent's DID
- `default_scopes` (List[str]): Default scopes to request
- `auto_propose` (bool): Enable auto-proposal

**Methods:**

- `load_user_context(user_did, scopes)` - Load user context
- `build_system_prompt(base, context)` - Build system prompt
- `propose_memory(...)` - Propose memory to profile
- `extract_and_propose(user_did, messages)` - Auto-extract memories

## Related

- [a2p SDK Python](../sdk-python/)
- [Framework Examples](../../../examples/frameworks/anthropic/python/)
- [Anthropic API Docs](https://docs.anthropic.com/)
