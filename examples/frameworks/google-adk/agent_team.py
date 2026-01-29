"""
Google ADK + a2p: Personalized Agent Team

A real Google ADK agent team that uses a2p profiles for personalization.
Requires: GOOGLE_API_KEY environment variable
"""

import os
import asyncio
from typing import Dict

from google import genai
from google.adk import Agent, Runner

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
    """Create a user profile with preferences."""
    user = A2PUserClient(storage)
    profile = await user.create_profile(
        display_name="Tech Lead",
        preferences={"language": "en", "timezone": "America/New_York"}
    )

    # Add user preferences
    await user.add_memory(
        content="Tech Lead with expertise in distributed systems and cloud architecture",
        category="a2p:professional",
    )
    await user.add_memory(
        content="Prefers detailed technical explanations with trade-off analysis",
        category="a2p:preferences.communication",
    )
    await user.add_memory(
        content="Currently migrating monolith to microservices on GCP",
        category="a2p:context.projects",
    )
    await user.add_memory(
        content="Uses Go, gRPC, Kubernetes, and Terraform",
        category="a2p:preferences.tools",
    )
    await user.add_memory(
        content="Values observability, reliability, and clean interfaces",
        category="a2p:interests.topics",
    )

    # Allow agents to read and propose
    current = user.get_profile()
    updated = add_policy(
        current,
        agent_pattern="did:a2p:agent:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.*", "a2p:professional.*", "a2p:context.*", "a2p:interests.*"],
        name="Allow ADK agents",
    )
    await storage.set(profile.id, updated)

    return profile.id


async def load_user_context(user_did: str) -> Dict:
    """Load user context from a2p profile for agents."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:adk-team",
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


async def propose_learning(user_did: str, content: str, topic: str):
    """Propose a learning to the user's profile."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:adk-team",
        storage=storage,
    )

    await agent.propose_memory(
        user_did=user_did,
        content=content,
        category="a2p:interests.discovered",
        confidence=0.75,
        context=f"Learned during design session on {topic}",
    )


# ============================================
# Google ADK Agent Team
# ============================================

def build_agent_instruction(role: str, base: str, user_context: Dict) -> str:
    """Build personalized agent instruction."""
    return f"""{base}

USER PROFILE (personalize your responses for this user):
Background: {user_context['professional']}
Preferences: {user_context['preferences']}
Current Projects: {user_context['projects']}
Values: {user_context['interests']}

Key guidelines:
- User is a tech lead, provide senior-level technical depth
- Focus on Go, gRPC, and Kubernetes where relevant
- Consider their microservices migration project context
- Include trade-off analysis in recommendations"""


async def main():
    # Check for API key
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("❌ Error: GOOGLE_API_KEY environment variable not set")
        print("   Run: export GOOGLE_API_KEY='your-api-key'")
        return

    print("═══════════════════════════════════════════════════════════")
    print("     🚀 Google ADK + a2p: Personalized Agent Team")
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

    # Initialize Gemini client for ADK
    print("3️⃣ Initializing Google ADK...")
    client = genai.Client(api_key=api_key)

    # Create agents with personalized instructions
    architect = Agent(
        name="SystemArchitect",
        model="gemini-2.0-flash",
        instruction=build_agent_instruction(
            "architect",
            """You are a system architecture expert.
Analyze requirements and propose technical solutions.
Consider scalability, maintainability, and operational excellence.""",
            user_context,
        ),
    )

    developer = Agent(
        name="Developer",
        model="gemini-2.0-flash",
        instruction=build_agent_instruction(
            "developer",
            """You are a senior developer specializing in Go and distributed systems.
Implement solutions based on architecture decisions.
Write clean, idiomatic Go code with proper error handling.""",
            user_context,
        ),
    )

    reviewer = Agent(
        name="CodeReviewer",
        model="gemini-2.0-flash",
        instruction=build_agent_instruction(
            "reviewer",
            """You are a code review expert focusing on production readiness.
Review implementations for quality, security, and performance.
Verify observability and operational concerns are addressed.""",
            user_context,
        ),
    )

    print("   ✅ SystemArchitect created")
    print("   ✅ Developer created")
    print("   ✅ CodeReviewer created\n")

    # Design task
    requirement = "API rate limiting service with Redis for the microservices migration"
    print(f"4️⃣ Design task: {requirement}\n")

    print("═══════════════════════════════════════════════════════════")
    print("   🔬 Running design pipeline...")
    print("═══════════════════════════════════════════════════════════\n")

    # Step 1: Architecture
    print("[SystemArchitect] Designing solution...")
    arch_runner = Runner(agent=architect, app_name="architect-app", client=client)
    arch_response = await arch_runner.run(
        f"Design a solution for: {requirement}"
    )
    arch_result = arch_response.text
    print(f"   ✅ Architecture complete\n")

    # Step 2: Implementation
    print("[Developer] Implementing in Go...")
    dev_runner = Runner(agent=developer, app_name="developer-app", client=client)
    dev_response = await dev_runner.run(
        f"Implement based on this architecture:\n\n{arch_result[:2000]}"
    )
    dev_result = dev_response.text
    print(f"   ✅ Implementation complete\n")

    # Step 3: Review
    print("[CodeReviewer] Reviewing for production...")
    review_runner = Runner(agent=reviewer, app_name="reviewer-app", client=client)
    review_response = await review_runner.run(
        f"Review this implementation:\n\n{dev_result[:2000]}"
    )
    review_result = review_response.text
    print(f"   ✅ Review complete\n")

    # Output
    print("═══════════════════════════════════════════════════════════")
    print("   📄 ARCHITECTURE (excerpt)")
    print("═══════════════════════════════════════════════════════════\n")
    print(arch_result[:800])
    print("\n[... truncated ...]\n")

    print("═══════════════════════════════════════════════════════════")
    print("   📄 REVIEW SUMMARY")
    print("═══════════════════════════════════════════════════════════\n")
    print(review_result[:600])
    print()

    # Propose learning
    print("5️⃣ Proposing learnings to user profile...")
    await propose_learning(
        user_did=user_did,
        content="Explored Redis-based rate limiting patterns for gRPC services",
        topic=requirement,
    )
    print("   ✅ Learning proposed!\n")

    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Design Session Complete!")
    print("═══════════════════════════════════════════════════════════\n")
    print("✓ All agents shared the same user context from a2p")
    print("✓ Responses were personalized for tech lead with Go expertise")


if __name__ == "__main__":
    asyncio.run(main())
