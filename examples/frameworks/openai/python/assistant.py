"""
OpenAI Assistants + a2p: Personalized Assistant

A real OpenAI Assistant that uses a2p profiles for personalization.
Requires: OPENAI_API_KEY environment variable
"""

import os
import asyncio
import time
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
        display_name="Alex Developer",
        preferences={"language": "en", "timezone": "America/New_York"}
    )

    # Add user preferences
    await user.add_memory(
        content="Full-stack developer with 8 years experience, mainly React and Node.js",
        category="a2p:professional",
    )
    await user.add_memory(
        content="Prefers TypeScript over JavaScript for type safety",
        category="a2p:preferences.development",
    )
    await user.add_memory(
        content="Currently building a SaaS product for project management",
        category="a2p:context.projects",
    )
    await user.add_memory(
        content="Likes detailed explanations with practical examples",
        category="a2p:preferences.communication",
    )
    await user.add_memory(
        content="Uses Next.js 14 with App Router for the current project",
        category="a2p:context.technology",
    )

    # Allow agents to read and propose
    current = user.get_profile()
    updated = add_policy(
        current,
        agent_pattern="did:a2p:agent:*",
        permissions=[PermissionLevel.READ_SCOPED, PermissionLevel.PROPOSE],
        allow=["a2p:preferences.*", "a2p:professional.*", "a2p:context.*"],
        name="Allow AI assistants",
    )
    await storage.set(profile.id, updated)

    return profile.id


async def load_user_context(user_did: str) -> str:
    """Load user context from a2p profile for the assistant."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:openai-assistant",
        storage=storage,
    )

    profile = await agent.get_profile(
        user_did=user_did,
        scopes=["a2p:preferences", "a2p:professional", "a2p:context"],
    )

    # Format memories as context string
    memories = profile.memories.episodic if profile.memories else []
    context_lines = []
    for memory in memories:
        context_lines.append(f"- {memory.content}")

    return "\n".join(context_lines) if context_lines else "No user context available."


async def propose_learned_memory(user_did: str, content: str, category: str, confidence: float):
    """Propose a new memory learned from the conversation."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:openai-assistant",
        storage=storage,
    )

    await agent.propose_memory(
        user_did=user_did,
        content=content,
        category=category,
        confidence=confidence,
        context="Learned during assistant conversation",
    )


# ============================================
# OpenAI Assistant Setup
# ============================================

def create_personalized_assistant(client: OpenAI, user_context: str) -> str:
    """Create an OpenAI Assistant with user context in instructions."""

    instructions = f"""You are a helpful AI assistant for software development.

## USER CONTEXT (from their a2p profile)
{user_context}

## Guidelines
- Use the user context to personalize all responses
- Match their experience level (senior developer)
- Focus on their tech stack (React, Node.js, Next.js, TypeScript)
- Provide practical examples relevant to their SaaS project
- Remember they prefer detailed explanations

## When helping with code:
- Always use TypeScript
- Follow Next.js 14 App Router conventions
- Consider their project management SaaS context
- Provide production-ready examples"""

    assistant = client.beta.assistants.create(
        name="a2p Personalized Dev Assistant",
        instructions=instructions,
        model="gpt-4o-mini",
    )

    return assistant.id


def run_conversation(client: OpenAI, assistant_id: str, thread_id: str, user_message: str) -> str:
    """Run a conversation turn with the assistant."""

    # Add message to thread
    client.beta.threads.messages.create(
        thread_id=thread_id,
        role="user",
        content=user_message,
    )

    # Run the assistant
    run = client.beta.threads.runs.create(
        thread_id=thread_id,
        assistant_id=assistant_id,
    )

    # Wait for completion
    while run.status in ["queued", "in_progress"]:
        time.sleep(0.5)
        run = client.beta.threads.runs.retrieve(
            thread_id=thread_id,
            run_id=run.id,
        )

    # Get the response
    messages = client.beta.threads.messages.list(thread_id=thread_id)

    # Return the latest assistant message
    for message in messages.data:
        if message.role == "assistant":
            return message.content[0].text.value

    return "No response generated."


# ============================================
# Main Application
# ============================================

async def main():
    # Check for API key
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ Error: OPENAI_API_KEY environment variable not set")
        print("   Run: export OPENAI_API_KEY='sk-your-key-here'")
        return

    print("═══════════════════════════════════════════════════════════")
    print("     🚀 OpenAI Assistants + a2p: Personalized Assistant")
    print("═══════════════════════════════════════════════════════════\n")

    # Setup a2p
    print("1️⃣ Setting up user profile...")
    user_did = await setup_user_profile()
    print(f"   ✅ Created profile: {user_did}\n")

    print("2️⃣ Loading user context...")
    user_context = await load_user_context(user_did)
    print("   📋 User context loaded:")
    for line in user_context.split("\n")[:5]:
        print(f"      {line}")
    print()

    # Setup OpenAI
    client = OpenAI(api_key=api_key)

    print("3️⃣ Creating personalized assistant...")
    assistant_id = create_personalized_assistant(client, user_context)
    print(f"   ✅ Assistant created: {assistant_id}\n")

    print("4️⃣ Creating conversation thread...")
    thread = client.beta.threads.create()
    print(f"   ✅ Thread created: {thread.id}\n")

    # Interactive conversation
    print("═══════════════════════════════════════════════════════════")
    print("   💬 Chat started! Type 'quit' to exit.")
    print("   Try asking about Next.js, TypeScript, or their project!")
    print("═══════════════════════════════════════════════════════════\n")

    conversation_history = []

    while True:
        user_input = input("You: ").strip()

        if user_input.lower() == "quit":
            break

        if not user_input:
            continue

        # Get response
        print("\n🤖 Assistant: ", end="", flush=True)
        response = run_conversation(client, assistant_id, thread.id, user_input)
        print(response)
        print()

        conversation_history.append({"user": user_input, "assistant": response})

    # Cleanup and propose learnings
    print("\n5️⃣ Analyzing conversation for learnings...")

    # Demo: Propose something learned
    if conversation_history:
        await propose_learned_memory(
            user_did=user_did,
            content="Actively working on authentication flow for SaaS project",
            category="a2p:context.projects",
            confidence=0.7,
        )
        print("   ✅ Memory proposed based on conversation!\n")

    # Cleanup
    print("6️⃣ Cleaning up...")
    client.beta.assistants.delete(assistant_id)
    print("   ✅ Assistant deleted\n")

    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Session Complete!")
    print("═══════════════════════════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(main())
