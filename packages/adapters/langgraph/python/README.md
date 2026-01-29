# a2p LangGraph Adapter (Python)

Integrate a2p user profiles with LangGraph for stateful, personalized agents.

## Installation

```bash
pip install a2p-langgraph
```

## Quick Start

```python
from a2p_langgraph import A2PMemorySaver, format_user_context_for_prompt
from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI

# Create memory saver
memory_saver = A2PMemorySaver(
    agent_did="did:a2p:agent:my-agent",
    default_scopes=["a2p:preferences", "a2p:professional"],
)

# Load user context
user_context = await memory_saver.load_user_context("did:a2p:user:alice")

# Use in graph node
def chatbot_node(state):
    system_prompt = f"""You are a helpful assistant.

User Context:
{state['user_context']}
"""
    # ... generate response with LLM
    return {"messages": [...]}

# Build graph
graph = StateGraph(...)
graph.add_node("chatbot", chatbot_node)
```

## Features

### Load User Context

```python
# Load and format user context
context = await memory_saver.load_user_context(
    user_did="did:a2p:user:alice",
    scopes=["a2p:preferences", "a2p:professional", "a2p:interests"]
)

# Access different parts
print(context["context_string"])  # Formatted string for prompts
print(context["preferences"])      # Dict of preferences
print(context["memories"])         # List of memory strings
```

### Inject into State

```python
from a2p_langgraph import inject_context_into_state

# Add user context to graph state
initial_state = {"messages": []}
state_with_context = inject_context_into_state(initial_state, context)

# state_with_context now has:
# - user_context: formatted string
# - user_preferences: dict
# - user_memories: list
```

### Propose Memories

```python
# Propose a learned memory
await memory_saver.propose_memory(
    user_did="did:a2p:user:alice",
    content="Prefers Tokio runtime for Rust async",
    category="a2p:preferences.development",
    confidence=0.85,
    context="User explicitly stated during conversation",
)
```

### Auto-Extract from Messages

```python
# Extract memories from conversation automatically
messages = [
    {"role": "user", "content": "I work as a data scientist"},
    {"role": "assistant", "content": "Great! How can I help?"},
    {"role": "user", "content": "I prefer Python over R"},
]

proposals = await memory_saver.extract_and_propose(
    user_did="did:a2p:user:alice",
    messages=messages,
)
# Automatically proposes memories based on patterns
```

## Full Example

```python
from typing import TypedDict, Annotated
from operator import add

from langgraph.graph import StateGraph, START, END
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from a2p_langgraph import A2PMemorySaver, format_user_context_for_prompt


class ChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add]
    user_context: str


async def main():
    # Setup
    memory_saver = A2PMemorySaver(
        agent_did="did:a2p:agent:chatbot",
        default_scopes=["a2p:preferences", "a2p:professional"],
    )
    
    llm = ChatOpenAI(model="gpt-4")
    
    # Load user context
    context = await memory_saver.load_user_context("did:a2p:user:alice")
    
    # Define chatbot node
    def chatbot(state: ChatState):
        system = SystemMessage(content=f"User context:\n{state['user_context']}")
        response = llm.invoke([system] + state["messages"])
        return {"messages": [response]}
    
    # Build graph
    graph = StateGraph(ChatState)
    graph.add_node("chatbot", chatbot)
    graph.add_edge(START, "chatbot")
    graph.add_edge("chatbot", END)
    
    app = graph.compile()
    
    # Run with user context
    result = app.invoke({
        "messages": [HumanMessage(content="Help me with my project")],
        "user_context": format_user_context_for_prompt(context),
    })
    
    print(result["messages"][-1].content)


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
```

## API Reference

### `A2PMemorySaver`

Main class for a2p integration with LangGraph.

**Parameters:**

- `agent_did` (str): The agent's DID
- `default_scopes` (List[str]): Default scopes to request
- `auto_propose` (bool): Enable auto-proposal (default: True)
- `storage`: Optional storage backend

**Methods:**

- `load_user_context(user_did, scopes)` - Load user context
- `propose_memory(user_did, content, category, confidence, context)` - Propose memory
- `extract_and_propose(user_did, messages, context)` - Auto-extract and propose
- `get_loaded_profile(user_did)` - Get cached profile
- `clear_cache()` - Clear profile cache

### Helper Functions

- `format_user_context_for_prompt(context)` - Format context for prompts
- `inject_context_into_state(state, context)` - Add context to graph state
- `create_memory_saver(...)` - Factory function

## Related

- [a2p SDK Python](../sdk-python/)
- [LangChain Adapter](../adapter-langchain-python/)
- [Framework Examples](../../../examples/frameworks/langgraph/python/)
