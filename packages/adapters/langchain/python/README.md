# a2p LangChain Adapter (Python)

Integrate a2p user profiles with LangChain for personalized AI applications.

## Installation

```bash
pip install a2p-langchain
```

## Quick Start

```python
from a2p_langchain import A2PMemory, create_a2p_memory
from langchain_openai import ChatOpenAI
from langchain.chains import ConversationChain

# Create a2p-backed memory
memory = create_a2p_memory(
    agent_did="did:a2p:agent:my-assistant",
    user_did="did:a2p:user:alice",
    default_scopes=["a2p:preferences", "a2p:professional"],
)

# Load user context from profile
await memory.load_user_context()

# Use with LangChain
llm = ChatOpenAI(model="gpt-4")
chain = ConversationChain(llm=llm, memory=memory)

# The chain now has access to user preferences!
response = chain.run("Help me with my project")
```

## Features

### Load User Context

```python
# Load specific scopes
context = await memory.load_user_context(
    scopes=["a2p:preferences", "a2p:professional", "a2p:interests"]
)
print(context)
# - Communication style: concise
# - Occupation: Software Engineer
# - Skills: Python, TypeScript
# - Interests: Machine Learning, Distributed Systems
```

### Propose Memories

```python
# Propose a learned memory
await memory.propose_memory(
    content="User prefers code examples in Python",
    category="a2p:preferences.development",
    confidence=0.85,
    context="User asked for Python-specific examples",
)
```

### Auto-Extract Memories

```python
# Use conversation memory with auto-extraction
memory = create_a2p_memory(
    agent_did="did:a2p:agent:my-assistant",
    user_did="did:a2p:user:alice",
    auto_extract=True,  # Automatically propose memories from patterns
)

# When user says "I work as a data scientist", it auto-proposes
await memory.save_context_async(
    {"input": "I work as a data scientist"},
    {"output": "Great! How can I help with your data science work?"}
)
```

### Custom Prompt Integration

```python
from a2p_langchain import format_context_for_prompt
from langchain_core.prompts import ChatPromptTemplate

# Get formatted context
user_context = memory.get_user_context()
formatted = format_context_for_prompt(user_context)

# Use in prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", f"You are a helpful assistant.\n\n{formatted}"),
    ("human", "{input}"),
])
```

## API Reference

### `A2PMemory`

LangChain Memory class backed by a2p profiles.

**Parameters:**

- `agent_did` (str): The agent's DID
- `user_did` (str): The user's DID  
- `default_scopes` (List[str]): Default scopes to request

**Methods:**

- `load_user_context(scopes)` - Load user context from profile
- `propose_memory(content, category, confidence, context)` - Propose a memory
- `get_user_context()` - Get loaded context
- `get_profile()` - Get loaded profile

### `A2PConversationMemory`

Extended memory with automatic memory extraction.

**Additional Parameters:**

- `auto_extract` (bool): Enable auto-extraction (default: True)

**Additional Methods:**

- `save_context_async(inputs, outputs)` - Save and optionally extract

### `create_a2p_memory()`

Factory function to create memory instances.

## Related

- [a2p SDK Python](../sdk-python/)
- [LangGraph Adapter](../adapter-langgraph-python/)
- [Framework Examples](../../../examples/frameworks/langchain/python/)
