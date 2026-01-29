"""
Google ADK + a2p: Cloud-Backed Agent Example

Demonstrates using a2p SDK with a2p-cloud service backend.
Shows how to integrate Google ADK with a2p profiles stored in the cloud.

This example requires:
- A2P_API_URL: Base URL of a2p-cloud API (default: http://localhost:3001)
- A2P_AUTH_TOKEN: Firebase ID token for authentication
- A2P_USER_DID: User DID to use (REQUIRED - profile must exist in a2p-cloud)
- GOOGLE_API_KEY: Google API key for ADK

Note: Profiles should be created via the a2p-cloud dashboard. This example
demonstrates how to READ and USE existing profiles, not create them.
"""

import os
import asyncio
from typing import Dict

from google import genai
from google.adk import Agent, Runner

# a2p imports
from a2p import (
    A2PUserClient,
    A2PClient,
)
from a2p.storage.cloud import CloudStorage


# ============================================
# Configuration
# ============================================

API_URL = os.getenv("A2P_API_URL", "http://localhost:3001")
AUTH_TOKEN = os.getenv("A2P_AUTH_TOKEN")
USER_DID = os.getenv("A2P_USER_DID")
AGENT_DID = "did:a2p:agent:local:adk-cloud-example"

if not AUTH_TOKEN:
    raise ValueError(
        "A2P_AUTH_TOKEN environment variable required. "
        "Get a Firebase ID token from your a2p-cloud dashboard."
    )

if not USER_DID:
    raise ValueError(
        "A2P_USER_DID environment variable required. "
        "Create a profile in your a2p-cloud dashboard first, then use its DID here."
    )


# ============================================
# Cloud Storage Setup
# ============================================

async def setup_cloud_storage() -> CloudStorage:
    """Create cloud storage backend connected to a2p-cloud."""
    storage = CloudStorage(
        api_url=API_URL,
        auth_token=AUTH_TOKEN,
        agent_did=AGENT_DID,
    )
    return storage


# ============================================
# User Profile Loading (from Cloud)
# ============================================

async def load_user_profile(storage: CloudStorage, user_did: str) -> str:
    """
    Load an existing user profile from a2p-cloud.

    Profiles should be created via the a2p-cloud dashboard.
    This function only reads existing profiles.
    """
    user = A2PUserClient(storage)

    # Load existing profile from cloud
    profile = await user.load_profile(user_did)

    if not profile:
        raise ValueError(
            f"Profile {user_did} not found in a2p-cloud. "
            "Please create a profile via the dashboard first."
        )

    print(f"✓ Loaded profile: {user_did}")
    print(f"  Type: {profile.profileType}")
    print(f"  Version: {profile.version}")

    # Show profile summary
    if profile.identity and profile.identity.get("displayName"):
        print(f"  Display Name: {profile.identity['displayName']}")

    # Count memories
    if profile.memories:
        total_memories = sum(
            len(mems) if isinstance(mems, list) else 1
            for mems in profile.memories.values()
        )
        print(f"  Memories: {total_memories} across {len(profile.memories)} categories")

    # Check for consent policies
    if profile.consent and profile.consent.policies:
        print(f"  Consent Policies: {len(profile.consent.policies)}")
        # Check if agent has access
        agent_policies = [
            p for p in profile.consent.policies
            if p.agentPattern and "did:a2p:agent:*" in p.agentPattern
        ]
        if not agent_policies:
            print("  ⚠ Warning: No consent policies found for agents.")
            print("    Add a policy in the dashboard to allow agent access.")

    return user_did


# ============================================
# Google ADK Agent Setup
# ============================================

async def create_personalized_agent(user_did: str, storage: CloudStorage) -> Agent:
    """Create a Google ADK agent personalized with a2p profile."""

    # Create a2p client to access user profile
    agent_client = A2PClient(
        agent_did=AGENT_DID,
        storage=storage,
    )

    # Request access to user profile
    try:
        access_result = await agent_client.request_access(
            user_did=user_did,
            scopes=["a2p:preferences", "a2p:professional"],
        )
        print(f"✓ Access granted: {access_result.get('consent', {}).get('granted')}")
    except PermissionError as e:
        print(f"⚠ Access denied: {e}")
        print("  Profile may need consent policies configured.")
        raise

    # Get user profile with scopes
    profile_data = await agent_client.get_profile(
        user_did=user_did,
        scopes=["a2p:preferences", "a2p:professional"],
    )

    # Build personalized system message from profile
    preferences = profile_data.get("common", {}).get("preferences", {})
    professional = profile_data.get("memories", {}).get("a2p:professional", [])

    system_message = "You are a helpful technical assistant."

    if professional:
        roles = [m.get("content", "") for m in professional if isinstance(m, dict)]
        if roles:
            system_message += f"\n\nUser context: {', '.join(roles)}"

    if preferences.get("communication"):
        comm_prefs = preferences["communication"]
        if comm_prefs.get("style"):
            system_message += f"\nCommunication style: {comm_prefs['style']}"

    # Create Google ADK agent with personalization
    client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

    agent = Agent(
        name="PersonalizedAssistant",
        model="gemini-2.0-flash-exp",
        system_instruction=system_message,
    )

    return agent


# ============================================
# Main Example
# ============================================

async def main():
    """Main example demonstrating cloud-backed a2p with Google ADK."""

    print("=" * 60)
    print("Google ADK + a2p Cloud Storage Example")
    print("=" * 60)
    print()

    # Setup cloud storage
    print("1. Setting up cloud storage...")
    storage = await setup_cloud_storage()
    print(f"   API URL: {API_URL}")
    print()

    try:
        # Load user profile from cloud
        print("2. Loading user profile from a2p-cloud...")
        user_did = await load_user_profile(storage, USER_DID)
        print()

        # Create personalized agent
        print("3. Creating personalized agent...")
        agent = await create_personalized_agent(user_did, storage)
        print()

        # Run agent with example queries
        print("4. Running agent with example queries...")
        print()

        runner = Runner(agents=[agent])

        queries = [
            "What are the best practices for microservices architecture?",
            "Explain the trade-offs between different database options.",
        ]

        for query in queries:
            print(f"Query: {query}")
            print("-" * 60)

            response = await runner.run(query)
            print(f"Response: {response.text}")
            print()

        # Demonstrate memory proposal
        print("5. Proposing a new memory...")
        agent_client = A2PClient(agent_did=AGENT_DID, storage=storage)

        proposal_result = await agent_client.propose_memory(
            user_did=user_did,
            content="User is interested in event-driven architecture patterns",
            category="a2p:professional.interests",
            confidence=0.85,
        )

        print(f"✓ Proposal created: {proposal_result.get('proposal_id')}")
        print(f"  Status: {proposal_result.get('status')}")
        print()

        print("=" * 60)
        print("Example completed successfully!")
        print("=" * 60)
        print()
        print("Next steps:")
        print("1. Review the proposal in your a2p-cloud dashboard")
        print("2. Approve or reject the proposal")
        print("3. The agent will use approved memories in future interactions")

    finally:
        # Cleanup
        await storage.close()


if __name__ == "__main__":
    asyncio.run(main())
