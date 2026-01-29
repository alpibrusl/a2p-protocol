# A2A Protocol + a2p Integration

This example demonstrates how to bridge the A2A (Agent-to-Agent) Protocol with a2p user profiles for personalized multi-agent collaboration.

## The Big Picture

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   A2A = How agents TALK to each other                           │
│   a2p = What agents should KNOW about the user                  │
│                                                                  │
│   Together = Agents collaborate while respecting user prefs     │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Prerequisites

```bash
pip install httpx a2p-sdk a2p-a2a
```

## Running the Example

```bash
python agent_collaboration.py
```

## What This Example Shows

1. **Context Propagation**: User preferences flow through agent chains
2. **Preference Respect**: Each agent adapts to user's communication style
3. **Constraint Enforcement**: Accessibility/privacy requirements enforced
4. **Multi-Agent Coordination**: Research → Analysis → Summary pipeline

## Scenario

```
User (Alice) wants research on "sustainable AI"

        ┌─────────────────┐
        │  Alice's a2p    │
        │  Profile        │
        │  - Technical    │
        │  - Detailed     │
        │  - Accessible   │
        └────────┬────────┘
                 │ load once
                 ▼
        ┌─────────────────┐      A2A        ┌─────────────────┐
        │ Research Agent  │ ─────────────▶  │ Analysis Agent  │
        │                 │  (with a2p)     │                 │
        │ Gets: technical │                 │ Gets: technical │
        └─────────────────┘                 └────────┬────────┘
                                                     │ A2A
                                                     ▼
                                            ┌─────────────────┐
                                            │ Summary Agent   │
                                            │                 │
                                            │ Gets: technical │
                                            │ (accessible)    │
                                            └─────────────────┘
                                                     │
                                                     ▼
                                            Personalized Result
```

## Key Concepts

### A2P Context in A2A Messages

```python
# Context travels with A2A messages
message = {
    "type": "task",
    "sender": "ResearchAgent",
    "content": {"task": "research sustainable AI"},
    "metadata": {
        "a2p_context": {
            "user_did": "did:a2p:user:local:alice",
            "preferences": {
                "communication": {"style": "technical"}
            },
            "constraints": {
                "accessibility": {"screenReader": True}
            }
        }
    }
}
```

### Agents Respect Context

```python
class AnalysisAgent(A2AAgentWithA2P):
    async def handle_task(self, task, context):
        # Adapt to user's style
        style = context.preferences.get("communication", {}).get("style")
        
        # Respect accessibility constraints
        if context.constraints.get("accessibility", {}).get("screenReader"):
            # Ensure output is screen-reader friendly
            return self.analyze_accessible(task)
        
        return self.analyze(task, style=style)
```

## Benefits of a2p + A2A

| Without a2p | With a2p |
|-------------|----------|
| Agents share tasks | Agents share tasks + user context |
| Each agent re-asks preferences | Preferences flow automatically |
| Inconsistent personalization | Consistent experience |
| Privacy unclear | User controls sharing |

## Key Features

1. **User-centric agents**: Agents don't just talk—they talk about what the user cares about
2. **Privacy by design**: User controls what context agents share
3. **Consistent UX**: User preferences persist across entire agent ecosystems
4. **Enterprise-ready**: Compliance and accessibility flow through agent chains

## Next Steps

- Explore the [a2p-a2a adapter](../../../../packages/adapters/a2a/python/)
- See the [A2A Protocol spec](https://a2a-protocol.org/)
- Read about [a2p profiles](https://alpibrusl.github.io/a2p-protocol/)
