"""
LangChain + a2p: Personalized Conversation Chain

A real LangChain chain that uses a2p profiles for personalization.
Requires: OPENAI_API_KEY environment variable
"""

import os
import asyncio
from typing import List, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain.memory import ConversationBufferMemory

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
        display_name="Maria Garcia",
        preferences={"language": "es", "timezone": "Europe/Madrid"}
    )

    # Add user preferences
    await user.add_memory(
        content="Data scientist with expertise in NLP and deep learning",
        category="a2p:professional",
    )
    await user.add_memory(
        content="Prefers explanations with mathematical notation when relevant",
        category="a2p:preferences.communication",
    )
    await user.add_memory(
        content="Working on sentiment analysis for Spanish social media",
        category="a2p:context.projects",
    )
    await user.add_memory(
        content="Familiar with PyTorch, Hugging Face Transformers, and scikit-learn",
        category="a2p:preferences.tools",
    )
    await user.add_memory(
        content="Interested in multilingual models and transfer learning",
        category="a2p:interests.research",
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


class A2PMemory:
    """LangChain-compatible memory that integrates with a2p profiles."""

    def __init__(self, user_did: str, agent_did: str):
        self.user_did = user_did
        self.agent_did = agent_did
        self.agent = A2PClient(agent_did=agent_did, storage=storage)
        self.conversation_memory = ConversationBufferMemory(
            return_messages=True,
            memory_key="chat_history"
        )
        self.user_context = ""

    async def load_user_context(self) -> str:
        """Load user context from a2p profile."""
        profile = await self.agent.get_profile(
            user_did=self.user_did,
            scopes=["a2p:preferences", "a2p:professional", "a2p:context", "a2p:interests"],
        )

        memories = profile.memories.episodic if profile.memories else []
        context_parts = []

        for memory in memories:
            category_short = memory.category.split(":")[-1] if ":" in memory.category else memory.category
            context_parts.append(f"- [{category_short}] {memory.content}")

        self.user_context = "\n".join(context_parts)
        return self.user_context

    async def propose_memory(self, content: str, category: str, confidence: float = 0.7):
        """Propose a learned memory back to the user's profile."""
        await self.agent.propose_memory(
            user_did=self.user_did,
            content=content,
            category=category,
            confidence=confidence,
            context="Learned during LangChain conversation",
        )

    def add_user_message(self, message: str):
        """Add a user message to conversation memory."""
        self.conversation_memory.chat_memory.add_user_message(message)

    def add_ai_message(self, message: str):
        """Add an AI message to conversation memory."""
        self.conversation_memory.chat_memory.add_ai_message(message)

    def get_chat_history(self) -> List:
        """Get the chat history."""
        return self.conversation_memory.chat_memory.messages


def create_personalized_chain(llm: ChatOpenAI, user_context: str):
    """Create a LangChain chain with personalized system prompt."""

    system_template = f"""You are a helpful AI assistant specializing in data science and machine learning.

## USER PROFILE (from a2p)
{user_context}

## Guidelines
- Adapt to the user's expertise level (data scientist with NLP focus)
- Use mathematical notation when explaining ML concepts
- Reference PyTorch and Hugging Face when giving code examples
- Consider their Spanish sentiment analysis project context
- Focus on multilingual NLP when relevant

Be helpful, technical, and precise. The user is an expert, so skip basic explanations."""

    prompt = ChatPromptTemplate.from_messages([
        ("system", system_template),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
    ])

    chain = prompt | llm | StrOutputParser()

    return chain


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
    print("     🚀 LangChain + a2p: Personalized Conversation Chain")
    print("═══════════════════════════════════════════════════════════\n")

    # Setup
    print("1️⃣ Setting up user profile...")
    user_did = await setup_user_profile()
    print(f"   ✅ Created profile: {user_did}\n")

    print("2️⃣ Creating a2p-integrated memory...")
    memory = A2PMemory(
        user_did=user_did,
        agent_did="did:a2p:agent:local:langchain-assistant",
    )
    user_context = await memory.load_user_context()
    print("   📋 User context loaded:")
    for line in user_context.split("\n")[:5]:
        print(f"      {line}")
    print()

    print("3️⃣ Creating personalized chain...")
    llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)
    chain = create_personalized_chain(llm, user_context)
    print("   ✅ Chain ready\n")

    # Interactive conversation
    print("═══════════════════════════════════════════════════════════")
    print("   💬 Chat started! Type 'quit' to exit.")
    print("   Try asking about NLP, transformers, or sentiment analysis!")
    print("═══════════════════════════════════════════════════════════\n")

    while True:
        user_input = input("You: ").strip()

        if user_input.lower() == "quit":
            break

        if user_input.lower() == "propose":
            # Demo: Propose a memory
            print("\n📝 Proposing a learned memory...")
            await memory.propose_memory(
                content="Exploring attention mechanisms for Spanish NLP",
                category="a2p:interests.research",
                confidence=0.75,
            )
            print("   ✅ Memory proposed!\n")
            continue

        if not user_input:
            continue

        # Add to memory and get response
        memory.add_user_message(user_input)

        response = chain.invoke({
            "input": user_input,
            "chat_history": memory.get_chat_history()[:-1],  # Exclude the message we just added
        })

        memory.add_ai_message(response)

        print(f"\n🤖 Assistant: {response}\n")

    # Propose final learning
    print("\n4️⃣ Proposing learnings from conversation...")
    await memory.propose_memory(
        content="Actively researching transformer architectures for NLP",
        category="a2p:context.projects",
        confidence=0.7,
    )
    print("   ✅ Memory proposed!\n")

    print("═══════════════════════════════════════════════════════════")
    print("                    ✨ Session Complete!")
    print("═══════════════════════════════════════════════════════════\n")


if __name__ == "__main__":
    asyncio.run(main())
