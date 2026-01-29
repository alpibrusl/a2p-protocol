# Contributing to a2p

We welcome contributions to the a2p protocol! Here's how to get involved.

---

## Ways to Contribute

| Type | Description |
|------|-------------|
| 🐛 **Bug Reports** | Report issues you find |
| 💡 **Feature Requests** | Suggest new features |
| 📖 **Documentation** | Improve docs and examples |
| 💻 **Code** | Fix bugs or add features |
| 🧪 **Testing** | Test implementations |
| 🌍 **Translations** | Translate documentation |

---

## Getting Started

### 1. Fork the Repository

```bash
git clone https://github.com/a2p-protocol/a2p.git
cd a2p
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run Tests

```bash
pnpm test
```

### 4. Make Changes

Create a branch for your changes:

```bash
git checkout -b feature/my-feature
```

---

## Contribution Guidelines

### Code Style

- Use TypeScript for new code
- Follow existing patterns
- Add tests for new features
- Update documentation

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(sdk): add memory proposal batching
fix(gateway): handle rate limit edge case
docs: update quickstart tutorial
```

### Pull Requests

1. Create a clear PR title
2. Describe what changed and why
3. Link related issues
4. Ensure CI passes

---

## Development Setup

### Project Structure

```
a2p/
├── docs/              # Specification docs
├── schemas/           # JSON Schema files
├── packages/
│   ├── sdk-typescript/
│   ├── sdk-python/
│   ├── gateway/
│   └── adapters/
├── examples/          # Example code
└── docs/              # Documentation (this site)
```

### Building

```bash
# Build all packages
pnpm build

# Build specific package
pnpm --filter @a2p/sdk build
```

### Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter @a2p/sdk test
```

---

## RFC Process

Major changes go through an RFC (Request for Comments):

1. **Draft** — Write RFC in `rfcs/` folder
2. **Discuss** — Open PR for community feedback
3. **Revise** — Incorporate feedback
4. **Accept/Reject** — Working group decision
5. **Implement** — Build the feature

### RFC Template

```markdown
# RFC-XXXX: [Title]

## Summary
[One paragraph summary]

## Motivation
[Why is this needed?]

## Detailed Design
[Technical details]

## Alternatives
[Other approaches considered]

## Compatibility
[Breaking changes, migration]
```

---

## Code of Conduct

We follow the [Contributor Covenant](https://www.contributor-covenant.org/).

### Summary

- Be welcoming and inclusive
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community

---

## License

By contributing, you agree that your contributions will be licensed under [EUPL-1.2](https://opensource.org/licenses/EUPL-1.2).

---

## Getting Help

- 💬 [Discord](https://discord.gg/a2p) — Chat with the community
- 📝 [GitHub Discussions](https://github.com/a2p-protocol/a2p/discussions) — Ask questions
- 🐛 [GitHub Issues](https://github.com/a2p-protocol/a2p/issues) — Report bugs

---

## Recognition

Contributors are recognized in:

- `CONTRIBUTORS.md` file
- Release notes
- Community spotlight

Thank you for contributing to a2p! 🙏
