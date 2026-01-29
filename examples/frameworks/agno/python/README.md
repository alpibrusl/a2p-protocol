# Agno + a2p Integration

This example demonstrates how to integrate a2p user profiles with Agno's agent framework for personalized multi-agent systems.

## Prerequisites

```bash
pip install agno openai a2p-sdk a2p-agno
```

Set your API key:

```bash
export OPENAI_API_KEY="your-api-key"
```

## Running the Example

```bash
python multi_agent.py
```

## What This Example Shows

1. **User Context Loading**: Fetch portable preferences from a2p profile
2. **Multi-Agent Personalization**: All agents share consistent user context
3. **Memory Sync**: Agent learnings proposed back to user's a2p profile
4. **Team Coordination**: Researcher, Writer, and Reviewer working together

## Key Concepts

### Agent-Side vs User-Side Memory

| Agno Memory | a2p Memory |
|-------------|------------|
| What THIS agent learned | What the USER wants ALL agents to know |
| Agent-specific | Portable across agents |
| Session-based | Persistent |

### Why Both Matter

- **Agno Memory**: "User asked about React hooks 3 times this session"
- **a2p Memory**: "User is a senior developer who prefers functional patterns"

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User's a2p Profile                       │
│         (Portable across ALL agents & platforms)            │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │    Coordinator    │
                    │   (loads once)    │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐     ┌───────────────┐     ┌───────────────┐
│  Researcher   │     │    Writer     │     │   Reviewer    │
│               │     │               │     │               │
│ Same user     │     │ Same user     │     │ Same user     │
│ preferences   │     │ preferences   │     │ preferences   │
└───────────────┘     └───────────────┘     └───────────────┘
```

## Example Output

```
[a2p] Loading user profile for research team...

User Context:
- Communication style: technical
- Skills: Python, ML, Kubernetes
- Interests: LLMs, Edge Computing
- Current project: Building RAG system

[Agno] Creating research team with shared context...

Research Task: "Best practices for RAG systems"

[Researcher] Gathering information...
[Writer] Creating summary based on user's ML background...
[Reviewer] Checking technical accuracy for experienced user...

Final Output: (personalized for user's expertise level)
```
