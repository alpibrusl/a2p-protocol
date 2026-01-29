"""
CrewAI + a2p: Personalized Research Crew

A real CrewAI crew that uses a2p profiles for personalization.
Requires: OPENAI_API_KEY environment variable
"""

import os
import asyncio
from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool

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
    """Create a researcher's profile with their interests and preferences."""
    user = A2PUserClient(storage)
    profile = await user.create_profile(
        display_name="Dr. Sarah Chen",
        preferences={"language": "en"}
    )

    # Add research context
    await user.add_memory(
        content="PhD in Machine Learning, specializing in transformer architectures",
        category="a2p:professional",
    )
    await user.add_memory(
        content="Currently researching attention mechanisms and efficient transformers",
        category="a2p:context.research",
    )
    await user.add_memory(
        content="Prefers academic writing style with proper citations",
        category="a2p:preferences.communication",
    )
    await user.add_memory(
        content="Interested in: sparse attention, linear transformers, MoE architectures",
        category="a2p:interests.topics",
    )
    await user.add_memory(
        content="Publishes in NeurIPS, ICML, and ACL conferences",
        category="a2p:professional.publishing",
    )

    # Allow agents to read and propose
    current = user.get_profile()
    updated = add_policy(
        current,
        agent_pattern="did:a2p:agent:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.*", "a2p:professional.*", "a2p:context.*", "a2p:interests.*"],
        name="Allow research crew",
    )
    await storage.set(profile.id, updated)

    return profile.id


async def load_user_context(user_did: str) -> dict:
    """Load user context from a2p profile for crew agents."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:crewai-research",
        storage=storage,
    )

    profile = await agent.get_profile(
        user_did=user_did,
        scopes=["a2p:preferences", "a2p:professional", "a2p:context", "a2p:interests"],
    )

    # Organize memories by category
    context = {
        "expertise": "",
        "interests": "",
        "style": "",
        "current_research": "",
    }

    memories = profile.memories.episodic if profile.memories else []
    for memory in memories:
        if "professional" in memory.category:
            context["expertise"] += f"- {memory.content}\n"
        elif "interests" in memory.category:
            context["interests"] += f"- {memory.content}\n"
        elif "preferences" in memory.category:
            context["style"] += f"- {memory.content}\n"
        elif "context" in memory.category:
            context["current_research"] += f"- {memory.content}\n"

    return context


async def propose_research_finding(user_did: str, finding: str, topic: str):
    """Propose a research finding to the user's profile."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:crewai-research",
        storage=storage,
    )

    await agent.propose_memory(
        user_did=user_did,
        content=finding,
        category=f"a2p:interests.discovered",
        confidence=0.75,
        context=f"Discovered during research on {topic}",
    )


# ============================================
# CrewAI Crew Definition
# ============================================

def create_research_crew(user_context: dict, research_topic: str):
    """Create a personalized research crew based on user's profile."""

    # Build personalized backstories
    researcher_backstory = f"""You are a senior research scientist helping a colleague.

YOUR COLLEAGUE'S BACKGROUND:
{user_context['expertise']}

THEIR CURRENT RESEARCH:
{user_context['current_research']}

THEIR INTERESTS:
{user_context['interests']}

Adapt your research to align with their expertise and interests. Focus on papers
and findings that would be relevant to their specific research direction."""

    analyst_backstory = f"""You are a research analyst helping to synthesize findings.

YOU'RE WORKING WITH A RESEARCHER WHO:
{user_context['expertise']}

THEY PREFER:
{user_context['style']}

Structure your analysis to match their preferred communication style and
academic standards. Focus on actionable insights for their research."""

    writer_backstory = f"""You are a technical writer creating research summaries.

THE RESEARCHER'S BACKGROUND:
{user_context['expertise']}

THEIR WRITING PREFERENCES:
{user_context['style']}

Write in a style that matches their preferences. Use appropriate academic
conventions and terminology for their field."""

    # Create agents
    researcher = Agent(
        role="Senior Research Scientist",
        goal=f"Find the most relevant and recent research on {research_topic}",
        backstory=researcher_backstory,
        verbose=True,
        allow_delegation=False,
        tools=[SerperDevTool()] if os.getenv("SERPER_API_KEY") else [],
    )

    analyst = Agent(
        role="Research Analyst",
        goal="Analyze and synthesize research findings into actionable insights",
        backstory=analyst_backstory,
        verbose=True,
        allow_delegation=False,
    )

    writer = Agent(
        role="Technical Writer",
        goal="Create a comprehensive yet concise research summary",
        backstory=writer_backstory,
        verbose=True,
        allow_delegation=False,
    )

    # Create tasks
    research_task = Task(
        description=f"""Research recent advances in {research_topic}.

        Focus on:
        1. Papers from the last 2 years
        2. Key researchers and labs working on this
        3. Novel techniques and approaches
        4. Connections to the user's current research interests

        Find at least 5 relevant papers or resources.""",
        expected_output="A list of 5+ relevant papers/resources with summaries",
        agent=researcher,
    )

    analysis_task = Task(
        description=f"""Analyze the research findings on {research_topic}.

        Provide:
        1. Key themes and trends
        2. Gaps in current research
        3. Potential research directions
        4. How this connects to the user's work on efficient transformers""",
        expected_output="A structured analysis with themes, gaps, and recommendations",
        agent=analyst,
    )

    summary_task = Task(
        description=f"""Write a research brief on {research_topic}.

        Include:
        1. Executive summary (2-3 sentences)
        2. Key findings (bullet points)
        3. Relevance to user's research
        4. Suggested next steps

        Write in academic style with proper formatting.""",
        expected_output="A 1-page research brief in academic style",
        agent=writer,
    )

    # Create crew
    crew = Crew(
        agents=[researcher, analyst, writer],
        tasks=[research_task, analysis_task, summary_task],
        process=Process.sequential,
        verbose=True,
    )

    return crew


# ============================================
# Main Application
# ============================================

async def main():
    # Check for API key
    if not os.getenv("OPENAI_API_KEY"):
        print("❌ Error: OPENAI_API_KEY environment variable not set")
        print("   Run: export OPENAI_API_KEY='sk-your-key-here'")
        return

    print("═══════════════════════════════════════════════════════════")
    print("     🚀 CrewAI + a2p: Personalized Research Crew")
    print("═══════════════════════════════════════════════════════════\n")

    # Setup
    print("1️⃣ Setting up researcher profile...")
    user_did = await setup_user_profile()
    print(f"   ✅ Created profile: {user_did}\n")

    print("2️⃣ Loading user context for crew agents...")
    user_context = await load_user_context(user_did)
    print("   📋 Expertise:", user_context["expertise"][:100], "...")
    print("   📋 Interests:", user_context["interests"][:100], "...")
    print()

    # Get research topic
    research_topic = "linear attention mechanisms in transformers"
    print(f"3️⃣ Research topic: {research_topic}\n")

    # Create personalized crew
    print("4️⃣ Creating personalized research crew...")
    crew = create_research_crew(user_context, research_topic)
    print("   ✅ Crew ready with 3 agents\n")

    # Execute
    print("═══════════════════════════════════════════════════════════")
    print("   🔬 Starting research... (this may take a few minutes)")
    print("═══════════════════════════════════════════════════════════\n")

    result = crew.kickoff()

    print("\n═══════════════════════════════════════════════════════════")
    print("   📄 RESEARCH BRIEF")
    print("═══════════════════════════════════════════════════════════\n")
    print(result)

    # Propose findings to profile
    print("\n5️⃣ Proposing research findings to user profile...")
    await propose_research_finding(
        user_did=user_did,
        finding="Interested in linear attention as alternative to softmax attention",
        topic=research_topic,
    )
    print("   ✅ Finding proposed! (User would review in their a2p app)\n")

    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Research Complete!")
    print("═══════════════════════════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(main())
