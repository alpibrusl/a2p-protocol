# Example 08: ML Recommender (Python)

This example shows how ML recommendation systems can use a2p profiles - demonstrating that a2p works beyond just AI agents.

## What You'll Learn

- Using a2p with non-agent services (ML systems)
- Reading preferences for personalization
- Learning from user behavior
- Proposing learned preferences back to users

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 08-ml-recommender/main.py
```

## Code Overview

```python
# ML service reads user preferences
profile = await recommender.get_profile(
    user_did=profile.id,
    scopes=["a2p:interests.music", "a2p:preferences"],
)

# Generate personalized recommendations
recommendations = generate_recommendations(profile.memories)

# Propose learned preferences
await recommender.propose_memory(
    user_did=profile.id,
    content="Strongly prefers instrumental music",
    category="a2p:preferences.content",
    confidence=0.9,
    context="Based on 3 months of listening behavior",
)
```

## Key Insight

a2p works for ANY service that learns about users, not just AI agents:

- Music streaming services
- E-commerce recommendations
- Content personalization
- Smart home systems
