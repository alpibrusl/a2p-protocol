# Example 05: LangGraph Chatbot (Python)

This example shows how to integrate a2p with LangGraph for a personalized chatbot.

> ⚠️ This is a **simulated** example. For a real LangGraph integration with actual LLM calls, see `examples/frameworks/langgraph/python/`.

## What You'll Learn

- Integrating a2p with LangGraph concepts
- Loading user context for personalization
- Proposing memories from conversations
- Building the a2p adapter pattern

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 05-langgraph-chatbot/main.py
```

## Code Overview

```python
from a2p_langgraph import A2PMemorySaver, format_user_context_for_prompt

# Create memory saver
memory_saver = A2PMemorySaver(
    agent_did="did:a2p:agent:local:langgraph-chatbot",
    default_scopes=["a2p:preferences", "a2p:professional"],
)

# Load user context
user_context = await memory_saver.load_user_context(user_did)
prompt = format_user_context_for_prompt(user_context)

# After conversation, propose learned memories
await memory_saver.propose_memory(
    user_did,
    "Prefers Tokio runtime for Rust",
    category="a2p:preferences.development",
    confidence=0.85,
)
```

## Real Integration

For a working example with actual LLM calls:

```bash
cd examples/frameworks/langgraph/python
export OPENAI_API_KEY="sk-..."
python chatbot.py
```
