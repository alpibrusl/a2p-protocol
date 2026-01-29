# TypeScript SDK Reference

Complete API reference for `@a2p/sdk`.

---

## Installation

```bash
npm install @a2p/sdk
```

---

## A2PClient

For agents accessing user profiles.

### Constructor

```typescript
const client = new A2PClient({
  agentDid: string,
  privateKey?: string,
  gatewayUrl?: string
});
```

### Methods

#### getProfile

```typescript
const profile = await client.getProfile({
  userDid: string,
  scopes: string[]
}): Promise<Profile>
```

#### requestAccess

```typescript
const result = await client.requestAccess({
  userDid: string,
  scopes: string[],
  purpose: Purpose
}): Promise<AccessResult>
```

#### proposeMemory

```typescript
const proposal = await client.proposeMemory({
  userDid: string,
  content: string,
  category: string,
  confidence: number,
  context?: string
}): Promise<Proposal>
```

---

## A2PUserClient

For users managing their profiles.

### Constructor

```typescript
const client = new A2PUserClient({
  storage?: StorageAdapter
});
```

### Methods

#### createProfile

```typescript
const profile = await client.createProfile({
  displayName: string,
  preferences?: Preferences
}): Promise<Profile>
```

#### getPendingProposals

```typescript
const proposals = await client.getPendingProposals(): Promise<Proposal[]>
```

#### reviewProposal

```typescript
await client.reviewProposal(
  proposalId: string,
  decision: { action: 'approve' | 'reject', editedContent?: string }
): Promise<void>
```

#### setPolicy

```typescript
await client.setPolicy({
  name: string,
  agentPattern: string,
  allow: string[],
  deny?: string[],
  permissions: Permission[]
}): Promise<Policy>
```

---

## Types

### Profile

```typescript
interface Profile {
  id: DID;
  version: string;
  profileType: 'human' | 'agent' | 'entity';
  identity: Identity;
  common?: CommonData;
  memories?: Record<string, any>;
  accessPolicies?: Policy[];
}
```

### Purpose

```typescript
interface Purpose {
  type: PurposeType;
  description: string;
  legalBasis: LegalBasis;
  retention?: string;
  automated?: {
    decisionMaking: boolean;
    profiling: boolean;
  };
}
```

### AccessResult

```typescript
interface AccessResult {
  granted: boolean;
  grantedScopes: string[];
  deniedScopes: string[];
  consentReceipt?: ConsentReceipt;
  reason?: string;
}
```

---

## Next Steps

- [Python SDK](python.md) — Python reference
- [Quickstart](../tutorials/quickstart-typescript.md) — Get started
