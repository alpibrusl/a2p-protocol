# Quickstart: Python

Build your first a2p integration in Python.

---

## Prerequisites

- Python 3.9+
- pip or poetry

---

## Installation

```bash
pip install a2p-sdk
```

---

## 1. Initialize the Client

```python
from a2p import A2PClient, A2PUserClient

# For agents accessing user profiles
agent_client = A2PClient(
    agent_did="did:a2p:agent:local:my-agent",
    # Optional: custom gateway
    # gateway_url="https://gateway.example.com"
)

# For users managing their profiles
user_client = A2PUserClient()
```

---

## 2. Create a User Profile

```python
# Create a new profile
profile = await user_client.create_profile(
    display_name="Alice",
    preferences={
        "language": "en-US",
        "timezone": "Europe/Madrid",
        "communication": {
            "style": "concise",
            "formality": "casual"
        }
    }
)

print(f"Created profile: {profile.id}")
# did:a2p:user:local:abc123xyz
```

---

## 3. Request Access (Agent)

```python
# Agent requests access to user profile
access_result = await agent_client.request_access(
    user_did="did:a2p:user:local:alice",
    scopes=["a2p:preferences", "a2p:interests"],
    purpose={
        "type": "personalization",
        "description": "Tailor responses to your preferences",
        "legal_basis": "consent"
    }
)

if access_result.granted:
    print(f"Access granted for: {access_result.granted_scopes}")
else:
    print(f"Access denied: {access_result.reason}")
```

---

## 4. Read User Profile (Agent)

```python
# Get user profile (filtered by permissions)
user_profile = await agent_client.get_profile(
    user_did="did:a2p:user:local:alice",
    scopes=["a2p:preferences", "a2p:interests"]
)

print(f"User preferences: {user_profile.common.preferences}")
print(f"User interests: {user_profile.memories.get('a2p:interests')}")
```

---

## 5. Propose a Memory (Agent)

```python
# Agent proposes a memory based on conversation
proposal = await agent_client.propose_memory(
    user_did="did:a2p:user:local:alice",
    content="Prefers Python for data science projects",
    category="a2p:professional.preferences",
    confidence=0.85,
    context="Based on discussion about frameworks"
)

print(f"Proposal submitted: {proposal.id}")
# User will review and approve/reject
```

---

## 6. Review Proposals (User)

```python
# User reviews pending proposals
proposals = await user_client.get_pending_proposals()

for proposal in proposals:
    print(f"From: {proposal.agent_did}")
    print(f"Content: {proposal.content}")
    print(f"Category: {proposal.category}")
    
    # Approve, reject, or edit
    await user_client.review_proposal(
        proposal.id,
        action="approve",
        # Optional: edit before approving
        # edited_content="Strongly prefers Python"
    )
```

---

## 7. Set Consent Policies (User)

```python
# User defines access policies
await user_client.set_policy(
    name="Work Assistants",
    agent_pattern="did:a2p:agent:local:work-*",
    allow=[
        "a2p:preferences.*",
        "a2p:professional.*"
    ],
    deny=[
        "a2p:health.*",
        "a2p:financial.*"
    ],
    permissions=["read_scoped", "propose"]
)
```

---

## Complete Example

```python
import asyncio
from a2p import A2PClient, A2PUserClient

async def main():
    # === User Setup ===
    user_client = A2PUserClient()
    
    # Create profile
    profile = await user_client.create_profile(
        display_name="Alice",
        preferences={
            "language": "en-US",
            "communication": {"style": "concise"}
        }
    )
    
    # Set policy
    await user_client.set_policy(
        name="Default",
        agent_pattern="*",
        allow=["a2p:preferences.*"],
        permissions=["read_scoped", "propose"]
    )
    
    # === Agent Access ===
    agent_client = A2PClient(
        agent_did="did:a2p:agent:local:my-assistant"
    )
    
    # Request access
    access = await agent_client.request_access(
        user_did=profile.id,
        scopes=["a2p:preferences"],
        purpose={
            "type": "personalization",
            "description": "Personalize responses",
            "legal_basis": "consent"
        }
    )
    
    if access.granted:
        # Read profile
        user_profile = await agent_client.get_profile(
            user_did=profile.id,
            scopes=["a2p:preferences"]
        )
        
        print(f"Got preferences: {user_profile.common.preferences}")
        
        # Propose memory
        await agent_client.propose_memory(
            user_did=profile.id,
            content="User is interested in data science",
            category="a2p:interests.topics",
            confidence=0.9
        )
    
    # === User Reviews ===
    proposals = await user_client.get_pending_proposals()
    for p in proposals:
        await user_client.review_proposal(p.id, action="approve")
    
    print("Done!")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## Using with Async Frameworks

### FastAPI

```python
from fastapi import FastAPI
from a2p import A2PClient

app = FastAPI()
client = A2PClient(agent_did="did:a2p:agent:local:my-api")

@app.get("/personalized/{user_did}")
async def get_personalized(user_did: str):
    profile = await client.get_profile(
        user_did=user_did,
        scopes=["a2p:preferences"]
    )
    
    return {
        "greeting": f"Hello, {profile.identity.display_name}!",
        "language": profile.common.preferences.language
    }
```

---

## Next Steps

- [Quickstart: TypeScript](quickstart-typescript.md) — TypeScript version
- [Agent Integration](agent-integration.md) — Deeper integration guide
- [CrewAI Adapter](../adapters/crewai.md) — Use with CrewAI
- [SDK Reference](../sdk/python.md) — Full API docs
