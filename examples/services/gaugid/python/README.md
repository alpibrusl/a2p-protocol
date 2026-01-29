# Gaugid Examples

**Gaugid** is the managed cloud service for a2p profiles. Instead of self-hosting profile storage, Gaugid provides:

- ✅ **Managed profile storage** - PostgreSQL + Redis, fully managed
- ✅ **Dashboard** - Web UI for users to manage profiles and review proposals
- ✅ **Protocol API** - Standard a2p protocol endpoints for agents
- ✅ **MCP Server** - Connect AI assistants via Model Context Protocol
- ✅ **Firebase Auth** - Secure authentication out of the box

## 💰 Why Gaugid? (5x Cost Savings)

| Deployment | Monthly Cost | Maintenance |
|------------|-------------|-------------|
| **Self-hosted** | ~$250-500/mo (Cloud SQL + Redis + Cloud Run + DevOps) | You maintain |
| **Gaugid** | ~$50-100/mo | We maintain |

**Gaugid handles**: Infrastructure, backups, scaling, security updates, monitoring.  
**You focus on**: Building your AI agent.

---

## 📁 Examples

| Example | Description | Use Case |
|---------|-------------|----------|
| `01-basic-connection/` | Connect to Gaugid, read profile, propose memory | Getting started |
| `02-mcp-claude/` | MCP integration for Claude Desktop | AI assistant integration |
| `03-gemini-agent/` | Google Gemini agent with Gaugid | Production agent |
| `04-multi-agent/` | Multiple agents sharing user context | Enterprise scenarios |
| `05-travel-agent/` | **Complete working example** with local Gaugid | Local development |

---

## 🚀 Quick Start

### Prerequisites

1. **Gaugid account** - Sign up at [gaugid.com](https://gaugid.com)
2. **API credentials** - Get from Gaugid dashboard
3. **User profile DID** - Create a profile in the dashboard

### Environment Variables

```bash
# Required
export GAUGID_API_URL="https://api.gaugid.com"
export GAUGID_AUTH_TOKEN="your-firebase-token"
export GAUGID_USER_DID="did:a2p:user:gaugid:your-profile-did"

# For agent examples
export GAUGID_AGENT_DID="did:a2p:agent:gaugid:your-agent-name"

# For AI examples
export GOOGLE_API_KEY="your-google-ai-key"  # or OPENAI_API_KEY
```

### Getting a Firebase Token

```python
# Python example using Firebase Admin SDK
import firebase_admin
from firebase_admin import auth

firebase_admin.initialize_app()
token = auth.create_custom_token("your-agent-uid").decode()
print(token)
```

Or use the Gaugid dashboard to generate a test token.

---

## 🔗 API Endpoints

Gaugid implements the standard a2p protocol endpoints:

### Protocol Endpoints (for agents)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/a2p/v1/profile/:did` | Get profile with scope filtering |
| `POST` | `/a2p/v1/profile/:did/access` | Request access to profile |
| `POST` | `/a2p/v1/profile/:did/memories/propose` | Propose new memory |

### Example: Read Profile

```bash
curl -X GET "https://api.gaugid.com/a2p/v1/profile/did:a2p:user:gaugid:abc123?scopes=a2p:identity,a2p:preferences" \
  -H "Authorization: Bearer $GAUGID_AUTH_TOKEN"
```

### Example: Propose Memory

```bash
curl -X POST "https://api.gaugid.com/a2p/v1/profile/did:a2p:user:gaugid:abc123/memories/propose" \
  -H "Authorization: Bearer $GAUGID_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "User prefers morning meetings",
    "category": "a2p:preferences",
    "confidence": 0.9,
    "context": "Expressed during scheduling conversation"
  }'
```

---

## 🤖 MCP Integration

Connect AI assistants (Claude, etc.) to Gaugid via Model Context Protocol.

### Claude Desktop Setup

1. Install the MCP server:
   ```bash
   npm install -g @gaugid/mcp-server
   ```

2. Configure Claude Desktop (`claude_desktop_config.json`):
   ```json
   {
     "mcpServers": {
       "gaugid": {
         "command": "npx",
         "args": ["-y", "@gaugid/mcp-server"],
         "env": {
           "GAUGID_API_URL": "https://api.gaugid.com",
           "GAUGID_AUTH_TOKEN": "your-token-here",
           "GAUGID_AGENT_DID": "did:a2p:agent:gaugid:claude-assistant"
         }
       }
     }
   }
   ```

3. Restart Claude Desktop

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `get_profile` | Retrieve user profile with scope filtering |
| `propose_memory` | Propose new memory for user review |
| `request_access` | Request access to specific scopes |
| `get_memories` | Get user's memories by category |
| `get_proposal_status` | Check status of a proposal |

---

## 📊 Comparison: Gaugid vs Self-Hosted

| Feature | Gaugid | Self-Hosted |
|---------|--------|-------------|
| **Setup Time** | 5 minutes | 2-4 hours |
| **Monthly Cost** | $50-100 | $250-500 |
| **Maintenance** | None | Ongoing |
| **Scaling** | Automatic | Manual |
| **Backups** | Included | DIY |
| **Dashboard** | Included | Build yourself |
| **MCP Server** | Included | DIY |
| **SLA** | 99.9% | Depends |

---

## 🔐 Security

- **Authentication**: Firebase Auth (industry standard)
- **Authorization**: Consent policies respected on every request
- **Encryption**: TLS 1.3 in transit, AES-256 at rest
- **Compliance**: GDPR-ready data handling
- **Audit**: Full access logging

---

## 📚 Resources

- [Gaugid Documentation](https://docs.gaugid.com)
- [a2p Protocol Specification](../../docs/docs/spec/index.md)
- [Dashboard Guide](https://docs.gaugid.com/dashboard)
- [API Reference](https://docs.gaugid.com/api)

---

## 🆘 Support

- **Email**: support@gaugid.com
- **Discord**: [Join our community](https://discord.gg/gaugid)
- **GitHub Issues**: [Report bugs](https://github.com/gaugid/gaugid/issues)
