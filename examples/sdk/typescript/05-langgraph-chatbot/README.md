# Example 05: LangGraph Chatbot

This example shows how to build a LangGraph chatbot with a2p memory.

## What You'll Learn

- Integrating a2p with LangGraph
- Using user profiles to personalize responses
- Auto-extracting memories from conversations
- Building stateful chatbots with user context

## Prerequisites

```bash
npm install @langchain/langgraph @langchain/openai
```

## Run

```bash
pnpm install
pnpm start
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    LangGraph Application                │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐     ┌─────────────┐     ┌──────────────┐ │
│   │  User   │────▶│   Graph     │────▶│   Response   │ │
│   │  Input  │     │   Nodes     │     │              │ │
│   └─────────┘     └──────┬──────┘     └──────────────┘ │
│                          │                              │
│                    ┌─────▼─────┐                       │
│                    │   a2p     │                       │
│                    │ Memory    │                       │
│                    │  Saver    │                       │
│                    └─────┬─────┘                       │
│                          │                              │
│                    ┌─────▼─────┐                       │
│                    │   User    │                       │
│                    │  Profile  │                       │
│                    └───────────┘                       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
