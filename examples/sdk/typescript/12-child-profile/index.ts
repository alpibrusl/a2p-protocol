/**
 * Example 12: Child Profile with Parental Controls
 *
 * Demonstrates how to create and manage a child's profile with:
 * - Age context
 * - Guardian management
 * - Content safety
 * - Screen time limits
 * - Enforced policies
 */

import {
  A2PClient,
  A2PUserClient,
  MemoryStorage,
  Guardianship,
  AgeContext,
  Guardian,
  ContentSafety
} from '@a2p/sdk';

async function main() {
  console.log('=== a2p Child Profile Example ===\n');

  const storage = new MemoryStorage();

  // ============================================
  // Step 1: Parent creates their profile
  // ============================================
  console.log('1. Parent (Alice) creates their profile...\n');

  const parentClient = new A2PUserClient(storage);
  const parentProfile = await parentClient.createProfile({
    displayName: 'Alice',
    preferences: {
      language: 'es-ES',
      timezone: 'Europe/Madrid'
    }
  });

  console.log(`   Parent profile created: ${parentProfile.id}`);
  console.log();

  // ============================================
  // Step 2: Parent creates child's profile
  // ============================================
  console.log('2. Parent creates child profile with guardianship...\n');

  // Age context using SDK types
  const ageContext: AgeContext = {
    ageGroup: 'child',
    ageRange: '8-12',
    jurisdiction: 'ES',           // Spain: digital age of consent is 14
    digitalAgeOfConsent: 14,
    consentStatus: 'parental_consent'
  };

  // Guardian configuration using SDK types
  const guardian: Guardian = {
    did: parentProfile.id as `did:${string}:${string}`,
    relationship: 'parent',
    permissions: ['manage_profile', 'approve_proposals', 'set_policies', 'view_activity'],
    consentGiven: new Date().toISOString()
  };

  // Content safety settings using SDK types
  const contentSafety: ContentSafety = {
    ageGroup: 'child',
    maturityRating: 'G',
    filterExplicitContent: true,
    filterViolence: true,
    filterScaryContent: true,
    safeSearch: 'strict',
    chatRestrictions: {
      allowStrangers: false,
      moderatedChats: true,
      predefinedPhrasesOnly: false
    },
    purchaseControls: {
      requireApproval: true,
      spendingLimit: 0
    },
    screenTime: {
      enabled: true,
      dailyLimit: '2h',
      bedtime: '20:00',
      breakReminders: true
    }
  };

  // Complete guardianship settings
  const guardianship: Guardianship = {
    guardians: [guardian],
    managedBy: parentProfile.id as `did:${string}:${string}`,
    contentSafety
  };

  const childDisplayName = 'Jamie';

  console.log('   Child profile settings:');
  console.log(`   - Name: ${childDisplayName}`);
  console.log(`   - Age group: ${ageContext.ageGroup} (${ageContext.ageRange})`);
  console.log(`   - Jurisdiction: ${ageContext.jurisdiction} (consent age: ${ageContext.digitalAgeOfConsent})`);
  console.log(`   - Primary guardian: ${guardianship.managedBy}`);
  console.log();

  // ============================================
  // Step 3: Show content safety settings
  // ============================================
  console.log('3. Content safety settings:\n');

  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │           CONTENT SAFETY                     │');
  console.log('   ├─────────────────────────────────────────────┤');
  console.log(`   │ Age Group:            ${(contentSafety.ageGroup || '').padEnd(21)}│`);
  console.log(`   │ Maturity Rating:      ${(contentSafety.maturityRating || '').padEnd(21)}│`);
  console.log(`   │ Filter Explicit:      ${(contentSafety.filterExplicitContent ? 'Yes' : 'No').padEnd(21)}│`);
  console.log(`   │ Filter Violence:      ${(contentSafety.filterViolence ? 'Yes' : 'No').padEnd(21)}│`);
  console.log(`   │ Filter Scary:         ${(contentSafety.filterScaryContent ? 'Yes' : 'No').padEnd(21)}│`);
  console.log(`   │ Safe Search:          ${(contentSafety.safeSearch || '').padEnd(21)}│`);
  console.log(`   │ Allow Strangers:      ${(contentSafety.chatRestrictions?.allowStrangers ? 'Yes' : 'No').padEnd(21)}│`);
  console.log(`   │ Moderated Chats:      ${(contentSafety.chatRestrictions?.moderatedChats ? 'Yes' : 'No').padEnd(21)}│`);
  console.log('   └─────────────────────────────────────────────┘');
  console.log();

  // ============================================
  // Step 4: Show screen time settings
  // ============================================
  console.log('4. Screen time and purchase controls:\n');

  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │           PARENTAL CONTROLS                  │');
  console.log('   ├─────────────────────────────────────────────┤');
  console.log(`   │ Screen Time Enabled:  ${(contentSafety.screenTime?.enabled ? 'Yes' : 'No').padEnd(21)}│`);
  console.log(`   │ Daily Limit:          ${(contentSafety.screenTime?.dailyLimit || 'None').padEnd(21)}│`);
  console.log(`   │ Bedtime:              ${(contentSafety.screenTime?.bedtime || 'Not set').padEnd(21)}│`);
  console.log(`   │ Break Reminders:      ${(contentSafety.screenTime?.breakReminders ? 'Yes' : 'No').padEnd(21)}│`);
  console.log('   ├─────────────────────────────────────────────┤');
  console.log(`   │ Purchase Approval:    ${(contentSafety.purchaseControls?.requireApproval ? 'Required' : 'No').padEnd(21)}│`);
  console.log(`   │ Spending Limit:       ${('€' + (contentSafety.purchaseControls?.spendingLimit || 0)).padEnd(21)}│`);
  console.log('   └─────────────────────────────────────────────┘');
  console.log();

  // ============================================
  // Step 5: Simulate agent access request
  // ============================================
  console.log('5. Agent requests access to child profile...\n');

  const agentClient = new A2PClient(
    { agentDid: 'did:a2p:agent:local:educational-game' },
    storage
  );

  console.log('   Agent: did:a2p:agent:local:educational-game');
  console.log('   Requested scopes: [a2p:preferences, a2p:interests]');
  console.log();

  // Simulated access check
  const isMinor = ageContext.consentStatus === 'parental_consent';
  const requiresGuardianApproval = isMinor;

  console.log('   ⚠️  MINOR PROFILE DETECTED');
  console.log(`   → Consent status: ${ageContext.consentStatus}`);
  console.log(`   → Guardian approval required: ${requiresGuardianApproval ? 'Yes' : 'No'}`);
  console.log(`   → Primary guardian: ${guardianship.managedBy}`);
  console.log();

  // ============================================
  // Step 6: Show enforced policies
  // ============================================
  console.log('6. Enforced policies (child cannot override):\n');

  const enforcedPolicies = [
    { field: 'contentSafety.filterExplicitContent', value: true, reason: 'Age-appropriate content' },
    { field: 'contentSafety.filterViolence', value: true, reason: 'Violence protection' },
    { field: 'chatRestrictions.allowStrangers', value: false, reason: 'Safety: no strangers' },
    { field: 'purchaseControls.requireApproval', value: true, reason: 'Parent approval for purchases' },
    { field: 'screenTime.dailyLimit', value: '2h', reason: 'Screen time limit' },
    { field: 'screenTime.bedtime', value: '20:00', reason: 'Digital bedtime' }
  ];

  console.log('   🔒 LOCKED BY GUARDIAN:');
  enforcedPolicies.forEach(policy => {
    console.log(`   - ${policy.field} = ${policy.value}`);
    console.log(`     Reason: ${policy.reason}`);
  });
  console.log();

  // ============================================
  // Step 7: Legal compliance
  // ============================================
  console.log('7. Legal compliance:\n');

  console.log('   ✅ COPPA (US) - Children under 13: Parental consent required');
  console.log('   ✅ GDPR Article 8 (EU) - Digital consent age varies by country');
  console.log(`   ✅ LOPDGDD (Spain) - Age ${ageContext.digitalAgeOfConsent} for digital consent`);
  console.log('   ✅ Content filtering aligned with age group');
  console.log();

  // ============================================
  // Step 8: Guardian permissions summary
  // ============================================
  console.log('8. Guardian permissions:\n');

  console.log('   ┌─────────────────────────────────────────────┐');
  console.log('   │        GUARDIAN CAPABILITIES                 │');
  console.log('   ├─────────────────────────────────────────────┤');
  guardian.permissions.forEach(perm => {
    console.log(`   │ ✓ ${perm.replace(/_/g, ' ').padEnd(41)}│`);
  });
  console.log('   └─────────────────────────────────────────────┘');
  console.log();

  console.log('=== Child Profile Example Complete ===\n');
}

main().catch(console.error);
