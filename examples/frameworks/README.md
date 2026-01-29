# Framework Integration Examples

**Real, working examples** that integrate a2p with popular AI/agent frameworks.

> ⚠️ These examples require API keys and external services. See each framework's README for setup instructions.

## 🔌 Supported Frameworks

### LLM Providers

| Provider | Package | Description | Status |
|----------|---------|-------------|--------|
| [Google Gemini](./gemini/python/) | `google-genai` | Gemini 3 + Vertex AI | ✅ Ready |
| [Anthropic Claude](./anthropic/python/) | `anthropic` | Claude Opus/Sonnet/Haiku 4.5 | ✅ Ready |
| [OpenAI](./openai/python/) | `openai` | GPT-4 + Assistants API | ✅ Ready |

### Agent Frameworks

| Framework | Package | Description | Status |
|-----------|---------|-------------|--------|
| [Google ADK](./google-adk/python/) | `google-adk` | Google Agent Development Kit | ✅ Ready (includes cloud storage example) |
| [LangGraph](./langgraph/python/) | `langgraph` | State machine agents | ✅ Ready |
| [CrewAI](./crewai/python/) | `crewai` | Multi-agent crews | ✅ Ready |
| [LangChain](./langchain/python/) | `langchain` | Chains and memory | ✅ Ready |
| [Agno](./agno/python/) | `agno` | Enterprise multi-agent | ✅ Ready |

### Protocol Integrations

| Protocol | Package | Description | Status |
|----------|---------|-------------|--------|
| [A2A Protocol](./a2a/python/) | `a2p-a2a` | Agent-to-Agent Protocol | ✅ Ready |
| [Solid Pods](./solid/python/) | `solid-python` | Decentralized storage backend | ⚠️ Planned |
| [OpenID Connect](./oidc/python/) | `authlib` | OIDC authentication → a2p profile | ⚠️ Planned |

## ☁️ Cloud Storage Support

All examples support both **local storage** (in-memory) and **cloud storage** (a2p-cloud service).

### Local Storage (Default)

Examples use `MemoryStorage` for local development and testing.

### Cloud Storage

Use `CloudStorage` to connect to a2p-cloud service:

```python
from a2p.storage.cloud import CloudStorage

storage = CloudStorage(
    api_url="https://api.a2p-cloud.example.com",
    auth_token="firebase-id-token",
    agent_did="did:a2p:agent:local:my-agent"
)
```

See [Google ADK cloud example](./google-adk/python/agent_cloud.py) for a complete implementation.

## 🚀 Quick Start

### 1. Set up environment

```bash
# Google (Gemini, ADK)
export GOOGLE_API_KEY="your-google-api-key"

# Anthropic (Claude)
export ANTHROPIC_API_KEY="your-anthropic-api-key"

# OpenAI (GPT-4, LangChain, LangGraph)
export OPENAI_API_KEY="your-openai-api-key"

# Optional: for CrewAI web search
export SERPER_API_KEY="your-serper-key"
```

### 2. Install dependencies

```bash
# Google Gemini
pip install google-genai a2p-sdk a2p-gemini

# Anthropic Claude
pip install anthropic a2p-sdk a2p-anthropic

# Google ADK
pip install google-adk google-genai a2p-sdk a2p-google-adk

# LangGraph
pip install langgraph langchain-openai a2p-sdk a2p-langgraph

# CrewAI
pip install crewai crewai-tools a2p-sdk a2p-crewai

# LangChain
pip install langchain langchain-openai a2p-sdk a2p-langchain

# OpenAI
pip install openai a2p-sdk a2p-openai

# Agno
pip install agno openai a2p-sdk a2p-agno

# A2A Protocol
pip install httpx a2p-sdk a2p-a2a
```

### 3. Run an example

```bash
cd gemini/python
python chatbot.py
```

## 🔑 Key Integration Pattern

All examples follow the same pattern:

```python
# 1. Load user context from a2p profile
user_context = await adapter.load_user_context(
    user_did=user_did,
    scopes=["a2p:preferences", "a2p:professional", "a2p:context"]
)

# 2. Inject context into the AI system
system_prompt = f"""You are helping a user.

USER CONTEXT:
{user_context}

Personalize your responses based on this context."""

# 3. After the conversation, propose learnings
await adapter.propose_memory(
    user_did=user_did,
    content="User is interested in X",
    category="a2p:interests",
    confidence=0.8,
)
```

## 📊 Framework Comparison

| Feature | Gemini | Claude | ADK | LangGraph | CrewAI |
|---------|--------|--------|-----|-----------|--------|
| Best for | Fast inference | Long context | Production agents | State machines | Agent teams |
| Context window | 2M tokens | 1M tokens | Varies | Varies | Varies |
| Multi-agent | Via ADK | Manual | ✅ Native | ✅ Graph | ✅ Crews |
| a2p integration | System instruction | System prompt | Instruction | State | Backstory |

## 🏗️ Architecture

### Single Agent (Gemini, Claude, OpenAI)

```
User Profile ──▶ Adapter ──▶ LLM ──▶ Personalized Response
```

### Multi-Agent (ADK, Agno, CrewAI, LangGraph)

```
User Profile ──▶ Coordinator ──▶ Agent 1 ──▶ Agent 2 ──▶ Agent 3
                     │              │           │           │
                     └── All agents share same user preferences ──┘
```

### Agent Chains (A2A Protocol)

```
User Profile ──▶ Agent A ──[A2A]──▶ Agent B ──[A2A]──▶ Agent C
                    │                   │                 │
                    └── Preferences flow through A2A messages ──┘
```

## 🤝 vs. Simulated Examples

The `sdk/python/` and `sdk/typescript/` folders contain **simulated examples** that:

- Don't require API keys
- Work offline
- Focus on a2p concepts

The `frameworks/` folder contains **real integrations** that:

- Require API keys
- Make actual LLM calls
- Show production patterns

**Start with simulated examples** to understand a2p, then move to framework examples for real implementations.

## 📚 Related Adapters

| Adapter | Package | Description |
|---------|---------|-------------|
| Gemini | `a2p-gemini` | Google Gemini + Vertex AI |
| Anthropic | `a2p-anthropic` | Claude Opus/Sonnet/Haiku |
| Google ADK | `a2p-google-adk` | Agent Development Kit |
| LangChain | `a2p-langchain` | Memory class for LangChain |
| LangGraph | `a2p-langgraph` | State management |
| OpenAI | `a2p-openai` | Chat Completions & Assistants |
| CrewAI | `a2p-crewai` | Agent backstory injection |
| Agno | `a2p-agno` | Multi-agent memory sync |
| A2A | `a2p-a2a` | Agent-to-Agent Protocol bridge |

## 📚 Learn More

- [a2p Protocol Specification](../../docs/docs/spec/index.md)
- [SDK Documentation](../../../packages/sdk/python/README.md)
- [Google GenAI SDK](https://ai.google.dev/gemini-api/docs)
- [Anthropic API](https://docs.anthropic.com/)
- [Google ADK](https://ai.google.dev/adk)
- [A2A Protocol](https://a2a-protocol.org/)
