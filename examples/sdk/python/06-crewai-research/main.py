"""
Example 06: CrewAI Research Crew with a2p Memory

This example shows how to integrate a2p with CrewAI for
personalized multi-agent research crews.

Note: This is a simplified example. In production, you would
integrate with actual CrewAI and an LLM provider.
"""

import asyncio
from a2p import (
    create_user_client,
    add_policy,
    PermissionLevel,
    MemoryStorage,
)
from a2p_crewai import create_crew_memory


# Shared storage
storage = MemoryStorage()


async def setup_user() -> str:
    print("👤 Setting up user profile...\n")

    user = create_user_client(storage)
    profile = await user.create_profile(display_name="Diana")

    # Add research interests
    await user.add_memory(
        content="PhD researcher in Computer Science",
        category="a2p:professional",
    )

    await user.add_memory(
        content="Researching distributed systems and consensus algorithms",
        category="a2p:interests.topics",
    )

    await user.add_memory(
        content="Prefers academic writing style with citations",
        category="a2p:preferences.communication",
    )

    await user.add_memory(
        content="Currently writing a paper on Byzantine fault tolerance",
        category="a2p:context.currentProjects",
    )

    # Add agent access policy
    current_profile = user.get_profile()
    updated_profile = add_policy(
        current_profile,
        agent_pattern="did:a2p:agent:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.*", "a2p:professional.*", "a2p:context.*", "a2p:interests.*"],
        name="Allow research crew",
    )
    await storage.set(profile.id, updated_profile)

    print(f"   ✅ Created user: {profile.id}\n")
    return profile.id


async def run_research_crew(user_did: str):
    print("🔬 Starting CrewAI Research Crew with a2p Memory\n")
    print("═══════════════════════════════════════════════════════════\n")

    # Create a2p memory for the crew
    memory = create_crew_memory(
        agent_did="did:a2p:agent:local:research-crew",
        default_scopes=["a2p:preferences", "a2p:professional", "a2p:context", "a2p:interests"],
    )

    # ============================================
    # 1. Load User Context
    # ============================================
    print("1️⃣ Loading user context for crew agents...\n")

    user_context = await memory.load_user_context(user_did)

    print("   📋 User context loaded:")
    print("   ─────────────────────────────────────────")
    for line in user_context.split("\n"):
        print(f"   {line}")
    print("   ─────────────────────────────────────────\n")

    # ============================================
    # 2. Define Crew Agents (simplified)
    # ============================================
    print("2️⃣ Configuring crew agents with user context...\n")

    # In real CrewAI, you would do:
    # from crewai import Agent, Crew, Task
    #
    # researcher = Agent(
    #     role="Research Specialist",
    #     goal="Find relevant academic papers",
    #     backstory=f"You are helping a user. Context:\n{user_context}",
    # )

    agents = [
        {
            "role": "Research Specialist",
            "goal": "Find relevant academic papers on distributed systems",
            "uses_context": True,
        },
        {
            "role": "Content Analyst",
            "goal": "Analyze and summarize research findings",
            "uses_context": True,
        },
        {
            "role": "Technical Writer",
            "goal": "Write academic-style summaries with citations",
            "uses_context": True,
        },
    ]

    for agent in agents:
        print(f"   🤖 {agent['role']}")
        print(f"      Goal: {agent['goal']}")
        print(f"      Uses user context: ✅")
        print()

    # ============================================
    # 3. Simulate Crew Execution
    # ============================================
    print("3️⃣ Crew executing research task...\n")

    task = "Research recent advances in Byzantine fault tolerance algorithms"
    print(f"   📋 Task: {task}\n")

    # Simulated crew output
    steps = [
        ("Research Specialist", "Found 15 relevant papers from 2023-2024"),
        ("Content Analyst", "Identified 3 key themes: PBFT improvements, DAG-based consensus, and hybrid approaches"),
        ("Technical Writer", "Produced academic summary with 12 citations"),
    ]

    for agent_name, action in steps:
        print(f"   🤖 {agent_name}: {action}")

    print()

    # ============================================
    # 4. Propose Learned Memories
    # ============================================
    print("4️⃣ Proposing memories from research session...\n")

    # Memory about research interests
    await memory.propose_memory(
        user_did=user_did,
        content="Interested in DAG-based consensus algorithms as an alternative to PBFT",
        category="a2p:interests.topics",
        confidence=0.8,
        context="User's research task focused on BFT, DAG emerged as key theme",
    )
    print("   ✅ Proposed: DAG consensus interest")

    # Memory about working style
    await memory.propose_memory(
        user_did=user_did,
        content="Prefers comprehensive literature reviews with categorized themes",
        category="a2p:preferences.research",
        confidence=0.7,
        context="Based on the successful research output format",
    )
    print("   ✅ Proposed: Literature review preference\n")

    # ============================================
    # 5. Show Final Results
    # ============================================
    print("5️⃣ Research output (personalized for user):\n")
    print("   ─────────────────────────────────────────")
    print("   📄 Byzantine Fault Tolerance: Recent Advances")
    print("   ")
    print("   Abstract: This review examines recent developments")
    print("   in BFT algorithms, focusing on three key areas...")
    print("   ")
    print("   [Written in academic style with citations,")
    print("    matching user's stated preferences]")
    print("   ─────────────────────────────────────────\n")

    # ============================================
    # 6. User Reviews Proposals
    # ============================================
    print("6️⃣ User reviewing proposals...\n")

    user = create_user_client(storage)
    await user.load_profile(user_did)

    proposals = user.get_pending_proposals()
    print(f"   📬 {len(proposals)} proposals pending\n")

    for proposal in proposals:
        print(f"   📝 \"{proposal.memory.content}\"")
        await user.approve_proposal(proposal.id)
        print("      ✅ Approved\n")

    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Example Complete!")
    print("═══════════════════════════════════════════════════════════\n")


async def main():
    print("═══════════════════════════════════════════════════════════")
    print("      🚀 a2p Example: CrewAI Research with User Context")
    print("═══════════════════════════════════════════════════════════\n")

    user_did = await setup_user()
    await run_research_crew(user_did)


if __name__ == "__main__":
    asyncio.run(main())
