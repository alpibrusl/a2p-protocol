#!/usr/bin/env python3
"""
Gaugid Basic Connection Example

This example demonstrates how to:
1. Connect to Gaugid API
2. Read a user profile
3. Propose a new memory

Prerequisites:
- Gaugid account (sign up at gaugid.com)
- GAUGID_API_URL, GAUGID_AUTH_TOKEN, GAUGID_USER_DID environment variables
"""

import os
import asyncio
from a2p import A2PClient
from a2p.storage.cloud import CloudStorage


async def main():
    # Configuration from environment
    api_url = os.environ.get("GAUGID_API_URL", "https://api.gaugid.com")
    auth_token = os.environ.get("GAUGID_AUTH_TOKEN")
    user_did = os.environ.get("GAUGID_USER_DID")
    agent_did = os.environ.get("GAUGID_AGENT_DID", "did:a2p:agent:gaugid:example-agent")

    if not auth_token:
        print("❌ Error: GAUGID_AUTH_TOKEN environment variable required")
        print("   Get your token from the Gaugid dashboard")
        return

    if not user_did:
        print("❌ Error: GAUGID_USER_DID environment variable required")
        print("   Create a profile in the Gaugid dashboard first")
        return

    print("🚀 Gaugid Basic Connection Example")
    print(f"   API URL: {api_url}")
    print(f"   User DID: {user_did}")
    print(f"   Agent DID: {agent_did}")
    print()

    # Initialize CloudStorage to connect to Gaugid
    storage = CloudStorage(
        api_url=api_url,
        auth_token=auth_token,
        agent_did=agent_did,
    )

    # Initialize A2P client with Gaugid storage
    client = A2PClient(
        agent_did=agent_did,
        storage=storage,
    )

    try:
        # Step 1: Load user profile from Gaugid
        print("📖 Loading user profile from Gaugid...")
        profile = await client.get_profile(user_did)

        if not profile:
            print("❌ Profile not found. Create one in the Gaugid dashboard first.")
            return

        print(f"✅ Profile loaded: {profile.profile_type} profile")

        if profile.identity and profile.identity.display_name:
            print(f"   Name: {profile.identity.display_name}")

        # Show existing memories count
        memory_count = 0
        if profile.memories:
            for category in ["semantic", "episodic", "procedural"]:
                memories = getattr(profile.memories, category, [])
                if memories:
                    memory_count += len(memories)
        print(f"   Memories: {memory_count}")
        print()

        # Step 2: Propose a new memory
        print("💡 Proposing a new memory...")

        proposal_result = await client.propose_memory(
            user_did=user_did,
            content="User connected their first agent to Gaugid",
            category="a2p:episodic",
            confidence=0.95,
            context="Initial Gaugid connection example",
        )

        print(f"✅ Memory proposed!")
        print(f"   Proposal ID: {proposal_result['proposal_id']}")
        print(f"   Status: {proposal_result['status']}")
        print()

        # Step 3: Show next steps
        print("📋 Next Steps:")
        print("   1. Go to Gaugid dashboard to review the proposal")
        print("   2. Approve or reject the proposed memory")
        print("   3. The memory will be added to the profile if approved")
        print()
        print(f"   Dashboard: {api_url.replace('api.', '')}/proposals")

    finally:
        # Cleanup
        await storage.close()


if __name__ == "__main__":
    asyncio.run(main())
