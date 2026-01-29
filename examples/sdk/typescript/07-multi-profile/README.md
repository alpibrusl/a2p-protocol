# Example 07: Multi-Profile (Work/Personal)

This example demonstrates sub-profiles for different contexts.

## What You'll Learn

- Creating sub-profiles for work and personal contexts
- Inheriting from common profile data
- Overriding specific values per context
- Sharing different data with different agents

## Run TypeScript Version

```bash
pnpm install
pnpm start
```

## Concept

```
┌─────────────────────────────────────────────────────────┐
│                    ROOT PROFILE                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  Common Data                                      │ │
│  │  - Display Name: Alex                             │ │
│  │  - Language: English                              │ │
│  │  - Communication: Concise                         │ │
│  └───────────────────────────────────────────────────┘ │
│                         │                               │
│          ┌──────────────┴──────────────┐               │
│          ▼                              ▼               │
│  ┌───────────────────┐      ┌───────────────────┐      │
│  │   WORK PROFILE    │      │  PERSONAL PROFILE │      │
│  │  ───────────────  │      │  ───────────────  │      │
│  │  Name: Alex Chen  │      │  Name: Alex       │      │
│  │  Title: Engineer  │      │  Hobbies: Gaming  │      │
│  │  Skills: Python   │      │  Music: Jazz      │      │
│  │                   │      │                   │      │
│  │  Share with:      │      │  Share with:      │      │
│  │  - Slack bots     │      │  - Spotify        │      │
│  │  - Work tools     │      │  - Entertainment  │      │
│  └───────────────────┘      └───────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
