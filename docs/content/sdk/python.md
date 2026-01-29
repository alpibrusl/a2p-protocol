# Python SDK Reference

Complete API reference for `a2p-sdk`.

---

## Installation

```bash
pip install a2p-sdk
```

---

## A2PClient

For agents accessing user profiles.

### Constructor

```python
client = A2PClient(
    agent_did: str,
    private_key: Optional[str] = None,
    gateway_url: Optional[str] = None
)
```

### Methods

#### get_profile

```python
profile = await client.get_profile(
    user_did: str,
    scopes: List[str]
) -> Profile
```

#### request_access

```python
result = await client.request_access(
    user_did: str,
    scopes: List[str],
    purpose: Purpose
) -> AccessResult
```

#### propose_memory

```python
proposal = await client.propose_memory(
    user_did: str,
    content: str,
    category: str,
    confidence: float,
    context: Optional[str] = None
) -> Proposal
```

---

## A2PUserClient

For users managing their profiles.

### Constructor

```python
client = A2PUserClient(
    storage: Optional[StorageAdapter] = None
)
```

### Methods

#### create_profile

```python
profile = await client.create_profile(
    display_name: str,
    preferences: Optional[Dict] = None
) -> Profile
```

#### get_pending_proposals

```python
proposals = await client.get_pending_proposals() -> List[Proposal]
```

#### review_proposal

```python
await client.review_proposal(
    proposal_id: str,
    action: Literal["approve", "reject"],
    edited_content: Optional[str] = None
)
```

#### set_policy

```python
await client.set_policy(
    name: str,
    agent_pattern: str,
    allow: List[str],
    deny: Optional[List[str]] = None,
    permissions: List[str]
) -> Policy
```

---

## Types

### Profile

```python
@dataclass
class Profile:
    id: str
    version: str
    profile_type: Literal["human", "agent", "entity"]
    identity: Identity
    common: Optional[CommonData] = None
    memories: Optional[Dict[str, Any]] = None
    access_policies: Optional[List[Policy]] = None
```

### Purpose

```python
@dataclass
class Purpose:
    type: str
    description: str
    legal_basis: str
    retention: Optional[str] = None
    automated: Optional[AutomatedDecision] = None
```

---

## Next Steps

- [TypeScript SDK](typescript.md) — TypeScript reference
- [Quickstart](../tutorials/quickstart-python.md) — Get started
