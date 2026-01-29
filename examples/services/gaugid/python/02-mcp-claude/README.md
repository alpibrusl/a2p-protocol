# 02 - MCP Integration with Claude Desktop

Connect Claude Desktop to Gaugid via Model Context Protocol (MCP). This enables Claude to:

- Read user profiles and preferences
- Propose memories based on conversations
- Respect user consent policies

## What is MCP?

[Model Context Protocol](https://modelcontextprotocol.io) is an open standard for connecting AI assistants to external tools and data sources. Gaugid provides an MCP server that exposes user profiles to AI assistants.

## Setup

### Step 1: Install the MCP Server

```bash
npm install -g @gaugid/mcp-server
```

Or use npx (no installation needed):
```bash
npx @gaugid/mcp-server --help
```

### Step 2: Get Your Credentials

1. Log in to [Gaugid Dashboard](https://gaugid.com/dashboard)
2. Go to **Settings → API Keys**
3. Create a new agent credential
4. Copy your:
   - API URL (e.g., `https://api.gaugid.com`)
   - Auth Token
   - Agent DID

### Step 3: Configure Claude Desktop

Edit your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "gaugid": {
      "command": "npx",
      "args": ["-y", "@gaugid/mcp-server"],
      "env": {
        "GAUGID_API_URL": "https://api.gaugid.com",
        "GAUGID_AUTH_TOKEN": "your-firebase-token-here",
        "GAUGID_AGENT_DID": "did:a2p:agent:gaugid:claude-assistant"
      }
    }
  }
}
```

### Step 4: Restart Claude Desktop

Close and reopen Claude Desktop. You should see the Gaugid tools available.

## Available Tools

Once connected, Claude can use these tools:

### `get_profile`

Retrieve a user profile with scope filtering.

```
Claude, get my profile preferences
```

Claude will call:
```json
{
  "tool": "get_profile",
  "arguments": {
    "profile_did": "did:a2p:user:gaugid:abc123",
    "scopes": ["a2p:preferences"]
  }
}
```

### `propose_memory`

Propose a new memory based on conversation.

```
Claude, remember that I prefer dark mode
```

Claude will call:
```json
{
  "tool": "propose_memory",
  "arguments": {
    "profile_did": "did:a2p:user:gaugid:abc123",
    "content": "User prefers dark mode for UI interfaces",
    "category": "a2p:preferences",
    "confidence": 0.9,
    "context": "User explicitly stated preference"
  }
}
```

### `request_access`

Request access to specific profile scopes.

```json
{
  "tool": "request_access",
  "arguments": {
    "profile_did": "did:a2p:user:gaugid:abc123",
    "scopes": ["a2p:identity", "a2p:preferences"],
    "purpose_description": "To personalize responses"
  }
}
```

### `get_memories`

Retrieve memories organized by category.

```json
{
  "tool": "get_memories",
  "arguments": {
    "profile_did": "did:a2p:user:gaugid:abc123"
  }
}
```

### `get_proposal_status`

Check the status of a submitted proposal.

```json
{
  "tool": "get_proposal_status",
  "arguments": {
    "proposal_id": "prop_abc123"
  }
}
```

## Example Conversation

```
You: Hi Claude, can you see my preferences?

Claude: I'll check your profile preferences.
[Uses get_profile tool]
Based on your profile, I can see:
- You prefer morning meetings (9am-12pm)
- You like technical explanations
- Dark mode is enabled

You: Actually, I now prefer afternoon meetings after 2pm

Claude: I'll remember that preference change for you.
[Uses propose_memory tool]
I've proposed updating your meeting preference. You can review 
and approve this in your Gaugid dashboard.

You: Thanks! Did you save it?

Claude: The memory proposal has been submitted with ID prop_xyz789. 
Its current status is "pending" - it will be added to your profile 
once you approve it in the dashboard.
```

## Troubleshooting

### "MCP server not found"

Make sure you have Node.js 18+ installed:
```bash
node --version  # Should be v18 or higher
```

### "Authentication failed"

1. Check your token hasn't expired
2. Regenerate token in Gaugid dashboard
3. Ensure token is correctly copied (no extra spaces)

### "Profile not found"

1. Verify the user DID is correct
2. Ensure the profile exists in Gaugid dashboard
3. Check the agent has been granted access

### Tools not appearing in Claude

1. Restart Claude Desktop completely
2. Check the config file syntax (valid JSON)
3. Look for errors in Claude's developer console

## Security Notes

- **Tokens expire**: Regenerate tokens periodically
- **Consent respected**: Claude can only access data you've granted
- **Proposals reviewed**: All memory changes require your approval
- **Audit trail**: All access is logged in Gaugid dashboard

## Next Steps

- [03-gemini-agent](../03-gemini-agent/) - Build a custom AI agent
- [Gaugid Dashboard](https://gaugid.com/dashboard) - Manage profiles and proposals
