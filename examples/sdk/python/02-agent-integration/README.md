# Example 02: Agent Integration (Python)

This example shows how an AI agent can access a user's profile with proper consent.

## What You'll Learn

- Creating agent clients
- Requesting profile access with scopes
- Respecting user consent policies
- Reading memories based on permissions

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 02-agent-integration/main.py
```

## Code Overview

```python
from a2p import create_agent_client

# Create an agent client
agent = create_agent_client(
    agent_did="did:a2p:agent:local:my-assistant"
)

# Request profile with specific scopes
profile = await agent.get_profile(
    user_did=user_did,
    scopes=["a2p:preferences", "a2p:professional"],
)

# Access allowed memories
for memory in profile.memories.episodic:
    print(f"[{memory.category}] {memory.content}")
```
