# Solid Pods + a2p Integration

This example demonstrates how to use **Solid Pods** as a storage backend for a2p profiles, enabling fully decentralized, user-owned profile storage.

## The Big Picture

```
┌─────────────────────────────────────────────────────────┐
│                                                           │
│   Solid = Decentralized storage infrastructure          │
│   a2p = AI-specific profile schema and protocol         │
│                                                           │
│   Together = User-owned AI profiles in Solid Pods       │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Why Solid + a2p?

| Aspect | Benefit |
|--------|---------|
| **Storage** | Solid Pods provide decentralized storage |
| **Schema** | a2p provides AI-specific profile structure |
| **Ownership** | Users control their Pods (Solid) + profiles (a2p) |
| **Portability** | Profiles stored in user's Pod, not tied to provider |
| **Compliance** | Both support GDPR/privacy requirements |

## Architecture

```
User's Solid Pod
├── profile.json (a2p Profile)
├── memories/
│   ├── episodic.json
│   ├── semantic.json
│   └── procedural.json
└── policies/
    └── consent-policies.json
```

## Prerequisites

```bash
# Install a2p SDK (includes SolidStorage)
pip install a2p-sdk httpx

# Note: SolidStorage uses HTTP requests to Solid Pods.
# For production, you may want to use a Solid Python SDK
# for proper authentication flows.
```

## Setup

### 1. Get a Solid Pod

You need a Solid Pod (personal online data store). Options:

- **Inrupt Pod**: Sign up at [pod.inrupt.com](https://pod.inrupt.com) (free)
- **Self-hosted**: Run your own Solid server
- **Other providers**: Use any Solid-compatible Pod provider

### 2. Get Access Token

You need an access token for your Solid Pod. Options:

**Option A: Use Solid authentication library**
```python
from solid import Solid

# Authenticate with your Solid Pod
solid = Solid()
solid.login(
    idp="https://broker.pod.inrupt.com",  # Your Pod provider
    username="your-username",
    password="your-password"
)

# Get access token
token = solid.get_token()
```

**Option B: Use environment variables (for testing)**
```bash
export SOLID_POD_URL="https://alice.inrupt.com/profile/card#me"
export SOLID_ACCESS_TOKEN="your-access-token"
```

### 3. Use SolidStorage Backend

```python
from a2p import A2PClient, A2PUserClient
from a2p.storage.solid import SolidStorage

# Create Solid storage backend
storage = SolidStorage(
    pod_url="https://your-pod.inrupt.com/profile/card#me",
    access_token=token
)

# Use with a2p client
client = A2PClient(
    agent_did="did:a2p:agent:my-agent",
    storage=storage
)

# Or use with user client
user = A2PUserClient(storage)
```

## Example: Store Profile in Solid Pod

See `main.py` for a complete working example.

```bash
# Set environment variables
export SOLID_POD_URL="https://alice.inrupt.com/profile/card#me"
export SOLID_ACCESS_TOKEN="your-access-token"

# Run example
python main.py
```

The example demonstrates:
1. Authenticating with Solid Pod
2. Creating SolidStorage backend
3. Creating a2p profile (stored in Pod)
4. Adding memories and policies
5. Accessing profile from Pod

## Benefits

✅ **Fully Decentralized**: Profile stored in user's Pod, not in a central service  
✅ **User Control**: User owns both Pod and profile data  
✅ **Portability**: Move Pod to different provider, profile comes with it  
✅ **Privacy**: User controls access via Solid's access control  
✅ **Compliance**: Both Solid and a2p support GDPR requirements

## Use Cases

1. **Privacy-Conscious Users**: Store AI profiles in their own Solid Pods
2. **Enterprise**: Self-hosted Solid servers for internal profiles
3. **Research**: Decentralized AI profile studies
4. **Compliance**: GDPR-compliant profile storage with user control

## Next Steps

- [Solid Project](https://solidproject.org/) - Learn about Solid
- [Solid Python SDK](https://github.com/jeff-zucker/solid-python) - Python library (for authentication)
- [a2p SolidStorage](../../../../packages/sdk/python/src/a2p/storage/solid.py) - Implementation
- [a2p Documentation](https://alpibrusl.github.io/a2p-protocol/) - Full docs
- [Run the example](./main.py) - Complete working code
