# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

a2p (Agent 2 Profile) is an open protocol for user-owned profiles in AI agent interactions. It provides SDKs in TypeScript and Python, plus framework adapters for popular AI frameworks (LangChain, LangGraph, OpenAI, CrewAI, Anthropic, etc.).

## Monorepo Structure

This is a pnpm workspace monorepo. Key packages:

- `packages/sdk/typescript/` — TypeScript SDK (`@a2p/sdk`), built with tsup, tested with Vitest
- `packages/sdk/python/` — Python SDK (`a2p-sdk`), built with hatchling, tested with pytest
- `packages/adapters/<framework>/{typescript,python}/` — Framework-specific adapters (9 frameworks)
- `packages/tools/gateway/` — Gateway server
- `packages/tools/conformance-tests/` — Protocol conformance tests
- `schemas/` — JSON Schema definitions for profiles, consent, proposals, etc.
- `docs/` — MkDocs documentation site

## Build & Test Commands

```bash
# Install dependencies
pnpm install

# Build/test/lint all packages
pnpm build
pnpm test
pnpm lint
pnpm typecheck

# TypeScript SDK specifically
cd packages/sdk/typescript
pnpm build                        # tsup build (CJS + ESM + DTS)
pnpm exec vitest run              # run tests once
pnpm exec vitest run --coverage   # with coverage (80% threshold)
pnpm exec vitest run path/to/file # single test file

# Python SDK specifically
cd packages/sdk/python
pytest tests/ -v                  # run tests
pytest tests/test_file.py -v      # single test file
pytest tests/ --cov=src/a2p       # with coverage
mypy src/                         # type checking (strict mode)
ruff check src/                   # linting
ruff format src/                  # formatting

# Pre-commit hooks
pnpm precommit:install            # one-time setup
pnpm precommit                    # run all checks
```

## Architecture

The SDKs maintain API parity across TypeScript and Python. Core modules in both:

- **profile** — Profile creation, management, and field filtering. Profiles use DID-based identity (`did:a2p:{user|entity|agent}:*`).
- **consent** — Granular consent policies with scope-based permissions, time expiration, and cryptographic receipts.
- **proposal** — Agents propose memories to users; users approve/reject. Includes deduplication.
- **storage** — Pluggable backends: memory (in-process), cloud (HTTP), solid (decentralized pods).

Key types: Profile categories (Identity, Preferences, Professional, etc.), Memory types (Episodic, Semantic, Procedural), Consent policies with scope matching.

TypeScript uses zod for runtime validation; Python uses pydantic v2.

## Code Style & Constraints

- **TypeScript**: Strict mode enabled — `noImplicitAny`, `strictNullChecks`, `noUnusedLocals`, `noUnusedParameters`. Target ES2022.
- **Python**: mypy strict mode, ruff linting (rules: E, F, I, N, W, UP), line length 100, target Python 3.10+.
- **Coverage thresholds** (TypeScript): 80% lines/functions/statements, 75% branches.
- Pre-commit hooks run: trailing whitespace, YAML/JSON validation, ruff, mypy, bandit (security), detect-secrets, gitleaks.

## Releases

Tag-based releases (`v*`) via GitHub Actions. Uses Trusted Publishing (OIDC) for both npm and PyPI — no secrets needed in CI.
