"""
Example 05: LangGraph Chatbot with a2p Memory

This example shows how to integrate a2p with LangGraph for
a personalized chatbot experience.

Note: This is a simplified example. In production, you would
integrate with actual LangGraph and an LLM provider.
"""

import asyncio
from a2p import (
    create_user_client,
    add_policy,
    PermissionLevel,
    MemoryStorage,
)
from a2p_langgraph import A2PMemorySaver, format_user_context_for_prompt


# Shared storage
storage = MemoryStorage()


async def setup_user() -> str:
    print("👤 Setting up user profile...\n")

    user = create_user_client(storage)
    profile = await user.create_profile(display_name="Charlie")

    # Add some initial context
    await user.add_memory(
        content="Software developer with 5 years experience",
        category="a2p:professional",
    )

    await user.add_memory(
        content="Prefers concise, technical responses",
        category="a2p:preferences.communication",
    )

    await user.add_memory(
        content="Currently learning Rust and WebAssembly",
        category="a2p:context.currentProjects",
    )

    # Add agent access policy
    current_profile = user.get_profile()
    updated_profile = add_policy(
        current_profile,
        agent_pattern="did:a2p:agent:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.*", "a2p:professional.*", "a2p:context.*", "a2p:interests.*"],
        name="Allow chatbot",
    )
    await storage.set(profile.id, updated_profile)

    print(f"   ✅ Created user: {profile.id}\n")
    return profile.id


async def run_chatbot(user_did: str):
    print("🤖 Starting LangGraph Chatbot with a2p Memory\n")
    print("═══════════════════════════════════════════════════════════\n")

    # Create a2p memory saver for LangGraph
    memory_saver = A2PMemorySaver(
        agent_did="did:a2p:agent:local:langgraph-chatbot",
        storage=storage,
        default_scopes=["a2p:preferences", "a2p:professional", "a2p:context"],
        auto_propose=True,
    )

    # ============================================
    # 1. Load User Context
    # ============================================
    print("1️⃣ Loading user context...\n")

    user_context = await memory_saver.load_user_context(user_did)
    context_string = format_user_context_for_prompt(user_context)

    print("   📋 User context loaded:")
    print("   ─────────────────────────────────────────")
    for line in context_string.split("\n"):
        print(f"   {line}")
    print("   ─────────────────────────────────────────\n")

    # ============================================
    # 2. Simulate Chat Conversation
    # ============================================
    print("2️⃣ Simulating conversation...\n")

    conversation = [
        {"role": "user", "content": "Hi! Can you help me with async/await in Rust?"},
        {"role": "assistant", "content": "Of course! Since you're learning Rust, I'll be concise. Here's the key concept: async functions return a Future that must be .await'ed..."},
        {"role": "user", "content": "I prefer using tokio as my runtime"},
        {"role": "assistant", "content": "Great choice! Tokio is the most popular async runtime. Here's a quick example..."},
    ]

    for msg in conversation:
        icon = "👤" if msg["role"] == "user" else "🤖"
        print(f"   {icon} {msg['role']}: {msg['content'][:60]}...")
    print()

    # ============================================
    # 3. Extract and Propose Memories
    # ============================================
    print("3️⃣ Proposing memories from conversation...\n")

    # Agent noticed user mentioned Tokio preference
    await memory_saver.propose_memory(
        user_did,
        "Prefers Tokio runtime for Rust async programming",
        category="a2p:preferences.development",
        confidence=0.85,
        context="User explicitly stated preference during Rust async discussion",
    )
    print("   ✅ Proposed: Tokio runtime preference")

    # Agent inferred ongoing interest
    await memory_saver.propose_memory(
        user_did,
        "Actively working on async Rust programming",
        category="a2p:context.currentProjects",
        confidence=0.75,
        context="User asked detailed questions about Rust async/await",
    )
    print("   ✅ Proposed: Async Rust focus\n")

    # ============================================
    # 4. Show Pending Proposals
    # ============================================
    print("4️⃣ Pending proposals for user review:\n")

    user = create_user_client(storage)
    await user.load_profile(user_did)

    proposals = user.get_pending_proposals()
    for proposal in proposals:
        print(f'   📝 "{proposal.memory.content}"')
        print(f"      Category: {proposal.memory.category}")
        print(f"      Confidence: {int((proposal.memory.confidence or 0) * 100)}%")
        print()

    # ============================================
    # 5. User Approves (in real app, async)
    # ============================================
    print("5️⃣ User approving proposals...\n")

    for proposal in proposals:
        await user.approve_proposal(proposal.id)
        print(f"   ✅ Approved: {proposal.memory.content}")

    print("\n═══════════════════════════════════════════════════════════")
    print("                    ✨ Example Complete!")
    print("═══════════════════════════════════════════════════════════\n")


async def main():
    print("═══════════════════════════════════════════════════════════")
    print("        🚀 a2p Example: LangGraph Chatbot with Memory")
    print("═══════════════════════════════════════════════════════════\n")

    user_did = await setup_user()
    await run_chatbot(user_did)


if __name__ == "__main__":
    asyncio.run(main())
