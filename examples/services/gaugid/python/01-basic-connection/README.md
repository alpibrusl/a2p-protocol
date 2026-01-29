# 01 - Basic Gaugid Connection

Connect to Gaugid, read a user profile, and propose a memory.

## Prerequisites

1. **Gaugid account** - Sign up at [gaugid.com](https://gaugid.com)
2. **User profile** - Create a profile in the Gaugid dashboard
3. **Auth token** - Get from Gaugid dashboard

## Setup

```bash
# Install dependencies
pip install a2p-sdk httpx

# Set environment variables
export GAUGID_API_URL="https://api.gaugid.com"
export GAUGID_AUTH_TOKEN="your-firebase-token"
export GAUGID_USER_DID="did:a2p:user:gaugid:your-profile-did"
export GAUGID_AGENT_DID="did:a2p:agent:gaugid:my-first-agent"
```

## Run

```bash
python main.py
```

## Expected Output

```
🚀 Gaugid Basic Connection Example
   API URL: https://api.gaugid.com
   User DID: did:a2p:user:gaugid:abc123
   Agent DID: did:a2p:agent:gaugid:my-first-agent

📖 Loading user profile from Gaugid...
✅ Profile loaded: human profile
   Name: Alice
   Memories: 5

💡 Proposing a new memory...
✅ Memory proposed!
   Proposal ID: prop_abc123xyz
   Status: pending

📋 Next Steps:
   1. Go to Gaugid dashboard to review the proposal
   2. Approve or reject the proposed memory
   3. The memory will be added to the profile if approved
```

## Code Explanation

### 1. CloudStorage

```python
storage = CloudStorage(
    api_url=api_url,
    auth_token=auth_token,
    agent_did=agent_did,
)
```

`CloudStorage` is the a2p SDK's storage backend for Gaugid. It:
- Connects to the Gaugid REST API
- Handles authentication automatically
- Implements the a2p protocol endpoints

### 2. A2PClient

```python
client = A2PClient(
    agent_did=agent_did,
    storage=storage,
)
```

The `A2PClient` provides high-level methods for profile operations. When using `CloudStorage`, all operations go through the Gaugid API.

### 3. Proposing Memories

```python
proposal_result = await client.propose_memory(
    user_did=user_did,
    content="User connected their first agent to Gaugid",
    category="a2p:episodic",
    confidence=0.95,
)
```

Memories are **proposed**, not directly added. The user reviews and approves/rejects proposals in the Gaugid dashboard.

## Next Steps

- [02-mcp-claude](../02-mcp-claude/) - Integrate with Claude Desktop via MCP
- [03-gemini-agent](../03-gemini-agent/) - Build an AI agent with Google Gemini
