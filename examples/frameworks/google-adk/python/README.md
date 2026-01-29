# Google ADK + a2p Examples

Examples demonstrating how to integrate Google ADK (Agent Development Kit) with the a2p protocol for personalized AI agents.

## Examples

### 1. `agent_team.py` - Local Storage Example

Uses in-memory storage for local development and testing.

**Requirements:**

- `GOOGLE_API_KEY` - Google API key for ADK

**Run:**

```bash
export GOOGLE_API_KEY="your-api-key"
python agent_team.py
```

### 2. `agent_cloud.py` - Cloud Storage Example

Uses a2p-cloud service backend for profile storage. This demonstrates how to use the a2p SDK with cloud-hosted profiles.

**Important:** Profiles must be created via the a2p-cloud dashboard first. This example only reads and uses existing profiles.

**Requirements:**

- `A2P_API_URL` - Base URL of a2p-cloud API (default: `http://localhost:3001`)
- `A2P_AUTH_TOKEN` - Firebase ID token for authentication
- `A2P_USER_DID` - User DID to use (REQUIRED - profile must exist in a2p-cloud)
- `GOOGLE_API_KEY` - Google API key for ADK

**Setup Steps:**

1. **Create a profile in a2p-cloud dashboard:**
   - Log in to your a2p-cloud dashboard
   - Create a new profile
   - Add some memories/preferences
   - Configure consent policies to allow agent access
   - Copy the profile DID

2. **Get your Firebase ID token** (see below)

3. **Run the example** with the profile DID

**Getting a Firebase ID Token:**

1. **Using Firebase CLI:**

   ```bash
   firebase login
   firebase auth:export users.json
   # Use the token from your Firebase project
   ```

2. **Using a2p-cloud Dashboard:**
   - Log in to your a2p-cloud dashboard
   - Open browser developer tools
   - Check the Network tab for API requests
   - Copy the `Authorization: Bearer <token>` header value

3. **Programmatically (for testing):**

   ```python
   import firebase_admin
   from firebase_admin import auth
   
   # Initialize Firebase Admin (server-side)
   cred = firebase_admin.credentials.Certificate("path/to/service-account.json")
   firebase_admin.initialize_app(cred)
   
   # Create custom token (for testing)
   custom_token = auth.create_custom_token("user-id")
   ```

**Run:**

```bash
export A2P_API_URL="https://api.a2p-cloud.example.com"
export A2P_AUTH_TOKEN="your-firebase-token"
export A2P_USER_DID="did:a2p:user:local:your-user"  # REQUIRED - from dashboard
export GOOGLE_API_KEY="your-api-key"
python agent_cloud.py
```

**What the example does:**

- Loads an existing profile from a2p-cloud
- Reads user preferences and memories
- Creates a personalized Google ADK agent
- Uses the profile to personalize responses
- Proposes new memories back to the profile

## Storage Backends

The a2p SDK supports multiple storage backends:

### Memory Storage (Default)

```python
from a2p import A2PClient, MemoryStorage

storage = MemoryStorage()
client = A2PClient(agent_did="...", storage=storage)
```

### Cloud Storage

```python
from a2p import A2PClient
from a2p.storage.cloud import CloudStorage

storage = CloudStorage(
    api_url="https://api.a2p-cloud.example.com",
    auth_token="firebase-token"
)
client = A2PClient(agent_did="...", storage=storage)
```

## How It Works

1. **Profile Storage**: User profiles are stored in a2p-cloud (or locally with MemoryStorage)
2. **Agent Access**: Agents request access to user profiles with specific scopes
3. **Consent Policies**: Users define policies that control what agents can access
4. **Personalization**: Agents use profile data to personalize responses
5. **Memory Proposals**: Agents can propose new memories for user review

## Architecture

```
┌─────────────┐
│   Google    │
│     ADK     │
│   Agent     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  a2p SDK    │
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌──────────────┐
│   Cloud     │─────▶│  a2p-cloud   │
│  Storage    │      │     API      │
└─────────────┘      └──────────────┘
```

## Next Steps

- Review the [a2p SDK documentation](../../../../packages/sdk/python/README.md)
- Check out other [framework examples](../README.md)
- Learn about [a2p protocol specification](../../../docs/docs/spec/index.md)
