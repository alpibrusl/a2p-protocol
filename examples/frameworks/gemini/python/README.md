# Google Gemini + a2p Integration

This example demonstrates how to integrate a2p user profiles with Google's Gemini API for personalized AI conversations.

## Prerequisites

```bash
pip install google-generativeai a2p-sdk a2p-gemini
```

Set your Google API key:

```bash
export GOOGLE_API_KEY="your-api-key"
```

## Running the Example

```bash
python chatbot.py
```

## What This Example Shows

1. **Loading User Context**: Fetch user preferences and memories from a2p profile
2. **Personalized System Instructions**: Inject context into Gemini's system instruction
3. **Conversation Memory**: Maintain chat history with personalization
4. **Memory Proposals**: Extract and propose new memories from conversations

## Key Concepts

### System Instructions with a2p Context

Gemini's system instruction is enhanced with user context:

```python
system_instruction = f"""You are a helpful assistant.

USER CONTEXT:
- Communication style: concise
- Occupation: Software Engineer
- Interests: Machine Learning, Rust
"""
```

### Model-Agnostic a2p Integration

The a2p profile works with any Gemini model:

- `gemini-3-pro` - Most capable, best for complex tasks
- `gemini-3-flash` - Fast responses, good for chat
- `gemini-3-nano` - Lightweight, edge deployment

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User's a2p    │     │   a2p Gemini    │     │  Google Gemini  │
│    Profile      │────▶│    Adapter      │────▶│      API        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Personalized   │
                        │   Responses     │
                        └─────────────────┘
```
