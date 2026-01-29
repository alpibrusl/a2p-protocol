"""
Google Gemini + a2p: Personalized Chatbot

A real Gemini chatbot that uses a2p profiles for personalization.
Requires: GOOGLE_API_KEY environment variable
"""

import os
import asyncio
from typing import List

from google import genai
from google.genai import types

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
        preferences={"language": "en", "timezone": "Europe/Madrid"}
    )

    # Add user preferences
    await user.add_memory(
        content="Machine Learning Engineer specializing in computer vision and LLMs",
        category="a2p:professional",
    )
    await user.add_memory(
        content="Prefers technical, detailed explanations with code examples",
        category="a2p:preferences.communication",
    )
    await user.add_memory(
        content="Currently building a RAG system for enterprise search",
        category="a2p:context.projects",
    )
    await user.add_memory(
        content="Uses PyTorch and Hugging Face Transformers",
        category="a2p:preferences.tools",
    )
    await user.add_memory(
        content="Interested in efficient inference and model optimization",
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
        agent_did="did:a2p:agent:local:gemini-chatbot",
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
        agent_did="did:a2p:agent:local:gemini-chatbot",
        storage=storage,
    )

    await agent.propose_memory(
        user_did=user_did,
        content=content,
        category=category,
        confidence=confidence,
        context="Learned during Gemini conversation",
    )


# ============================================
# Gemini Chatbot
# ============================================

def create_system_instruction(user_context: str) -> str:
    """Create personalized system instruction."""
    return f"""You are a helpful AI assistant specializing in ML and AI.

USER CONTEXT (from their a2p profile - use this to personalize responses):
{user_context}

Guidelines:
- Adapt your communication style to match user preferences
- Reference their expertise level when explaining concepts
- Consider their current projects and interests
- Provide code examples in PyTorch when relevant"""


async def main():
    # Check for API key
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("❌ Error: GOOGLE_API_KEY environment variable not set")
        print("   Run: export GOOGLE_API_KEY='your-api-key'")
        return

    print("═══════════════════════════════════════════════════════════")
    print("     🚀 Google Gemini + a2p: Personalized Chatbot")
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

    # Initialize Gemini client
    print("3️⃣ Initializing Gemini client...")
    client = genai.Client(api_key=api_key)
    print("   ✅ Gemini ready\n")

    # Create configuration
    system_instruction = create_system_instruction(user_context)
    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.7,
        max_output_tokens=2048,
    )

    # Chat history
    chat_history: List[types.Content] = []

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
                content="Interested in using Gemini for RAG applications",
                category="a2p:interests.technology",
                confidence=0.8,
            )
            print("   ✅ Memory proposed! (User would review in their a2p app)\n")
            continue

        if not user_input:
            continue

        # Add user message to history
        chat_history.append(
            types.Content(
                role="user",
                parts=[types.Part(text=user_input)],
            )
        )

        try:
            # Generate response using Gemini
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=chat_history,
                config=config,
            )

            assistant_message = response.text
            print(f"\n🤖 Assistant: {assistant_message}\n")

            # Add to history
            chat_history.append(
                types.Content(
                    role="model",
                    parts=[types.Part(text=assistant_message)],
                )
            )

        except Exception as e:
            print(f"\n❌ Error: {e}\n")

    print("\n═══════════════════════════════════════════════════════════")
    print("                    ✨ Session Complete!")
    print("═══════════════════════════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(main())
