"""
Example 03: Memory Proposals

This example demonstrates the memory proposal workflow.
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
    print("🚀 a2p Example: Memory Proposals\n")

    # ============================================
    # Setup: Create user with policy
    # ============================================
    print("📋 Setting up user profile...\n")

    user = create_user_client(storage)
    profile = await user.create_profile(display_name="Bob")

    # Add policy allowing agent proposals
    profile = add_policy(
        profile,
        agent_pattern="did:a2p:agent:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:*"],
        deny=["a2p:health.*"],
        name="Allow proposals",
    )
    await storage.set(profile.id, profile)
    await user.load_profile(profile.id)

    user_did = profile.id
    print(f"   User: {user_did}\n")

    # ============================================
    # Agent proposes multiple memories
    # ============================================
    print("🤖 Agent proposing memories...\n")

    agent = create_agent_client(
        agent_did="did:a2p:agent:local:assistant",
        storage=storage
    )

    # Proposal 1: Will be approved as-is
    await agent.propose_memory(
        user_did=user_did,
        content="Prefers dark mode in all applications",
        category="a2p:preferences.ui",
        confidence=0.9,
        context="User mentioned this explicitly",
    )
    print("   ✅ Proposed: Dark mode preference")

    # Proposal 2: Will be approved with edits
    await agent.propose_memory(
        user_did=user_did,
        content="Lives in Spain",
        category="a2p:identity.location",
        confidence=0.7,
        context="Inferred from timezone discussion",
    )
    print("   ✅ Proposed: Location (will be edited)")

    # Proposal 3: Will be rejected
    await agent.propose_memory(
        user_did=user_did,
        content="Dislikes Python programming",
        category="a2p:interests",
        confidence=0.5,
        context="Seemed frustrated with Python syntax",
    )
    print("   ✅ Proposed: Python dislike (will be rejected)\n")

    # ============================================
    # User reviews proposals
    # ============================================
    print("👤 User reviewing proposals...\n")

    # Reload profile to see proposals
    await user.load_profile(user_did)
    proposals = user.get_pending_proposals()
    print(f"   📬 {len(proposals)} pending proposals\n")

    for proposal in proposals:
        print("   ─────────────────────────────────────────")
        print(f'   📝 "{proposal.memory.content}"')
        print(f"   Category: {proposal.memory.category}")
        print(f"   Confidence: {int((proposal.memory.confidence or 0) * 100)}%")
        print(f"   Context: {proposal.context}")

        # Decision based on content
        if "dark mode" in proposal.memory.content:
            # Approve as-is
            memory = await user.approve_proposal(proposal.id)
            print(f"   ✅ APPROVED → {memory.id}")
        elif "Spain" in proposal.memory.content:
            # Approve with edits
            memory = await user.approve_proposal(
                proposal.id,
                edited_content="Lives in Barcelona, Spain"
            )
            print(f"   ✏️ APPROVED WITH EDITS → {memory.id}")
            print(f'   New content: "{memory.content}"')
        elif "Python" in proposal.memory.content:
            # Reject
            await user.reject_proposal(
                proposal.id,
                reason="Incorrect - I actually like Python!"
            )
            print('   ❌ REJECTED: "Incorrect - I actually like Python!"')
        print()

    # ============================================
    # View final profile
    # ============================================
    print("📊 Final profile memories:\n")

    await user.load_profile(user_did)
    final_profile = user.get_profile()
    memories = final_profile.memories.episodic if final_profile and final_profile.memories else []

    approved_count = len([m for m in memories if m.status == "approved"])
    print(f"   Total approved memories: {approved_count}")
    for memory in memories:
        if memory.status == "approved":
            print(f"   ✅ [{memory.category}] {memory.content}")

    print("\n✨ Example complete!")


if __name__ == "__main__":
    asyncio.run(main())
