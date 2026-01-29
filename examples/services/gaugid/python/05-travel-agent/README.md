# 05 - Travel Agent with Gaugid (Local Development)

A complete, working travel agent example that demonstrates:

1. **Firebase Emulator Authentication** - Login with test user
2. **Gaugid Profile Management** - Create profile with travel preferences
3. **Vertex AI Integration** - Personalized travel recommendations
4. **Memory Proposals** - Agent learns from conversations

## Prerequisites

### 1. Start Gaugid Locally

```bash
cd ../a2p-cloud
docker-compose up -d
```

This starts:
- API: http://localhost:3001
- Dashboard: http://localhost:3000
- Firebase Emulator: http://localhost:9099
- Emulator UI: http://localhost:4000

### 2. Implement Agent Registration API (Required)

The example requires the agent registration API to be implemented in Gaugid.

**See**: `a2p-cloud/.internal-docs/agent-registration-api.md` for implementation details.

**Quick implementation**:
1. Create `services/api/src/routes/agents.ts` with `POST /api/agents/register`
2. Add route to `services/api/src/index.ts`
3. Set `AUTO_VERIFY_AGENTS=true` in docker-compose.yml for local dev

Once implemented, agents can self-register via the API.

### 3. Create Test User and Profile

**Important**: The example needs a user profile to work with.

**Option A**: Use the Dashboard (Recommended)
1. Go to http://localhost:3000/register
2. Register with `test@example.com` / `test123456`
3. Create a profile in the dashboard (or use existing one)

**Option B**: Use Firebase Emulator UI
1. Go to http://localhost:4000
2. Click Authentication → Add User
3. Then create profile via dashboard

**Note**: The example will automatically:
- List all your profiles
- Use the first "human" profile it finds
- Or use the profile specified with `--profile-did`

### 4. Setup Google Cloud Auth

```bash
# Authenticate with Google Cloud
gcloud auth application-default login

# Verify you have access to the project
gcloud projects describe a2p-common
```

### 5. Install Dependencies

```bash
# Install from local SDK (no published package needed)
pip install google-genai httpx requests firebase-admin

# The example uses the local a2p SDK from packages/sdk/python/src/
```

## Run the Example

### Demo Mode (Default)

Runs 3 sample travel conversations:

```bash
python main.py
```

### Single Conversation

```bash
python main.py --conversation "I want to visit Barcelona in summer"
```

### Interactive Mode

```bash
python main.py --interactive
```

### Specify Profile

If you have multiple profiles, specify which one to use:

```bash
python main.py --profile-did "did:a2p:user:gaugid:YC4yUR9QW5vC"
```

## Example Output

```
============================================================
  🌴 Gaugid Travel Agent Example
============================================================

📡 Gaugid API: http://localhost:3001
🔥 Firebase Emulator: localhost:9099
☁️  Vertex AI: a2p-common / europe-southwest1

🔐 Authenticating test@example.com with Firebase Emulator...
✅ Authenticated as test@example.com

👤 User DID: did:a2p:user:gaugid:abc123xyz

🔌 Connecting to Gaugid...
✅ Connected to Gaugid

📝 Setting up travel profile...
✅ Profile created with 5 travel memories

🤖 Initializing Vertex AI (a2p-common / europe-southwest1)...
✅ Vertex AI initialized

📖 Loading user profile from Gaugid...
✅ Profile loaded
   Context: 342 chars

============================================================
🎬 Demo Mode - Sample Travel Conversations
============================================================

--- Conversation 1 ---

👤 User: I'm planning a trip to Japan in April. I've heard it's cherry blossom season!

🤖 Travel Advisor:
Japan in April is absolutely magical! Since you prefer boutique hotels, I'd recommend 
staying in a traditional ryokan in Kyoto for the authentic experience. The cherry 
blossoms (sakura) typically peak in late March to early April in Tokyo and mid-April 
in Kyoto.

Given your interest in cultural and historical destinations, here's what I'd suggest:
- Start in Tokyo (3-4 days): Visit Ueno Park and Shinjuku Gyoen for cherry blossoms
- Head to Kyoto (4-5 days): The Philosopher's Path is stunning during sakura season
- Consider a day trip to Nara to see the temples and friendly deer

Since you're vegetarian, I'd recommend trying shojin ryori (Buddhist temple cuisine) 
in Kyoto - it's entirely plant-based and deeply traditional.

  📝 Proposed: User is planning a trip to Japan in April during cherry blossom season...
     Status: pending
```

## How It Works

### 1. User Authentication

The script authenticates the user (not the agent) to list their profiles:

```python
user_token, firebase_uid = get_user_firebase_token(email, password)
profiles = await get_user_profiles(user_token)  # GET /api/profiles
```

### 2. Profile Selection

The script automatically selects a profile:
- If `--profile-did` is provided: Uses that specific profile
- Otherwise: Uses first "human" profile, or first profile if none

```python
selected_did = select_profile_did(profiles, args.profile_did)
```

**Important**: Users can have multiple profiles! The script lists them and lets you choose.

### 3. Agent Authentication

The agent authenticates separately (with agent DID as Firebase UID):

```python
auth_token = get_agent_token()  # Agent's Firebase token
```

### 4. Agent Registration

Agent registers with Gaugid:

```python
await register_agent(auth_token)  # POST /api/agents/register
```

### 5. Gaugid Connection

```python
storage = CloudStorage(
    api_url="http://localhost:3001",
    auth_token=auth_token,  # Agent's token
    agent_did="did:a2p:agent:gaugid:travel-advisor",
)

client = A2PClient(agent_did=agent_did, storage=storage)
```

### 6. Profile Access with Scopes

The agent requests specific scopes when accessing the profile:

```python
profile = await client.storage.get(
    user_did,
    scopes=["a2p:identity", "a2p:preferences", "a2p:episodic"]
)
```

**Note**: Without scopes, the protocol endpoint returns an empty profile!

### 7. Profile with Travel Preferences

If the profile doesn't exist, the example creates one with:
- Window seat preference
- Interest in cultural/historical destinations
- Vegetarian diet
- Languages: English, Spanish
- Boutique hotel preference

### 4. Vertex AI Personalization

```python
self.genai_client = genai.Client(
    vertexai=True,
    project="a2p-common",
    location="europe-southwest1",
)
```

### 5. Memory Proposals

After each conversation, the agent analyzes for new travel information and proposes memories via:

```python
await self.a2p_client.propose_memory(
    user_did=self.user_did,
    content="User planning Japan trip in April",
    category="a2p:interests",
    confidence=0.9,
)
```

## Review Proposals

After running the example, go to the Gaugid dashboard to review proposed memories:

**http://localhost:3000/proposals**

You can:
- ✅ Approve - Memory is added to profile
- ❌ Reject - Memory is discarded
- 📝 Edit - Modify before approving

## Configuration

Edit the `Config` class in `main.py`:

```python
@dataclass
class Config:
    # Gaugid API
    api_url: str = "http://localhost:3001"
    
    # Firebase Emulator
    firebase_emulator_host: str = "localhost:9099"
    firebase_project_id: str = "demo-a2p-cloud"
    
    # Test User
    user_email: str = "test@example.com"
    user_password: str = "test123456"
    
    # Vertex AI
    gcp_project: str = "a2p-common"
    gcp_location: str = "europe-southwest1"
    model: str = "gemini-3.0-flash"
```

## Troubleshooting

### "Agent not registered" (A2P011)

This means the agent registration API is not yet implemented.

**Solution**: Implement `POST /api/agents/register` endpoint in Gaugid.
See `a2p-cloud/.internal-docs/agent-registration-api.md` for details.

**Temporary workaround** (for testing only):
- Manually insert agent into database:
  ```sql
  INSERT INTO agents (did, name, description, verified, owner_email)
  VALUES ('did:a2p:agent:gaugid:travel-advisor', 'Travel Advisor', 'Travel agent', true, 'test@example.com');
  ```

### "Connection refused" to localhost:3001

```bash
# Check if Gaugid is running
cd ../a2p-cloud
docker-compose ps

# If not running, start it
docker-compose up -d
```

### "Firebase auth failed"

```bash
# Check Firebase Emulator
curl http://localhost:4000  # Should show emulator UI

# Check if emulator is running
docker-compose logs firebase-emulator
```

### "Vertex AI permission denied"

```bash
# Re-authenticate
gcloud auth application-default login

# Verify project access
gcloud projects describe a2p-common
```

### "No profiles found"

This means the user has no profiles in Gaugid.

**Solution**:
1. Go to http://localhost:3000
2. Log in with `test@example.com` / `test123456`
3. Create a profile in the dashboard
4. Run the example again

The example will automatically detect and use your profile.

### "Profile not found" (when using --profile-did)

The specified profile DID doesn't belong to this user.

**Solution**:
- List your profiles: The example shows all available profiles
- Use one of the DIDs shown, or omit `--profile-did` to auto-select

### "User not found"

The example auto-creates the user, but if it fails:
1. Go to http://localhost:4000 (Emulator UI)
2. Click Authentication
3. Add user: `test@example.com` / `test123456`

## Next Steps

- Review proposed memories in the [Dashboard](http://localhost:3000/proposals)
- Try different travel conversations
- Modify the agent's system prompt for different travel styles
- Add more initial memories in `setup_travel_profile()`
