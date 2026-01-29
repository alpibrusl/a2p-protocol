# Example 09: IoT Smart Home

This example demonstrates how IoT devices and smart home systems can use a2p profiles — showing that a2p works **beyond just AI agents**.

## What You'll Learn

- Using a2p profiles for smart home personalization
- Learning routines from behavior patterns
- Proposing automation preferences
- Multi-device profile sharing

## Scenario

A smart home hub ("HomeWise") uses a2p to:

1. **Read** user's home preferences from their a2p profile
2. **Personalize** device behavior based on preferences
3. **Learn** routines from daily patterns
4. **Propose** automation suggestions back to the user's profile

## Key Concept: Device Ecosystem Benefits

When the user approves the smart home's proposals:

- 🏠 **Other smart home systems** know preferred temperatures
- 🚗 **Connected car** can pre-heat home before arrival
- 📱 **Mobile apps** can show relevant controls at the right time
- 🤖 **AI assistants** can suggest routines verbally
- ⌚ **Wearables** can adjust based on sleep patterns

## Running

```bash
pnpm install
pnpm start
```

## Code Highlights

### IoT Hub as a2p Service

The smart home hub uses the same a2p protocol as AI agents:

```typescript
const smartHome = createAgentClient(
  { agentDid: 'did:a2p:service:local:iot-homewise' as DID },
  storage
);
```

### Learning Routines

```typescript
// After observing user patterns...
await smartHome.proposeMemory({
  userDid: profile.id,
  content: 'Usually arrives home around 6:30pm on weekdays',
  category: 'a2p:routines.schedule',
  confidence: 0.85,
  context: 'Based on 4 weeks of motion sensor and door lock data',
});
```

## License

EUPL-1.2
