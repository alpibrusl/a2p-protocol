#!/usr/bin/env python3
"""
Gaugid Travel Agent Example

A complete working example that:
1. Connects to Gaugid running locally (localhost:3001)
2. Authenticates with Firebase Emulator (localhost:9099)
3. Creates/loads a user profile with travel preferences
4. Uses Vertex AI (a2p-common / europe-southwest1) to analyze conversations
5. Proposes travel-related memories based on conversation

Prerequisites:
- Gaugid running locally: docker-compose up -d (in a2p-cloud/)
- Test user created: test@example.com / test123456
- Google Cloud auth: gcloud auth application-default login
- Vertex AI access to project a2p-common

Usage:
    python main.py
    python main.py --interactive
    python main.py --conversation "I'm planning a trip to Japan in spring"
"""

import os
import sys
import json
import asyncio
import argparse
from typing import Optional
import requests
from dataclasses import dataclass

# Add local SDK to path (use local package instead of published)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../../../packages/sdk/python/src"))

# Google Vertex AI
from google import genai
from google.genai import types

# Gaugid / a2p (from local SDK)
from a2p import A2PClient, create_profile, add_memory
from a2p.storage.cloud import CloudStorage
from a2p.types import SensitivityLevel


# =============================================================================
# Configuration
# =============================================================================

@dataclass
class Config:
    # Gaugid API
    api_url: str = "http://localhost:3001"

    # Firebase Emulator
    firebase_emulator_host: str = "localhost:9099"
    firebase_project_id: str = "demo-a2p-cloud"

    # Test User
    user_email: str = "test@example.com"
    user_password: str = "test123456"

    # Agent
    agent_did: str = "did:a2p:agent:gaugid:travel-advisor"
    agent_name: str = "Travel Advisor"

    # Vertex AI
    gcp_project: str = "a2p-common"
    gcp_location: str = "europe-southwest1"
    model: str = "gemini-2.5-flash-lite"


config = Config()


# =============================================================================
# Firebase Authentication (Emulator)
# =============================================================================

def setup_firebase_admin():
    """Initialize Firebase Admin SDK for emulator"""
    import firebase_admin
    from firebase_admin import auth

    if not firebase_admin._apps:
        os.environ["FIREBASE_AUTH_EMULATOR_HOST"] = config.firebase_emulator_host
        firebase_admin.initialize_app(
            options={"projectId": config.firebase_project_id}
        )
    return auth


def get_agent_token() -> str:
    """
    Get Firebase ID token for the agent.

    Creates an agent user with the agent DID as the UID (required by Gaugid API).

    Returns:
        Firebase ID token for the agent
    """
    auth = setup_firebase_admin()

    print(f"🔐 Setting up agent: {config.agent_did}...")

    agent_email = f"{config.agent_did.replace(':', '_').replace('.', '_')}@agent.local"
    agent_password = "agent-temp-password-123"

    # Create or get agent user with DID as UID
    try:
        user = auth.get_user(config.agent_did)
        print(f"   Agent exists: {user.uid}")
    except auth.UserNotFoundError:
        user = auth.create_user(
            uid=config.agent_did,  # Use agent DID as Firebase UID
            email=agent_email,
            email_verified=True,
            password=agent_password,
        )
        print(f"   Created agent user: {user.uid}")

    # Get ID token via REST API
    response = requests.post(
        f"http://{config.firebase_emulator_host}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword",
        json={
            "email": agent_email,
            "password": agent_password,
            "returnSecureToken": True
        },
        params={"key": "fake-api-key"}  # Emulator doesn't validate this
    )

    if response.status_code == 200:
        token = response.json()["idToken"]
        print(f"✅ Agent authenticated: {config.agent_did}")
        return token
    else:
        raise Exception(f"Failed to get agent token: {response.text}")


async def register_agent(auth_token: str) -> bool:
    """
    Register the agent with Gaugid via API.

    This calls POST /api/agents/register to register the agent.
    In local development, agents are auto-verified.
    """
    import httpx

    print(f"   Registering agent via API...")

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{config.api_url}/api/agents/register",
                headers={
                    "Authorization": f"Bearer {auth_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "did": config.agent_did,
                    "name": config.agent_name,
                    "description": "AI travel advisor that helps plan trips and proposes travel-related memories",
                    "ownerEmail": "travel-advisor@agent.local",
                },
                timeout=10.0,
            )

            if response.status_code == 201:
                # New agent created
                data = response.json()
                agent = data.get("agent", {})
                verified = agent.get("verified", False)
                message = data.get("message", "")
                print(f"   ✅ Agent registered" + (" and verified" if verified else " (verification pending)"))
                if message:
                    print(f"      {message}")
                return True
            elif response.status_code == 200:
                # Agent already exists, was updated
                data = response.json()
                agent = data.get("agent", {})
                verified = agent.get("verified", False)
                message = data.get("message", "Agent already registered")
                print(f"   ✅ {message}")
                if verified:
                    print(f"      Agent is verified")
                return True
            else:
                error = response.json().get("error", {})
                print(f"   ⚠️ Registration failed: {error.get('message', response.text)}")
                return False

        except httpx.RequestError as e:
            print(f"   ⚠️ Could not connect to API: {e}")
            print(f"   Make sure Gaugid API is running at {config.api_url}")
            return False
        except Exception as e:
            print(f"   ⚠️ Registration error: {e}")
            return False


def get_user_firebase_token(email: str, password: str) -> tuple[str, str]:
    """
    Authenticate user and get Firebase token and UID.

    Returns:
        Tuple of (id_token, firebase_uid)
    """
    print(f"🔐 Authenticating user {email}...")

    # Sign in to get/verify user
    response = requests.post(
        f"http://{config.firebase_emulator_host}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword",
        json={
            "email": email,
            "password": password,
            "returnSecureToken": True
        },
        params={"key": "fake-api-key"}
    )

    if response.status_code == 200:
        data = response.json()
        print(f"✅ User authenticated: {data['localId']}")
        return data["idToken"], data["localId"]
    elif response.status_code == 400 and "EMAIL_NOT_FOUND" in response.text:
        # Create user
        response = requests.post(
            f"http://{config.firebase_emulator_host}/identitytoolkit.googleapis.com/v1/accounts:signUp",
            json={
                "email": email,
                "password": password,
                "returnSecureToken": True
            },
            params={"key": "fake-api-key"}
        )
        if response.status_code == 200:
            data = response.json()
            print(f"✅ User created: {data['localId']}")
            return data["idToken"], data["localId"]

    raise Exception(f"Failed to authenticate user: {response.text}")


async def get_user_profiles(user_token: str) -> list[dict]:
    """
    Get all profiles for the authenticated user.

    This uses the user-facing API endpoint, not the protocol endpoint.
    """
    import httpx

    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{config.api_url}/api/profiles",
            headers={
                "Authorization": f"Bearer {user_token}",
                "Content-Type": "application/json",
            },
            timeout=10.0,
        )

        if response.status_code == 200:
            data = response.json()
            return data.get("profiles", [])
        else:
            print(f"⚠️ Failed to get profiles: {response.text}")
            return []


def select_profile_did(profiles: list[dict], profile_did: str | None = None) -> str | None:
    """
    Select a profile DID from user's profiles.

    If profile_did is provided, validates it exists.
    Otherwise, uses first human profile or first profile.
    """
    if not profiles:
        return None

    if profile_did:
        # Validate provided DID exists
        for profile in profiles:
            if profile.get("did") == profile_did:
                return profile_did
        print(f"⚠️ Profile {profile_did} not found in user's profiles")
        return None

    # Prefer human profiles
    for profile in profiles:
        if profile.get("profileType") == "human":
            return profile["did"]

    # Fallback to first profile
    return profiles[0]["did"]


# =============================================================================
# Profile Setup
# =============================================================================

async def setup_travel_profile(client: A2PClient, user_did: str) -> None:
    """
    Create or update a user profile with travel preferences.
    """
    print("\n📝 Setting up travel profile...")

    # Check if profile exists (request identity scope to get full profile structure)
    # Note: We need at least identity scope to deserialize the profile properly
    existing_profile = await client.storage.get(user_did, scopes=["a2p:identity"])

    if existing_profile:
        print(f"   Profile exists: {existing_profile.profile_type}")
        return

    # Create new profile with travel preferences
    profile = create_profile(
        did=user_did,
        profile_type="human",
        display_name="Travel Enthusiast",
    )

    # Add travel-related memories
    travel_memories = [
        {
            "content": "Prefers window seats on flights",
            "category": "a2p:preferences",
            "sensitivity": SensitivityLevel.NORMAL,
        },
        {
            "content": "Interested in cultural and historical destinations",
            "category": "a2p:interests",
            "sensitivity": SensitivityLevel.NORMAL,
        },
        {
            "content": "Vegetarian diet - needs vegetarian meal options",
            "category": "a2p:preferences",
            "sensitivity": SensitivityLevel.SENSITIVE,
        },
        {
            "content": "Speaks English and Spanish",
            "category": "a2p:preferences",
            "sensitivity": SensitivityLevel.NORMAL,
        },
        {
            "content": "Prefers boutique hotels over large chains",
            "category": "a2p:preferences",
            "sensitivity": SensitivityLevel.NORMAL,
        },
    ]

    for mem in travel_memories:
        profile = add_memory(
            profile,
            content=mem["content"],
            category=mem["category"],
            source_type="user_input",
            sensitivity=mem["sensitivity"],
        )

    # Save profile to Gaugid
    await client.storage.set(user_did, profile)
    print(f"✅ Profile created with {len(travel_memories)} travel memories")


# =============================================================================
# Travel Agent (Vertex AI)
# =============================================================================

class TravelAgent:
    """AI Travel Agent powered by Vertex AI with Gaugid profile integration"""

    def __init__(self, a2p_client: A2PClient, user_did: str):
        self.a2p_client = a2p_client
        self.user_did = user_did
        self.user_context = ""

        # Initialize Vertex AI client
        print(f"\n🤖 Initializing Vertex AI ({config.gcp_project} / {config.gcp_location})...")
        self.genai_client = genai.Client(
            vertexai=True,
            project=config.gcp_project,
            location=config.gcp_location,
        )
        print("✅ Vertex AI initialized")

    async def load_user_context(self) -> str:
        """Load user profile and build context for AI"""
        print("\n📖 Loading user profile from Gaugid...")

        # Request profile with scopes needed for travel recommendations
        # Note: In production, this would require user consent via consent policies
        scopes = ["a2p:identity", "a2p:preferences", "a2p:episodic"]
        profile = await self.a2p_client.storage.get(self.user_did, scopes=scopes)

        if not profile:
            self.user_context = "New traveler, no preferences known yet."
            return self.user_context

        context_parts = []

        # Identity
        if profile.identity and profile.identity.display_name:
            context_parts.append(f"Traveler: {profile.identity.display_name}")

        # Collect memories
        if profile.memories:
            memories_list = []
            for category in ["semantic", "episodic", "procedural"]:
                memories = getattr(profile.memories, category, [])
                if memories:
                    for mem in memories:
                        memories_list.append(f"- {mem.content}")

            if memories_list:
                context_parts.append("Known preferences:\n" + "\n".join(memories_list))

        self.user_context = "\n".join(context_parts) if context_parts else "No profile data."

        print(f"✅ Profile loaded")
        print(f"   Context: {len(self.user_context)} chars")

        return self.user_context

    async def chat(self, user_message: str) -> str:
        """
        Process a travel-related message and generate personalized response.
        """
        system_prompt = f"""You are a helpful travel advisor assistant. You have access to the user's travel preferences and should use them to personalize your recommendations.

User Profile:
{self.user_context}

Guidelines:
1. Use known preferences to personalize recommendations
2. Consider dietary restrictions, language abilities, accommodation preferences
3. Suggest specific destinations, activities, or tips
4. Be helpful and enthusiastic about travel
5. If the user mentions new preferences, note them for memory

Respond naturally and helpfully to the user's travel-related question or request."""

        # Generate response
        response = self.genai_client.models.generate_content(
            model=config.model,
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

        # Analyze for new memories (async)
        asyncio.create_task(
            self._analyze_and_propose(user_message, assistant_response)
        )

        return assistant_response

    async def _analyze_and_propose(self, user_message: str, assistant_response: str) -> None:
        """Analyze conversation and propose travel-related memories"""

        analysis_prompt = f"""Analyze this travel conversation for new information worth remembering about the traveler.

User said: "{user_message}"
Assistant responded: "{assistant_response}"

Current known preferences:
{self.user_context}

If the user revealed NEW travel-related information (destinations they want to visit, preferences, past trips, budget, travel style), respond with a JSON array of memories to propose.

Each memory should have:
- content: What to remember (string, be specific and useful for future trips)
- category: One of "a2p:preferences", "a2p:interests", "a2p:episodic"
- confidence: How confident (0.5 to 1.0)

Focus on ACTIONABLE travel information:
- Destination interests
- Budget preferences
- Travel dates/seasons
- Activity preferences
- Accommodation preferences
- Transportation preferences
- Dietary needs
- Past travel experiences

If nothing new was revealed, respond with an empty array: []

Respond ONLY with valid JSON, no markdown or explanation."""

        try:
            response = self.genai_client.models.generate_content(
                model=config.model,
                contents=analysis_prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,  # Lower for consistent JSON
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
                        user_did=self.user_did,
                        content=proposal["content"],
                        category=proposal.get("category", "a2p:preferences"),
                        confidence=proposal.get("confidence", 0.8),
                        context=f"Travel conversation: {user_message[:100]}",
                    )
                    print(f"\n  📝 Proposed: {proposal['content'][:60]}...")
                    print(f"     Status: {result.get('status', 'pending')}")
                except Exception as e:
                    print(f"\n  ⚠️ Failed to propose: {e}")

        except json.JSONDecodeError:
            pass  # No valid memories
        except Exception as e:
            print(f"\n  ⚠️ Analysis error: {e}")


# =============================================================================
# Main
# =============================================================================

async def main():
    parser = argparse.ArgumentParser(description="Gaugid Travel Agent Example")
    parser.add_argument(
        "--conversation",
        help="Single conversation to analyze",
    )
    parser.add_argument(
        "--interactive",
        action="store_true",
        help="Run in interactive chat mode",
    )
    parser.add_argument(
        "--profile-did",
        help="Profile DID to use (if not provided, will use first available profile)",
    )
    args = parser.parse_args()

    print("=" * 60)
    print("  🌴 Gaugid Travel Agent Example")
    print("=" * 60)
    print(f"\n📡 Gaugid API: {config.api_url}")
    print(f"🔥 Firebase Emulator: {config.firebase_emulator_host}")
    print(f"☁️  Vertex AI: {config.gcp_project} / {config.gcp_location}")

    # Step 1: Authenticate user and get their profiles
    try:
        user_token, firebase_uid = get_user_firebase_token(
            config.user_email,
            config.user_password
        )
    except Exception as e:
        print(f"\n❌ Failed to authenticate user: {e}")
        print("\nMake sure Firebase Emulator is running at localhost:9099")
        return

    print(f"\n👤 User Firebase UID: {firebase_uid}")

    # Step 1b: Get user's profiles
    print("\n📋 Getting user's profiles...")
    profiles = await get_user_profiles(user_token)

    if not profiles:
        print("⚠️  No profiles found for this user.")
        print("   Create a profile in the Gaugid dashboard first:")
        print(f"   http://localhost:3000/profiles")
        return

    print(f"   Found {len(profiles)} profile(s):")
    for i, profile in enumerate(profiles, 1):
        profile_type = profile.get("profileType", "unknown")
        display_name = profile.get("identity", {}).get("displayName") or "Unnamed"
        did = profile.get("did", "unknown")
        print(f"   {i}. {display_name} ({profile_type}) - {did}")

    # Select profile
    selected_did = select_profile_did(profiles, args.profile_did)

    if not selected_did:
        print("\n❌ Could not select a profile")
        if args.profile_did:
            print(f"   Profile {args.profile_did} not found")
        return

    user_did = selected_did
    selected_profile = next(p for p in profiles if p["did"] == selected_did)
    print(f"\n✅ Using profile: {selected_profile.get('identity', {}).get('displayName', 'Unnamed')}")
    print(f"   DID: {user_did}")

    # Step 2: Get agent token (agent identity for API calls)
    try:
        auth_token = get_agent_token()
    except Exception as e:
        print(f"\n❌ Agent authentication failed: {e}")
        print("\nMake sure:")
        print("  1. Gaugid is running: cd ../a2p-cloud && docker-compose up -d")
        print("  2. Firebase Emulator is accessible at localhost:9099")
        return

    # Step 2b: Register agent with Gaugid API (required before accessing profiles)
    print("\n🔧 Registering agent with Gaugid...")
    registration_success = await register_agent(auth_token)

    if not registration_success:
        print("\n⚠️  Agent registration failed. The agent may not be able to access profiles.")
        print("   This is expected if the registration API is not yet implemented.")
        print("   See: a2p-cloud/.internal-docs/agent-registration-api.md")
        print("\n   Continuing anyway...")

    # Step 3: Connect to Gaugid
    print(f"\n🔌 Connecting to Gaugid...")

    storage = CloudStorage(
        api_url=config.api_url,
        auth_token=auth_token,
        agent_did=config.agent_did,
    )

    client = A2PClient(
        agent_did=config.agent_did,
        storage=storage,
    )

    print("✅ Connected to Gaugid")

    try:
        # Step 4: Setup profile
        await setup_travel_profile(client, user_did)

        # Step 5: Initialize Travel Agent
        agent = TravelAgent(client, user_did)
        await agent.load_user_context()

        # Step 6: Run agent
        if args.conversation:
            # Single conversation mode
            print("\n" + "=" * 60)
            print(f"👤 User: {args.conversation}")
            print("=" * 60)

            response = await agent.chat(args.conversation)
            print(f"\n🤖 Travel Advisor:\n{response}")

            # Wait for async proposals
            await asyncio.sleep(2)

        elif args.interactive:
            # Interactive mode
            print("\n" + "=" * 60)
            print("💬 Interactive Travel Chat")
            print("   Type your travel questions (type 'quit' to exit)")
            print("=" * 60 + "\n")

            while True:
                try:
                    user_input = input("You: ").strip()

                    if not user_input:
                        continue

                    if user_input.lower() in ("quit", "exit", "q"):
                        break

                    response = await agent.chat(user_input)
                    print(f"\n🤖 Travel Advisor:\n{response}\n")

                except EOFError:
                    break
                except KeyboardInterrupt:
                    break

            print("\n👋 Happy travels!")

        else:
            # Demo mode with sample conversations
            print("\n" + "=" * 60)
            print("🎬 Demo Mode - Sample Travel Conversations")
            print("=" * 60)

            demo_conversations = [
                "I'm planning a trip to Japan in April. I've heard it's cherry blossom season!",
                "What's the best way to get around Tokyo? I prefer not to rent a car.",
                "I have a budget of around $3000 for a 10-day trip. Is that reasonable for Japan?",
            ]

            for i, conversation in enumerate(demo_conversations, 1):
                print(f"\n--- Conversation {i} ---")
                print(f"\n👤 User: {conversation}")

                response = await agent.chat(conversation)
                print(f"\n🤖 Travel Advisor:\n{response}")

                # Wait for proposals
                await asyncio.sleep(2)

            print("\n" + "=" * 60)
            print("📋 Check Gaugid Dashboard for proposed memories:")
            print("   http://localhost:3000/proposals")
            print("=" * 60)

    finally:
        await storage.close()


if __name__ == "__main__":
    asyncio.run(main())
