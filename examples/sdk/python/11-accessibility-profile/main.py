"""
Example 11: Accessibility Profile

Demonstrates how services can adapt to user accessibility preferences:
- Digital UI services: Generative UI adaptation
- Physical services: Restaurant reservations, hotel bookings, etc.
"""

import asyncio
from typing import Dict, Any, List
from a2p import (
    A2PUserClient,
    MemoryStorage,
    AccessibilityPreferences,
    PhysicalAccessibility,
)


def generate_adapted_ui(accessibility: AccessibilityPreferences) -> Dict[str, Any]:
    """Simulated generative UI adapter."""
    adaptations = {
        "colorPalette": "default",
        "fontSize": "medium",
        "animations": True,
        "theme": "light",
        "contrast": "normal",
        "clickTargetSize": "normal",
        "timeoutMultiplier": 1,
        "lineSpacing": "normal",
    }

    # Adapt for color vision
    if accessibility.vision and accessibility.vision.color_vision:
        cv_type = accessibility.vision.color_vision.get("type")
        if cv_type in ["protanopia", "deuteranopia", "protanomaly", "deuteranomaly"]:
            adaptations["colorPalette"] = "colorblind-safe-rg"
            print("  → Using red/green colorblind-safe palette")
        elif cv_type in ["tritanopia", "tritanomaly"]:
            adaptations["colorPalette"] = "colorblind-safe-by"
            print("  → Using blue/yellow colorblind-safe palette")
        elif cv_type == "achromatopsia":
            adaptations["colorPalette"] = "high-contrast-patterns"
            print("  → Using patterns instead of colors")

    # Adapt font size
    if accessibility.vision and accessibility.vision.font_size:
        adaptations["fontSize"] = accessibility.vision.font_size
        print(f"  → Font size: {adaptations['fontSize']}")

    # Adapt for reduced motion
    if (accessibility.vision and accessibility.vision.reduced_motion) or \
       (accessibility.cognitive and accessibility.cognitive.reduced_animations):
        adaptations["animations"] = False
        print("  → Animations disabled")

    # Adapt theme
    if accessibility.vision and accessibility.vision.prefers_dark_mode:
        adaptations["theme"] = "dark"
        print("  → Using dark theme")

    # Adapt contrast
    if accessibility.vision and accessibility.vision.high_contrast:
        adaptations["contrast"] = accessibility.vision.high_contrast
        print(f"  → Contrast: {adaptations['contrast']}")

    # Adapt for motor accessibility
    if accessibility.motor and accessibility.motor.large_click_targets:
        adaptations["clickTargetSize"] = "large"
        print("  → Using large click targets (44x44px minimum)")

    if accessibility.motor and accessibility.motor.extended_timeouts:
        adaptations["timeoutMultiplier"] = 3
        print("  → Timeouts extended 3x")

    # Adapt for cognitive accessibility
    if accessibility.cognitive and accessibility.cognitive.reading_assistance:
        line_spacing = accessibility.cognitive.reading_assistance.get("lineSpacing")
        if line_spacing:
            adaptations["lineSpacing"] = line_spacing
            print(f"  → Line spacing: {adaptations['lineSpacing']}")

    return adaptations


def prepare_restaurant_reservation(physical: PhysicalAccessibility) -> Dict[str, List[str]]:
    """Simulated restaurant reservation system."""
    reservation = {
        "specialRequests": [],
        "allergyWarnings": [],
        "dietaryNotes": [],
        "accessibilityNeeds": [],
    }

    # Process allergies - CRITICAL for safety
    if physical.allergies and physical.allergies.food:
        for allergen in physical.allergies.food:
            severity = physical.allergies.severity.get(allergen, "unknown") if physical.allergies.severity else "unknown"
            if severity == "anaphylactic":
                reservation["allergyWarnings"].append(f"⚠️ SEVERE: {allergen} (ANAPHYLACTIC - carries EpiPen)")
            elif severity == "severe":
                reservation["allergyWarnings"].append(f"⚠️ SEVERE: {allergen}")
            else:
                reservation["allergyWarnings"].append(f"{allergen} ({severity})")
        print(f"  → Food allergies flagged: {', '.join(physical.allergies.food)}")

    # Process dietary restrictions
    if physical.dietary:
        if physical.dietary.restrictions:
            reservation["dietaryNotes"].extend([r.upper() for r in physical.dietary.restrictions])
            print(f"  → Dietary restrictions: {', '.join(physical.dietary.restrictions)}")

        if physical.dietary.intolerances:
            reservation["dietaryNotes"].extend([f"No {i}" for i in physical.dietary.intolerances])
            print(f"  → Intolerances: {', '.join(physical.dietary.intolerances)}")

        if physical.dietary.medical_diets:
            reservation["dietaryNotes"].extend([f"Medical: {d}" for d in physical.dietary.medical_diets])
            print(f"  → Medical diets: {', '.join(physical.dietary.medical_diets)}")

    # Process mobility needs
    if physical.mobility and physical.mobility.wheelchair:
        reservation["accessibilityNeeds"].append("Wheelchair-accessible seating required")
        print("  → Wheelchair seating requested")

    # Process service animal
    if physical.service_animal and physical.service_animal.has:
        reservation["accessibilityNeeds"].append(
            f"Service animal: {physical.service_animal.type} ({physical.service_animal.name})"
        )
        print(f"  → Service animal: {physical.service_animal.name}")

    return reservation


async def main():
    print("=== a2p Accessibility Profile Example ===\n")

    # Create storage
    storage = MemoryStorage()

    # Create user client
    user_client = A2PUserClient(storage)

    # Create a profile with accessibility preferences
    print("1. Creating user profile with accessibility preferences...\n")

    profile = await user_client.create_profile(
        display_name="Alex",
        preferences={
            "language": "en-US",
            "timezone": "America/New_York",
        }
    )

    # Comprehensive accessibility preferences
    accessibility_prefs = AccessibilityPreferences(
        # Digital UI preferences
        vision={
            "colorVision": {
                "type": "deuteranopia",
                "severity": "moderate",
            },
            "fontSize": "large",
            "prefersDarkMode": True,
            "reducedMotion": True,
            "highContrast": "more",
        },
        motor={
            "largeClickTargets": True,
            "extendedTimeouts": True,
        },
        cognitive={
            "reducedAnimations": True,
            "readingAssistance": {
                "lineSpacing": "wide",
            },
        },
        # Physical accessibility needs
        physical=PhysicalAccessibility(
            mobility={
                "wheelchair": True,
                "wheelchairType": "electric",
                "requiresAccessibleEntrance": True,
            },
            service_animal={
                "has": True,
                "type": "guide_dog",
                "name": "Max",
                "breed": "Labrador Retriever",
            },
            allergies={
                "food": ["peanuts", "shellfish", "tree nuts"],
                "medication": ["penicillin"],
                "severity": {
                    "peanuts": "anaphylactic",
                    "shellfish": "moderate",
                    "tree nuts": "severe",
                },
                "epiPenCarrier": True,
            },
            dietary={
                "restrictions": ["vegetarian"],
                "intolerances": ["lactose"],
                "medicalDiets": ["low_sodium"],
            },
            emergency_info={
                "emergencyContact": {
                    "name": "Jordan Smith",
                    "relationship": "spouse",
                    "phone": "+1-555-123-4567",
                },
                "medicalConditions": ["asthma"],
                "bloodType": "O+",
            },
        )
    )

    print("   Digital accessibility preferences:")
    print("   - Color vision: deuteranopia (moderate)")
    print("   - Font size: large")
    print("   - Dark mode: enabled")
    print("   - Reduced motion: enabled")
    print()
    print("   Physical accessibility needs:")
    print("   - Wheelchair: electric")
    print("   - Service animal: Max (guide dog)")
    print("   - Allergies: peanuts (anaphylactic), shellfish, tree nuts")
    print("   - Dietary: vegetarian, lactose-free, low sodium")
    print()

    # =====================================================
    # Scenario 1: Generative UI Service
    # =====================================================
    print("═══════════════════════════════════════════════════════════")
    print("SCENARIO 1: Generative UI Service")
    print("═══════════════════════════════════════════════════════════\n")

    print("2. Generative UI service requesting accessibility preferences...\n")
    print("   Scope requested: a2p:preferences.accessibility.vision,motor,cognitive")
    print("   Purpose: UI adaptation\n")

    # Generate adapted UI
    print("3. Generating adapted UI based on preferences...\n")

    adaptations = generate_adapted_ui(accessibility_prefs)

    print("\n4. Final UI configuration:")
    print("   ─────────────────────────────────────────")
    print(f"   Color palette:     {adaptations['colorPalette']}")
    print(f"   Font size:         {adaptations['fontSize']}")
    print(f"   Theme:             {adaptations['theme']}")
    print(f"   Contrast:          {adaptations['contrast']}")
    print(f"   Animations:        {'enabled' if adaptations['animations'] else 'disabled'}")
    print(f"   Click targets:     {adaptations['clickTargetSize']}")
    print(f"   Timeout multiplier: {adaptations['timeoutMultiplier']}x")
    print(f"   Line spacing:      {adaptations['lineSpacing']}")
    print("   ─────────────────────────────────────────\n")

    print("✅ UI successfully adapted!\n")

    # =====================================================
    # Scenario 2: Restaurant Reservation
    # =====================================================
    print("═══════════════════════════════════════════════════════════")
    print("SCENARIO 2: Restaurant Reservation Service")
    print("═══════════════════════════════════════════════════════════\n")

    print("5. Restaurant agent requesting physical accessibility data...\n")
    print("   Scope requested: a2p:preferences.accessibility.physical.allergies,dietary,mobility,serviceAnimal")
    print("   Purpose: reservation_accessibility\n")

    print("6. Preparing reservation with accessibility information...\n")

    reservation = prepare_restaurant_reservation(accessibility_prefs.physical)

    print("\n7. Reservation details for kitchen staff:")
    print("   ─────────────────────────────────────────")

    if reservation["allergyWarnings"]:
        print("   🚨 ALLERGY ALERTS:")
        for a in reservation["allergyWarnings"]:
            print(f"      {a}")

    if reservation["dietaryNotes"]:
        print("   🍽️  DIETARY REQUIREMENTS:")
        for d in reservation["dietaryNotes"]:
            print(f"      {d}")

    if reservation["accessibilityNeeds"]:
        print("   ♿ ACCESSIBILITY:")
        for a in reservation["accessibilityNeeds"]:
            print(f"      {a}")

    print("   ─────────────────────────────────────────\n")

    print("✅ Restaurant reservation prepared with safety information!\n")

    # =====================================================
    # Privacy Summary
    # =====================================================
    print("═══════════════════════════════════════════════════════════")
    print("PRIVACY PROTECTION")
    print("═══════════════════════════════════════════════════════════\n")

    print("   Service-specific data sharing:")
    print("   ┌─────────────────────────────────────────────────────────┐")
    print("   │ Service          │ Data Shared                         │")
    print("   ├─────────────────────────────────────────────────────────┤")
    print("   │ UI Service       │ vision, motor, cognitive only       │")
    print("   │ Restaurant       │ allergies, dietary, mobility        │")
    print("   │ Hotel            │ mobility, serviceAnimal, devices    │")
    print("   │ Healthcare       │ Full physical accessibility data    │")
    print("   └─────────────────────────────────────────────────────────┘")
    print()
    print("   ✓ User controls what each service can access")
    print("   ✓ Data is not stored longer than needed")
    print("   ✓ No sharing with third parties without consent")
    print()


if __name__ == "__main__":
    asyncio.run(main())
