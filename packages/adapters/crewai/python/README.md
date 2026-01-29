# a2p-crewai

CrewAI adapter for the a2p (Agent 2 Profile) protocol.

## Installation

```bash
pip install a2p-crewai a2p-sdk crewai
```

## Quick Start

```python
import asyncio
from a2p_crewai import A2PCrewMemory, create_crew_memory
from crewai import Agent, Crew, Task

async def main():
    # Create a2p memory
    memory = create_crew_memory(
        agent_did="did:a2p:agent:research-crew",
        default_scopes=["a2p:preferences", "a2p:professional", "a2p:interests"],
    )

    # Load user context
    user_did = "did:a2p:user:alice"
    user_context = await memory.load_user_context(user_did)

    # Create agent with user context
    researcher = Agent(
        role="Research Assistant",
        goal="Help the user find relevant information",
        backstory=f"""You are a helpful research assistant.
        
Here's what you know about the user:
{user_context}

Use this information to personalize your responses.""",
    )

    # Create and run task
    task = Task(
        description="Research the latest trends in AI",
        agent=researcher,
    )

    crew = Crew(agents=[researcher], tasks=[task])
    result = crew.kickoff()

    # Propose memories from the interaction
    await memory.propose_memory(
        user_did=user_did,
        content="Interested in AI trends research",
        category="a2p:interests.topics",
        confidence=0.75,
        context="User requested research on AI trends",
    )

asyncio.run(main())
```

## API

### A2PCrewMemory

```python
memory = A2PCrewMemory(
    agent_did="did:a2p:agent:my-agent",
    private_key=None,  # Optional
    default_scopes=["a2p:preferences"],
)

# Load user context as formatted string
context = await memory.load_user_context("did:a2p:user:alice")

# Propose a memory
await memory.propose_memory(
    user_did="did:a2p:user:alice",
    content="User prefers detailed explanations",
    category="a2p:preferences.communication",
    confidence=0.8,
)

# Get cached context
cached = memory.get_cached_context("did:a2p:user:alice")
```

## License

EUPL-1.2
