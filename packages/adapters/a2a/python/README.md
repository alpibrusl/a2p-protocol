# a2p + A2A Protocol Integration

Bridge user-owned profiles (a2p) with Google's Agent-to-Agent (A2A) Protocol.

## The Vision

**A2A Protocol**: How agents communicate with each other  
**a2p Protocol**: What agents should know about the user

**Together**: Agents can collaborate (A2A) while respecting user preferences (a2p)

```
User ──[a2p]──▶ Agent A ──[A2A]──▶ Agent B ──[A2A]──▶ Agent C
                  │                   │                   │
                  └───── All agents respect the same user profile ─────┘
```

## Installation

```bash
pip install a2p-a2a
```

## Quick Start

```python
from a2p_a2a import A2PA2AAdapter, A2AMessageType

# Create adapter
adapter = A2PA2AAdapter(
    agent_did="did:a2p:agent:my-agent",
    agent_name="ResearchAgent",
)

# Load user context from a2p profile
context = await adapter.load_user_context("did:a2p:user:alice")

# Create A2A task message with user context attached
message = adapter.create_task_message(
    task="Research quantum computing applications",
    a2p_context=context,
    parameters={"depth": "detailed"},
)

# Send via A2A - receiving agent will see user's preferences!
await send_to_agent(target_agent_url, message.to_dict())
```

## How It Works

### 1. User Context Flows Through A2A

When Agent A sends a task to Agent B, the user's a2p context travels with it:

```python
# Agent A (sender)
context = await adapter.load_user_context(user_did)
message = adapter.create_task_message("summarize document", context)

# A2A transport carries the message...

# Agent B (receiver)
received = A2AMessage.from_dict(raw_message)
user_context = received.a2p_context  # User preferences available!

# Agent B respects preferences
if user_context.preferences.get("communication", {}).get("style") == "technical":
    # Provide technical summary
else:
    # Provide general summary
```

### 2. Context in A2A Metadata

a2p context is embedded in A2A message metadata:

```json
{
  "type": "task",
  "sender": "ResearchAgent",
  "content": {
    "task": "summarize document"
  },
  "metadata": {
    "a2p_context": {
      "version": "1.0",
      "user_did": "did:a2p:user:alice",
      "preferences": {
        "communication": {"style": "technical"},
        "language": "en"
      },
      "constraints": {
        "accessibility": {"screenReader": true}
      },
      "summary": "Communication: technical | Role: ML Engineer",
      "scopes": ["a2p:preferences", "a2p:context"]
    }
  }
}
```

### 3. Building A2A-Aware Agents

```python
from a2p_a2a import A2AAgentWithA2P, A2PContext

class SummaryAgent(A2AAgentWithA2P):
    """An A2A agent that respects a2p profiles."""
    
    async def handle_task(self, task: str, context: A2PContext):
        # Extract user preferences
        style = context.preferences.get("communication", {}).get("style", "general")
        
        # Check constraints
        if context.constraints.get("accessibility", {}).get("screenReader"):
            # Ensure output is screen-reader friendly
            pass
        
        # Generate personalized response
        summary = await self.generate_summary(task, style=style)
        
        return summary

# Use the agent
agent = SummaryAgent(
    agent_did="did:a2p:agent:summary",
    agent_name="SummaryAgent",
)

# Process incoming A2A message
result_message = await agent.process_message(incoming_message)
```

## Key Features

### Load User Context

```python
context = await adapter.load_user_context(
    user_did="did:a2p:user:alice",
    scopes=["a2p:preferences", "a2p:constraints", "a2p:professional"]
)

print(context.preferences)      # User preferences
print(context.constraints)      # Requirements/restrictions
print(context.context_summary)  # Human-readable summary
```

### Create A2A Messages

```python
# Task message
task_msg = adapter.create_task_message(
    task="analyze data",
    a2p_context=context,
    parameters={"format": "json"},
)

# Result message
result_msg = adapter.create_result_message(
    result={"analysis": "..."},
    original_task="analyze data",
    a2p_context=context,  # Pass context back
)
```

### Check Preferences & Constraints

```python
# Check specific preference
style = adapter.should_respect_preference(context, "communication.style")

# Check constraints
accessibility = adapter.check_constraint(context, "accessibility")
if accessibility and accessibility.get("screenReader"):
    # Adapt output for screen readers
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       User's a2p Profile                        │
│              (Sovereign, Portable, User-Controlled)             │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    │   a2p-a2a Adapter     │
                    │  (Context Bridge)     │
                    └───────────┬───────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     A2A Protocol Layer                          │
│            (Agent-to-Agent Communication)                       │
└─────────────────────────────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        ▼                       ▼                       ▼
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│   Agent A     │──A2A──│   Agent B     │──A2A──│   Agent C     │
│               │       │               │       │               │
│ a2p context   │       │ a2p context   │       │ a2p context   │
│ respected ✓   │       │ respected ✓   │       │ respected ✓   │
└───────────────┘       └───────────────┘       └───────────────┘
```

## Why This Matters

### Without a2p + A2A

- Each agent asks user for preferences
- Inconsistent experience across agents
- User repeats themselves constantly
- Privacy settings lost in agent chains

### With a2p + A2A

- Load preferences once, share everywhere
- Consistent personalization across all agents
- User's constraints always respected
- Privacy travels with the context

## Related

- [a2p SDK Python](../sdk-python/)
- [A2A Protocol Specification](https://a2a-protocol.org/)
- [Framework Examples](../../../examples/frameworks/a2a/python/)
