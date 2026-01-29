# Example 09: IoT Smart Home (Python)

This example shows how IoT devices and smart home systems can use a2p profiles for personalization.

## What You'll Learn

- Using a2p with IoT services
- Reading environment/routine preferences
- Learning patterns from sensor data
- Proposing automation suggestions

## Run

```bash
cd examples/sdk/python
pip install -r requirements.txt
python 09-iot-smart-home/main.py
```

## Code Overview

```python
# Smart home reads user preferences
profile = await smart_home.get_profile(
    user_did=profile.id,
    scopes=["a2p:preferences.environment", "a2p:routines"],
)

# Apply personalized automation
# - Set thermostat to preferred temperature
# - Configure lighting based on preferences
# - Schedule routines based on patterns

# Propose learned routines
await smart_home.propose_memory(
    user_did=profile.id,
    content="Usually arrives home around 6:30pm",
    category="a2p:routines.schedule",
    confidence=0.88,
    context="Based on 4 weeks of door lock data",
)
```

## Cross-Device Benefits

Once approved, learned routines benefit:

- Connected cars (pre-heat home)
- Smartwatches (sleep patterns)
- Hotel apps (apply temperature preferences)
- Other IoT hubs (sync routines)
