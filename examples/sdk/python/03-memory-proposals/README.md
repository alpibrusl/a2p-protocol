# Example 03: Memory Proposals (Python)

This example demonstrates the memory proposal workflow where agents can suggest learned information for user approval.

## What You'll Learn

- Agents proposing memories
- User reviewing proposals
- Approving, editing, or rejecting proposals
- Building a consent-based learning loop

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 03-memory-proposals/main.py
```

## Code Overview

```python
from a2p import create_agent_client, create_user_client

# Agent proposes a memory
await agent.propose_memory(
    user_did=user_did,
    content="Prefers dark mode",
    category="a2p:preferences.ui",
    confidence=0.9,
    context="User mentioned this explicitly",
)

# User reviews proposals
proposals = user.get_pending_proposals()
for proposal in proposals:
    # Approve, approve with edits, or reject
    await user.approve_proposal(proposal.id)
```

## Workflow

```
Agent learns something → Proposes memory → User reviews → Approve/Edit/Reject
```
