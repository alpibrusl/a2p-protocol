"""
Example 04: Consent Policies

This example demonstrates how to configure access control policies.
"""

import asyncio
from a2p import (
    create_user_client,
    create_agent_client,
    add_policy,
    evaluate_access,
    PermissionLevel,
    MemoryStorage,
    AgentProfile,
)


storage = MemoryStorage()


async def main():
    print("🚀 a2p Example: Consent Policies\n")
    print("═══════════════════════════════════════════════════════════\n")

    # ============================================
    # 1. Create User Profile
    # ============================================
    print("1️⃣ Creating user profile...\n")

    user = create_user_client(storage)
    profile = await user.create_profile(display_name="Eve")

    # Add some memories
    await user.add_memory(content="Software developer", category="a2p:professional")
    await user.add_memory(content="Prefers dark mode", category="a2p:preferences.ui")
    await user.add_memory(content="Allergic to peanuts", category="a2p:health")
    await user.add_memory(content="Bank: XYZ Bank", category="a2p:financial")

    profile = user.get_profile()
    print("   ✅ Created profile with 4 memories\n")

    # ============================================
    # 2. Add Different Policies
    # ============================================
    print("2️⃣ Adding access control policies...\n")

    # Policy 1: Work agents - can access professional info
    profile = add_policy(
        profile,
        name="Work Agents",
        agent_pattern="did:a2p:agent:local:local:work-*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:professional.*", "a2p:preferences.*", "a2p:context.*"],
        deny=["a2p:health.*", "a2p:financial.*"],
        priority=10,
    )
    print("   📋 Policy 1: Work Agents")
    print("      Pattern: did:a2p:agent:local:local:work-*")
    print("      Allow: professional, preferences, context")
    print("      Deny: health, financial\n")

    # Policy 2: Health agents - can access health info
    profile = add_policy(
        profile,
        name="Health Agents",
        agent_pattern="did:a2p:agent:local:local:health-*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:health.*", "a2p:identity.name"],
        deny=["a2p:financial.*"],
        priority=10,
        conditions={"requireVerifiedOperator": True},
    )
    print("   📋 Policy 2: Health Agents")
    print("      Pattern: did:a2p:agent:local:local:health-*")
    print("      Allow: health, identity.name")
    print("      Requires: Verified operator\n")

    # Policy 3: Trusted agents with high trust score
    profile = add_policy(
        profile,
        name="Trusted AI Assistants",
        agent_pattern="did:a2p:agent:local:local:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.*"],
        deny=["a2p:health.*", "a2p:financial.*", "a2p:relationships.*"],
        priority=100,
        conditions={"minTrustScore": 0.8},
    )
    print("   📋 Policy 3: Trusted Assistants")
    print("      Pattern: did:a2p:agent:local:local:* (any agent)")
    print("      Allow: preferences only")
    print("      Requires: Trust score >= 0.8\n")

    await storage.set(profile.id, profile)

    # ============================================
    # 3. Test Access for Different Agents
    # ============================================
    print("3️⃣ Testing access for different agents...\n")

    test_cases = [
        {
            "did": "did:a2p:agent:local:local:work-slack-assistant",
            "scopes": ["a2p:professional", "a2p:health", "a2p:preferences"],
            "agent_profile": None,
            "description": "Work Slack Assistant",
        },
        {
            "did": "did:a2p:agent:local:local:health-tracker",
            "scopes": ["a2p:health", "a2p:identity.name"],
            "agent_profile": AgentProfile(
                id="did:a2p:agent:local:local:health-tracker",
                profile_type="agent",
                identity={"name": "Health Tracker"},
                operator={"name": "HealthCorp", "verified": True},
                a2p_support={"protocol_version": "1.0"},
            ),
            "description": "Verified Health Tracker",
        },
        {
            "did": "did:a2p:agent:local:local:random-chatbot",
            "scopes": ["a2p:preferences", "a2p:health"],
            "agent_profile": AgentProfile(
                id="did:a2p:agent:local:local:random-chatbot",
                profile_type="agent",
                identity={"name": "Random Bot"},
                operator={"name": "Unknown"},
                a2p_support={"protocol_version": "1.0"},
                trust_metrics={"community_score": 0.9},
            ),
            "description": "High-trust General Chatbot",
        },
        {
            "did": "did:a2p:agent:local:local:untrusted-bot",
            "scopes": ["a2p:preferences", "a2p:professional"],
            "agent_profile": AgentProfile(
                id="did:a2p:agent:local:local:untrusted-bot",
                profile_type="agent",
                identity={"name": "New Bot"},
                operator={"name": "StartupCo"},
                a2p_support={"protocol_version": "1.0"},
                trust_metrics={"community_score": 0.3},
            ),
            "description": "Low-trust Bot",
        },
    ]

    for test in test_cases:
        print(f"   🤖 {test['description']}")
        print(f"      DID: {test['did']}")
        print(f"      Requested: [{', '.join(test['scopes'])}]")

        await user.load_profile(profile.id)
        current_profile = user.get_profile()

        result = evaluate_access(
            current_profile,
            test["did"],
            test["scopes"],
            test["agent_profile"]
        )

        if result.granted:
            print("      ✅ GRANTED")
            print(f"      Allowed: [{', '.join(result.allowed_scopes)}]")
            if result.denied_scopes:
                print(f"      Denied: [{', '.join(result.denied_scopes)}]")
            print(f"      Policy: {result.matched_policy.name if result.matched_policy else 'N/A'}")
        else:
            print("      ❌ DENIED - No matching policy")
        print()

    # ============================================
    # 4. Show Policy Summary
    # ============================================
    print("4️⃣ Policy Summary:\n")
    print("   ┌─────────────────────────┬───────────────────────┬──────────────────┐")
    print("   │ Policy                  │ Pattern               │ Priority         │")
    print("   ├─────────────────────────┼───────────────────────┼──────────────────┤")

    await user.load_profile(profile.id)
    final_profile = user.get_profile()

    for policy in final_profile.access_policies or []:
        name = (policy.name or "Unnamed").ljust(23)
        pattern = policy.agent_pattern.ljust(21)
        priority = str(policy.priority).ljust(16)
        print(f"   │ {name} │ {pattern} │ {priority} │")

    print("   └─────────────────────────┴───────────────────────┴──────────────────┘\n")

    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Example Complete!")
    print("═══════════════════════════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(main())
