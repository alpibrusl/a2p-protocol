"""
Solid Pods + a2p: Store user profiles in decentralized Solid Pods

This example demonstrates how to use Solid Pods as a storage backend
for a2p profiles, enabling fully decentralized, user-owned profile storage.

Requirements:
    - Solid Pod account (e.g., pod.inrupt.com)
    - Access token for your Pod
    - a2p SDK installed: pip install a2p-sdk

Note: This is a simplified example. In production, you would use
a proper Solid Python SDK (e.g., solid-python) for authentication.
"""

import asyncio
import os
from typing import Any

from a2p import A2PUserClient, A2PClient, add_policy, PermissionLevel
from a2p.storage.solid import SolidStorage


async def get_solid_access_token() -> tuple[str, str]:
    """
    Get Solid Pod URL and access token.

    In production, this would use a proper Solid authentication flow.
    For this example, we expect environment variables.

    Returns:
        Tuple of (pod_url, access_token)
    """
    pod_url = os.getenv("SOLID_POD_URL")
    access_token = os.getenv("SOLID_ACCESS_TOKEN")

    if not pod_url or not access_token:
        raise ValueError(
            "Please set SOLID_POD_URL and SOLID_ACCESS_TOKEN environment variables.\n"
            "Example:\n"
            "  export SOLID_POD_URL='https://alice.inrupt.com/profile/card#me'\n"
            "  export SOLID_ACCESS_TOKEN='your-solid-access-token'\n"
            "\n"
            "To get an access token, use a Solid authentication library\n"
            "or the Solid authentication flow."
        )

    return pod_url, access_token


async def main():
    """Main example: Store a2p profile in Solid Pod."""

    print("=" * 60)
    print("Solid Pods + a2p Integration Example")
    print("=" * 60)
    print()

    # 1. Get Solid Pod credentials
    print("Step 1: Authenticating with Solid Pod...")
    try:
        pod_url, access_token = await get_solid_access_token()
        print(f"✓ Connected to Pod: {pod_url}")
    except ValueError as e:
        print(f"✗ Error: {e}")
        return

    # 2. Create Solid storage backend
    print("\nStep 2: Creating Solid storage backend...")
    storage = SolidStorage(
        pod_url=pod_url,
        access_token=access_token,
    )
    print(f"✓ Storage backend created")
    print(f"  Profile will be stored at: {storage.profile_path}")

    # 3. Create a2p profile (stored in Solid Pod)
    print("\nStep 3: Creating a2p profile in Solid Pod...")
    user = A2PUserClient(storage)

    # Create profile with preferences
    profile = await user.create_profile(
        display_name="Alice",
        preferences={
            "language": "en-US",
            "timezone": "America/New_York",
            "communication": {
                "style": "technical",
                "detailLevel": "detailed",
            },
        },
    )

    print(f"✓ Profile created: {profile.id}")
    print(f"  Display name: {profile.identity.display_name}")

    # 4. Add some memories
    print("\nStep 4: Adding memories to profile...")
    await user.add_memory(
        content="Software engineer with 10 years of experience in Python and TypeScript",
        category="a2p:professional",
        source="user",
    )
    await user.add_memory(
        content="Prefers technical documentation with code examples",
        category="a2p:preferences",
        source="user",
    )
    print("✓ Memories added")

    # 5. Add consent policy
    print("\nStep 5: Adding consent policy...")
    profile = await add_policy(
        profile,
        agent_pattern="did:a2p:agent:*",
        scopes=["a2p:preferences", "a2p:memories"],
        permission_level=PermissionLevel.READ,
    )
    print("✓ Consent policy added")

    # 6. Verify profile is stored in Solid Pod
    print("\nStep 6: Verifying profile in Solid Pod...")
    agent = A2PClient(
        agent_did="did:a2p:agent:research-assistant",
        storage=storage,
    )

    # Request access
    access = await agent.request_access(
        user_did=profile.id,
        scopes=["a2p:preferences", "a2p:memories"],
    )

    if access.get("granted"):
        print("✓ Profile accessible from Solid Pod")
        profile_data = access.get("profile", {})
        print(f"  Agent can access: {len(profile_data.get('memories', {}).get('a2p:episodic', []))} memories")
    else:
        print("✗ Access denied")

    # 7. Show benefits
    print("\n" + "=" * 60)
    print("Benefits of Solid + a2p:")
    print("=" * 60)
    print("✅ Fully Decentralized: Profile stored in YOUR Pod")
    print("✅ User Control: You own both Pod and profile data")
    print("✅ Portability: Move Pod to different provider, profile comes with it")
    print("✅ Privacy: You control access via Solid's access control")
    print("✅ Compliance: Both Solid and a2p support GDPR requirements")
    print()

    print(f"Profile stored at: {storage.profile_path}")
    print(f"Profile DID: {profile.id}")


if __name__ == "__main__":
    asyncio.run(main())
