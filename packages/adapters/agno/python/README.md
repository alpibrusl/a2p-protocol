# a2p Agno Adapter

Integrate a2p user-owned profiles with Agno's agent framework for personalized multi-agent systems.

## Key Concept

- **Agno Memory**: Agent-side (what the agent learned during interactions)
- **a2p Memory**: User-side (what the user wants ALL agents to know)

This adapter bridges both, enabling user preferences to persist across all agents while allowing agents to propose new memories back to the user's portable profile.

## Installation

```bash
pip install a2p-agno
```

## Quick Start

```python
from agno.agent import Agent
from agno.models.openai import OpenAIChat
from a2p_agno import A2PAgnoAdapter

# Create adapter
adapter = A2PAgnoAdapter(
    agent_did="did:a2p:agent:my-agent",
    default_scopes=["a2p:preferences", "a2p:professional"],
)

# Load user context
user_context = await adapter.load_user_context("did:a2p:user:alice")

# Create Agno agent with a2p personalization
agent = Agent(
    model=OpenAIChat(id="gpt-4"),
    instructions=adapter.build_instructions(
        "You are a helpful coding assistant.",
        user_context,
    ),
)

# Run with personalization
response = agent.run("Help me with my Python project")
```

## Features

### Load User Context

```python
context = await adapter.load_user_context(
    user_did="did:a2p:user:alice",
    scopes=["a2p:preferences", "a2p:professional", "a2p:accessibility"]
)

# Access structured data
print(context.preferences)      # Dict of preferences
print(context.memories)         # List of memory strings
print(context.accessibility)    # Accessibility settings
print(context.context_string)   # Formatted for instructions
```

### Sync Agent Memories to a2p

```python
# Propose individual memory
await adapter.propose_memory(
    user_did="did:a2p:user:alice",
    content="User prefers async/await over callbacks",
    category="a2p:preferences.development",
    confidence=0.85,
    source_agent="coding-assistant",
)

# Sync batch of Agno memories
proposals = await adapter.sync_agent_memory_to_a2p(
    user_did="did:a2p:user:alice",
    agent_memories=agent.memory.get_all(),  # Agno memory
    source_agent="research-agent",
)
```

### Multi-Agent Coordination

```python
from a2p_agno import A2PMultiAgentCoordinator

coordinator = A2PMultiAgentCoordinator(
    agent_did="did:a2p:agent:team-coordinator",
)

# Load user context once for entire team
context = await coordinator.load_user_context("did:a2p:user:alice")

# Create agents with consistent user context
researcher_config = coordinator.create_agent_config(
    "researcher",
    context,
    "You research and gather information.",
)

writer_config = coordinator.create_agent_config(
    "writer", 
    context,
    "You write content based on research.",
)

# All agents now share the same user preferences!
```

### Memory Hook for Auto-Sync

```python
# Create hook for automatic memory sync
memory_hook = adapter.create_memory_hook(
    user_did="did:a2p:user:alice",
    source_agent="assistant",
)

# Use with Agno's memory system
# (when Agno learns something new, it's proposed to a2p)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's a2p Profile                       │
│  (Portable across ALL agents and platforms)                 │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │   a2p Agno        │
                    │   Adapter         │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│ Agno Agent 1  │     │ Agno Agent 2  │     │ Agno Agent 3  │
│ (Researcher)  │     │ (Writer)      │     │ (Reviewer)    │
│               │     │               │     │               │
│ Agent Memory  │     │ Agent Memory  │     │ Agent Memory  │
└───────────────┘     └───────────────┘     └───────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                              ▼
                    Memories sync back to a2p
```

## API Reference

### `A2PAgnoAdapter`

**Parameters:**

- `agent_did` (str): The agent's DID
- `default_scopes` (List[str]): Default scopes to request
- `sync_memories` (bool): Enable memory sync (default: True)

**Methods:**

- `load_user_context(user_did, scopes)` - Load user context
- `build_instructions(base, context)` - Build personalized instructions
- `propose_memory(...)` - Propose memory to a2p
- `sync_agent_memory_to_a2p(...)` - Sync Agno memories
- `create_memory_hook(user_did)` - Create auto-sync hook

### `A2PMultiAgentCoordinator`

**Methods:**

- `load_user_context(user_did)` - Load context for team
- `create_agent_config(name, context, instructions)` - Create agent config

## Related

- [a2p SDK Python](../sdk-python/)
- [Framework Examples](../../../examples/frameworks/agno/python/)
