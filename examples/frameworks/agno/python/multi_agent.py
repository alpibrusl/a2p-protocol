"""
Agno + a2p: Personalized Multi-Agent Research Team

A real Agno multi-agent system that uses a2p profiles for personalization.
Requires: OPENAI_API_KEY environment variable
"""

import os
import asyncio
from typing import Dict

from agno.agent import Agent
from agno.models.openai import OpenAIChat

# a2p imports
from a2p import (
    A2PUserClient,
    A2PClient,
    MemoryStorage,
    add_policy,
    PermissionLevel,
)


# ============================================
# a2p Profile Setup
# ============================================

storage = MemoryStorage()


async def setup_user_profile() -> str:
    """Create a researcher's profile with preferences."""
    user = A2PUserClient(storage)
    profile = await user.create_profile(
        display_name="ML Researcher",
        preferences={"language": "en"}
    )

    # Add user preferences
    await user.add_memory(
        content="ML Engineer specializing in NLP and information retrieval",
        category="a2p:professional",
    )
    await user.add_memory(
        content="Prefers code examples over theoretical explanations",
        category="a2p:preferences.communication",
    )
    await user.add_memory(
        content="Currently building a production RAG system with LangChain",
        category="a2p:context.projects",
    )
    await user.add_memory(
        content="Uses PyTorch and deploys on Kubernetes",
        category="a2p:preferences.tools",
    )
    await user.add_memory(
        content="Interested in efficient inference and model optimization",
        category="a2p:interests.topics",
    )
    await user.add_memory(
        content="Values production-ready, scalable solutions",
        category="a2p:preferences.criteria",
    )

    # Allow agents to read and propose
    current = user.get_profile()
    updated = add_policy(
        current,
        agent_pattern="did:a2p:agent:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.*", "a2p:professional.*", "a2p:context.*", "a2p:interests.*"],
        name="Allow research agents",
    )
    await storage.set(profile.id, updated)

    return profile.id


async def load_user_context(user_did: str) -> Dict:
    """Load user context from a2p profile for agents."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:agno-research-team",
        storage=storage,
    )

    profile = await agent.get_profile(
        user_did=user_did,
        scopes=["a2p:preferences", "a2p:professional", "a2p:context", "a2p:interests"],
    )

    # Organize memories by category
    context = {
        "professional": "",
        "preferences": "",
        "projects": "",
        "interests": "",
    }

    memories = profile.memories.episodic if profile.memories else []
    for memory in memories:
        if "professional" in memory.category:
            context["professional"] += f"- {memory.content}\n"
        elif "preferences" in memory.category:
            context["preferences"] += f"- {memory.content}\n"
        elif "context" in memory.category:
            context["projects"] += f"- {memory.content}\n"
        elif "interests" in memory.category:
            context["interests"] += f"- {memory.content}\n"

    return context


async def propose_research_finding(user_did: str, finding: str, topic: str):
    """Propose a research finding to the user's profile."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:agno-research-team",
        storage=storage,
    )

    await agent.propose_memory(
        user_did=user_did,
        content=finding,
        category="a2p:interests.discovered",
        confidence=0.75,
        context=f"Discovered during research on {topic}",
    )


# ============================================
# Agno Agent Team
# ============================================

def build_agent_instructions(role: str, base: str, user_context: Dict) -> str:
    """Build personalized agent instructions."""
    return f"""{base}

USER PROFILE (adapt your output for this user):
Background: {user_context['professional']}
Preferences: {user_context['preferences']}
Current Projects: {user_context['projects']}
Interests: {user_context['interests']}

Key guidelines based on user profile:
- User prefers code examples over theory
- Focus on practical, production-ready solutions
- Consider their RAG system project context"""


async def main():
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY environment variable not set")
        print("   Run: export OPENAI_API_KEY='sk-your-key-here'")
        return

    print("═══════════════════════════════════════════════════════════")
    print("     🚀 Agno + a2p: Personalized Multi-Agent Research Team")
    print("═══════════════════════════════════════════════════════════\n")

    # Setup
    print("1️⃣ Setting up user profile...")
    user_did = await setup_user_profile()
    print(f"   ✅ Created profile: {user_did}\n")

    print("2️⃣ Loading user context for agents...")
    user_context = await load_user_context(user_did)
    print("   📋 User context loaded:")
    print(f"      Professional: {user_context['professional'][:80]}...")
    print(f"      Projects: {user_context['projects'][:80]}...")
    print()

    # Create agents with shared user context
    print("3️⃣ Creating research team with shared a2p context...")

    researcher = Agent(
        model=OpenAIChat(id="gpt-4o"),
        instructions=build_agent_instructions(
            "researcher",
            """You are a research specialist. Your job is to:
1. Search for relevant information on the topic
2. Identify key findings and best practices
3. Note important considerations and trade-offs

Focus on technical depth appropriate for the user's expertise level.""",
            user_context,
        ),
    )

    writer = Agent(
        model=OpenAIChat(id="gpt-4o"),
        instructions=build_agent_instructions(
            "writer",
            """You are a technical writer. Your job is to:
1. Take research findings and create clear documentation
2. Structure content logically with code examples
3. Focus on practical implementation details

Match the user's preferred style (code-focused, production-ready).""",
            user_context,
        ),
    )

    reviewer = Agent(
        model=OpenAIChat(id="gpt-4o"),
        instructions=build_agent_instructions(
            "reviewer",
            """You are a quality reviewer. Your job is to:
1. Check technical accuracy
2. Ensure content is practical and actionable
3. Verify relevance to user's current projects

Consider the user's production requirements.""",
            user_context,
        ),
    )

    print("   ✅ Researcher created")
    print("   ✅ Writer created")
    print("   ✅ Reviewer created\n")

    # Run research task
    research_topic = "Best practices for production RAG systems with hybrid search"
    print(f"4️⃣ Research topic: {research_topic}\n")

    print("═══════════════════════════════════════════════════════════")
    print("   🔬 Starting research... (this may take a minute)")
    print("═══════════════════════════════════════════════════════════\n")

    # Step 1: Research
    print("[Researcher] Gathering information...")
    research_response = researcher.run(f"Research: {research_topic}")
    research_result = research_response.content
    print(f"   ✅ Research complete ({len(research_result)} chars)\n")

    # Step 2: Write
    print("[Writer] Creating technical guide...")
    writer_response = writer.run(
        f"Write a practical guide based on this research:\n\n{research_result[:3000]}"
    )
    written_content = writer_response.content
    print(f"   ✅ Guide written ({len(written_content)} chars)\n")

    # Step 3: Review
    print("[Reviewer] Reviewing for production-readiness...")
    review_response = reviewer.run(
        f"Review this guide for a senior ML engineer:\n\n{written_content[:3000]}"
    )
    review_result = review_response.content
    print(f"   ✅ Review complete\n")

    # Output
    print("═══════════════════════════════════════════════════════════")
    print("   📄 FINAL GUIDE (excerpt)")
    print("═══════════════════════════════════════════════════════════\n")
    print(written_content[:1500])
    print("\n[... truncated for display ...]\n")

    # Propose findings
    print("5️⃣ Proposing research findings to user profile...")
    await propose_research_finding(
        user_did=user_did,
        finding="Interested in hybrid search (dense + sparse) for RAG systems",
        topic=research_topic,
    )
    print("   ✅ Finding proposed! (User would review in their a2p app)\n")

    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Research Complete!")
    print("═══════════════════════════════════════════════════════════\n")
    print("✓ All agents shared the same user context from a2p")
    print("✓ Content was personalized for senior ML engineer")
    print("✓ Focused on production-ready, code-first guidance")


if __name__ == "__main__":
    asyncio.run(main())
