#!/usr/bin/env python3
"""
Gaugid Multi-Agent Example

Demonstrates how multiple AI agents can share user context through Gaugid:
1. Research Agent - Gathers information and proposes learnings
2. Assistant Agent - Uses profile to provide personalized help
3. Scheduler Agent - Manages calendar based on preferences

All agents read from the same Gaugid profile, ensuring consistent personalization.

Prerequisites:
- Gaugid account (sign up at gaugid.com)
- Google AI API key (for Gemini)
"""

import os
import asyncio
from dataclasses import dataclass
from typing import Optional
from google import genai
from google.genai import types
from a2p import A2PClient
from a2p.storage.cloud import CloudStorage


@dataclass
class AgentConfig:
    """Configuration for a Gaugid-connected agent"""
    name: str
    did: str
    role: str
    system_prompt: str


# Define different agents with their roles
AGENTS = [
    AgentConfig(
        name="Research Agent",
        did="did:a2p:agent:gaugid:research-agent",
        role="research",
        system_prompt="""You are a research assistant. Your job is to:
- Help users find information on topics
- Summarize complex topics
- Identify key insights worth remembering

When you learn something important about the user's research interests,
note it for memory proposal."""
    ),
    AgentConfig(
        name="Personal Assistant",
        did="did:a2p:agent:gaugid:personal-assistant",
        role="assistant",
        system_prompt="""You are a personal assistant. Your job is to:
- Help with daily tasks and questions
- Provide personalized recommendations
- Remember user preferences

Use what you know about the user to personalize responses."""
    ),
    AgentConfig(
        name="Scheduler Agent",
        did="did:a2p:agent:gaugid:scheduler-agent",
        role="scheduler",
        system_prompt="""You are a scheduling assistant. Your job is to:
- Help manage time and calendar
- Suggest optimal meeting times
- Respect user's time preferences

Consider the user's known schedule preferences."""
    ),
]


class MultiAgentSystem:
    """System managing multiple Gaugid-connected agents"""

    def __init__(
        self,
        api_url: str,
        auth_token: str,
        google_api_key: str,
    ):
        self.api_url = api_url
        self.auth_token = auth_token
        self.gemini = genai.Client(api_key=google_api_key)

        # Initialize agents
        self.agents: dict[str, tuple[AgentConfig, A2PClient, CloudStorage]] = {}

        for agent_config in AGENTS:
            storage = CloudStorage(
                api_url=api_url,
                auth_token=auth_token,
                agent_did=agent_config.did,
            )
            client = A2PClient(
                agent_did=agent_config.did,
                storage=storage,
            )
            self.agents[agent_config.role] = (agent_config, client, storage)

        self.current_user_did: Optional[str] = None
        self.user_context: str = ""

    async def load_user_context(self, user_did: str) -> str:
        """Load user profile (shared by all agents)"""
        self.current_user_did = user_did

        # Use the assistant agent to load profile
        _, client, _ = self.agents["assistant"]
        profile = await client.get_profile(user_did)

        if not profile:
            self.user_context = "New user, no profile data available."
            return self.user_context

        context_parts = []

        if profile.identity and profile.identity.display_name:
            context_parts.append(f"User: {profile.identity.display_name}")

        if profile.common and profile.common.preferences:
            prefs = profile.common.preferences
            if prefs.timezone:
                context_parts.append(f"Timezone: {prefs.timezone}")

        if profile.memories:
            memories_list = []
            for category in ["semantic", "episodic", "procedural"]:
                memories = getattr(profile.memories, category, [])
                if memories:
                    for mem in memories[:3]:
                        memories_list.append(f"- {mem.content}")

            if memories_list:
                context_parts.append("Known:\n" + "\n".join(memories_list))

        self.user_context = "\n".join(context_parts) if context_parts else "No profile data."
        return self.user_context

    async def route_message(self, message: str) -> tuple[str, str]:
        """
        Route a message to the appropriate agent based on content.
        Returns (agent_role, response).
        """
        # Simple routing based on keywords
        message_lower = message.lower()

        if any(word in message_lower for word in ["schedule", "meeting", "calendar", "time", "appointment"]):
            role = "scheduler"
        elif any(word in message_lower for word in ["research", "find", "search", "learn about", "explain"]):
            role = "research"
        else:
            role = "assistant"

        return role, await self.chat(role, message)

    async def chat(self, role: str, message: str) -> str:
        """Send a message to a specific agent"""
        if role not in self.agents:
            return f"Unknown agent role: {role}"

        agent_config, client, _ = self.agents[role]

        prompt = f"""{agent_config.system_prompt}

User Profile:
{self.user_context}

User message: {message}

Respond helpfully and naturally."""

        response = self.gemini.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )

        return response.text

    async def propose_memory(self, role: str, content: str, category: str = "a2p:episodic"):
        """Have an agent propose a memory"""
        if not self.current_user_did:
            return {"error": "No user loaded"}

        if role not in self.agents:
            return {"error": f"Unknown agent role: {role}"}

        _, client, _ = self.agents[role]

        return await client.propose_memory(
            user_did=self.current_user_did,
            content=content,
            category=category,
            confidence=0.8,
        )

    async def close(self):
        """Cleanup all agents"""
        for _, _, storage in self.agents.values():
            await storage.close()


async def main():
    # Configuration
    api_url = os.environ.get("GAUGID_API_URL", "https://api.gaugid.com")
    auth_token = os.environ.get("GAUGID_AUTH_TOKEN")
    user_did = os.environ.get("GAUGID_USER_DID")
    google_api_key = os.environ.get("GOOGLE_API_KEY")

    # Validate
    missing = []
    if not auth_token:
        missing.append("GAUGID_AUTH_TOKEN")
    if not user_did:
        missing.append("GAUGID_USER_DID")
    if not google_api_key:
        missing.append("GOOGLE_API_KEY")

    if missing:
        print("❌ Missing required environment variables:")
        for var in missing:
            print(f"   - {var}")
        return

    print("🤖 Gaugid Multi-Agent System")
    print(f"   API URL: {api_url}")
    print(f"   Agents: {len(AGENTS)}")
    for agent in AGENTS:
        print(f"     - {agent.name} ({agent.did})")
    print()

    # Initialize system
    system = MultiAgentSystem(
        api_url=api_url,
        auth_token=auth_token,
        google_api_key=google_api_key,
    )

    try:
        # Load shared user context
        print("📖 Loading user profile (shared by all agents)...")
        context = await system.load_user_context(user_did)
        print(f"✅ Context loaded")
        print()

        # Interactive demo
        print("💬 Multi-Agent Chat")
        print("   Messages are automatically routed to the best agent:")
        print("   - 'schedule', 'meeting' → Scheduler Agent")
        print("   - 'research', 'explain' → Research Agent")
        print("   - Other → Personal Assistant")
        print()
        print("   Type 'quit' to exit")
        print()

        while True:
            try:
                user_input = input("You: ").strip()

                if not user_input:
                    continue

                if user_input.lower() in ("quit", "exit", "q"):
                    break

                role, response = await system.route_message(user_input)
                agent_name = next(a.name for a in AGENTS if a.role == role)

                print(f"\n[{agent_name}]: {response}\n")

            except EOFError:
                break
            except KeyboardInterrupt:
                break

        print("\n👋 Goodbye!")

    finally:
        await system.close()


if __name__ == "__main__":
    asyncio.run(main())
