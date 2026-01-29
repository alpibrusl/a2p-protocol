# LangChain + a2p Integration

This example shows how to integrate a2p user profiles with LangChain for building personalized AI applications.

## Prerequisites

```bash
pip install langchain langchain-openai a2p-sdk
```

## Environment Variables

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

## What This Example Does

1. **Creates a custom memory class** that integrates with a2p
2. **Loads user context** into conversation memory
3. **Builds chains** with personalized system prompts
4. **Proposes learnings** back to the user's profile

## Files

- `chain_with_memory.py` - Conversation chain with a2p memory
- `rag_personalized.py` - RAG pipeline with user preferences

## Running

```bash
python chain_with_memory.py
```
