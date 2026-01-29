# Example 06: CrewAI Research (Python)

This example shows how to integrate a2p with CrewAI for personalized multi-agent research crews.

> ⚠️ This is a **simulated** example. For a real CrewAI integration with actual LLM calls, see `examples/frameworks/crewai/python/`.

## What You'll Learn

- Loading user context for crew agents
- Personalizing agent backstories
- Proposing research findings to user profiles
- Building multi-agent systems with a2p

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 06-crewai-research/main.py
```

## Code Overview

```python
from a2p_crewai import create_crew_memory

# Create memory for the crew
memory = create_crew_memory(
    agent_did="did:a2p:agent:local:research-crew",
    default_scopes=["a2p:preferences", "a2p:professional", "a2p:interests"],
)

# Load user context for crew agents
user_context = await memory.load_user_context(user_did)

# Use context in agent backstories
researcher = Agent(
    role="Research Specialist",
    backstory=f"You're helping a user. Context:\n{user_context}",
)

# Propose findings back to profile
await memory.propose_memory(
    user_did=user_did,
    content="Interested in DAG-based consensus",
    category="a2p:interests.topics",
    confidence=0.8,
)
```

## Real Integration

For a working example with actual LLM calls:

```bash
cd examples/frameworks/crewai/python
export OPENAI_API_KEY="sk-..."
python research_crew.py
```
