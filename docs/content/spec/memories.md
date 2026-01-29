# Memory Specification

**Protocol Version**: 0.1.0  
**Last Updated**: January 2026

This document specifies memory types, categories, proposals, and consolidation.

---

## Memory Types

The a2p protocol supports three memory types that organize memories by how they are stored, retrieved, and used:

### Episodic Memory

**Purpose**: Store specific events and interactions with temporal context.

**Characteristics**:
- Time-stamped events
- Contextual information
- Event-specific details
- Historical record of interactions

**Examples**:
- "User asked about Python async on 2026-01-15"
- "User completed onboarding on 2026-01-10"
- "User mentioned interest in Rust during conversation"

### Semantic Memory

**Purpose**: Store abstracted knowledge and facts about the user.

**Characteristics**:
- Abstracted from multiple episodes
- Timeless information
- General knowledge
- Factual statements

**Examples**:
- "User is a Python expert" (abstracted from many episodes)
- "User prefers technical explanations" (generalized preference)
- "User works in distributed systems" (factual knowledge)

### Procedural Memory

**Purpose**: Store behavioral patterns and how-to information.

**Characteristics**:
- Pattern-based
- Behavioral information
- Preference-driven
- "How the user does things"

**Examples**:
- "User prefers code examples with type hints"
- "User always asks for pros/cons before decisions"
- "User follows a morning routine: coffee, emails, coding"

### Memory Types and Categories

**Important**: Memory types (`episodic`, `semantic`, `procedural`) are **orthogonal** to memory categories (`a2p:preferences`, `a2p:professional`, etc.).

- **Memory Type**: Determines how the memory is stored, retrieved, and used
- **Memory Category**: Determines the domain/context of the memory

A memory can be:
- **Semantic** memory in the **preferences** category
- **Procedural** memory in the **professional** category
- **Episodic** memory in the **interests** category

**Example**:
```json
{
  "memories": {
    "a2p:semantic": [
      {
        "id": "mem_001",
        "content": "User prefers dark mode for coding",
        "category": "a2p:preferences.ui",
        "confidence": 0.9,
        "status": "approved"
      }
    ],
    "a2p:procedural": [
      {
        "id": "mem_002",
        "content": "User always asks for pros/cons before decisions",
        "category": "a2p:preferences.communication",
        "confidence": 0.85,
        "status": "approved"
      }
    ],
    "a2p:episodic": [
      {
        "id": "mem_003",
        "content": "User asked about Python async on 2026-01-15",
        "category": "a2p:interests.technology",
        "confidence": 0.8,
        "status": "approved"
      }
    ]
  }
}
```

---

## Memory Categories

### Standard Namespace (a2p:)

| Category | Description | Sensitivity |
|----------|-------------|-------------|
| `a2p:preferences` | User preferences | standard |
| `a2p:interests` | Topics, hobbies | standard |
| `a2p:professional` | Work context | standard |
| `a2p:health` | Health information | restricted |
| `a2p:financial` | Financial context | restricted |
| `a2p:relationships` | Social connections | sensitive |
| `a2p:episodic` | Episodic memories - specific events, interactions | standard |
| `a2p:semantic` | Semantic memories - general knowledge, facts, abstracted information | standard |
| `a2p:procedural` | Procedural memories - behavioral patterns, how-to information, preferences | standard |
| `a2p:context` | Current context | standard |

### Extension Namespace (ext:)

Third parties register custom categories:

```
ext:spotify:music.preferences
ext:github:coding.style
```

---

## Memory Structure

```json
{
  "id": "mem_abc123",
  "content": "Prefers TypeScript for new projects",
  "category": "a2p:professional.preferences",
  "source": {
    "type": "proposal",
    "agentDid": "did:a2p:agent:local:assistant",
    "sessionId": "sess_xyz",
    "timestamp": "2025-12-20T14:30:00Z"
  },
  "confidence": 0.88,
  "status": "approved",
  "sensitivity": "standard",
  "scope": ["work"],
  "metadata": {
    "approvedAt": "2025-12-20T14:35:00Z",
    "useCount": 5,
    "lastUsed": "2025-12-25T10:00:00Z"
  }
}
```

**Note**: The memory type (episodic, semantic, procedural) is determined by which array it's stored in (`a2p:episodic`, `a2p:semantic`, or `a2p:procedural`), not by a field in the memory object itself.

---

## Proposals

### Proposal Structure

```json
{
  "id": "prop_xyz789",
  "agentDid": "did:a2p:agent:local:assistant",
  "content": "User prefers detailed explanations",
  "category": "a2p:preferences.communication",
  "memory_type": "procedural",
  "confidence": 0.85,
  "context": "Based on follow-up questions in conversation",
  "status": "pending",
  "proposedAt": "2025-12-25T10:00:00Z",
  "expiresAt": "2025-01-01T10:00:00Z"
}
```

**Note**: The `memory_type` field specifies which type of memory is being proposed (`episodic`, `semantic`, or `procedural`). If not specified, defaults to `episodic` for backward compatibility.

### Proposal Status

| Status | Description |
|--------|-------------|
| `pending` | Awaiting review |
| `approved` | User approved |
| `rejected` | User rejected |
| `expired` | Not reviewed in time |
| `edited` | Approved with edits |

---

## Memory Type Classification

Agents need to classify memories into types when proposing them. Use this decision tree:

1. **Is it a specific event or interaction with a timestamp/context?**
   - YES → `episodic`
   - NO → Continue

2. **Is it abstracted/generalized knowledge derived from multiple episodes?**
   - YES → `semantic`
   - NO → Continue

3. **Is it a behavioral pattern, preference, or "how-to" information?**
   - YES → `procedural`
   - NO → Default to `episodic`

### Classification Examples

| Content | Type | Reasoning |
|---------|------|-----------|
| "User asked about Python async on 2026-01-15" | `episodic` | Specific event with timestamp |
| "User completed onboarding on 2026-01-10" | `episodic` | Specific event |
| "User is a Python expert" | `semantic` | Abstracted from many episodes |
| "User prefers technical explanations" | `semantic` | Generalized preference |
| "User works in distributed systems" | `semantic` | Factual knowledge |
| "User prefers code examples with type hints" | `procedural` | Behavioral pattern |
| "User always asks for pros/cons before decisions" | `procedural` | Behavioral pattern |
| "User follows morning routine: coffee, emails, coding" | `procedural` | How-to/pattern |

## Consolidation

Memories can be consolidated to reduce redundancy.

### Merge Example

```json
// Before
{ "content": "Likes jazz music" }
{ "content": "Enjoys electronic music" }

// After consolidation
{ 
  "content": "Music preferences: jazz, electronic",
  "consolidatedFrom": ["mem_1", "mem_2"]
}
```

## Memory Reclassification

Memories can be reclassified from one type to another:

**Reclassification Methods**:
1. **User Action**: User manually reclassifies in dashboard
2. **Agent Proposal**: Agent proposes reclassification (requires approval)
3. **Automatic Promotion**: System can promote episodic → semantic based on:
   - High confidence (>0.9)
   - High use count (>10)
   - Multiple similar episodes

---

## Next Steps

- [Consent](consent.md) — Access control
- [Profiles](profiles.md) — Profile structure
