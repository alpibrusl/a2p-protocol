"""
Example 02: Agent Integration

This example shows how to build an AI agent that uses a2p profiles.
"""

import asyncio
from a2p import (
    create_user_client,
    create_agent_client,
    add_policy,
    PermissionLevel,
    MemoryStorage,
)


# Shared storage (in production, this would be a real storage backend)
shared_storage = MemoryStorage()


async def setup_user_profile() -> str:
    print("👤 Setting up user profile...\n")

    user = create_user_client(shared_storage)
    profile = await user.create_profile(display_name="Alice")

    # Add some memories
    await user.add_memory(
        content="Senior Software Engineer specializing in Python",
        category="a2p:professional",
    )

    await user.add_memory(
        content="Interested in AI, distributed systems, and open source",
        category="a2p:interests.topics",
    )

    await user.add_memory(
        content="Prefers detailed technical explanations with code examples",
        category="a2p:preferences.communication",
    )

    # Add an access policy for our agent
    current_profile = user.get_profile()
    updated_profile = add_policy(
        current_profile,
        agent_pattern="did:a2p:agent:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.*", "a2p:professional.*", "a2p:interests.*"],
        deny=["a2p:health.*", "a2p:financial.*"],
        name="Allow AI Assistants",
    )

    await shared_storage.set(profile.id, updated_profile)

    print(f"   ✅ User profile created: {profile.id}")
    print("   ✅ Added professional info, interests, and preferences")
    print("   ✅ Configured access policy for agents\n")

    return profile.id


async def run_agent(user_did: str):
    print("🤖 Running AI Agent...\n")

    # Create agent client
    agent = create_agent_client(
        agent_did="did:a2p:agent:local:coding-assistant",
        storage=shared_storage,
    )

    # ============================================
    # 1. Request Profile Access
    # ============================================
    print("1️⃣ Requesting profile access...")

    try:
        profile = await agent.get_profile(
            user_did=user_did,
            scopes=["a2p:preferences", "a2p:professional", "a2p:interests"],
        )

        print("   ✅ Access granted!")
        print("   📋 Retrieved profile data for prompts\n")

        # ============================================
        # 2. Build Personalized Prompt
        # ============================================
        print("2️⃣ Building personalized prompt...")

        memories = profile.get("memories", {}).get("a2p:episodic", [])
        context_lines = "\n".join(f"- {m['content']}" for m in memories)

        system_prompt = f"""You are a helpful coding assistant.

What you know about the user:
{context_lines}

Use this context to personalize your responses. Match their communication preferences."""

        print("\n   📝 System Prompt:")
        print("   ─────────────────────────────────────────")
        for line in system_prompt.split("\n"):
            print(f"   {line}")
        print("   ─────────────────────────────────────────\n")

        # ============================================
        # 3. Simulate Conversation & Learn
        # ============================================
        print("3️⃣ Simulating conversation...")
        print('   User: "Can you help me with Python async programming?"')
        print("   Agent: \"I'd be happy to help! Given your Python background...")
        print("          [provides detailed technical explanation with code]\n")

        # ============================================
        # 4. Propose New Memory
        # ============================================
        print("4️⃣ Proposing new memory from conversation...")

        proposal = await agent.propose_memory(
            user_did=user_did,
            content="Interested in Python async/await patterns",
            category="a2p:interests.topics",
            confidence=0.85,
            context="User asked about Python async programming",
        )

        print(f"   ✅ Memory proposed: {proposal['proposal_id']}")
        print(f"   📬 Status: {proposal['status']} (awaiting user review)\n")

    except PermissionError as e:
        print(f"   ❌ Access denied: {e}")


async def review_proposals(user_did: str):
    print("👤 User reviewing proposals...\n")

    user = create_user_client(shared_storage)
    await user.load_profile(user_did)

    proposals = user.get_pending_proposals()
    print(f"   📬 Found {len(proposals)} pending proposal(s)\n")

    for proposal in proposals:
        print(f"   Proposal from: {proposal.proposed_by.get('agentDid')}")
        print(f'   Content: "{proposal.memory.content}"')
        print(f"   Confidence: {(proposal.memory.confidence or 0) * 100}%")
        print(f"   Context: {proposal.context}\n")

        # Approve the proposal
        memory = await user.approve_proposal(proposal.id)
        print(f"   ✅ Approved! Memory saved: {memory.id}\n")


async def main():
    print("═══════════════════════════════════════════════════════════")
    print("           🚀 a2p Example: Agent Integration")
    print("═══════════════════════════════════════════════════════════\n")

    # Setup
    user_did = await setup_user_profile()

    # Agent interaction
    await run_agent(user_did)

    # User reviews proposals
    await review_proposals(user_did)

    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Example Complete!")
    print("═══════════════════════════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(main())
