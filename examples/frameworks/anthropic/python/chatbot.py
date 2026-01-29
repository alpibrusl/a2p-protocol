"""
Anthropic Claude + a2p: Personalized Chatbot

A real Claude chatbot that uses a2p profiles for personalization.
Requires: ANTHROPIC_API_KEY environment variable
"""

import os
import asyncio
from typing import List, Dict

from anthropic import Anthropic

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
        display_name="Demo User",
        preferences={"language": "en", "timezone": "America/Los_Angeles"}
    )

    # Add user preferences
    await user.add_memory(
        content="Senior Software Engineer with expertise in systems programming",
        category="a2p:professional",
    )
    await user.add_memory(
        content="Prefers technical, detailed explanations with practical examples",
        category="a2p:preferences.communication",
    )
    await user.add_memory(
        content="Currently building a high-performance API gateway in Rust",
        category="a2p:context.projects",
    )
    await user.add_memory(
        content="Uses Neovim with custom LSP configuration",
        category="a2p:preferences.tools",
    )
    await user.add_memory(
        content="Interested in formal verification and type systems",
        category="a2p:interests.topics",
    )

    # Allow agents to read and propose
    current = user.get_profile()
    updated = add_policy(
        current,
        agent_pattern="did:a2p:agent:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.*", "a2p:professional.*", "a2p:context.*", "a2p:interests.*"],
        name="Allow AI assistants",
    )
    await storage.set(profile.id, updated)

    return profile.id


async def load_user_context(user_did: str) -> str:
    """Load user context from a2p profile for the agent."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:claude-chatbot",
        storage=storage,
    )

    profile = await agent.get_profile(
        user_did=user_did,
        scopes=["a2p:preferences", "a2p:professional", "a2p:context", "a2p:interests"],
    )

    # Format memories as context string
    memories = profile.memories.episodic if profile.memories else []
    context_lines = []
    for memory in memories:
        context_lines.append(f"- [{memory.category}] {memory.content}")

    return "\n".join(context_lines) if context_lines else "No user context available."


async def propose_learned_memory(user_did: str, content: str, category: str, confidence: float):
    """Propose a new memory learned from the conversation."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:claude-chatbot",
        storage=storage,
    )

    await agent.propose_memory(
        user_did=user_did,
        content=content,
        category=category,
        confidence=confidence,
        context="Learned during Claude conversation",
    )


# ============================================
# Claude Chatbot
# ============================================

def create_system_prompt(user_context: str) -> str:
    """Create personalized system prompt."""
    return f"""You are an expert programming assistant specializing in systems programming and distributed systems.

USER CONTEXT (from their a2p profile - use this to personalize responses):
{user_context}

Guidelines:
- Adapt your communication style to match user preferences
- Consider their senior expertise level when explaining concepts
- Reference their current Rust API gateway project when relevant
- Provide practical, production-ready examples
- Focus on performance and type safety"""


async def main():
    # Check for API key
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        print("❌ Error: ANTHROPIC_API_KEY environment variable not set")
        print("   Run: export ANTHROPIC_API_KEY='your-api-key'")
        return

    print("═══════════════════════════════════════════════════════════")
    print("     🚀 Anthropic Claude + a2p: Personalized Chatbot")
    print("═══════════════════════════════════════════════════════════\n")

    # Setup
    print("1️⃣ Setting up user profile...")
    user_did = await setup_user_profile()
    print(f"   ✅ Created profile: {user_did}\n")

    print("2️⃣ Loading user context for agent...")
    user_context = await load_user_context(user_did)
    print("   📋 User context:")
    for line in user_context.split("\n"):
        print(f"      {line}")
    print()

    # Initialize Claude client
    print("3️⃣ Initializing Claude client...")
    client = Anthropic(api_key=api_key)
    model = "claude-sonnet-4-5-20250514"
    print(f"   ✅ Using model: {model}\n")

    # Create system prompt
    system_prompt = create_system_prompt(user_context)

    # Conversation history
    messages: List[Dict] = []

    # Interactive chat
    print("═══════════════════════════════════════════════════════════")
    print("   💬 Chat started! Type 'quit' to exit, 'propose' to")
    print("      see how memory proposals work.")
    print("═══════════════════════════════════════════════════════════\n")

    while True:
        user_input = input("You: ").strip()

        if user_input.lower() == "quit":
            print("\n👋 Goodbye!")
            break

        if user_input.lower() == "propose":
            print("\n📝 Proposing a learned memory to user profile...")
            await propose_learned_memory(
                user_did=user_did,
                content="Interested in using Claude for code review",
                category="a2p:interests.technology",
                confidence=0.8,
            )
            print("   ✅ Memory proposed! (User would review in their a2p app)\n")
            continue

        if not user_input:
            continue

        # Add user message
        messages.append({"role": "user", "content": user_input})

        try:
            # Generate response using Claude
            response = client.messages.create(
                model=model,
                max_tokens=4096,
                system=system_prompt,
                messages=messages,
            )

            assistant_message = response.content[0].text
            print(f"\n🤖 Assistant: {assistant_message}\n")

            # Add to history
            messages.append({"role": "assistant", "content": assistant_message})

        except Exception as e:
            print(f"\n❌ Error: {e}\n")

    print("\n═══════════════════════════════════════════════════════════")
    print("                    ✨ Session Complete!")
    print("═══════════════════════════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(main())
