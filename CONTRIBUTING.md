# Contributing to a2p Protocol

Thank you for your interest in contributing to the a2p protocol! This document provides guidelines and information for contributors.

## Code of Conduct

Please be respectful and constructive in all interactions. We're building technology for user empowerment, and our community should reflect those values.

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Python >= 3.10 (for Python SDK)

### Setup

```bash
# Clone the repository
git clone https://github.com/a2p-protocol/a2p.git
cd a2p

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

## Project Structure

```
a2p/
├── docs/                    # Documentation
│   ├── spec/               # Protocol specification
│   └── api/                # API documentation
├── schemas/                 # JSON Schema definitions
├── packages/
│   ├── sdk/
│   │   ├── typescript/     # TypeScript SDK
│   │   └── python/         # Python SDK
│   ├── adapters/
│   │   ├── langgraph/      # LangGraph integration
│   │   ├── crewai/         # CrewAI integration
│   │   └── ...             # Other adapters
│   └── tools/
│       ├── gateway/         # Gateway server
│       └── conformance-tests/ # Conformance tests
└── examples/               # Example implementations
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-fix-name
```

### 2. Make Changes

- Follow the existing code style
- Add tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# TypeScript SDK
cd packages/sdk/typescript
pnpm test

# Python SDK
cd packages/sdk/python
pytest
```

### 4. Submit a Pull Request

- Provide a clear description of changes
- Reference any related issues
- Ensure all tests pass

## Contribution Areas

### Protocol Specification

Help improve the protocol specification in `docs/spec/`. Consider:

- Clarity and completeness
- Edge cases and error handling
- Security considerations
- Privacy implications

### SDK Development

Contribute to the SDKs:

- Bug fixes
- New features
- Performance improvements
- Documentation

### Framework Adapters

Create or improve integrations:

- LangGraph adapter
- CrewAI adapter
- Mastra adapter
- Other frameworks

### Documentation

- Tutorials and guides
- API documentation
- Example code
- Translations

## Style Guides

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public APIs

### Python

- Follow PEP 8
- Use type hints
- Use Pydantic for data models
- Add docstrings for public APIs

### Documentation

- Use clear, concise language
- Include code examples
- Keep examples up to date

## Schema Changes

When modifying JSON schemas:

1. Update the schema in `schemas/`
2. Update TypeScript types in `packages/sdk/typescript/src/types/`
3. Update Python models in `packages/sdk/python/src/a2p/types.py`
4. Update documentation in `docs/spec/schemas.md`

## Security

If you discover a security vulnerability:

1. **Do not** open a public issue
2. Email <security@a2p.protocol> with details
3. We'll respond within 48 hours

## License

By contributing, you agree that your contributions will be licensed under the EUPL-1.2.

## Questions?

- Open an issue for bugs or feature requests
- Join our Discord for discussions
- Check existing issues before creating new ones

Thank you for contributing to a2p! 🚀
