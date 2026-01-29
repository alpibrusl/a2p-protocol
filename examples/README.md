# a2p Protocol Examples

This folder contains practical examples demonstrating how to use the a2p protocol in various scenarios.

## 📁 Structure

```
examples/
├── sdk/
│   ├── typescript/      # TypeScript examples (simulated, no API keys needed)
│   │   ├── package.json # Shared dependencies
│   │   ├── 01-basic-profile/
│   │   └── ...
│   └── python/          # Python examples (simulated, no API keys needed)
│       ├── requirements.txt # Shared dependencies
│       ├── 01-basic-profile/
│       └── ...
├── frameworks/          # 🔥 REAL framework integrations (requires API keys)
│   ├── langchain/
│   │   └── python/      # LangChain + a2p
│   ├── langgraph/
│   │   └── python/      # LangGraph + a2p
│   ├── openai/
│   │   └── python/      # OpenAI Assistants + a2p
│   ├── crewai/
│   │   └── python/      # CrewAI + a2p
│   └── ... (other frameworks)
└── services/
    └── gaugid/
        └── python/      # ⭐ GAUGID CLOUD (managed service, 5x cost savings)
            ├── 01-basic-connection/  # Connect to Gaugid
            ├── 02-mcp-claude/        # MCP integration for Claude
            ├── 03-gemini-agent/      # AI agent with Gemini
            └── ... (other examples)
```

## 🎯 Which Examples Should I Use?

| Goal | Use |
|------|-----|
| **Production with managed storage** | `services/gaugid/python/` ⭐ (recommended, 5x cheaper) |
| **Learn a2p concepts** | `sdk/python/` or `sdk/typescript/` (simulated, no API keys) |
| **Build with LangGraph** | `frameworks/langgraph/python/` |
| **Build with CrewAI** | `frameworks/crewai/python/` |
| **Build with LangChain** | `frameworks/langchain/python/` |
| **Build with OpenAI** | `frameworks/openai/python/` |

## ⭐ Gaugid Cloud (Recommended for Production)

**Gaugid** is the managed cloud service for a2p profiles. Instead of self-hosting, get:

- ✅ Managed profile storage (PostgreSQL + Redis)
- ✅ Dashboard for users to manage profiles
- ✅ MCP server for AI assistants (Claude, etc.)
- ✅ 5x cost savings vs self-hosted

### Quick Start with Gaugid

```bash
# 1. Sign up at gaugid.com and create a profile

# 2. Install dependencies
pip install a2p-sdk google-genai httpx

# 3. Set credentials
export GAUGID_API_URL="https://api.gaugid.com"
export GAUGID_AUTH_TOKEN="your-token"
export GAUGID_USER_DID="did:a2p:user:local:your-profile"

# 4. Run example
cd examples/services/gaugid/python/01-basic-connection
python main.py
```

See [gaugid/README.md](./services/gaugid/python/README.md) for complete setup guide.

---

## 🚀 Quick Start

### TypeScript

```bash
cd examples/sdk/typescript
npm install
npm run 01:basic-profile
```

### Python

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 01-basic-profile/main.py
```

## 📋 Examples Overview

| # | Example | Description | Use Case |
|---|---------|-------------|----------|
| 01 | **Basic Profile** | Create and manage a user profile | Getting started |
| 02 | **Agent Integration** | Connect an AI agent to user profiles | AI assistants |
| 03 | **Memory Proposals** | Agent proposes, user approves memories | Learning from interactions |
| 04 | **Consent Policies** | Configure fine-grained access control | Privacy management |
| 05 | **LangGraph Chatbot** | Personalized chatbot with LangGraph | Framework integration |
| 06 | **CrewAI Research** | Multi-agent research crew | Multi-agent systems |
| 07 | **Multi-Profile** | Work/Personal sub-profiles | Context separation |
| 08 | **ML Recommender** | Music recommendation with a2p | ML personalization |
| 09 | **IoT Smart Home** | Smart home with learned routines | IoT devices |
| 10 | **Entity Hierarchy** | Organization policies | Enterprise use |
| 11 | **Accessibility Profile** | Digital + physical accessibility | Inclusive design |
| 12 | **Child Profile** | Parental controls & guardianship | Family accounts |

## 📖 Example Details

### 01 - Basic Profile

Learn the fundamentals of creating a user profile, adding memories, and exporting data.

### 02 - Agent Integration

See how AI agents can request access to user profiles with proper consent.

### 03 - Memory Proposals

Demonstrates the propose → review → approve/reject workflow for agent-learned information.

### 04 - Consent Policies

Configure different access levels for different agents using pattern matching and conditions.

### 05 - LangGraph Chatbot

Integrate a2p with LangGraph to build a personalized chatbot that remembers user preferences.

### 06 - CrewAI Research

Use a2p with CrewAI for multi-agent research crews with shared user context.

### 07 - Multi-Profile

Create sub-profiles for different contexts (work vs personal) with separate data sharing rules.

### 08 - ML Recommender

Shows how ML recommendation systems (not just AI agents) can use and contribute to a2p profiles.

### 09 - IoT Smart Home

Demonstrates IoT device integration, pattern learning, and cross-device profile sharing.

### 10 - Entity Hierarchy

Enterprise example showing organizations, departments, and teams with inherited policies.

### 11 - Accessibility Profile

Comprehensive accessibility preferences for both digital (UI adaptation) and physical (allergies, mobility) needs.

### 12 - Child Profile

Implement parental controls, content safety, screen time limits, and guardian management.

---

## 🔥 Framework Integration Examples

**Real, working examples** with actual LLM calls. Requires API keys.

| Framework | File | Description |
|-----------|------|-------------|
| **LangGraph** | `frameworks/langgraph/python/chatbot.py` | Personalized chatbot with state management |
| **CrewAI** | `frameworks/crewai/python/research_crew.py` | Multi-agent research crew |
| **LangChain** | `frameworks/langchain/python/chain_with_memory.py` | Conversation chain with a2p memory |
| **OpenAI** | `frameworks/openai/python/assistant.py` | Assistants API integration |

### Quick Start (Framework Examples)

```bash
# Set your API key
export OPENAI_API_KEY="sk-your-key-here"

# Install dependencies
pip install langgraph langchain-openai a2p-sdk

# Run
cd frameworks/langgraph/python
python chatbot.py
```

See [frameworks/README.md](./frameworks/README.md) for detailed setup instructions.

---

## ⭐ Gaugid Cloud Examples

**Production-ready examples** using the Gaugid managed service.

| Example | Description | Key Features |
|---------|-------------|--------------|
| **01-basic-connection** | Connect to Gaugid, read profile, propose memory | Getting started |
| **02-mcp-claude** | Claude Desktop integration via MCP | AI assistant integration |
| **03-gemini-agent** | Google Gemini agent with personalization | Full AI agent |
| **04-multi-agent** | Multiple agents sharing user context | Enterprise patterns |
| **05-travel-agent** | 🔥 **Complete working example** with local Gaugid + Vertex AI | Local development |

### Why Gaugid?

| | Self-Hosted | Gaugid |
|---|---|---|
| **Monthly Cost** | $250-500 | $50-100 |
| **Setup Time** | Hours | Minutes |
| **Maintenance** | Ongoing | None |
| **Dashboard** | Build yourself | Included |
| **MCP Server** | DIY | Included |

See [gaugid/README.md](./services/gaugid/python/README.md) for setup instructions.

---

## 🔗 Related Resources

- [SDK Documentation](../packages/sdk/typescript/README.md)
- [Schema Reference](../schemas/README.md)
- [Protocol Specification](../docs/docs/spec/index.md)
- [Web Documentation](https://alpibrusl.github.io/a2p-protocol)

## 📝 Contributing

Want to add an example? See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines.

Each example should:

1. Have implementations in both TypeScript and Python
2. Include a README explaining the use case
3. Be self-contained and runnable
4. Demonstrate a specific a2p feature or integration pattern
