# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
## [0.1.1] - 2026-01-29

### Changed
- Set up automated releases with Trusted Publishing
- npm package published with provenance


## [0.1.0-alpha] - 2026-01-29

### Added

- Initial release of a2p Protocol
- **TypeScript SDK** (`@a2p/sdk`)
  - Profile management (create, read, update)
  - Memory system with episodic, semantic, and procedural memory types
  - Consent and policy management
  - Proposal workflow for agent-suggested memories
  - DID-based identity system
- **Python SDK** (`a2p-sdk`)
  - Full parity with TypeScript SDK
  - Async-first design with httpx
  - Pydantic models for type safety
- **JSON Schemas**
  - Profile schema
  - Memory schema
  - Consent policy schema
  - Proposal schema
  - Agent profile schema
- **Documentation**
  - Complete specification
  - SDK reference guides
  - Tutorial examples
  - GDPR and EU AI Act compliance guides
- **Framework Adapters** (experimental)
  - LangChain adapter
  - OpenAI adapter
  - LangGraph adapter
  - CrewAI adapter

### Security

- DID-based authentication
- Cryptographic signature verification
- Consent-based access control

[Unreleased]: https://github.com/alpibrusl/a2p-protocol/compare/v0.1.0-alpha...HEAD
[0.1.0-alpha]: https://github.com/alpibrusl/a2p-protocol/releases/tag/v0.1.0-alpha
