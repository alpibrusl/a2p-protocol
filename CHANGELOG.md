# Changelog

All notable changes to the a2p Protocol project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Additional adapter implementations
- Performance optimizations
- Enhanced documentation
- Community features

## [0.1.0-alpha] - 2025-01-12

### Added
- Core a2p protocol specification
- TypeScript SDK with comprehensive test coverage (83-88%)
- Python SDK with comprehensive test coverage (78-83%)
- Multiple adapter implementations:
  - LangChain (TypeScript and Python)
  - LangGraph (TypeScript and Python)
  - OpenAI Assistants (TypeScript and Python)
  - CrewAI (Python)
  - Anthropic (Python)
  - Gemini (Python)
  - Google ADK (Python)
  - A2A Protocol (Python)
  - Agno (Python)
- Gateway service for profile management
- Comprehensive documentation:
  - Protocol specification
  - SDK documentation
  - Tutorials and examples
  - Compliance guidance (GDPR, EU AI Act)
- Test coverage:
  - 155+ tests for TypeScript SDK
  - 158+ tests for Python SDK
  - Integration tests
  - Error handling tests
  - Edge case coverage
- Profile management features:
  - User-owned profiles
  - Memory proposals
  - Consent policies
  - Scope-based access control
  - Profile export/import
- DID-based identity system
- Compliance features:
  - GDPR compliance documentation
  - EU AI Act compliance guidance
  - DPIA templates
  - Consent management

### Security
- DID-based authentication
- Scope-based access control
- Consent-based data sharing
- Security policy documentation

### Documentation
- Comprehensive README
- Contributing guidelines
- Protocol specification
- SDK API documentation
- Tutorial examples
- Compliance documentation

---

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** for vulnerability fixes
