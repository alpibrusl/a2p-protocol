# a2p Gemini Adapter

Integrate a2p user profiles with Google's Gemini API and Vertex AI using the latest `google-genai` SDK.

## Installation

```bash
pip install a2p-gemini google-genai
```

## Quick Start

### Gemini API

```python
from google import genai
from a2p_gemini import A2PGeminiAdapter

# Configure Gemini client
client = genai.Client(api_key="YOUR_GOOGLE_API_KEY")

# Create adapter
adapter = A2PGeminiAdapter(
    agent_did="did:a2p:agent:my-assistant",
    default_scopes=["a2p:preferences", "a2p:professional"],
)

# Load user context
context = await adapter.load_user_context("did:a2p:user:alice")

# Build personalized config
config = adapter.build_generation_config(
    base_instruction="You are a helpful coding assistant.",
    user_context=context,
)

# Generate with personalization
response = client.models.generate_content(
    model="gemini-2.5-pro",
    contents="Help me with my Python project",
    config=config,
)

print(response.text)
```

### Vertex AI

```python
from google import genai
from a2p_gemini import A2PVertexAIAdapter

# Configure Vertex AI client
client = genai.Client(
    vertexai=True,
    project="your-project-id",
    location="us-central1",
)

# Create Vertex AI adapter
adapter = A2PVertexAIAdapter(
    agent_did="did:a2p:agent:vertex-assistant",
    project_id="your-project-id",
    location="us-central1",
)

# Use same as Gemini API
context = await adapter.load_user_context("did:a2p:user:alice")
config = adapter.build_generation_config("You are an enterprise assistant.", context)
```

## Supported Models

- `gemini-2.5-pro` - Most capable, best for complex tasks
- `gemini-2.5-flash` - Fast responses, great for chat
- `gemini-2.0-pro` - Balanced performance
- Custom fine-tuned models on Vertex AI

## API Reference

### `A2PGeminiAdapter`

**Methods:**

- `load_user_context(user_did, scopes)` - Load user context
- `build_system_instruction(base, context)` - Build personalized instruction
- `build_generation_config(...)` - Create GenerateContentConfig
- `propose_memory(...)` - Propose memory to profile
- `extract_and_propose(user_did, chat_history)` - Auto-extract memories

### `A2PVertexAIAdapter`

Extends `A2PGeminiAdapter` with Vertex AI configuration.

## Related

- [a2p SDK Python](../sdk-python/)
- [Google GenAI SDK](https://ai.google.dev/gemini-api/docs)
