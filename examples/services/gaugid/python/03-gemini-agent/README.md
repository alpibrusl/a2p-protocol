# 03 - Gemini Agent with Gaugid

A complete AI agent powered by Google Gemini with Gaugid profile storage. The agent:

- Loads user context from Gaugid
- Generates personalized responses using Gemini
- Automatically analyzes conversations for new information
- Proposes memories for user review

## Prerequisites

1. **Gaugid account** - [gaugid.com](https://gaugid.com)
2. **Google AI API key** - [Google AI Studio](https://aistudio.google.com/apikey)
3. **User profile** - Create in Gaugid dashboard

## Setup

```bash
# Install dependencies
pip install a2p-sdk google-genai httpx

# Set environment variables
export GAUGID_API_URL="https://api.gaugid.com"
export GAUGID_AUTH_TOKEN="your-firebase-token"
export GAUGID_USER_DID="did:a2p:user:gaugid:your-profile-did"
export GAUGID_AGENT_DID="did:a2p:agent:gaugid:gemini-agent"
export GOOGLE_API_KEY="your-google-ai-api-key"
```

## Run

```bash
python main.py
```

## Example Session

```
🤖 Gaugid + Gemini Agent
   API URL: https://api.gaugid.com
   Agent DID: did:a2p:agent:gaugid:gemini-agent

📖 Loading user profile...
✅ User context loaded

💬 Chat started (type 'quit' to exit)
   New information you share may be proposed as memories.

You: Hi! I'm working on a machine learning project

Agent: Hello! That's exciting - machine learning projects can be really rewarding. 
Based on your profile, I see you have experience with Python. Are you using any 
specific ML framework like TensorFlow, PyTorch, or scikit-learn?

  📝 Proposed memory: User is working on a machine learning project...

You: I'm using PyTorch for this one

Agent: Great choice! PyTorch is excellent for research and prototyping due to its 
dynamic computation graphs. What kind of model are you building?

  📝 Proposed memory: User prefers PyTorch for machine learning projects...

You: quit

👋 Goodbye!
```

## How It Works

### 1. User Context Loading

```python
context = await agent.load_user_context(user_did)
```

The agent loads the user's profile from Gaugid, including:
- Identity (name, preferences)
- Existing memories
- Settings

This context is used to personalize Gemini's responses.

### 2. Personalized Responses

```python
response = await agent.chat(user_message)
```

Each chat message is sent to Gemini with the user context, enabling personalized responses that reference what the agent knows about the user.

### 3. Memory Analysis

After each response, the agent analyzes the conversation for new information:

```python
asyncio.create_task(
    self._analyze_for_memories(user_message, assistant_response)
)
```

This runs asynchronously so it doesn't slow down the conversation.

### 4. Memory Proposals

When new information is detected, the agent proposes memories:

```python
await self.a2p_client.propose_memory(
    user_did=self.current_user_did,
    content=proposal["content"],
    category=proposal.get("category", "a2p:episodic"),
    confidence=proposal.get("confidence", 0.7),
)
```

The user can review and approve/reject these in the Gaugid dashboard.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────┐
│   User      │────▶│ Gemini Agent │────▶│ Gemini  │
│             │◀────│              │◀────│   AI    │
└─────────────┘     └──────┬───────┘     └─────────┘
                          │
                          │ Profile & Memories
                          ▼
                   ┌──────────────┐
                   │   Gaugid     │
                   │   Cloud      │
                   └──────────────┘
```

## Customization

### Different AI Models

Change the model in `chat()` and `_analyze_for_memories()`:

```python
model="gemini-2.0-flash"      # Fast, good for chat
model="gemini-2.0-pro"        # More capable, slower
model="gemini-1.5-flash"      # Previous generation
```

### Memory Categories

The agent can propose memories in these categories:
- `a2p:preferences` - User preferences
- `a2p:interests` - Hobbies, interests
- `a2p:professional` - Work-related information
- `a2p:episodic` - Events, experiences

### Confidence Thresholds

Adjust in `_analyze_for_memories()`:

```python
config=types.GenerateContentConfig(
    temperature=0.3,  # Lower = more consistent
)
```

## Production Considerations

1. **Token Management**: Implement token refresh for long-running agents
2. **Rate Limiting**: Add delays between API calls
3. **Error Handling**: Add retry logic for transient failures
4. **Logging**: Add proper logging for debugging
5. **Caching**: Cache user context to reduce API calls

## Next Steps

- [04-multi-agent](../04-multi-agent/) - Multiple agents sharing context
- [Gaugid API Docs](https://docs.gaugid.com/api) - Full API reference
