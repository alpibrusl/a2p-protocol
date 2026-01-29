/**
 * Example 09: IoT Smart Home with a2p
 *
 * This example shows how IoT devices and smart home systems can use a2p
 * profiles for personalization — demonstrating that a2p works beyond AI agents.
 *
 * Scenario: A smart home hub uses a2p to:
 * 1. Read user preferences from their profile
 * 2. Personalize device behavior
 * 3. Learn routines from daily patterns
 * 4. Propose automation suggestions
 */

import {
  createUserClient,
  createAgentClient,
  addPolicy,
  MemoryStorage,
  type DID,
  type PermissionLevel,
} from '@a2p/sdk';

const storage = new MemoryStorage();

async function main() {
  console.log('🚀 a2p Example: IoT Smart Home\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('   This example demonstrates a2p with IoT devices,');
  console.log('   showing the protocol works BEYOND just AI agents.\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ============================================
  // 1. Setup User Profile with Home Preferences
  // ============================================
  console.log('👤 Step 1: Setting up user profile with home preferences...\n');

  const user = createUserClient(storage);
  let profile = await user.createProfile({ displayName: 'Alex' });

  // Add existing home preferences
  await user.addMemory({
    content: 'Preferred temperature: 21°C (70°F) during the day',
    category: 'a2p:preferences.environment',
  });

  await user.addMemory({
    content: 'Prefers dimmed warm lighting in the evening',
    category: 'a2p:preferences.lighting',
  });

  await user.addMemory({
    content: 'Usually wakes up around 7:00am on weekdays',
    category: 'a2p:routines.schedule',
  });

  await user.addMemory({
    content: 'Works from home on Mondays and Fridays',
    category: 'a2p:routines.work',
  });

  // Add policy for smart home services
  profile = addPolicy(user.getProfile()!, {
    name: 'Smart Home Devices',
    agentPattern: 'did:a2p:service:local:iot-*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:preferences.environment.*', 'a2p:preferences.lighting.*', 'a2p:routines.*'],
    deny: ['a2p:health.*', 'a2p:financial.*', 'a2p:professional.*'],
  });

  await storage.set(profile.id, profile);
  console.log(`   ✅ Profile created: ${profile.id}`);
  console.log('   ✅ Home preferences added');
  console.log('   ✅ Consent policy for IoT services configured\n');

  // ============================================
  // 2. Smart Home Hub Reads Profile
  // ============================================
  console.log('🏠 Step 2: Smart Home Hub reading user profile...\n');

  // The smart home hub is a "service" not an "agent" — same protocol!
  const smartHome = createAgentClient(
    { agentDid: 'did:a2p:service:local:iot-homewise' as DID },
    storage
  );

  const userProfile = await smartHome.getProfile({
    userDid: profile.id,
    scopes: ['a2p:preferences', 'a2p:routines'],
  });

  console.log('   📋 Retrieved preferences from a2p profile:');
  const memories = userProfile.memories?.['a2p:episodic'] || [];
  for (const memory of memories) {
    console.log(`      • ${memory.content}`);
  }
  console.log();

  // ============================================
  // 3. Apply Personalized Automation
  // ============================================
  console.log('⚡ Step 3: Applying personalized automation...\n');

  console.log('   🌡️  Thermostat → Set to 21°C (from profile)');
  console.log('   💡 Living Room → Warm dimmed lights (evening mode)');
  console.log('   ⏰ Wake routine → Scheduled for 7:00am weekdays');
  console.log('   🏢 Work mode → Home office setup for Mon/Fri\n');

  // Simulate devices responding to preferences
  const deviceActions = [
    { device: 'Thermostat', action: 'Set to 21°C', room: 'Whole house' },
    { device: 'Smart Lights', action: 'Warm white, 40% brightness', room: 'Living Room' },
    { device: 'Smart Blinds', action: 'Partially closed', room: 'Bedroom' },
    { device: 'Coffee Maker', action: 'Scheduled for 6:55am', room: 'Kitchen' },
  ];

  console.log('   📱 Device actions executed:');
  for (const action of deviceActions) {
    console.log(`      • ${action.device} (${action.room}): ${action.action}`);
  }
  console.log();

  // ============================================
  // 4. Learn Patterns from Sensors (Simulated)
  // ============================================
  console.log('📊 Step 4: Learning patterns from sensor data...\n');

  console.log('   📈 Pattern analysis over 4 weeks:\n');

  const patterns = [
    {
      pattern: 'Arrives home around 6:30pm on weekdays',
      confidence: 0.88,
      source: 'Door lock + motion sensors',
    },
    {
      pattern: 'Lowers thermostat to 18°C before sleep (around 11pm)',
      confidence: 0.82,
      source: 'Thermostat adjustments',
    },
    {
      pattern: 'Prefers all lights off after midnight',
      confidence: 0.9,
      source: 'Light switch patterns',
    },
    {
      pattern: 'Uses kitchen heavily 7-8am and 7-8pm',
      confidence: 0.85,
      source: 'Motion + appliance sensors',
    },
    {
      pattern: 'Opens bedroom blinds immediately after waking',
      confidence: 0.75,
      source: 'Blind motor + motion correlation',
    },
  ];

  for (const p of patterns) {
    console.log(`      • ${p.pattern}`);
    console.log(`        └─ Source: ${p.source} (${Math.round(p.confidence * 100)}% confidence)`);
  }
  console.log();

  // ============================================
  // 5. Propose Learned Routines to Profile
  // ============================================
  console.log('💡 Step 5: Proposing learned routines to user profile...\n');

  await smartHome.proposeMemory({
    userDid: profile.id,
    content: 'Usually arrives home around 6:30pm on weekdays',
    category: 'a2p:routines.schedule',
    confidence: 0.88,
    context: 'Based on 4 weeks of door lock and motion sensor data',
  });
  console.log('   📝 Proposed: Arrival time routine (88% confidence)');

  await smartHome.proposeMemory({
    userDid: profile.id,
    content: 'Preferred sleep temperature: 18°C (64°F)',
    category: 'a2p:preferences.environment',
    confidence: 0.82,
    context: 'Consistent thermostat lowering before 11pm bedtime',
  });
  console.log('   📝 Proposed: Sleep temperature preference (82% confidence)');

  await smartHome.proposeMemory({
    userDid: profile.id,
    content: 'Prefers complete darkness for sleeping (all lights off after midnight)',
    category: 'a2p:preferences.lighting',
    confidence: 0.9,
    context: 'Consistent pattern: 100% lights-off after 12am',
  });
  console.log('   📝 Proposed: Dark sleep preference (90% confidence)');

  await smartHome.proposeMemory({
    userDid: profile.id,
    content: 'Morning routine: Opens blinds immediately after waking',
    category: 'a2p:routines.morning',
    confidence: 0.75,
    context: 'Blind motor activation correlates with first motion detection',
  });
  console.log('   📝 Proposed: Morning blinds routine (75% confidence)\n');

  // ============================================
  // 6. Cross-Device/Service Benefits
  // ============================================
  console.log('🔗 Step 6: Cross-Device & Cross-Service Benefits\n');
  console.log('   Once Alex approves these proposals, OTHER services benefit:\n');
  console.log('   ┌────────────────────────────────────────────────────────────┐');
  console.log('   │                                                            │');
  console.log('   │  🚗 Connected car  → Pre-heat home when leaving work      │');
  console.log('   │  ⌚ Smartwatch     → Adjust based on sleep patterns       │');
  console.log('   │  🤖 AI assistant   → Suggest "heading home?" at 6pm       │');
  console.log('   │  🏨 Hotel apps     → Apply temperature preferences        │');
  console.log('   │  📱 Other IoT hubs → Sync routines across locations       │');
  console.log('   │  🎵 Music service  → Queue relaxing music at 10:30pm      │');
  console.log('   │                                                            │');
  console.log('   └────────────────────────────────────────────────────────────┘\n');
  console.log('   This is the power of USER-OWNED profiles:');
  console.log('   → IoT learnings benefit your entire digital ecosystem.\n');

  // ============================================
  // 7. User Reviews Proposals
  // ============================================
  console.log('👤 Step 7: Alex reviews and manages proposals...\n');

  await user.loadProfile(profile.id);
  const proposals = user.getPendingProposals();

  let approved = 0;
  let rejected = 0;

  for (const proposal of proposals) {
    console.log(`   📝 "${proposal.memory.content}"`);
    console.log(`      From: ${proposal.proposedBy.agentDid}`);
    console.log(`      Confidence: ${Math.round((proposal.memory.confidence || 0) * 100)}%`);

    // Simulate user decision (approve high confidence, review low confidence)
    if ((proposal.memory.confidence || 0) >= 0.8) {
      await user.approveProposal(proposal.id);
      console.log('      ✅ Approved\n');
      approved++;
    } else {
      await user.rejectProposal(proposal.id);
      console.log('      ❌ Rejected (will review manually)\n');
      rejected++;
    }
  }

  console.log(`   Summary: ${approved} approved, ${rejected} rejected for manual review\n`);

  // ============================================
  // 8. Suggested Automation Rules
  // ============================================
  console.log('🤖 Step 8: Smart Home suggests automation rules...\n');

  console.log('   Based on learned patterns, HomeWise suggests:\n');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ 🌅 "Good Morning" Automation                           │');
  console.log('   │    Trigger: Motion detected after 6:30am               │');
  console.log('   │    Actions:                                            │');
  console.log('   │      • Open bedroom blinds                             │');
  console.log('   │      • Set thermostat to 21°C                          │');
  console.log('   │      • Start coffee maker                              │');
  console.log('   │      • Play morning news briefing                      │');
  console.log('   └─────────────────────────────────────────────────────────┘');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ 🏠 "Welcome Home" Automation                           │');
  console.log('   │    Trigger: Phone GPS within 10 min of home (6pm+)     │');
  console.log('   │    Actions:                                            │');
  console.log('   │      • Set thermostat to 21°C                          │');
  console.log('   │      • Turn on entryway lights                         │');
  console.log('   │      • Disarm security system                          │');
  console.log('   └─────────────────────────────────────────────────────────┘');
  console.log('   ┌─────────────────────────────────────────────────────────┐');
  console.log('   │ 🌙 "Good Night" Automation                             │');
  console.log('   │    Trigger: All lights off after 11pm                  │');
  console.log('   │    Actions:                                            │');
  console.log('   │      • Lower thermostat to 18°C                        │');
  console.log('   │      • Lock all doors                                  │');
  console.log('   │      • Arm security system                             │');
  console.log('   │      • Enable Do Not Disturb on all devices            │');
  console.log('   └─────────────────────────────────────────────────────────┘\n');

  // ============================================
  // Summary
  // ============================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    ✨ Example Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('   Key takeaways:\n');
  console.log('   1. a2p works for IoT devices, not just AI agents');
  console.log('   2. Smart home sensors can propose learned patterns');
  console.log('   3. Users control what routines get saved to their profile');
  console.log('   4. Approved patterns benefit the entire device ecosystem');
  console.log('   5. Privacy-preserving: user owns all behavioral data');
  console.log('   6. Portable: preferences work in any a2p-compatible home\n');
}

main().catch(console.error);
