/**
 * Example 11: Accessibility Profile
 *
 * Demonstrates how services can adapt to user accessibility preferences:
 * - Digital UI services: Generative UI adaptation
 * - Physical services: Restaurant reservations, hotel bookings, etc.
 */

import {
  A2PClient,
  A2PUserClient,
  MemoryStorage,
  AccessibilityPreferences,
  PhysicalAccessibility
} from '@a2p/sdk';

interface UIAdaptations {
  colorPalette: string;
  fontSize: string;
  animations: boolean;
  theme: string;
  contrast: string;
  clickTargetSize: string;
  timeoutMultiplier: number;
  lineSpacing: string;
}

interface RestaurantReservation {
  specialRequests: string[];
  allergyWarnings: string[];
  dietaryNotes: string[];
  accessibilityNeeds: string[];
}

// Simulated generative UI adapter
function generateAdaptedUI(accessibility: AccessibilityPreferences): UIAdaptations {
  const adaptations: UIAdaptations = {
    colorPalette: 'default',
    fontSize: 'medium',
    animations: true,
    theme: 'light',
    contrast: 'normal',
    clickTargetSize: 'normal',
    timeoutMultiplier: 1,
    lineSpacing: 'normal'
  };

  // Adapt for color vision
  if (accessibility.vision?.colorVision?.type) {
    const cvType = accessibility.vision.colorVision.type;
    if (['protanopia', 'deuteranopia', 'protanomaly', 'deuteranomaly'].includes(cvType)) {
      adaptations.colorPalette = 'colorblind-safe-rg'; // Avoid red/green
      console.log('  → Using red/green colorblind-safe palette');
    } else if (['tritanopia', 'tritanomaly'].includes(cvType)) {
      adaptations.colorPalette = 'colorblind-safe-by'; // Avoid blue/yellow
      console.log('  → Using blue/yellow colorblind-safe palette');
    } else if (cvType === 'achromatopsia') {
      adaptations.colorPalette = 'high-contrast-patterns'; // Use patterns, not colors
      console.log('  → Using patterns instead of colors');
    }
  }

  // Adapt font size
  if (accessibility.vision?.fontSize) {
    adaptations.fontSize = accessibility.vision.fontSize;
    console.log(`  → Font size: ${adaptations.fontSize}`);
  }

  // Adapt for reduced motion
  if (accessibility.vision?.reducedMotion || accessibility.cognitive?.reducedAnimations) {
    adaptations.animations = false;
    console.log('  → Animations disabled');
  }

  // Adapt theme
  if (accessibility.vision?.prefersDarkMode) {
    adaptations.theme = 'dark';
    console.log('  → Using dark theme');
  }

  // Adapt contrast
  if (accessibility.vision?.highContrast) {
    adaptations.contrast = accessibility.vision.highContrast;
    console.log(`  → Contrast: ${adaptations.contrast}`);
  }

  // Adapt for motor accessibility
  if (accessibility.motor?.largeClickTargets) {
    adaptations.clickTargetSize = 'large'; // min 44x44px
    console.log('  → Using large click targets (44x44px minimum)');
  }

  if (accessibility.motor?.extendedTimeouts) {
    adaptations.timeoutMultiplier = 3; // 3x longer timeouts
    console.log('  → Timeouts extended 3x');
  }

  // Adapt for cognitive accessibility
  if (accessibility.cognitive?.readingAssistance?.lineSpacing) {
    adaptations.lineSpacing = accessibility.cognitive.readingAssistance.lineSpacing;
    console.log(`  → Line spacing: ${adaptations.lineSpacing}`);
  }

  return adaptations;
}

// Simulated restaurant reservation system
function prepareRestaurantReservation(physical: PhysicalAccessibility): RestaurantReservation {
  const reservation: RestaurantReservation = {
    specialRequests: [],
    allergyWarnings: [],
    dietaryNotes: [],
    accessibilityNeeds: []
  };

  // Process allergies - CRITICAL for safety
  if (physical.allergies?.food) {
    for (const allergen of physical.allergies.food) {
      const severity = physical.allergies.severity?.[allergen] || 'unknown';
      if (severity === 'anaphylactic') {
        reservation.allergyWarnings.push(`⚠️ SEVERE: ${allergen} (ANAPHYLACTIC - carries EpiPen)`);
      } else if (severity === 'severe') {
        reservation.allergyWarnings.push(`⚠️ SEVERE: ${allergen}`);
      } else {
        reservation.allergyWarnings.push(`${allergen} (${severity})`);
      }
    }
    console.log(`  → Food allergies flagged: ${physical.allergies.food.join(', ')}`);
  }

  // Process dietary restrictions
  if (physical.dietary?.restrictions) {
    reservation.dietaryNotes.push(...physical.dietary.restrictions.map(r => r.toUpperCase()));
    console.log(`  → Dietary restrictions: ${physical.dietary.restrictions.join(', ')}`);
  }

  if (physical.dietary?.intolerances) {
    reservation.dietaryNotes.push(...physical.dietary.intolerances.map(i => `No ${i}`));
    console.log(`  → Intolerances: ${physical.dietary.intolerances.join(', ')}`);
  }

  if (physical.dietary?.medicalDiets) {
    reservation.dietaryNotes.push(...physical.dietary.medicalDiets.map(d => `Medical: ${d}`));
    console.log(`  → Medical diets: ${physical.dietary.medicalDiets.join(', ')}`);
  }

  // Process mobility needs
  if (physical.mobility?.wheelchair) {
    reservation.accessibilityNeeds.push('Wheelchair-accessible seating required');
    console.log('  → Wheelchair seating requested');
  }

  // Process service animal
  if (physical.serviceAnimal?.has) {
    reservation.accessibilityNeeds.push(
      `Service animal: ${physical.serviceAnimal.type} (${physical.serviceAnimal.name})`
    );
    console.log(`  → Service animal: ${physical.serviceAnimal.name}`);
  }

  return reservation;
}

async function main() {
  console.log('=== a2p Accessibility Profile Example ===\n');

  // Create storage
  const storage = new MemoryStorage();

  // Create user client
  const userClient = new A2PUserClient(storage);

  // Create a profile with accessibility preferences
  console.log('1. Creating user profile with accessibility preferences...\n');

  const profile = await userClient.createProfile({
    displayName: 'Alex',
    preferences: {
      language: 'en-US',
      timezone: 'America/New_York'
    }
  });

  // Comprehensive accessibility preferences
  const accessibilityPrefs: AccessibilityPreferences = {
    // Digital UI preferences
    vision: {
      colorVision: {
        type: 'deuteranopia',
        severity: 'moderate'
      },
      fontSize: 'large',
      prefersDarkMode: true,
      reducedMotion: true,
      highContrast: 'more'
    },
    motor: {
      largeClickTargets: true,
      extendedTimeouts: true
    },
    cognitive: {
      reducedAnimations: true,
      readingAssistance: {
        lineSpacing: 'wide'
      }
    },
    // Physical accessibility needs
    physical: {
      mobility: {
        wheelchair: true,
        wheelchairType: 'electric',
        requiresAccessibleEntrance: true
      },
      serviceAnimal: {
        has: true,
        type: 'guide_dog',
        name: 'Max',
        breed: 'Labrador Retriever'
      },
      allergies: {
        food: ['peanuts', 'shellfish', 'tree nuts'],
        medication: ['penicillin'],
        severity: {
          'peanuts': 'anaphylactic',
          'shellfish': 'moderate',
          'tree nuts': 'severe'
        },
        epiPenCarrier: true
      },
      dietary: {
        restrictions: ['vegetarian'],
        intolerances: ['lactose'],
        medicalDiets: ['low_sodium']
      },
      emergencyInfo: {
        emergencyContact: {
          name: 'Jordan Smith',
          relationship: 'spouse',
          phone: '+1-555-123-4567'
        },
        medicalConditions: ['asthma'],
        bloodType: 'O+'
      }
    }
  };

  console.log('   Digital accessibility preferences:');
  console.log('   - Color vision: deuteranopia (moderate)');
  console.log('   - Font size: large');
  console.log('   - Dark mode: enabled');
  console.log('   - Reduced motion: enabled');
  console.log();
  console.log('   Physical accessibility needs:');
  console.log('   - Wheelchair: electric');
  console.log('   - Service animal: Max (guide dog)');
  console.log('   - Allergies: peanuts (anaphylactic), shellfish, tree nuts');
  console.log('   - Dietary: vegetarian, lactose-free, low sodium');
  console.log();

  // =====================================================
  // Scenario 1: Generative UI Service
  // =====================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SCENARIO 1: Generative UI Service');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('2. Generative UI service requesting accessibility preferences...\n');
  console.log('   Scope requested: a2p:preferences.accessibility.vision,motor,cognitive');
  console.log('   Purpose: UI adaptation\n');

  // Generate adapted UI
  console.log('3. Generating adapted UI based on preferences...\n');

  const adaptations = generateAdaptedUI(accessibilityPrefs);

  console.log('\n4. Final UI configuration:');
  console.log('   ─────────────────────────────────────');
  console.log(`   Color palette:     ${adaptations.colorPalette}`);
  console.log(`   Font size:         ${adaptations.fontSize}`);
  console.log(`   Theme:             ${adaptations.theme}`);
  console.log(`   Contrast:          ${adaptations.contrast}`);
  console.log(`   Animations:        ${adaptations.animations ? 'enabled' : 'disabled'}`);
  console.log(`   Click targets:     ${adaptations.clickTargetSize}`);
  console.log(`   Timeout multiplier: ${adaptations.timeoutMultiplier}x`);
  console.log(`   Line spacing:      ${adaptations.lineSpacing}`);
  console.log('   ─────────────────────────────────────\n');

  console.log('✅ UI successfully adapted!\n');

  // =====================================================
  // Scenario 2: Restaurant Reservation
  // =====================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('SCENARIO 2: Restaurant Reservation Service');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('5. Restaurant agent requesting physical accessibility data...\n');
  console.log('   Scope requested: a2p:preferences.accessibility.physical.allergies,dietary,mobility,serviceAnimal');
  console.log('   Purpose: reservation_accessibility\n');

  console.log('6. Preparing reservation with accessibility information...\n');

  const reservation = prepareRestaurantReservation(accessibilityPrefs.physical!);

  console.log('\n7. Reservation details for kitchen staff:');
  console.log('   ─────────────────────────────────────');

  if (reservation.allergyWarnings.length > 0) {
    console.log('   🚨 ALLERGY ALERTS:');
    reservation.allergyWarnings.forEach(a => console.log(`      ${a}`));
  }

  if (reservation.dietaryNotes.length > 0) {
    console.log('   🍽️  DIETARY REQUIREMENTS:');
    reservation.dietaryNotes.forEach(d => console.log(`      ${d}`));
  }

  if (reservation.accessibilityNeeds.length > 0) {
    console.log('   ♿ ACCESSIBILITY:');
    reservation.accessibilityNeeds.forEach(a => console.log(`      ${a}`));
  }

  console.log('   ─────────────────────────────────────\n');

  console.log('✅ Restaurant reservation prepared with safety information!\n');

  // =====================================================
  // Privacy Summary
  // =====================================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('PRIVACY PROTECTION');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('   Service-specific data sharing:');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ Service          │ Data Shared                         │');
  console.log('   ├─────────────────────────────────────────────────────────┤');
  console.log('   │ UI Service       │ vision, motor, cognitive only       │');
  console.log('   │ Restaurant       │ allergies, dietary, mobility        │');
  console.log('   │ Hotel            │ mobility, serviceAnimal, devices    │');
  console.log('   │ Healthcare       │ Full physical accessibility data    │');
  console.log('   └─────────────────────────────────────────────────────────┘');
  console.log();
  console.log('   ✓ User controls what each service can access');
  console.log('   ✓ Data is not stored longer than needed');
  console.log('   ✓ No sharing with third parties without consent');
  console.log();
}

main().catch(console.error);
