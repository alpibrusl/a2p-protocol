/**
 * Example 03: Memory Proposals
 *
 * This example demonstrates the memory proposal workflow.
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
  console.log('🚀 a2p Example: Memory Proposals\n');

  // ============================================
  // Setup: Create user with policy
  // ============================================
  console.log('📋 Setting up user profile...\n');

  const user = createUserClient(storage);
  let profile = await user.createProfile({ displayName: 'Bob' });

  // Add policy allowing agent proposals
  profile = addPolicy(profile, {
    agentPattern: 'did:a2p:agent:*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:*'],
    deny: ['a2p:health.*'],
    name: 'Allow proposals',
  });
  await storage.set(profile.id, profile);
  await user.loadProfile(profile.id);

  const userDid = profile.id;
  console.log(`   User: ${userDid}\n`);

  // ============================================
  // Agent proposes multiple memories
  // ============================================
  console.log('🤖 Agent proposing memories...\n');

  const agent = createAgentClient(
    { agentDid: 'did:a2p:agent:local:assistant' as DID },
    storage
  );

  // Proposal 1: Will be approved as-is
  await agent.proposeMemory({
    userDid,
    content: 'Prefers dark mode in all applications',
    category: 'a2p:preferences.ui',
    confidence: 0.9,
    context: 'User mentioned this explicitly',
  });
  console.log('   ✅ Proposed: Dark mode preference');

  // Proposal 2: Will be approved with edits
  await agent.proposeMemory({
    userDid,
    content: 'Lives in Spain',
    category: 'a2p:identity.location',
    confidence: 0.7,
    context: 'Inferred from timezone discussion',
  });
  console.log('   ✅ Proposed: Location (will be edited)');

  // Proposal 3: Will be rejected
  await agent.proposeMemory({
    userDid,
    content: 'Dislikes Python programming',
    category: 'a2p:interests',
    confidence: 0.5,
    context: 'Seemed frustrated with Python syntax',
  });
  console.log('   ✅ Proposed: Python dislike (will be rejected)\n');

  // ============================================
  // User reviews proposals
  // ============================================
  console.log('👤 User reviewing proposals...\n');

  // Reload profile to see proposals
  await user.loadProfile(userDid);
  const proposals = user.getPendingProposals();
  console.log(`   📬 ${proposals.length} pending proposals\n`);

  for (const proposal of proposals) {
    console.log('   ─────────────────────────────────────────');
    console.log(`   📝 "${proposal.memory.content}"`);
    console.log(`   Category: ${proposal.memory.category}`);
    console.log(`   Confidence: ${((proposal.memory.confidence || 0) * 100).toFixed(0)}%`);
    console.log(`   Context: ${proposal.context}`);

    // Decision based on content
    if (proposal.memory.content.includes('dark mode')) {
      // Approve as-is
      const memory = await user.approveProposal(proposal.id);
      console.log(`   ✅ APPROVED → ${memory.id}`);
    }
    else if (proposal.memory.content.includes('Spain')) {
      // Approve with edits
      const memory = await user.approveProposal(proposal.id, {
        editedContent: 'Lives in Barcelona, Spain',
      });
      console.log(`   ✏️ APPROVED WITH EDITS → ${memory.id}`);
      console.log(`   New content: "${memory.content}"`);
    }
    else if (proposal.memory.content.includes('Python')) {
      // Reject
      await user.rejectProposal(
        proposal.id,
        'Incorrect - I actually like Python!'
      );
      console.log('   ❌ REJECTED: "Incorrect - I actually like Python!"');
    }
    console.log();
  }

  // ============================================
  // View final profile
  // ============================================
  console.log('📊 Final profile memories:\n');

  await user.loadProfile(userDid);
  const finalProfile = user.getProfile();
  const memories = finalProfile?.memories?.['a2p:episodic'] || [];

  console.log(`   Total approved memories: ${memories.filter(m => m.status === 'approved').length}`);
  for (const memory of memories) {
    if (memory.status === 'approved') {
      console.log(`   ✅ [${memory.category}] ${memory.content}`);
    }
  }

  console.log('\n✨ Example complete!');
}

main().catch(console.error);
