"""
OpenID Connect + a2p: Authenticate with OIDC, access a2p profile

This example demonstrates how to bridge OpenID Connect authentication
with a2p profiles, enabling users to authenticate with OIDC and then
access their a2p profile.

Flow:
    1. User authenticates with OIDC provider (Google, GitHub, etc.)
    2. OIDC returns ID token with user claims
    3. Map OIDC identity to DID (did:a2p:user:oidc:<provider>:<sub>)
    4. Load or create a2p profile using DID
    5. Agent accesses user's preferences, memories, consent policies

Requirements:
    - OIDC provider credentials (client_id, client_secret)
    - a2p SDK installed: pip install a2p-sdk
    - authlib for OIDC: pip install authlib httpx

Note: This is a simplified example. In production, you would use
a proper OIDC authentication flow with redirects and callbacks.
"""

import asyncio
import os
from typing import Any

from a2p import A2PUserClient, A2PClient, add_policy, PermissionLevel
from a2p.storage.memory import MemoryStorage


def map_oidc_to_did(oidc_claims: dict[str, Any], provider: str) -> str:
    """
    Map OIDC identity to a2p DID.

    Strategy: did:a2p:user:oidc:<provider>:<sub>

    Args:
        oidc_claims: OIDC ID token claims
        provider: OIDC provider name (e.g., "google", "github")

    Returns:
        User DID
    """
    sub = oidc_claims.get("sub")
    if not sub:
        raise ValueError("OIDC claims missing 'sub' (subject identifier)")

    return f"did:a2p:user:oidc:{provider}:{sub}"


async def simulate_oidc_login(provider: str) -> dict[str, Any]:
    """
    Simulate OIDC login flow.

    In production, this would:
    1. Redirect user to OIDC provider
    2. User authorizes
    3. Provider redirects back with code
    4. Exchange code for ID token
    5. Return ID token claims

    For this example, we simulate with environment variables.

    Args:
        provider: OIDC provider name

    Returns:
        OIDC ID token claims
    """
    # In production, use authlib or similar:
    # from authlib.integrations.httpx_client import AsyncOAuth2Client
    # client = AsyncOAuth2Client(...)
    # token = await client.fetch_token(...)
    # claims = decode_id_token(token['id_token'])

    # For demo, simulate with environment variables
    if provider == "google":
        claims = {
            "sub": os.getenv("OIDC_GOOGLE_SUB", "google-123456789"),
            "email": os.getenv("OIDC_GOOGLE_EMAIL", "alice@example.com"),
            "name": os.getenv("OIDC_GOOGLE_NAME", "Alice"),
            "email_verified": True,
            "picture": "https://example.com/avatar.jpg",
        }
    elif provider == "github":
        claims = {
            "sub": os.getenv("OIDC_GITHUB_SUB", "github-987654321"),
            "email": os.getenv("OIDC_GITHUB_EMAIL", "alice@example.com"),
            "name": os.getenv("OIDC_GITHUB_NAME", "Alice"),
            "preferred_username": "alice",
        }
    else:
        # Generic provider
        claims = {
            "sub": os.getenv("OIDC_SUB", f"{provider}-123456"),
            "email": os.getenv("OIDC_EMAIL", "alice@example.com"),
            "name": os.getenv("OIDC_NAME", "Alice"),
        }

    return claims


async def main():
    """Main example: OIDC authentication → a2p profile."""

    print("=" * 60)
    print("OpenID Connect + a2p Integration Example")
    print("=" * 60)
    print()

    # 1. Simulate OIDC authentication
    print("Step 1: Authenticating with OIDC provider...")
    provider = os.getenv("OIDC_PROVIDER", "google")
    oidc_claims = await simulate_oidc_login(provider)

    print(f"✓ Authenticated with {provider}")
    print(f"  Email: {oidc_claims.get('email')}")
    print(f"  Name: {oidc_claims.get('name')}")
    print(f"  Subject: {oidc_claims.get('sub')}")

    # 2. Map OIDC identity to DID
    print("\nStep 2: Mapping OIDC identity to DID...")
    user_did = map_oidc_to_did(oidc_claims, provider)
    print(f"✓ Mapped to DID: {user_did}")

    # 3. Load or create a2p profile
    print("\nStep 3: Loading or creating a2p profile...")
    storage = MemoryStorage()  # In production, use CloudStorage or SolidStorage
    user = A2PUserClient(storage)

    # Check if profile exists
    profile = await user.get_profile(user_did)

    if not profile:
        # Create new profile from OIDC claims
        print("  Creating new profile from OIDC claims...")
        profile = await user.create_profile(
            did=user_did,
            display_name=oidc_claims.get("name", "User"),
            preferences={
                "language": "en-US",  # Could extract from OIDC locale claim
                "timezone": "UTC",
            },
        )

        # Sync OIDC claims to a2p profile
        if oidc_claims.get("email"):
            await user.add_memory(
                content=f"Email: {oidc_claims['email']}",
                category="a2p:identity",
                source="oidc",
            )

        if oidc_claims.get("picture"):
            await user.add_memory(
                content=f"Avatar: {oidc_claims['picture']}",
                category="a2p:identity",
                source="oidc",
            )

        print(f"✓ Created new profile: {profile.id}")
    else:
        print(f"✓ Loaded existing profile: {profile.id}")

    # 4. Add consent policy
    print("\nStep 4: Adding consent policy...")
    profile = await add_policy(
        profile,
        agent_pattern="did:a2p:agent:*",
        scopes=["a2p:preferences", "a2p:memories"],
        permission_level=PermissionLevel.READ,
    )
    print("✓ Consent policy added")

    # 5. Agent accesses profile
    print("\nStep 5: Agent accessing user profile...")
    agent = A2PClient(
        agent_did="did:a2p:agent:web-app",
        storage=storage,
    )

    # Request access
    access = await agent.request_access(
        user_did=user_did,
        scopes=["a2p:preferences", "a2p:memories"],
    )

    if access.get("granted"):
        print("✓ Agent granted access")
        profile_data = access.get("profile", {})
        identity = profile_data.get("identity", {})
        print(f"  Display name: {identity.get('displayName')}")
        print(f"  Memories: {len(profile_data.get('memories', {}).get('a2p:episodic', []))}")
    else:
        print("✗ Access denied")

    # 6. Show benefits
    print("\n" + "=" * 60)
    print("Benefits of OIDC + a2p:")
    print("=" * 60)
    print("✅ Familiar Auth: Users login with existing accounts (Google, GitHub, etc.)")
    print("✅ No Account Creation: No need for separate a2p account")
    print("✅ Enterprise SSO: Support for enterprise single sign-on")
    print("✅ Profile Data: After authentication, access rich a2p profile")
    print("✅ Different Layers: OIDC = auth, a2p = profile data")
    print()

    print(f"User DID: {user_did}")
    print(f"Profile ID: {profile.id}")


if __name__ == "__main__":
    asyncio.run(main())
