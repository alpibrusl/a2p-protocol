/**
 * Example 08: ML Recommender System with a2p
 *
 * This example shows how ML recommendation systems can use a2p profiles
 * for personalization — demonstrating that a2p works beyond just AI agents.
 *
 * Scenario: A music streaming service uses a2p to:
 * 1. Read user preferences from their profile
 * 2. Generate personalized recommendations
 * 3. Learn from user behavior
 * 4. Propose learned preferences back to the user
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
  console.log('🚀 a2p Example: ML Recommender System\n');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('   This example demonstrates a2p with ML systems,');
  console.log('   showing the protocol works BEYOND just AI agents.\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ============================================
  // 1. Setup User Profile
  // ============================================
  console.log('👤 Step 1: Setting up user profile...\n');

  const user = createUserClient(storage);
  let profile = await user.createProfile({ displayName: 'Maria' });

  // Add existing music preferences
  await user.addMemory({
    content: 'Enjoys jazz, especially modern jazz and fusion',
    category: 'a2p:interests.music',
  });

  await user.addMemory({
    content: 'Listens to music mostly during work hours (9am-5pm)',
    category: 'a2p:preferences.timing',
  });

  await user.addMemory({
    content: 'Prefers instrumental music while working',
    category: 'a2p:preferences.content',
  });

  // Add policy for music services
  profile = addPolicy(user.getProfile()!, {
    name: 'Music Streaming Services',
    agentPattern: 'did:a2p:service:local:music-*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:interests.music.*', 'a2p:preferences.*'],
    deny: ['a2p:health.*', 'a2p:financial.*'],
  });

  await storage.set(profile.id, profile);
  console.log(`   ✅ Profile created: ${profile.id}`);
  console.log('   ✅ Music preferences added');
  console.log('   ✅ Consent policy for music services configured\n');

  // ============================================
  // 2. ML Recommender Reads Profile
  // ============================================
  console.log('🎵 Step 2: Music Recommender reading user profile...\n');

  // The recommender is a "service" not an "agent" — same protocol!
  const recommender = createAgentClient(
    { agentDid: 'did:a2p:service:local:music-streamify' as DID },
    storage
  );

  const userProfile = await recommender.getProfile({
    userDid: profile.id,
    scopes: ['a2p:interests.music', 'a2p:preferences'],
  });

  console.log('   📋 Retrieved user preferences from a2p profile:');
  const memories = userProfile.memories?.['a2p:episodic'] || [];
  for (const memory of memories) {
    console.log(`      • ${memory.content}`);
  }
  console.log();

  // ============================================
  // 3. Generate Personalized Recommendations
  // ============================================
  console.log('🎼 Step 3: Generating personalized recommendations...\n');

  // Simulate ML model using profile data for personalization
  const recommendations = [
    { artist: 'Snarky Puppy', reason: 'Modern jazz fusion (matches your jazz preference)' },
    { artist: 'GoGo Penguin', reason: 'Instrumental jazz (perfect for work)' },
    { artist: 'Kamasi Washington', reason: 'Modern jazz (genre match)' },
    { artist: 'Yussef Dayes', reason: 'Jazz fusion (genre match)' },
    { artist: 'BadBadNotGood', reason: 'Instrumental hip-hop/jazz fusion' },
  ];

  console.log('   🎧 Personalized recommendations for Maria:');
  for (const rec of recommendations) {
    console.log(`      • ${rec.artist}`);
    console.log(`        └─ ${rec.reason}`);
  }
  console.log();

  // ============================================
  // 4. Learn from User Behavior (Simulated)
  // ============================================
  console.log('📊 Step 4: Learning from user behavior...\n');

  console.log('   📈 Behavior analysis over 3 months:');

  const behaviorInsights = [
    { observation: 'Frequently skips songs with vocals', confidence: 0.9, metric: 'Skip rate: 78% for vocal tracks' },
    { observation: 'Listens to lo-fi beats in the evening', confidence: 0.75, metric: 'Evening sessions: 85% lo-fi' },
    { observation: 'Replays Snarky Puppy tracks often', confidence: 0.85, metric: 'Replay rate: 3.2x average' },
    { observation: 'Prefers longer tracks (5+ minutes)', confidence: 0.7, metric: 'Completion rate: 92% for 5+ min' },
  ];

  for (const insight of behaviorInsights) {
    console.log(`      • ${insight.observation}`);
    console.log(`        └─ ${insight.metric} (${Math.round(insight.confidence * 100)}% confidence)`);
  }
  console.log();

  // ============================================
  // 5. Propose Learned Preferences to Profile
  // ============================================
  console.log('💡 Step 5: Proposing learned preferences to user profile...\n');

  // Propose high-confidence learnings
  await recommender.proposeMemory({
    userDid: profile.id,
    content: 'Strongly prefers instrumental music; usually skips songs with vocals',
    category: 'a2p:preferences.content',
    confidence: 0.9,
    context: 'Based on 3 months of listening behavior: 78% skip rate for vocal tracks',
  });
  console.log('   📝 Proposed: Instrumental music preference (90% confidence)');

  await recommender.proposeMemory({
    userDid: profile.id,
    content: 'Favorite artist: Snarky Puppy',
    category: 'a2p:interests.music',
    confidence: 0.85,
    context: 'High replay rate (3.2x average) and full track completion',
  });
  console.log('   📝 Proposed: Snarky Puppy as favorite artist (85% confidence)');

  await recommender.proposeMemory({
    userDid: profile.id,
    content: 'Enjoys lo-fi beats in evening hours (6pm-10pm)',
    category: 'a2p:preferences.timing',
    confidence: 0.75,
    context: 'Pattern observed over 6 weeks: 85% of evening sessions are lo-fi',
  });
  console.log('   📝 Proposed: Evening lo-fi preference (75% confidence)');

  await recommender.proposeMemory({
    userDid: profile.id,
    content: 'Prefers longer tracks (5+ minutes) with high completion rate',
    category: 'a2p:preferences.content',
    confidence: 0.7,
    context: '92% completion rate for tracks over 5 minutes',
  });
  console.log('   📝 Proposed: Long track preference (70% confidence)\n');

  // ============================================
  // 6. Cross-Service Benefits
  // ============================================
  console.log('🔗 Step 6: Cross-Service Benefits\n');
  console.log('   Once Maria approves these proposals, OTHER services benefit:\n');
  console.log('   ┌────────────────────────────────────────────────────────────┐');
  console.log('   │                                                            │');
  console.log('   │  🎵 Other music apps → Know her instrumental preference    │');
  console.log('   │  🤖 AI assistants   → Can suggest focus music for work     │');
  console.log('   │  📺 Video services  → Avoid recommending music videos      │');
  console.log('   │  🏠 Smart home      → Auto-play lo-fi beats in evening     │');
  console.log('   │  🎧 Podcast apps    → Suggest longer-form content          │');
  console.log('   │                                                            │');
  console.log('   └────────────────────────────────────────────────────────────┘\n');
  console.log('   This is the power of USER-OWNED profiles:');
  console.log('   → One service learns, all services benefit (with consent).\n');

  // ============================================
  // 7. User Reviews Proposals
  // ============================================
  console.log('👤 Step 7: Maria reviews and approves proposals...\n');

  await user.loadProfile(profile.id);
  const proposals = user.getPendingProposals();

  for (const proposal of proposals) {
    console.log(`   📝 "${proposal.memory.content}"`);
    console.log(`      From: ${proposal.proposedBy.agentDid}`);
    console.log(`      Confidence: ${Math.round((proposal.memory.confidence || 0) * 100)}%`);
    await user.approveProposal(proposal.id);
    console.log('      ✅ Approved\n');
  }

  // ============================================
  // Summary
  // ============================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    ✨ Example Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('   Key takeaways:\n');
  console.log('   1. a2p works for ML systems, not just AI agents');
  console.log('   2. Any service that learns can propose to user profiles');
  console.log('   3. Users control what gets added to their profile');
  console.log('   4. Approved learnings benefit ALL a2p-compatible services');
  console.log('   5. The same protocol, consent model, and DIDs apply\n');
}

main().catch(console.error);
