# a2p Google ADK Adapter

Integrate a2p user profiles with Google's Agent Development Kit (ADK) for personalized AI agents.

## What is Google ADK?

Google ADK (Agent Development Kit) is Google's framework for building production-ready AI agents. It provides:

- Agent orchestration and lifecycle management
- Tool integration and function calling
- Multi-agent coordination
- Native Gemini integration

This adapter adds **user-centric personalization** via a2p profiles.

## Installation

```bash
pip install a2p-google-adk google-adk google-genai
```

## Quick Start

```python
from google.adk import Agent, Runner
from google.genai import Client
from a2p_google_adk import A2PADKAdapter

# Create a2p adapter
adapter = A2PADKAdapter(
    agent_did="did:a2p:agent:my-adk-agent",
    default_scopes=["a2p:preferences", "a2p:professional"],
)

# Load user context
user_context = await adapter.load_user_context("did:a2p:user:alice")

# Create ADK agent with personalized instructions
agent = Agent(
    name="PersonalizedAssistant",
    model="gemini-2.5-pro",
    instruction=adapter.build_instruction(
        "You are a helpful coding assistant.",
        user_context,
    ),
)

# Run agent
client = Client(api_key="YOUR_API_KEY")
runner = Runner(agent=agent, app_name="my-app", client=client)
response = await runner.run("Help me with my project")
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
```

### Create Personalized Agent Config

```python
config = adapter.create_personalized_agent_config(
    name="CodingAssistant",
    base_instruction="You help with coding tasks.",
    user_context=context,
    model="gemini-2.5-pro",
    tools=[search_tool, code_tool],
)

agent = Agent(**config)
```

### Multi-Agent Coordination

```python
from a2p_google_adk import A2PADKMultiAgentCoordinator

coordinator = A2PADKMultiAgentCoordinator(
    agent_did="did:a2p:agent:team-coordinator",
)

# Load user context once for entire team
context = await coordinator.load_user_context("did:a2p:user:alice")

# All agents share the same user preferences
research_config = coordinator.create_agent_config(
    "researcher", "Research and gather information.", context
)
writer_config = coordinator.create_agent_config(
    "writer", "Write content based on research.", context
)
reviewer_config = coordinator.create_agent_config(
    "reviewer", "Review and improve content.", context
)
```

### Propose Memories

```python
await adapter.propose_memory(
    user_did="did:a2p:user:alice",
    content="Prefers Python type hints",
    category="a2p:preferences.development",
    confidence=0.85,
    source_agent="CodingAssistant",
)
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's a2p Profile                       │
│              (Portable across all agents)                   │
└───────────────────────────────┬─────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   a2p ADK Adapter     │
                    │  (Context Bridge)     │
                    └───────────┬───────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                  Google ADK Framework                       │
│            (Agent Orchestration & Tools)                    │
└─────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   Agent A     │       │   Agent B     │       │   Agent C     │
│ Personalized  │       │ Personalized  │       │ Personalized  │
└───────────────┘       └───────────────┘       └───────────────┘
```

## API Reference

### `A2PADKAdapter`

**Parameters:**

- `agent_did` (str): The agent's DID
- `default_scopes` (List[str]): Default scopes to request
- `auto_propose` (bool): Enable auto-proposal (default: True)

**Methods:**

- `load_user_context(user_did, scopes)` - Load user context
- `build_instruction(base, context)` - Build personalized instruction
- `create_personalized_agent_config(...)` - Create agent config
- `propose_memory(...)` - Propose memory to a2p
- `extract_and_propose(...)` - Auto-extract memories

### `A2PADKMultiAgentCoordinator`

**Methods:**

- `load_user_context(user_did)` - Load context for team
- `create_agent_config(name, instruction, context)` - Create agent config

## Related

- [a2p SDK Python](../sdk-python/)
- [Google ADK Documentation](https://ai.google.dev/adk)
- [Framework Examples](../../../examples/frameworks/google-adk/python/)
