# @a2p/gateway

Reference a2p gateway server implementation. Provides a fully functional HTTP API for the a2p protocol.

## Installation

```bash
npm install @a2p/gateway
# or
pnpm add @a2p/gateway
```

## Quick Start

### CLI Usage

```bash
# Start the gateway server
npx a2p-gateway serve

# With custom port
npx a2p-gateway serve --port 8080

# With custom host
npx a2p-gateway serve --host localhost --port 3000
```

### Programmatic Usage

```typescript
import { createGateway, MemoryStorageAdapter } from '@a2p/gateway';
import { serve } from '@hono/node-server';

const app = createGateway({
  storage: new MemoryStorageAdapter(),
  rateLimit: {
    requestsPerMinute: 100,
    burstSize: 20,
  },
  corsOrigins: ['https://myapp.com'],
});

serve({
  fetch: app.fetch,
  port: 3000,
});
```

## API Endpoints

### Health Check

```http
GET /health
```

Response:

```json
{
  "status": "ok",
  "version": "1.0.0"
}
```

### Get Profile

```http
GET /a2p/v1/profile/:did
Authorization: A2P-Signature did="...",sig="...",ts="..."
```

### Request Access

```http
POST /a2p/v1/profile/:did/access
Authorization: A2P-Signature did="...",sig="...",ts="..."
Content-Type: application/json

{
  "scopes": ["a2p:preferences", "a2p:interests"],
  "purpose": {
    "type": "personalization",
    "description": "Personalize responses based on user preferences",
    "legalBasis": "consent"
  }
}
```

### List Memories

```http
GET /a2p/v1/profile/:did/memories
Authorization: A2P-Signature did="...",sig="...",ts="..."
```

### Propose Memory

```http
POST /a2p/v1/profile/:did/memories/propose
Authorization: A2P-Signature did="...",sig="...",ts="..."
Content-Type: application/json

{
  "content": "User prefers concise responses",
  "category": "a2p:preferences.communication",
  "confidence": 0.85,
  "context": "Based on feedback during conversation"
}
```

### List Proposals

```http
GET /a2p/v1/profile/:did/proposals
Authorization: A2P-Signature did="...",sig="...",ts="..."
```

### Review Proposal

```http
POST /a2p/v1/profile/:did/proposals/:proposalId/review
Authorization: A2P-Signature did="...",sig="...",ts="..."
Content-Type: application/json

{
  "action": "approve",
  "editedContent": "User prefers brief, concise responses"
}
```

## Configuration

### GatewayConfig

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `port` | `number` | `3000` | Port to listen on |
| `host` | `string` | `'0.0.0.0'` | Host to bind to |
| `corsOrigins` | `string[]` | `['*']` | Allowed CORS origins |
| `rateLimit.requestsPerMinute` | `number` | `60` | Rate limit per minute |
| `rateLimit.burstSize` | `number` | `10` | Burst allowance |
| `storage` | `StorageAdapter` | `MemoryStorageAdapter` | Storage backend |

## Custom Storage

Implement the `StorageAdapter` interface for custom storage backends:

```typescript
import type { StorageAdapter, Profile, Proposal } from '@a2p/gateway';

class PostgresStorageAdapter implements StorageAdapter {
  async getProfile(did: string): Promise<Profile | null> {
    // Implement
  }

  async saveProfile(did: string, profile: Profile): Promise<void> {
    // Implement
  }

  async deleteProfile(did: string): Promise<void> {
    // Implement
  }

  async getProposals(userDid: string): Promise<Proposal[]> {
    // Implement
  }

  async saveProposal(proposal: Proposal): Promise<void> {
    // Implement
  }

  async updateProposalStatus(id: string, status: string): Promise<void> {
    // Implement
  }
}

const app = createGateway({
  storage: new PostgresStorageAdapter(connectionConfig),
});
```

## Error Codes

| Code | Name | HTTP Status |
|------|------|-------------|
| `A2P001` | Unauthorized | 401 |
| `A2P003` | Not Found | 404 |
| `A2P005` | Rate Limited | 429 |
| `A2P006` | Invalid Request | 400 |
| `A2P007` | Timestamp Invalid | 401 |

## Development

```bash
# Clone the repo
git clone https://github.com/a2p-protocol/a2p.git
cd a2p/packages/tools/gateway/typescript

# Install dependencies
pnpm install

# Run in dev mode
pnpm dev

# Build
pnpm build

# Test
pnpm test
```

## License

EUPL-1.2
