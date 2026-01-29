# OpenAI Assistants + a2p Integration

This example shows how to integrate a2p user profiles with OpenAI Assistants API.

## Prerequisites

```bash
pip install openai a2p-sdk
```

## Environment Variables

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

## What This Example Does

1. **Creates an Assistant** with user context in system instructions
2. **Runs conversations** with personalization
3. **Extracts learnings** from conversations
4. **Proposes memories** back to the user's profile

## Files

- `assistant.py` - Personalized assistant with a2p integration
- `with_tools.py` - Assistant with function calling and a2p

## Running

```bash
python assistant.py
```
