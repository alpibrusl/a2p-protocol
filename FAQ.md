# Frequently Asked Questions

## General

### What is a2p?

a2p (Agent 2 Profile) is an open protocol that enables user-owned profiles for AI agents. Instead of each AI agent maintaining its own siloed memory about you, a2p lets you own a unified profile that you selectively share with agents.

### Why should I use a2p?

- **User Control**: You own your profile data
- **Portability**: One profile works with any a2p-compatible agent
- **Transparency**: See exactly what's stored about you
- **Granular Consent**: Share only what you want, with whom you want
- **Compliance**: Built with GDPR and EU AI Act compliance in mind

### What license is a2p under?

a2p is licensed under the **EUPL-1.2** (European Union Public Licence 1.2). This license is designed for EU legal frameworks and ensures compatibility with EU regulations.

### What version is currently available?

We're currently at **0.1.0-alpha**. This is an alpha release, meaning the API may change before the stable 1.0.0 release.

## SDK Usage

### Which SDK should I use?

- **TypeScript SDK**: If you're building with Node.js, TypeScript, or JavaScript
- **Python SDK**: If you're building with Python

Both SDKs provide the same core functionality, so choose based on your technology stack.

### How do I install the SDK?

**TypeScript:**
```bash
npm install @a2p/sdk
# or
pnpm add @a2p/sdk
```

**Python:**
```bash
pip install a2p-sdk
```

### How do I create a profile?

**TypeScript:**
```typescript
import { createUserClient } from '@a2p/sdk';

const client = createUserClient();
const profile = await client.createProfile({
  displayName: 'Alice'
});
```

**Python:**
```python
from a2p.client import create_user_client

client = create_user_client()
profile = await client.create_profile(display_name="Alice")
```

### How do I add memories to my profile?

Memories are added through proposals. Agents propose memories, and you approve or reject them:

```typescript
// Agent proposes a memory
const proposal = await agentClient.proposeMemory({
  userDid: profile.id,
  content: 'User prefers email communication',
  category: 'a2p:preferences.communication'
});

// User approves it
await userClient.approveProposal(proposal.proposalId);
```

## Protocol

### What is a DID?

DID stands for Decentralized Identifier. In a2p, all entities (users, agents, organizations) are identified by DIDs in the format: `did:a2p:<type>:<namespace>:<identifier>`

Example: `did:a2p:user:gaugid:alice`

### How does consent work?

a2p uses consent policies that define:
- Which agents can access your profile
- What scopes they can access
- Under what conditions

You create policies that match agent patterns and specify permissions:

```typescript
addPolicy(profile, {
  agentPattern: 'did:a2p:agent:*',
  permissions: ['read_scoped', 'propose'],
  allow: ['a2p:preferences.*']
});
```

### What are scopes?

Scopes define what parts of your profile an agent can access. Examples:
- `a2p:preferences.*` - All preferences
- `a2p:preferences.communication` - Communication preferences only
- `a2p:health.*` - Health-related data
- `a2p:identity.*` - Identity information

## Migration

### Can I migrate from another system?

Yes! You can export your profile as JSON and import it into a2p:

```typescript
// Export
const json = client.exportProfile();

// Import
const newClient = createUserClient();
await newClient.importProfile(json);
```

### How do I migrate from version X to Y?

Check the [CHANGELOG.md](CHANGELOG.md) for migration guides. For breaking changes, we'll provide detailed migration instructions.

## Compliance

### Is a2p GDPR compliant?

a2p is designed with GDPR compliance in mind. We provide:
- Consent management
- Data portability (export/import)
- Right to deletion
- Purpose limitation
- Documentation for DPIA (Data Protection Impact Assessment)

However, compliance also depends on how you implement and use a2p. See our [GDPR documentation](docs/content/legal/gdpr.md) for details.

### Does a2p comply with the EU AI Act?

a2p includes features to help with EU AI Act compliance:
- Transparency obligations
- Human oversight mechanisms
- Record-keeping capabilities
- Risk classification support

See our [EU AI Act documentation](docs/content/legal/ai-act.md) for details.

## Technical

### What storage backends are supported?

Currently:
- **MemoryStorage**: In-memory storage (for development/testing)
- **CloudStorage**: HTTP-based storage (for production services like Gaugid)
- **SolidStorage**: Solid Pod storage (for decentralized, user-owned storage)

Additional storage backends can be implemented by creating a `ProfileStorage` implementation.

### Can I use a2p offline?

The protocol supports offline usage with local storage. However, agent interactions typically require network connectivity for profile access.

### How do I handle errors?

All SDK methods throw errors that you can catch:

```typescript
try {
  const profile = await client.getProfile(userDid);
} catch (error) {
  if (error.code === 'A2P001') {
    // Authentication error
  } else if (error.code === 'A2P006') {
    // Validation error
  }
}
```

See the SDK documentation for error codes.

## Contributing

### How can I contribute?

See our [Contributing Guide](CONTRIBUTING.md) for details. We welcome:
- Bug reports
- Feature requests
- Code contributions
- Documentation improvements
- Examples and tutorials

### Do I need to sign a CLA?

No, by contributing you agree that your contributions will be licensed under EUPL-1.2.

### How do I report a security vulnerability?

**Do NOT** open a public issue. Instead, email **security@a2p.protocol** with details. See our [Security Policy](.github/SECURITY.md) for more information.

## Community

### Where can I get help?

- 📖 [Documentation](https://a2p-protocol.github.io/a2p/)
- 💬 [Discord](https://discord.gg/a2p) (if available)
- 🐛 [GitHub Issues](https://github.com/a2p-protocol/a2p/issues)
- 📧 Email: support@a2p.protocol

### Who is using a2p?

See our [ADOPTERS.md](ADOPTERS.md) page. We'd love to feature you there!

### How do I stay updated?

- Watch the GitHub repository for releases
- Check the [CHANGELOG.md](CHANGELOG.md) for updates
- Follow our announcements

## License Questions

### Can I use a2p in commercial projects?

Yes! EUPL-1.2 allows commercial use. However, please review the license terms to understand your obligations.

### Can I modify a2p?

Yes, EUPL-1.2 allows modification. Modified versions must also be licensed under EUPL-1.2.

### Do I need to attribute a2p?

Yes, you should include the license notice and attribution. See the LICENSE file for details.

---

**Still have questions?** [Open an issue](https://github.com/a2p-protocol/a2p/issues/new?template=question.md) or email support@a2p.protocol
