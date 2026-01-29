"""
Example 07: Multi-Profile (Work/Personal)

This example demonstrates sub-profiles for different contexts.
"""

import asyncio
import json
from a2p import (
    create_user_client,
    create_agent_client,
    add_sub_profile,
    add_policy,
    PermissionLevel,
    MemoryStorage,
    SubProfile,
)


storage = MemoryStorage()


async def main():
    print("🚀 a2p Example: Multi-Profile (Work/Personal)\n")
    print("═══════════════════════════════════════════════════════════\n")

    # ============================================
    # 1. Create Base Profile
    # ============================================
    print("1️⃣ Creating base profile with common data...\n")

    user = create_user_client(storage)
    profile = await user.create_profile(display_name="Alex")

    # Add common memories (shared across all contexts)
    await user.add_memory(
        content="Prefers concise communication",
        category="a2p:preferences.communication",
        scope=["general"],
    )

    await user.add_memory(
        content="Primary language: English",
        category="a2p:preferences.language",
        scope=["general"],
    )

    profile = user.get_profile()
    print(f"   ✅ Base profile: {profile.id}")
    print("   📋 Common preferences added\n")

    # ============================================
    # 2. Create Work Sub-Profile
    # ============================================
    print("2️⃣ Creating WORK sub-profile...\n")

    work_sub_profile = SubProfile(
        id=f"{profile.id}:work",
        name="Work",
        description="Professional context",
        inherits_from=["common"],
        overrides={"identity.displayName": "Alex Chen"},  # More formal
        specialized={
            "a2p:professional": {
                "title": "Senior Software Engineer",
                "employer": "TechCorp Inc.",
                "skills": ["Python", "TypeScript", "Kubernetes"],
            },
            "a2p:context": {
                "currentProjects": ["API Migration", "ML Pipeline"],
            },
        },
        share_with=["did:a2p:agent:local:local:slack-*", "did:a2p:agent:local:local:work-*"],
    )

    profile = add_sub_profile(profile, work_sub_profile)
    print("   ✅ Work sub-profile created")
    print("      Name: Alex Chen (formal)")
    print("      Title: Senior Software Engineer")
    print("      Skills: Python, TypeScript, Kubernetes")
    print("      Shares with: Slack bots, Work tools\n")

    # ============================================
    # 3. Create Personal Sub-Profile
    # ============================================
    print("3️⃣ Creating PERSONAL sub-profile...\n")

    personal_sub_profile = SubProfile(
        id=f"{profile.id}:personal",
        name="Personal",
        description="Personal/entertainment context",
        inherits_from=["common"],
        overrides={"identity.displayName": "Alex"},  # Casual
        specialized={
            "a2p:interests": {
                "hobbies": ["Gaming", "Photography", "Hiking"],
                "music": {
                    "genres": ["Jazz", "Electronic"],
                    "artists": ["Miles Davis", "Bonobo"],
                },
                "reading": {
                    "genres": ["Sci-Fi", "Technical"],
                },
            },
            "a2p:context": {
                "currentProjects": ["Learning piano", "Photo project"],
            },
        },
        share_with=["did:a2p:agent:local:local:spotify-*", "did:a2p:agent:local:local:entertainment-*"],
    )

    profile = add_sub_profile(profile, personal_sub_profile)
    print("   ✅ Personal sub-profile created")
    print("      Name: Alex (casual)")
    print("      Hobbies: Gaming, Photography, Hiking")
    print("      Music: Jazz, Electronic")
    print("      Shares with: Spotify, Entertainment apps\n")

    # ============================================
    # 4. Add Access Policies
    # ============================================
    print("4️⃣ Configuring access policies...\n")

    # Work agents get work sub-profile
    profile = add_policy(
        profile,
        name="Work Context",
        agent_pattern="did:a2p:agent:local:local:work-*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:professional.*", "a2p:preferences.*", "a2p:context.*"],
        deny=["a2p:interests.*", "a2p:health.*"],
        sub_profile=f"{profile.id}:work",
        priority=10,
    )
    print("   📋 Work agents → Work sub-profile")

    # Slack bots get work sub-profile
    profile = add_policy(
        profile,
        name="Slack Bots",
        agent_pattern="did:a2p:agent:local:local:slack-*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:professional.*", "a2p:preferences.*"],
        sub_profile=f"{profile.id}:work",
        priority=10,
    )
    print("   📋 Slack bots → Work sub-profile")

    # Entertainment agents get personal sub-profile
    profile = add_policy(
        profile,
        name="Entertainment Apps",
        agent_pattern="did:a2p:agent:local:local:entertainment-*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:interests.*", "a2p:preferences.*"],
        deny=["a2p:professional.*", "a2p:health.*"],
        sub_profile=f"{profile.id}:personal",
        priority=10,
    )
    print("   📋 Entertainment apps → Personal sub-profile")

    # Spotify gets personal sub-profile
    profile = add_policy(
        profile,
        name="Spotify",
        agent_pattern="did:a2p:agent:local:local:spotify-*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:interests.music.*", "a2p:preferences.*"],
        sub_profile=f"{profile.id}:personal",
        priority=10,
    )
    print("   📋 Spotify → Personal sub-profile (music only)\n")

    await storage.set(profile.id, profile)

    # ============================================
    # 5. Test Agent Access
    # ============================================
    print("5️⃣ Testing agent access to different contexts...\n")

    # Work agent
    print("   🤖 Work Assistant (did:a2p:agent:local:local:work-assistant)")
    work_agent = create_agent_client(
        agent_did="did:a2p:agent:local:local:work-assistant",
        storage=storage
    )
    try:
        work_profile = await work_agent.get_profile(
            user_did=profile.id,
            scopes=["a2p:professional", "a2p:interests"],
            sub_profile=f"{profile.id}:work",
        )
        print("      ✅ Access granted to work context")
        professional = work_profile.memories.get("a2p:professional", {}) if work_profile.memories else {}
        print(f"      Sees: {json.dumps(professional)}")
    except Exception:
        print("      ❌ Access denied")
    print()

    # Entertainment agent
    print("   🎮 Entertainment App (did:a2p:agent:local:local:entertainment-app)")
    entertainment_agent = create_agent_client(
        agent_did="did:a2p:agent:local:local:entertainment-app",
        storage=storage
    )
    try:
        personal_profile = await entertainment_agent.get_profile(
            user_did=profile.id,
            scopes=["a2p:interests", "a2p:professional"],
            sub_profile=f"{profile.id}:personal",
        )
        print("      ✅ Access granted to personal context")
        interests = personal_profile.memories.get("a2p:interests", {}) if personal_profile.memories else {}
        print(f"      Sees: {json.dumps(interests)}")
    except Exception:
        print("      ❌ Access denied")
    print()

    # ============================================
    # 6. Summary
    # ============================================
    print("6️⃣ Profile Structure Summary:\n")
    print("   ┌────────────────────────────────────────────────────────┐")
    print("   │                    ROOT PROFILE                        │")
    print(f"   │  ID: {profile.id[:40]}...  │")
    print("   │  Common: Language preferences, Communication style    │")
    print("   ├────────────────────────────────────────────────────────┤")
    print("   │                                                        │")
    print("   │   ┌─────────────────┐     ┌─────────────────┐         │")
    print("   │   │  WORK PROFILE   │     │ PERSONAL PROFILE│         │")
    print("   │   │  ─────────────  │     │  ─────────────  │         │")
    print("   │   │  Alex Chen      │     │  Alex           │         │")
    print("   │   │  Sr. Engineer   │     │  Gaming, Music  │         │")
    print("   │   │  TechCorp       │     │  Photography    │         │")
    print("   │   └─────────────────┘     └─────────────────┘         │")
    print("   │                                                        │")
    print("   └────────────────────────────────────────────────────────┘\n")

    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Example Complete!")
    print("═══════════════════════════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(main())
