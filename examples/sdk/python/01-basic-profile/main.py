"""
Example 01: Basic Profile

This example shows how to create and manage a user profile.
"""

import asyncio
from a2p import (
    create_user_client,
    SensitivityLevel,
)


async def main():
    print("🚀 a2p Example: Basic Profile\n")

    # ============================================
    # 1. Create a User Client
    # ============================================
    print("1️⃣ Creating user client...")
    user = create_user_client()

    # ============================================
    # 2. Create a New Profile
    # ============================================
    print("2️⃣ Creating profile...")
    profile = await user.create_profile(display_name="Alice")
    print(f"   ✅ Profile created: {profile.id}")

    # ============================================
    # 3. Add Memories
    # ============================================
    print("3️⃣ Adding memories...")

    # Add professional information
    await user.add_memory(
        content="Works as a Software Engineer at TechCorp",
        category="a2p:professional",
        sensitivity=SensitivityLevel.STANDARD,
        tags=["work", "career"],
    )
    print("   ✅ Added professional memory")

    # Add interests
    await user.add_memory(
        content="Interested in machine learning and distributed systems",
        category="a2p:interests.topics",
        sensitivity=SensitivityLevel.PUBLIC,
    )
    print("   ✅ Added interests memory")

    # Add a preference
    await user.add_memory(
        content="Prefers concise responses with code examples",
        category="a2p:preferences.communication",
        sensitivity=SensitivityLevel.PUBLIC,
    )
    print("   ✅ Added communication preference")

    # ============================================
    # 4. View the Profile
    # ============================================
    print("\n4️⃣ Current profile:")
    current_profile = user.get_profile()

    if current_profile:
        print(f"   ID: {current_profile.id}")
        print(f"   Display Name: {current_profile.identity.display_name}")

        memories = current_profile.memories.episodic if current_profile.memories else []
        print(f"   Memories: {len(memories) if memories else 0}")

        # Show memories
        if memories:
            for memory in memories:
                print(f"   - [{memory.category}] {memory.content}")

    # ============================================
    # 5. Export Profile
    # ============================================
    print("\n5️⃣ Exporting profile...")
    exported = user.export_profile()
    print("   ✅ Profile exported to JSON")
    print(f"   Size: {len(exported)} bytes")

    # ============================================
    # 6. Show JSON (truncated)
    # ============================================
    print("\n6️⃣ Profile JSON (first 500 chars):")
    print(exported[:500] + "...")

    print("\n✨ Example complete!")


if __name__ == "__main__":
    asyncio.run(main())
