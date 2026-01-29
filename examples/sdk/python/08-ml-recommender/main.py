"""
Example 08: ML Recommender System with a2p

This example shows how ML recommendation systems can use a2p profiles
for personalization — demonstrating that a2p works beyond just AI agents.

Scenario: A music streaming service uses a2p to:
1. Read user preferences from their profile
2. Generate personalized recommendations
3. Learn from user behavior
4. Propose learned preferences back to the user
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
    print("🚀 a2p Example: ML Recommender System\n")
    print("═══════════════════════════════════════════════════════════\n")
    print("   This example demonstrates a2p with ML systems,")
    print("   showing the protocol works BEYOND just AI agents.\n")
    print("═══════════════════════════════════════════════════════════\n")

    # ============================================
    # 1. Setup User Profile
    # ============================================
    print("👤 Step 1: Setting up user profile...\n")

    user = create_user_client(storage)
    profile = await user.create_profile(display_name="Maria")

    # Add existing music preferences
    await user.add_memory(
        content="Enjoys jazz, especially modern jazz and fusion",
        category="a2p:interests.music",
    )

    await user.add_memory(
        content="Listens to music mostly during work hours (9am-5pm)",
        category="a2p:preferences.timing",
    )

    await user.add_memory(
        content="Prefers instrumental music while working",
        category="a2p:preferences.content",
    )

    # Add policy for music services
    current_profile = user.get_profile()
    current_profile = add_policy(
        current_profile,
        name="Music Streaming Services",
        agent_pattern="did:a2p:service:local:music-*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:interests.music.*", "a2p:preferences.*"],
        deny=["a2p:health.*", "a2p:financial.*"],
    )

    await storage.set(profile.id, current_profile)
    print(f"   ✅ Profile created: {profile.id}")
    print("   ✅ Music preferences added")
    print("   ✅ Consent policy for music services configured\n")

    # ============================================
    # 2. ML Recommender Reads Profile
    # ============================================
    print("🎵 Step 2: Music Recommender reading user profile...\n")

    # The recommender is a "service" not an "agent" — same protocol!
    recommender = create_agent_client(
        agent_did="did:a2p:service:local:music-streamify",
        storage=storage
    )

    user_profile = await recommender.get_profile(
        user_did=profile.id,
        scopes=["a2p:interests.music", "a2p:preferences"],
    )

    print("   📋 Retrieved user preferences from a2p profile:")
    memories = user_profile.memories.episodic if user_profile.memories else []
    for memory in memories:
        print(f"      • {memory.content}")
    print()

    # ============================================
    # 3. Generate Personalized Recommendations
    # ============================================
    print("🎼 Step 3: Generating personalized recommendations...\n")

    # Simulate ML model using profile data for personalization
    recommendations = [
        {"artist": "Snarky Puppy", "reason": "Modern jazz fusion (matches your jazz preference)"},
        {"artist": "GoGo Penguin", "reason": "Instrumental jazz (perfect for work)"},
        {"artist": "Kamasi Washington", "reason": "Modern jazz (genre match)"},
        {"artist": "Yussef Dayes", "reason": "Jazz fusion (genre match)"},
        {"artist": "BadBadNotGood", "reason": "Instrumental hip-hop/jazz fusion"},
    ]

    print("   🎧 Personalized recommendations for Maria:")
    for rec in recommendations:
        print(f"      • {rec['artist']}")
        print(f"        └─ {rec['reason']}")
    print()

    # ============================================
    # 4. Learn from User Behavior (Simulated)
    # ============================================
    print("📊 Step 4: Learning from user behavior...\n")

    print("   📈 Behavior analysis over 3 months:")

    behavior_insights = [
        {"observation": "Frequently skips songs with vocals", "confidence": 0.9, "metric": "Skip rate: 78% for vocal tracks"},
        {"observation": "Listens to lo-fi beats in the evening", "confidence": 0.75, "metric": "Evening sessions: 85% lo-fi"},
        {"observation": "Replays Snarky Puppy tracks often", "confidence": 0.85, "metric": "Replay rate: 3.2x average"},
        {"observation": "Prefers longer tracks (5+ minutes)", "confidence": 0.7, "metric": "Completion rate: 92% for 5+ min"},
    ]

    for insight in behavior_insights:
        print(f"      • {insight['observation']}")
        print(f"        └─ {insight['metric']} ({round(insight['confidence'] * 100)}% confidence)")
    print()

    # ============================================
    # 5. Propose Learned Preferences to Profile
    # ============================================
    print("💡 Step 5: Proposing learned preferences to user profile...\n")

    # Propose high-confidence learnings
    await recommender.propose_memory(
        user_did=profile.id,
        content="Strongly prefers instrumental music; usually skips songs with vocals",
        category="a2p:preferences.content",
        confidence=0.9,
        context="Based on 3 months of listening behavior: 78% skip rate for vocal tracks",
    )
    print("   📝 Proposed: Instrumental music preference (90% confidence)")

    await recommender.propose_memory(
        user_did=profile.id,
        content="Favorite artist: Snarky Puppy",
        category="a2p:interests.music",
        confidence=0.85,
        context="High replay rate (3.2x average) and full track completion",
    )
    print("   📝 Proposed: Snarky Puppy as favorite artist (85% confidence)")

    await recommender.propose_memory(
        user_did=profile.id,
        content="Enjoys lo-fi beats in evening hours (6pm-10pm)",
        category="a2p:preferences.timing",
        confidence=0.75,
        context="Pattern observed over 6 weeks: 85% of evening sessions are lo-fi",
    )
    print("   📝 Proposed: Evening lo-fi preference (75% confidence)")

    await recommender.propose_memory(
        user_did=profile.id,
        content="Prefers longer tracks (5+ minutes) with high completion rate",
        category="a2p:preferences.content",
        confidence=0.7,
        context="92% completion rate for tracks over 5 minutes",
    )
    print("   📝 Proposed: Long track preference (70% confidence)\n")

    # ============================================
    # 6. Cross-Service Benefits
    # ============================================
    print("🔗 Step 6: Cross-Service Benefits\n")
    print("   Once Maria approves these proposals, OTHER services benefit:\n")
    print("   ┌────────────────────────────────────────────────────────────┐")
    print("   │                                                            │")
    print("   │  🎵 Other music apps → Know her instrumental preference    │")
    print("   │  🤖 AI assistants   → Can suggest focus music for work     │")
    print("   │  📺 Video services  → Avoid recommending music videos      │")
    print("   │  🏠 Smart home      → Auto-play lo-fi beats in evening     │")
    print("   │  🎧 Podcast apps    → Suggest longer-form content          │")
    print("   │                                                            │")
    print("   └────────────────────────────────────────────────────────────┘\n")
    print("   This is the power of USER-OWNED profiles:")
    print("   → One service learns, all services benefit (with consent).\n")

    # ============================================
    # 7. User Reviews Proposals
    # ============================================
    print("👤 Step 7: Maria reviews and approves proposals...\n")

    await user.load_profile(profile.id)
    proposals = user.get_pending_proposals()

    for proposal in proposals:
        print(f'   📝 "{proposal.memory.content}"')
        print(f"      From: {proposal.proposed_by.agent_did}")
        print(f"      Confidence: {round((proposal.memory.confidence or 0) * 100)}%")
        await user.approve_proposal(proposal.id)
        print("      ✅ Approved\n")

    # ============================================
    # Summary
    # ============================================
    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Example Complete!")
    print("═══════════════════════════════════════════════════════════\n")
    print("   Key takeaways:\n")
    print("   1. a2p works for ML systems, not just AI agents")
    print("   2. Any service that learns can propose to user profiles")
    print("   3. Users control what gets added to their profile")
    print("   4. Approved learnings benefit ALL a2p-compatible services")
    print("   5. The same protocol, consent model, and DIDs apply\n")


if __name__ == "__main__":
    asyncio.run(main())
