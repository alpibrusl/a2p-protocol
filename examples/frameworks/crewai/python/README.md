# CrewAI + a2p Integration

This example shows how to integrate a2p user profiles with CrewAI for building personalized multi-agent crews.

## Prerequisites

```bash
pip install crewai crewai-tools a2p-sdk
```

## Environment Variables

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

## What This Example Does

1. **Loads user preferences** from an a2p profile (research interests, communication style)
2. **Configures agent backstories** with user context
3. **Personalizes task execution** based on user expertise
4. **Proposes discoveries** back to the user's profile

## Files

- `research_crew.py` - Research crew that adapts to user's interests
- `writing_crew.py` - Content creation crew with user style preferences

## Running

```bash
python research_crew.py
```
