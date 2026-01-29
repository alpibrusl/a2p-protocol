# LangGraph + a2p Integration

This example shows how to integrate a2p user profiles with LangGraph for building personalized AI agents.

## Prerequisites

```bash
pip install langgraph langchain-openai a2p-sdk
```

## Environment Variables

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

## What This Example Does

1. **Loads user preferences** from an a2p profile
2. **Injects context** into the LangGraph agent's system prompt
3. **Proposes memories** when the agent learns something new about the user
4. **Persists conversation** with user context awareness

## Files

- `chatbot.py` - Simple personalized chatbot
- `react_agent.py` - ReAct agent with tools and user context
- `multi_turn.py` - Multi-turn conversation with memory proposals

## Running

```bash
python chatbot.py
```
