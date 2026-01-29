# Memory Proposals Guide

How to effectively propose memories from your AI agent.

---

## When to Propose

Good candidates for memory proposals:

| ✅ Propose | ❌ Don't Propose |
|-----------|-----------------|
| Stable preferences | Temporary context |
| Repeated patterns | One-time mentions |
| Explicit statements | Inferred guesses |
| High confidence | Low confidence |

---

## Confidence Levels

| Level | When to Use |
|-------|-------------|
| 0.9+ | User explicitly stated |
| 0.7-0.9 | Strong inference from multiple signals |
| 0.5-0.7 | Reasonable inference |
| <0.5 | Don't propose, too uncertain |

---

## Good Proposals

```typescript
// User said: "I always use TypeScript for my projects"
await client.proposeMemory({
  content: 'Uses TypeScript for all projects',
  category: 'a2p:professional.preferences',
  confidence: 0.95,  // Explicit statement
  context: 'User explicitly stated in conversation'
});
```

---

## Bad Proposals

```typescript
// User mentioned Python once in passing
await client.proposeMemory({
  content: 'Prefers Python',
  category: 'a2p:professional.preferences',
  confidence: 0.3,  // Too low, don't propose
  context: 'Mentioned once'
});
// ❌ Don't do this
```

---

## Categories Guide

| Category | Use For |
|----------|---------|
| `a2p:preferences.communication` | Response style |
| `a2p:preferences.language` | Language choice |
| `a2p:professional.skills` | Technical skills |
| `a2p:interests.topics` | Interest areas |
| `a2p:episodic` | General learned facts |

---

## Next Steps

- [Agent Integration](agent-integration.md) — Full integration guide
- [SDK Reference](../sdk/typescript.md) — API details
