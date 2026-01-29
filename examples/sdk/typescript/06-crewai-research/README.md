# Example 06: CrewAI Research Crew

This example shows how to build a CrewAI research crew with a2p user context.

## What You'll Learn

- Integrating a2p with CrewAI
- Using user profiles to personalize agent behavior
- Building multi-agent systems with user context
- Proposing memories from crew interactions

## Prerequisites

```bash
pip install crewai a2p-crewai
```

## Run

```bash
npm install
npm run 06:*
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CrewAI Application                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌───────────────────────────────────────────────────┐ │
│   │                    Crew                           │ │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │ │
│   │  │Researcher│  │ Analyst  │  │ Writer   │       │ │
│   │  └────┬─────┘  └────┬─────┘  └────┬─────┘       │ │
│   │       │             │             │              │ │
│   │       └─────────────┼─────────────┘              │ │
│   │                     │                            │ │
│   │               ┌─────▼─────┐                      │ │
│   │               │   a2p     │                      │ │
│   │               │  Memory   │                      │ │
│   │               └─────┬─────┘                      │ │
│   │                     │                            │ │
│   └─────────────────────│────────────────────────────┘ │
│                   ┌─────▼─────┐                        │
│                   │   User    │                        │
│                   │  Profile  │                        │
│                   └───────────┘                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
