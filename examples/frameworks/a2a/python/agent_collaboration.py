"""
A2A Protocol + a2p: Multi-Agent Collaboration with User Context

A demonstration of how A2A (Agent-to-Agent) protocol messages can carry
a2p user context, enabling personalized multi-agent workflows.

Key Integration:
- A2A: Standard for agent-to-agent communication
- a2p: User profiles that travel with A2A messages

Requires: OPENAI_API_KEY environment variable
"""

import os
import asyncio
from typing import Dict, List, Any, Optional
from dataclasses import dataclass
from enum import Enum

from openai import OpenAI

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
        display_name="Research Lead",
        preferences={"language": "en"}
    )

    # Add user preferences
    await user.add_memory(
        content="ML researcher focusing on sustainable AI and efficient computing",
        category="a2p:professional",
    )
    await user.add_memory(
        content="Prefers technical depth with environmental impact analysis",
        category="a2p:preferences.communication",
    )
    await user.add_memory(
        content="Writing a paper on green AI practices",
        category="a2p:context.projects",
    )
    await user.add_memory(
        content="Interested in energy-efficient ML architectures",
        category="a2p:interests.topics",
    )

    # Allow agents to read and propose
    current = user.get_profile()
    updated = add_policy(
        current,
        agent_pattern="did:a2p:agent:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.*", "a2p:professional.*", "a2p:context.*", "a2p:interests.*"],
        name="Allow A2A agents",
    )
    await storage.set(profile.id, updated)

    return profile.id


async def load_user_context_summary(user_did: str) -> str:
    """Load summarized user context for A2A messages."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:a2a-orchestrator",
        storage=storage,
    )

    profile = await agent.get_profile(
        user_did=user_did,
        scopes=["a2p:preferences", "a2p:professional", "a2p:context", "a2p:interests"],
    )

    # Create concise summary for A2A transport
    memories = profile.memories.episodic if profile.memories else []
    parts = []
    for memory in memories:
        category_short = memory.category.split(":")[-1].split(".")[-1]
        parts.append(f"{category_short}: {memory.content}")

    return " | ".join(parts)


async def propose_finding(user_did: str, finding: str):
    """Propose a finding to the user's profile."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:a2a-orchestrator",
        storage=storage,
    )

    await agent.propose_memory(
        user_did=user_did,
        content=finding,
        category="a2p:interests.discovered",
        confidence=0.75,
        context="Discovered via A2A agent collaboration",
    )


# ============================================
# A2A Message Types with a2p Context
# ============================================

class A2AMessageType(str, Enum):
    TASK = "task"
    TASK_RESULT = "task_result"
    STATUS = "status"


@dataclass
class A2PContextPayload:
    """a2p context that travels with A2A messages."""
    user_did: str
    context_summary: str

    def to_dict(self) -> Dict:
        return {
            "a2p_version": "1.0",
            "user_did": self.user_did,
            "context": self.context_summary,
        }


@dataclass
class A2AMessage:
    """A2A message with embedded a2p context."""
    type: A2AMessageType
    sender: str
    content: Dict[str, Any]
    a2p_context: Optional[A2PContextPayload] = None

    def to_dict(self) -> Dict:
        msg = {
            "type": self.type.value,
            "sender": self.sender,
            "content": self.content,
        }
        if self.a2p_context:
            msg["metadata"] = {"a2p": self.a2p_context.to_dict()}
        return msg


# ============================================
# A2A Agent Implementation
# ============================================

class A2AAgent:
    """An A2A-compatible agent that respects a2p context."""

    def __init__(self, name: str, role: str, client: OpenAI):
        self.name = name
        self.role = role
        self.client = client

    def _build_system_prompt(self, a2p_context: Optional[A2PContextPayload]) -> str:
        base = f"""You are a {self.role}. Provide expert analysis and insights."""

        if a2p_context:
            return f"""{base}

USER CONTEXT (from a2p profile attached to A2A message):
{a2p_context.context_summary}

Personalize your response based on this context."""

        return base

    async def process(self, message: A2AMessage) -> A2AMessage:
        """Process an A2A message with user context."""
        print(f"\n   [{self.name}] Processing task from {message.sender}")

        if message.a2p_context:
            print(f"   [{self.name}] User context: {message.a2p_context.context_summary[:60]}...")

        # Build prompt with context
        system = self._build_system_prompt(message.a2p_context)

        # Call LLM
        response = self.client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": str(message.content.get("task", message.content))},
            ],
            max_tokens=1024,
        )

        result = response.choices[0].message.content

        # Return result with context preserved
        return A2AMessage(
            type=A2AMessageType.TASK_RESULT,
            sender=self.name,
            content={"result": result},
            a2p_context=message.a2p_context,  # Context flows through!
        )


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
    print("     🚀 A2A Protocol + a2p: Multi-Agent Collaboration")
    print("═══════════════════════════════════════════════════════════\n")
    print("Demonstrating how a2p user context flows through A2A messages\n")

    # Setup
    print("1️⃣ Setting up user profile...")
    user_did = await setup_user_profile()
    print(f"   ✅ Created profile: {user_did}\n")

    print("2️⃣ Loading user context for A2A transport...")
    context_summary = await load_user_context_summary(user_did)
    print(f"   📋 Context: {context_summary[:80]}...\n")

    # Create a2p payload for A2A
    a2p_payload = A2PContextPayload(
        user_did=user_did,
        context_summary=context_summary,
    )

    # Initialize agents
    print("3️⃣ Creating A2A agents...")
    client = OpenAI()

    research_agent = A2AAgent("ResearchAgent", "research specialist", client)
    analysis_agent = A2AAgent("AnalysisAgent", "analysis expert", client)
    summary_agent = A2AAgent("SummaryAgent", "summarization expert", client)

    print("   ✅ ResearchAgent created")
    print("   ✅ AnalysisAgent created")
    print("   ✅ SummaryAgent created\n")

    # Run pipeline
    topic = "Energy-efficient training techniques for large language models"
    print(f"4️⃣ Research topic: {topic}\n")

    print("═══════════════════════════════════════════════════════════")
    print("   🔬 Running A2A pipeline with a2p context...")
    print("═══════════════════════════════════════════════════════════")

    # Step 1: Research
    print("\n[STEP 1] User → ResearchAgent (A2A task with a2p context)")
    initial_message = A2AMessage(
        type=A2AMessageType.TASK,
        sender="UserInterface",
        content={"task": f"Research: {topic}"},
        a2p_context=a2p_payload,
    )
    research_result = await research_agent.process(initial_message)

    # Step 2: Analysis (context flows!)
    print("\n[STEP 2] ResearchAgent → AnalysisAgent (a2p context preserved)")
    analysis_message = A2AMessage(
        type=A2AMessageType.TASK,
        sender="ResearchAgent",
        content={"task": f"Analyze: {research_result.content['result'][:1000]}"},
        a2p_context=research_result.a2p_context,  # Context preserved!
    )
    analysis_result = await analysis_agent.process(analysis_message)

    # Step 3: Summary (context still there!)
    print("\n[STEP 3] AnalysisAgent → SummaryAgent (a2p context preserved)")
    summary_message = A2AMessage(
        type=A2AMessageType.TASK,
        sender="AnalysisAgent",
        content={"task": f"Summarize: {analysis_result.content['result'][:1000]}"},
        a2p_context=analysis_result.a2p_context,  # Context preserved!
    )
    summary_result = await summary_agent.process(summary_message)

    # Output
    print("\n═══════════════════════════════════════════════════════════")
    print("   📄 FINAL RESULT (personalized for sustainable AI researcher)")
    print("═══════════════════════════════════════════════════════════\n")
    print(summary_result.content["result"][:1000])
    print()

    # Propose finding
    print("5️⃣ Proposing finding to user profile...")
    await propose_finding(
        user_did=user_did,
        finding="Researched energy-efficient LLM training techniques via A2A agents",
    )
    print("   ✅ Finding proposed!\n")

    print("═══════════════════════════════════════════════════════════")
    print("   WHAT HAPPENED")
    print("═══════════════════════════════════════════════════════════")
    print("""
✓ User's a2p profile loaded ONCE at the start
✓ Context attached to initial A2A message metadata
✓ Each agent received the SAME user preferences via A2A
✓ All agents personalized responses for sustainable AI focus
✓ Context flowed through entire agent chain via A2A protocol
""")

    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Collaboration Complete!")
    print("═══════════════════════════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(main())
