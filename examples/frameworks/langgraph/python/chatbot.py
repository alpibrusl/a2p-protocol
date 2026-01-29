"""
LangGraph + a2p: Personalized Chatbot

A real LangGraph chatbot that uses a2p profiles for personalization.
Requires: OPENAI_API_KEY environment variable
"""

import os
import asyncio
from typing import TypedDict, Annotated, Sequence
from operator import add

from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

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
        content="Senior software engineer specializing in Python and distributed systems",
        category="a2p:professional",
    )
    await user.add_memory(
        content="Prefers concise, technical explanations with code examples",
        category="a2p:preferences.communication",
    )
    await user.add_memory(
        content="Currently learning Rust for systems programming",
        category="a2p:context.learning",
    )
    await user.add_memory(
        content="Uses VSCode as primary editor",
        category="a2p:preferences.tools",
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
    """Load user context from a2p profile for the agent."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:langgraph-chatbot",
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
        context_lines.append(f"- [{memory.category}] {memory.content}")

    return "\n".join(context_lines) if context_lines else "No user context available."


async def propose_learned_memory(user_did: str, content: str, category: str, confidence: float):
    """Propose a new memory learned from the conversation."""
    agent = A2PClient(
        agent_did="did:a2p:agent:local:langgraph-chatbot",
        storage=storage,
    )

    await agent.propose_memory(
        user_did=user_did,
        content=content,
        category=category,
        confidence=confidence,
        context="Learned during conversation",
    )


# ============================================
# LangGraph Chatbot Definition
# ============================================

class ChatState(TypedDict):
    """State for the chatbot graph."""
    messages: Annotated[Sequence[BaseMessage], add]
    user_did: str
    user_context: str


def create_chatbot_graph(llm: ChatOpenAI):
    """Create the LangGraph chatbot with a2p integration."""

    def chatbot_node(state: ChatState) -> dict:
        """Main chatbot node that generates responses."""
        # Build system prompt with user context
        system_prompt = f"""You are a helpful AI assistant.

USER CONTEXT (from their a2p profile - use this to personalize responses):
{state['user_context']}

Guidelines:
- Adapt your communication style to match user preferences
- Reference their expertise level when explaining concepts
- Consider their current learning goals
- Be aware of their tool preferences"""

        # Prepare messages with system prompt
        messages = [SystemMessage(content=system_prompt)] + list(state["messages"])

        # Generate response
        response = llm.invoke(messages)

        return {"messages": [response]}

    # Build graph
    graph = StateGraph(ChatState)
    graph.add_node("chatbot", chatbot_node)
    graph.add_edge(START, "chatbot")
    graph.add_edge("chatbot", END)

    return graph.compile(checkpointer=MemorySaver())


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
    print("     🚀 LangGraph + a2p: Personalized Chatbot")
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

    # Create LLM and graph
    print("3️⃣ Creating LangGraph chatbot...")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
    chatbot = create_chatbot_graph(llm)
    print("   ✅ Chatbot ready\n")

    # Initial state
    config = {"configurable": {"thread_id": "demo-thread"}}
    initial_state = {
        "messages": [],
        "user_did": user_did,
        "user_context": user_context,
    }

    # Interactive chat loop
    print("═══════════════════════════════════════════════════════════")
    print("   💬 Chat started! Type 'quit' to exit, 'propose' to")
    print("      see how memory proposals work.")
    print("═══════════════════════════════════════════════════════════\n")

    state = initial_state

    while True:
        user_input = input("You: ").strip()

        if user_input.lower() == "quit":
            print("\n👋 Goodbye!")
            break

        if user_input.lower() == "propose":
            # Demo: Propose a learned memory
            print("\n📝 Proposing a learned memory to user profile...")
            await propose_learned_memory(
                user_did=user_did,
                content="Interested in LangGraph for building AI agents",
                category="a2p:interests.technology",
                confidence=0.8,
            )
            print("   ✅ Memory proposed! (User would review in their a2p app)\n")
            continue

        if not user_input:
            continue

        # Add user message and run graph
        state["messages"] = list(state["messages"]) + [HumanMessage(content=user_input)]

        result = chatbot.invoke(state, config)
        state = result

        # Get last AI message
        ai_message = result["messages"][-1]
        print(f"\n🤖 Assistant: {ai_message.content}\n")


if __name__ == "__main__":
    asyncio.run(main())
