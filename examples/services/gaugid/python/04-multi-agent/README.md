# 04 - Multi-Agent System with Gaugid

Multiple AI agents sharing the same user profile through Gaugid. This demonstrates how different specialized agents can maintain consistent personalization.

## The Agents

| Agent | Role | Specialization |
|-------|------|----------------|
| **Research Agent** | `research` | Information gathering, topic explanations |
| **Personal Assistant** | `assistant` | General help, recommendations |
| **Scheduler Agent** | `scheduler` | Calendar, meetings, time management |

All agents share the same user profile, ensuring consistent personalization across interactions.

## Why Multi-Agent?

```
┌─────────────────────────────────────────────────────────┐
│                    User Profile (Gaugid)                │
│  - Preferences: morning meetings, dark mode            │
│  - Interests: machine learning, coffee                 │
│  - Schedule: busy Mon/Wed afternoons                   │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
   │  Research   │ │  Personal   │ │  Scheduler  │
   │   Agent     │ │  Assistant  │ │    Agent    │
   └─────────────┘ └─────────────┘ └─────────────┘
```

**Benefits:**
- Each agent is specialized for its domain
- User preferences apply consistently across all agents
- New learnings from one agent benefit others
- Single source of truth for user data

## Setup

```bash
# Install dependencies
pip install a2p-sdk google-genai httpx

# Set environment variables
export GAUGID_API_URL="https://api.gaugid.com"
export GAUGID_AUTH_TOKEN="your-firebase-token"
export GAUGID_USER_DID="did:a2p:user:gaugid:your-profile-did"
export GOOGLE_API_KEY="your-google-ai-api-key"
```

## Run

```bash
python main.py
```

## Example Session

```
🤖 Gaugid Multi-Agent System
   API URL: https://api.gaugid.com
   Agents: 3
     - Research Agent (did:a2p:agent:gaugid:research-agent)
     - Personal Assistant (did:a2p:agent:gaugid:personal-assistant)
     - Scheduler Agent (did:a2p:agent:gaugid:scheduler-agent)

📖 Loading user profile (shared by all agents)...
✅ Context loaded

💬 Multi-Agent Chat
   Messages are automatically routed to the best agent:
   - 'schedule', 'meeting' → Scheduler Agent
   - 'research', 'explain' → Research Agent
   - Other → Personal Assistant

You: Can you schedule a meeting for tomorrow?

[Scheduler Agent]: Based on your preference for morning meetings, 
I'd suggest scheduling for tomorrow between 9-11am. Your afternoons 
tend to be busy with focused work. Would 10am work for you?

You: What's the latest in quantum computing?

[Research Agent]: Quantum computing has seen significant advances 
recently. Key developments include IBM's 1000+ qubit processors and 
Google's quantum error correction breakthroughs. Given your interest 
in machine learning, you might find quantum ML particularly relevant.

You: What should I have for lunch?

[Personal Assistant]: Since you mentioned you like coffee, there's 
a great cafe nearby that also serves healthy lunch options. Based on 
your busy afternoon schedule, something quick but nutritious would 
be ideal.
```

## Architecture

### Message Routing

```python
async def route_message(self, message: str) -> tuple[str, str]:
    message_lower = message.lower()
    
    if any(word in message_lower for word in ["schedule", "meeting"]):
        role = "scheduler"
    elif any(word in message_lower for word in ["research", "explain"]):
        role = "research"
    else:
        role = "assistant"
    
    return role, await self.chat(role, message)
```

### Shared Context

All agents receive the same user context:

```python
async def load_user_context(self, user_did: str) -> str:
    # Use any agent to load profile (they all see the same data)
    _, client, _ = self.agents["assistant"]
    profile = await client.get_profile(user_did)
    # ... build context string
```

### Memory Proposals

Any agent can propose memories:

```python
await system.propose_memory(
    role="research",
    content="User interested in quantum ML applications",
    category="a2p:interests"
)
```

## Extending the System

### Add a New Agent

```python
AGENTS.append(AgentConfig(
    name="Code Assistant",
    did="did:a2p:agent:gaugid:code-assistant",
    role="code",
    system_prompt="You are a coding assistant specialized in Python..."
))
```

### Custom Routing

Implement smarter routing with an LLM:

```python
async def smart_route(self, message: str) -> str:
    routing_prompt = f"""Given this message: "{message}"
    Which agent should handle it?
    - research: information gathering
    - assistant: general help
    - scheduler: time management
    
    Respond with just the role name."""
    
    response = await self.gemini.generate(routing_prompt)
    return response.text.strip()
```

### Cross-Agent Communication

Agents can delegate to each other:

```python
async def delegate(self, from_role: str, to_role: str, task: str):
    response = await self.chat(to_role, task)
    return f"[Delegated to {to_role}]: {response}"
```

## Production Considerations

1. **Agent Registration**: Register each agent in Gaugid dashboard
2. **Permission Scopes**: Each agent may need different scopes
3. **Rate Limiting**: Coordinate API calls across agents
4. **Logging**: Track which agent handled each request
5. **Failover**: Handle agent unavailability gracefully

## Next Steps

- [Gaugid API Docs](https://docs.gaugid.com/api) - Full API reference
- [Agent Registration](https://docs.gaugid.com/agents) - Register agents in dashboard
