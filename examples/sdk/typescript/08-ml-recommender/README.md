# Example 08: ML Recommender System

This example demonstrates how ML recommendation systems can use a2p profiles — showing that a2p works **beyond just AI agents**.

## What You'll Learn

- Using a2p profiles for recommendation personalization
- Proposing learned preferences from behavioral analysis
- Cross-service preference sharing benefits

## Scenario

A music streaming service ("Streamify") uses a2p to:

1. **Read** user's music preferences from their a2p profile
2. **Personalize** recommendations based on shared context
3. **Learn** from user behavior (skip rates, replays, etc.)
4. **Propose** newly learned preferences back to the user's profile

## Key Concept: Cross-Service Benefits

When the user approves the streaming service's proposals:

- 🎵 **Other music apps** know their instrumental preference
- 🤖 **AI assistants** can suggest focus music during work
- 📺 **Video services** can avoid recommending music videos
- 🏠 **Smart home** can auto-play lo-fi beats in the evening

This demonstrates the power of user-owned profiles: **one service learns, all services benefit** (with user consent).

## Running

```bash
pnpm install
pnpm start
```

## Code Highlights

### Service as "Agent"

The recommender system uses the same a2p protocol as AI agents:

```typescript
const recommender = createAgentClient(
  { agentDid: 'did:a2p:service:local:music-streamify' as DID },
  storage
);
```

### Behavioral Learning to Proposal

```typescript
// After observing user behavior...
await recommender.proposeMemory({
  userDid: profile.id,
  content: 'Strongly prefers instrumental music; usually skips vocals',
  category: 'a2p:preferences.content',
  confidence: 0.9,
  context: 'Based on 3 months of listening behavior analysis',
});
```

## License

EUPL-1.2
