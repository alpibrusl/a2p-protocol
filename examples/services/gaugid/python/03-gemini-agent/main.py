#!/usr/bin/env python3
"""
Gaugid + Google Gemini Agent Example

A complete AI agent that:
1. Connects to Gaugid for user profile storage
2. Uses Google Gemini for AI capabilities
3. Analyzes conversations and proposes memories
4. Respects user consent policies

Prerequisites:
- Gaugid account (sign up at gaugid.com)
- Google AI API key (get from Google AI Studio)
"""

import os
import json
import asyncio
from typing import Optional
from google import genai
from google.genai import types
from a2p import A2PClient
from a2p.storage.cloud import CloudStorage


class GaugidGeminiAgent:
    """AI Agent powered by Gemini with Gaugid profile storage"""

    def __init__(
        self,
        agent_did: str,
        api_url: str,
        auth_token: str,
        google_api_key: str,
    ):
        self.agent_did = agent_did

        # Initialize Gaugid storage
        self.storage = CloudStorage(
            api_url=api_url,
            auth_token=auth_token,
            agent_did=agent_did,
        )

        # Initialize A2P client
        self.a2p_client = A2PClient(
            agent_did=agent_did,
            storage=self.storage,
        )

        # Initialize Gemini client
        self.gemini = genai.Client(api_key=google_api_key)

        # Current user context
        self.current_user_did: Optional[str] = None
        self.user_context: str = ""

    async def load_user_context(self, user_did: str) -> str:
        """Load user profile and build context string for Gemini"""
        self.current_user_did = user_did

        profile = await self.a2p_client.get_profile(user_did)
        if not profile:
            self.user_context = "No profile available."
            return self.user_context

        context_parts = []

        # Identity
        if profile.identity:
            if profile.identity.display_name:
                context_parts.append(f"User: {profile.identity.display_name}")

        # Preferences
        if profile.common and profile.common.preferences:
            prefs = profile.common.preferences
            if prefs.language:
                context_parts.append(f"Language: {prefs.language}")
            if prefs.timezone:
                context_parts.append(f"Timezone: {prefs.timezone}")

        # Memories
        if profile.memories:
            memories_list = []
            for category in ["semantic", "episodic", "procedural"]:
                memories = getattr(profile.memories, category, [])
                if memories:
                    for mem in memories[:5]:  # Limit to 5 per category
                        memories_list.append(f"- {mem.content}")

            if memories_list:
                context_parts.append("Known about user:\n" + "\n".join(memories_list))

        self.user_context = "\n".join(context_parts) if context_parts else "New user, no history."
        return self.user_context

    async def chat(self, user_message: str) -> str:
        """
        Process a user message and generate a response.

        Also analyzes the conversation for potential memories to propose.
        """
        if not self.current_user_did:
            return "Error: No user loaded. Call load_user_context first."

        # Build prompt with user context
        system_prompt = f"""You are a helpful AI assistant with knowledge about the user from their a2p profile.

User Profile Context:
{self.user_context}

Guidelines:
1. Use the user context to personalize your responses
2. Be helpful and friendly
3. If the user shares new information about themselves, acknowledge it
4. Keep responses concise but informative

Respond to the user's message naturally."""

        # Generate response with Gemini
        response = self.gemini.models.generate_content(
            model="gemini-2.0-flash",
            contents=[
                types.Content(role="user", parts=[types.Part(text=system_prompt)]),
                types.Content(role="user", parts=[types.Part(text=user_message)]),
            ],
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=1024,
            ),
        )

        assistant_response = response.text

        # Analyze conversation for memory proposals (async, don't block)
        asyncio.create_task(
            self._analyze_for_memories(user_message, assistant_response)
        )

        return assistant_response

    async def _analyze_for_memories(self, user_message: str, assistant_response: str):
        """Analyze conversation and propose relevant memories"""
        if not self.current_user_did:
            return

        analysis_prompt = f"""Analyze this conversation for information worth remembering about the user.

User said: "{user_message}"
Assistant responded: "{assistant_response}"

Current user context:
{self.user_context}

If the user revealed any NEW information about themselves (preferences, facts, experiences),
respond with a JSON array of memories to propose. Each memory should have:
- content: What to remember (string)
- category: One of "a2p:preferences", "a2p:interests", "a2p:professional", "a2p:episodic"
- confidence: How confident (0.5 to 1.0)

If nothing new was revealed, respond with an empty array: []

Only propose genuinely new information, not things already known.
Respond ONLY with valid JSON, no markdown."""

        try:
            response = self.gemini.models.generate_content(
                model="gemini-2.0-flash",
                contents=analysis_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.3,  # Lower temperature for more consistent JSON
                ),
            )

            response_text = response.text.strip()

            # Handle markdown code blocks
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0].strip()
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0].strip()

            proposals = json.loads(response_text)

            if not proposals:
                return

            # Propose each memory
            for proposal in proposals:
                try:
                    result = await self.a2p_client.propose_memory(
                        user_did=self.current_user_did,
                        content=proposal["content"],
                        category=proposal.get("category", "a2p:episodic"),
                        confidence=proposal.get("confidence", 0.7),
                        context=f"From conversation: {user_message[:100]}",
                    )
                    print(f"  📝 Proposed memory: {proposal['content'][:50]}...")
                except Exception as e:
                    print(f"  ⚠️ Failed to propose: {e}")

        except json.JSONDecodeError:
            pass  # No valid memories to propose
        except Exception as e:
            print(f"  ⚠️ Memory analysis error: {e}")

    async def close(self):
        """Cleanup resources"""
        await self.storage.close()


async def main():
    # Configuration from environment
    api_url = os.environ.get("GAUGID_API_URL", "https://api.gaugid.com")
    auth_token = os.environ.get("GAUGID_AUTH_TOKEN")
    user_did = os.environ.get("GAUGID_USER_DID")
    agent_did = os.environ.get("GAUGID_AGENT_DID", "did:a2p:agent:gaugid:gemini-agent")
    google_api_key = os.environ.get("GOOGLE_API_KEY")

    # Validate configuration
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
        print("\nSet these variables and try again.")
        return

    print("🤖 Gaugid + Gemini Agent")
    print(f"   API URL: {api_url}")
    print(f"   Agent DID: {agent_did}")
    print()

    # Initialize agent
    agent = GaugidGeminiAgent(
        agent_did=agent_did,
        api_url=api_url,
        auth_token=auth_token,
        google_api_key=google_api_key,
    )

    try:
        # Load user context
        print("📖 Loading user profile...")
        context = await agent.load_user_context(user_did)
        print(f"✅ User context loaded")
        print()

        # Interactive chat loop
        print("💬 Chat started (type 'quit' to exit)")
        print("   New information you share may be proposed as memories.")
        print()

        while True:
            try:
                user_input = input("You: ").strip()

                if not user_input:
                    continue

                if user_input.lower() in ("quit", "exit", "q"):
                    break

                response = await agent.chat(user_input)
                print(f"\nAgent: {response}\n")

            except EOFError:
                break
            except KeyboardInterrupt:
                break

        print("\n👋 Goodbye!")

    finally:
        await agent.close()


if __name__ == "__main__":
    asyncio.run(main())
