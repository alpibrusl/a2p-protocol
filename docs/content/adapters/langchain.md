# LangChain Adapter

Use a2p profiles as memory in LangChain applications.

---

## Installation

=== "TypeScript"

    ```bash
    npm install @a2p/langchain
    ```

=== "Python"

    ```bash
    pip install a2p-langchain
    ```

---

## Quick Start

=== "TypeScript"

    ```typescript
    import { A2PLangChainMemory } from '@a2p/langchain';
    import { ChatOpenAI } from '@langchain/openai';
    import { ConversationChain } from 'langchain/chains';
    
    const memory = new A2PLangChainMemory({
      userDid: 'did:a2p:user:local:alice',
      agentDid: 'did:a2p:agent:local:my-agent',
      scopes: ['a2p:preferences', 'a2p:interests']
    });
    
    const chain = new ConversationChain({
      llm: new ChatOpenAI(),
      memory
    });
    
    const response = await chain.call({
      input: 'What should I work on today?'
    });
    ```

=== "Python"

    ```python
    from a2p_langchain import A2PLangChainMemory
    from langchain_openai import ChatOpenAI
    from langchain.chains import ConversationChain
    
    memory = A2PLangChainMemory(
        user_did="did:a2p:user:local:alice",
        agent_did="did:a2p:agent:local:my-agent",
        scopes=["a2p:preferences", "a2p:interests"]
    )
    
    chain = ConversationChain(
        llm=ChatOpenAI(),
        memory=memory
    )
    
    response = chain.invoke({
        "input": "What should I work on today?"
    })
    ```

---

## Configuration

| Option | Type | Description |
|--------|------|-------------|
| `userDid` | string | User's DID |
| `agentDid` | string | Your agent's DID |
| `scopes` | string[] | Scopes to request |
| `purpose` | Purpose | Access purpose (auto-generated if not provided) |
| `autoPropose` | boolean | Auto-propose memories from conversation |

---

## Memory Variables

The adapter provides these memory variables:

| Variable | Content |
|----------|---------|
| `a2p_profile` | User preferences and context |
| `a2p_memories` | Episodic memories |
| `history` | Conversation history |

---

## Proposing Memories

```typescript
// Enable auto-propose
const memory = new A2PLangChainMemory({
  // ...
  autoPropose: true,
  proposeThreshold: 0.8  // Minimum confidence
});

// Or manually
await memory.proposeMemory(
  'User prefers detailed explanations',
  { category: 'a2p:preferences.communication', confidence: 0.9 }
);
```

---

## Next Steps

- [OpenAI Adapter](openai.md)
- [LangGraph Adapter](langgraph.md)
- [Adapter Overview](overview.md)
