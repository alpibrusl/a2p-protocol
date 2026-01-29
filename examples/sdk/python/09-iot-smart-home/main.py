"""
Example 09: IoT Smart Home with a2p

This example shows how IoT devices and smart home systems can use a2p
profiles for personalization — demonstrating that a2p works beyond AI agents.

Scenario: A smart home hub uses a2p to:
1. Read user preferences from their profile
2. Personalize device behavior
3. Learn routines from daily patterns
4. Propose automation suggestions
"""

import asyncio
from a2p import (
    create_user_client,
    create_agent_client,
    add_policy,
    PermissionLevel,
    MemoryStorage,
)


storage = MemoryStorage()


async def main():
    print("🚀 a2p Example: IoT Smart Home\n")
    print("═══════════════════════════════════════════════════════════\n")
    print("   This example demonstrates a2p with IoT devices,")
    print("   showing the protocol works BEYOND just AI agents.\n")
    print("═══════════════════════════════════════════════════════════\n")

    # ============================================
    # 1. Setup User Profile with Home Preferences
    # ============================================
    print("👤 Step 1: Setting up user profile with home preferences...\n")

    user = create_user_client(storage)
    profile = await user.create_profile(display_name="Alex")

    # Add existing home preferences
    await user.add_memory(
        content="Preferred temperature: 21°C (70°F) during the day",
        category="a2p:preferences.environment",
    )

    await user.add_memory(
        content="Prefers dimmed warm lighting in the evening",
        category="a2p:preferences.lighting",
    )

    await user.add_memory(
        content="Usually wakes up around 7:00am on weekdays",
        category="a2p:routines.schedule",
    )

    await user.add_memory(
        content="Works from home on Mondays and Fridays",
        category="a2p:routines.work",
    )

    # Add policy for smart home services
    current_profile = user.get_profile()
    current_profile = add_policy(
        current_profile,
        name="Smart Home Devices",
        agent_pattern="did:a2p:service:local:iot-*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.environment.*", "a2p:preferences.lighting.*", "a2p:routines.*"],
        deny=["a2p:health.*", "a2p:financial.*", "a2p:professional.*"],
    )

    await storage.set(profile.id, current_profile)
    print(f"   ✅ Profile created: {profile.id}")
    print("   ✅ Home preferences added")
    print("   ✅ Consent policy for IoT services configured\n")

    # ============================================
    # 2. Smart Home Hub Reads Profile
    # ============================================
    print("🏠 Step 2: Smart Home Hub reading user profile...\n")

    # The smart home hub is a "service" not an "agent" — same protocol!
    smart_home = create_agent_client(
        agent_did="did:a2p:service:local:iot-homewise",
        storage=storage
    )

    user_profile = await smart_home.get_profile(
        user_did=profile.id,
        scopes=["a2p:preferences", "a2p:routines"],
    )

    print("   📋 Retrieved preferences from a2p profile:")
    memories = user_profile.memories.episodic if user_profile.memories else []
    for memory in memories:
        print(f"      • {memory.content}")
    print()

    # ============================================
    # 3. Apply Personalized Automation
    # ============================================
    print("⚡ Step 3: Applying personalized automation...\n")

    print("   🌡️  Thermostat → Set to 21°C (from profile)")
    print("   💡 Living Room → Warm dimmed lights (evening mode)")
    print("   ⏰ Wake routine → Scheduled for 7:00am weekdays")
    print("   🏢 Work mode → Home office setup for Mon/Fri\n")

    # Simulate devices responding to preferences
    device_actions = [
        {"device": "Thermostat", "action": "Set to 21°C", "room": "Whole house"},
        {"device": "Smart Lights", "action": "Warm white, 40% brightness", "room": "Living Room"},
        {"device": "Smart Blinds", "action": "Partially closed", "room": "Bedroom"},
        {"device": "Coffee Maker", "action": "Scheduled for 6:55am", "room": "Kitchen"},
    ]

    print("   📱 Device actions executed:")
    for action in device_actions:
        print(f"      • {action['device']} ({action['room']}): {action['action']}")
    print()

    # ============================================
    # 4. Learn Patterns from Sensors (Simulated)
    # ============================================
    print("📊 Step 4: Learning patterns from sensor data...\n")

    print("   📈 Pattern analysis over 4 weeks:\n")

    patterns = [
        {
            "pattern": "Arrives home around 6:30pm on weekdays",
            "confidence": 0.88,
            "source": "Door lock + motion sensors",
        },
        {
            "pattern": "Lowers thermostat to 18°C before sleep (around 11pm)",
            "confidence": 0.82,
            "source": "Thermostat adjustments",
        },
        {
            "pattern": "Prefers all lights off after midnight",
            "confidence": 0.9,
            "source": "Light switch patterns",
        },
        {
            "pattern": "Uses kitchen heavily 7-8am and 7-8pm",
            "confidence": 0.85,
            "source": "Motion + appliance sensors",
        },
        {
            "pattern": "Opens bedroom blinds immediately after waking",
            "confidence": 0.75,
            "source": "Blind motor + motion correlation",
        },
    ]

    for p in patterns:
        print(f"      • {p['pattern']}")
        print(f"        └─ Source: {p['source']} ({round(p['confidence'] * 100)}% confidence)")
    print()

    # ============================================
    # 5. Propose Learned Routines to Profile
    # ============================================
    print("💡 Step 5: Proposing learned routines to user profile...\n")

    await smart_home.propose_memory(
        user_did=profile.id,
        content="Usually arrives home around 6:30pm on weekdays",
        category="a2p:routines.schedule",
        confidence=0.88,
        context="Based on 4 weeks of door lock and motion sensor data",
    )
    print("   📝 Proposed: Arrival time routine (88% confidence)")

    await smart_home.propose_memory(
        user_did=profile.id,
        content="Preferred sleep temperature: 18°C (64°F)",
        category="a2p:preferences.environment",
        confidence=0.82,
        context="Consistent thermostat lowering before 11pm bedtime",
    )
    print("   📝 Proposed: Sleep temperature preference (82% confidence)")

    await smart_home.propose_memory(
        user_did=profile.id,
        content="Prefers complete darkness for sleeping (all lights off after midnight)",
        category="a2p:preferences.lighting",
        confidence=0.9,
        context="Consistent pattern: 100% lights-off after 12am",
    )
    print("   📝 Proposed: Dark sleep preference (90% confidence)")

    await smart_home.propose_memory(
        user_did=profile.id,
        content="Morning routine: Opens blinds immediately after waking",
        category="a2p:routines.morning",
        confidence=0.75,
        context="Blind motor activation correlates with first motion detection",
    )
    print("   📝 Proposed: Morning blinds routine (75% confidence)\n")

    # ============================================
    # 6. Cross-Device/Service Benefits
    # ============================================
    print("🔗 Step 6: Cross-Device & Cross-Service Benefits\n")
    print("   Once Alex approves these proposals, OTHER services benefit:\n")
    print("   ┌────────────────────────────────────────────────────────────┐")
    print("   │                                                            │")
    print("   │  🚗 Connected car  → Pre-heat home when leaving work      │")
    print("   │  ⌚ Smartwatch     → Adjust based on sleep patterns       │")
    print("   │  🤖 AI assistant   → Suggest \"heading home?\" at 6pm       │")
    print("   │  🏨 Hotel apps     → Apply temperature preferences        │")
    print("   │  📱 Other IoT hubs → Sync routines across locations       │")
    print("   │  🎵 Music service  → Queue relaxing music at 10:30pm      │")
    print("   │                                                            │")
    print("   └────────────────────────────────────────────────────────────┘\n")
    print("   This is the power of USER-OWNED profiles:")
    print("   → IoT learnings benefit your entire digital ecosystem.\n")

    # ============================================
    # 7. User Reviews Proposals
    # ============================================
    print("👤 Step 7: Alex reviews and manages proposals...\n")

    await user.load_profile(profile.id)
    proposals = user.get_pending_proposals()

    approved = 0
    rejected = 0

    for proposal in proposals:
        print(f'   📝 "{proposal.memory.content}"')
        print(f"      From: {proposal.proposed_by.agent_did}")
        print(f"      Confidence: {round((proposal.memory.confidence or 0) * 100)}%")

        # Simulate user decision (approve high confidence, review low confidence)
        if (proposal.memory.confidence or 0) >= 0.8:
            await user.approve_proposal(proposal.id)
            print("      ✅ Approved\n")
            approved += 1
        else:
            await user.reject_proposal(proposal.id)
            print("      ❌ Rejected (will review manually)\n")
            rejected += 1

    print(f"   Summary: {approved} approved, {rejected} rejected for manual review\n")

    # ============================================
    # 8. Suggested Automation Rules
    # ============================================
    print("🤖 Step 8: Smart Home suggests automation rules...\n")

    print("   Based on learned patterns, HomeWise suggests:\n")
    print("   ┌─────────────────────────────────────────────────────────┐")
    print('   │ 🌅 "Good Morning" Automation                           │')
    print("   │    Trigger: Motion detected after 6:30am               │")
    print("   │    Actions:                                            │")
    print("   │      • Open bedroom blinds                             │")
    print("   │      • Set thermostat to 21°C                          │")
    print("   │      • Start coffee maker                              │")
    print("   │      • Play morning news briefing                      │")
    print("   └─────────────────────────────────────────────────────────┘")
    print("   ┌─────────────────────────────────────────────────────────┐")
    print('   │ 🏠 "Welcome Home" Automation                           │')
    print("   │    Trigger: Phone GPS within 10 min of home (6pm+)     │")
    print("   │    Actions:                                            │")
    print("   │      • Set thermostat to 21°C                          │")
    print("   │      • Turn on entryway lights                         │")
    print("   │      • Disarm security system                          │")
    print("   └─────────────────────────────────────────────────────────┘")
    print("   ┌─────────────────────────────────────────────────────────┐")
    print('   │ 🌙 "Good Night" Automation                             │')
    print("   │    Trigger: All lights off after 11pm                  │")
    print("   │    Actions:                                            │")
    print("   │      • Lower thermostat to 18°C                        │")
    print("   │      • Lock all doors                                  │")
    print("   │      • Arm security system                             │")
    print("   │      • Enable Do Not Disturb on all devices            │")
    print("   └─────────────────────────────────────────────────────────┘\n")

    # ============================================
    # Summary
    # ============================================
    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Example Complete!")
    print("═══════════════════════════════════════════════════════════\n")
    print("   Key takeaways:\n")
    print("   1. a2p works for IoT devices, not just AI agents")
    print("   2. Smart home sensors can propose learned patterns")
    print("   3. Users control what routines get saved to their profile")
    print("   4. Approved patterns benefit the entire device ecosystem")
    print("   5. Privacy-preserving: user owns all behavioral data")
    print("   6. Portable: preferences work in any a2p-compatible home\n")


if __name__ == "__main__":
    asyncio.run(main())
