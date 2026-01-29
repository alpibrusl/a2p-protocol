"""
Example 12: Child Profile with Parental Controls

Demonstrates how to create and manage a child's profile with:
- Age context
- Guardian management
- Content safety
- Screen time limits
- Enforced policies
"""

import asyncio
from a2p import (
    A2PClient,
    A2PUserClient,
    MemoryStorage,
    Guardianship,
    AgeContext,
    Guardian,
    ContentSafety,
)


async def main():
    print("=== a2p Child Profile Example ===\n")

    storage = MemoryStorage()

    # ============================================
    # Step 1: Parent creates their profile
    # ============================================
    print("1. Parent (Alice) creates their profile...\n")

    parent_client = A2PUserClient(storage)
    parent_profile = await parent_client.create_profile(
        display_name="Alice",
        preferences={
            "language": "es-ES",
            "timezone": "Europe/Madrid",
        }
    )

    print(f"   Parent profile created: {parent_profile.id}")
    print()

    # ============================================
    # Step 2: Parent creates child's profile
    # ============================================
    print("2. Parent creates child profile with guardianship...\n")

    # Age context
    age_context = AgeContext(
        age_group="child",
        age_range="8-12",
        jurisdiction="ES",  # Spain: digital age of consent is 14
        digital_age_of_consent=14,
        consent_status="parental_consent",
    )

    # Guardian configuration
    guardian = Guardian(
        did=parent_profile.id,
        relationship="parent",
        permissions=["manage_profile", "approve_proposals", "set_policies", "view_activity"],
        consent_given=True,
    )

    # Content safety settings
    content_safety = ContentSafety(
        age_group="child",
        maturity_rating="G",
        filter_explicit_content=True,
        filter_violence=True,
        filter_scary_content=True,
        safe_search="strict",
        chat_restrictions={
            "allowStrangers": False,
            "moderatedChats": True,
            "predefinedPhrasesOnly": False,
        },
        purchase_controls={
            "requireApproval": True,
            "spendingLimit": 0,
        },
        screen_time={
            "enabled": True,
            "dailyLimit": "2h",
            "bedtime": "20:00",
            "breakReminders": True,
        },
    )

    # Complete guardianship settings
    guardianship = Guardianship(
        guardians=[guardian],
        managed_by=parent_profile.id,
        content_safety=content_safety,
    )

    child_display_name = "Jamie"

    print("   Child profile settings:")
    print(f"   - Name: {child_display_name}")
    print(f"   - Age group: {age_context.age_group} ({age_context.age_range})")
    print(f"   - Jurisdiction: {age_context.jurisdiction} (consent age: {age_context.digital_age_of_consent})")
    print(f"   - Primary guardian: {guardianship.managed_by}")
    print()

    # ============================================
    # Step 3: Show content safety settings
    # ============================================
    print("3. Content safety settings:\n")

    print("   ┌─────────────────────────────────────────────┐")
    print("   │           CONTENT SAFETY                     │")
    print("   ├─────────────────────────────────────────────┤")
    print(f"   │ Age Group:            {(content_safety.age_group or '').ljust(21)}│")
    print(f"   │ Maturity Rating:      {(content_safety.maturity_rating or '').ljust(21)}│")
    print(f"   │ Filter Explicit:      {('Yes' if content_safety.filter_explicit_content else 'No').ljust(21)}│")
    print(f"   │ Filter Violence:      {('Yes' if content_safety.filter_violence else 'No').ljust(21)}│")
    print(f"   │ Filter Scary:         {('Yes' if content_safety.filter_scary_content else 'No').ljust(21)}│")
    print(f"   │ Safe Search:          {(content_safety.safe_search or '').ljust(21)}│")
    chat_allow = content_safety.chat_restrictions.get("allowStrangers", False) if content_safety.chat_restrictions else False
    chat_mod = content_safety.chat_restrictions.get("moderatedChats", False) if content_safety.chat_restrictions else False
    print(f"   │ Allow Strangers:      {('Yes' if chat_allow else 'No').ljust(21)}│")
    print(f"   │ Moderated Chats:      {('Yes' if chat_mod else 'No').ljust(21)}│")
    print("   └─────────────────────────────────────────────┘")
    print()

    # ============================================
    # Step 4: Show screen time settings
    # ============================================
    print("4. Screen time and purchase controls:\n")

    screen_enabled = content_safety.screen_time.get("enabled", False) if content_safety.screen_time else False
    daily_limit = content_safety.screen_time.get("dailyLimit", "None") if content_safety.screen_time else "None"
    bedtime = content_safety.screen_time.get("bedtime", "Not set") if content_safety.screen_time else "Not set"
    break_rem = content_safety.screen_time.get("breakReminders", False) if content_safety.screen_time else False
    purchase_approval = content_safety.purchase_controls.get("requireApproval", False) if content_safety.purchase_controls else False
    spending = content_safety.purchase_controls.get("spendingLimit", 0) if content_safety.purchase_controls else 0

    print("   ┌─────────────────────────────────────────────┐")
    print("   │           PARENTAL CONTROLS                  │")
    print("   ├─────────────────────────────────────────────┤")
    print(f"   │ Screen Time Enabled:  {('Yes' if screen_enabled else 'No').ljust(21)}│")
    print(f"   │ Daily Limit:          {daily_limit.ljust(21)}│")
    print(f"   │ Bedtime:              {bedtime.ljust(21)}│")
    print(f"   │ Break Reminders:      {('Yes' if break_rem else 'No').ljust(21)}│")
    print("   ├─────────────────────────────────────────────┤")
    print(f"   │ Purchase Approval:    {('Required' if purchase_approval else 'No').ljust(21)}│")
    print(f"   │ Spending Limit:       {('€' + str(spending)).ljust(21)}│")
    print("   └─────────────────────────────────────────────┘")
    print()

    # ============================================
    # Step 5: Simulate agent access request
    # ============================================
    print("5. Agent requests access to child profile...\n")

    agent_client = A2PClient(
        agent_did="did:a2p:agent:local:educational-game",
        storage=storage,
    )

    print("   Agent: did:a2p:agent:local:educational-game")
    print("   Requested scopes: [a2p:preferences, a2p:interests]")
    print()

    # Simulated access check
    is_minor = age_context.consent_status == "parental_consent"
    requires_guardian_approval = is_minor

    print("   ⚠️  MINOR PROFILE DETECTED")
    print(f"   → Consent status: {age_context.consent_status}")
    print(f"   → Guardian approval required: {'Yes' if requires_guardian_approval else 'No'}")
    print(f"   → Primary guardian: {guardianship.managed_by}")
    print()

    # ============================================
    # Step 6: Show enforced policies
    # ============================================
    print("6. Enforced policies (child cannot override):\n")

    enforced_policies = [
        {"field": "contentSafety.filterExplicitContent", "value": True, "reason": "Age-appropriate content"},
        {"field": "contentSafety.filterViolence", "value": True, "reason": "Violence protection"},
        {"field": "chatRestrictions.allowStrangers", "value": False, "reason": "Safety: no strangers"},
        {"field": "purchaseControls.requireApproval", "value": True, "reason": "Parent approval for purchases"},
        {"field": "screenTime.dailyLimit", "value": "2h", "reason": "Screen time limit"},
        {"field": "screenTime.bedtime", "value": "20:00", "reason": "Digital bedtime"},
    ]

    print("   🔒 LOCKED BY GUARDIAN:")
    for policy in enforced_policies:
        print(f"   - {policy['field']} = {policy['value']}")
        print(f"     Reason: {policy['reason']}")
    print()

    # ============================================
    # Step 7: Legal compliance
    # ============================================
    print("7. Legal compliance:\n")

    print("   ✅ COPPA (US) - Children under 13: Parental consent required")
    print("   ✅ GDPR Article 8 (EU) - Digital consent age varies by country")
    print(f"   ✅ LOPDGDD (Spain) - Age {age_context.digital_age_of_consent} for digital consent")
    print("   ✅ Content filtering aligned with age group")
    print()

    # ============================================
    # Step 8: Guardian permissions summary
    # ============================================
    print("8. Guardian permissions:\n")

    print("   ┌─────────────────────────────────────────────┐")
    print("   │        GUARDIAN CAPABILITIES                 │")
    print("   ├─────────────────────────────────────────────┤")
    for perm in guardian.permissions:
        print(f"   │ ✓ {perm.replace('_', ' ').ljust(41)}│")
    print("   └─────────────────────────────────────────────┘")
    print()

    print("=== Child Profile Example Complete ===\n")


if __name__ == "__main__":
    asyncio.run(main())
