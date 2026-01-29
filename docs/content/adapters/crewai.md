# CrewAI Adapter

Use a2p profiles with CrewAI agents.

---

## Installation

```bash
pip install a2p-crewai
```

---

## Quick Start

```python
from a2p_crewai import A2PCrewMemory
from crewai import Agent, Task, Crew

memory = A2PCrewMemory(
    user_did="did:a2p:user:local:alice",
    agent_did="did:a2p:agent:local:my-agent"
)

agent = Agent(
    role="Personal Assistant",
    goal="Help the user with their tasks",
    memory=memory
)

task = Task(
    description="Help plan today's schedule",
    agent=agent
)

crew = Crew(agents=[agent], tasks=[task])
result = crew.kickoff()
```

---

## Features

### User Context

```python
# Memory automatically provides user context
# - Preferences
# - Interests
# - Professional info
```

### Memory Proposals

```python
# After task completion
await memory.propose_memory(
    content="User prefers morning meetings",
    category="a2p:preferences.schedule",
    confidence=0.85
)
```

---

## Next Steps

- [LangChain Adapter](langchain.md)
- [Adapter Overview](overview.md)
