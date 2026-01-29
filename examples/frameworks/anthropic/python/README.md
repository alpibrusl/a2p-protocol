# Anthropic Claude + a2p Integration

This example demonstrates how to integrate a2p user profiles with Anthropic's Claude API for personalized AI conversations.

## Prerequisites

```bash
pip install anthropic a2p-sdk a2p-anthropic
```

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY="your-api-key"
```

## Running the Example

```bash
python chatbot.py
```

## What This Example Shows

1. **Loading User Context**: Fetch user preferences and memories from a2p profile
2. **Personalized System Prompts**: Inject context into Claude's system prompt
3. **Streaming Responses**: Real-time streaming with personalization
4. **Memory Proposals**: Extract and propose new memories from conversations

## Supported Models

| Model | Best For | Context Window |
|-------|----------|---------------|
| Claude Opus 4.5 | Complex analysis, multi-step tasks | 1M tokens |
| Claude Sonnet 4.5 | Agents, coding, balanced performance | 1M tokens |
| Claude Haiku 4.5 | Real-time, low latency | 1M tokens |

## Key Concepts

### System Prompt with a2p Context

```python
system = f"""You are a helpful assistant.

USER CONTEXT:
- Communication style: technical
- Occupation: ML Engineer
- Skills: Python, PyTorch, Kubernetes
- Interests: LLMs, Edge Computing
"""
```

### Extended Context Window

Claude's 1M token context is perfect for rich a2p profiles:

- Full user preferences
- Complete episodic memory
- Detailed professional background
- Extensive conversation history

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User's a2p    │     │   a2p Claude    │     │   Anthropic     │
│    Profile      │────▶│    Adapter      │────▶│    Claude API   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │  Personalized   │
                        │   Responses     │
                        └─────────────────┘
```
