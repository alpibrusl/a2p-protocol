/**
 * Example 02: Agent Integration
 *
 * This example shows how to build an AI agent that uses a2p profiles.
 */

import {
  createUserClient,
  createAgentClient,
  addPolicy,
  MemoryStorage,
  type DID,
  type PermissionLevel,
} from '@a2p/sdk';

// Shared storage (in production, this would be a real storage backend)
const sharedStorage = new MemoryStorage();

async function setupUserProfile(): Promise<DID> {
  console.log('👤 Setting up user profile...\n');

  const user = createUserClient(sharedStorage);
  const profile = await user.createProfile({ displayName: 'Alice' });

  // Add some memories
  await user.addMemory({
    content: 'Senior Software Engineer specializing in TypeScript',
    category: 'a2p:professional',
  });

  await user.addMemory({
    content: 'Interested in AI, distributed systems, and open source',
    category: 'a2p:interests.topics',
  });

  await user.addMemory({
    content: 'Prefers detailed technical explanations with code examples',
    category: 'a2p:preferences.communication',
  });

  // Add an access policy for our agent
  const currentProfile = user.getProfile()!;
  const updatedProfile = addPolicy(currentProfile, {
    agentPattern: 'did:a2p:agent:*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:preferences.*', 'a2p:professional.*', 'a2p:interests.*'],
    deny: ['a2p:health.*', 'a2p:financial.*'],
    name: 'Allow AI Assistants',
  });

  await sharedStorage.set(profile.id, updatedProfile);

  console.log(`   ✅ User profile created: ${profile.id}`);
  console.log('   ✅ Added professional info, interests, and preferences');
  console.log('   ✅ Configured access policy for agents\n');

  return profile.id;
}

async function runAgent(userDid: DID) {
  console.log('🤖 Running AI Agent...\n');

  // Create agent client
  const agent = createAgentClient(
    {
      agentDid: 'did:a2p:agent:local:coding-assistant' as DID,
    },
    sharedStorage
  );

  // ============================================
  // 1. Request Profile Access
  // ============================================
  console.log('1️⃣ Requesting profile access...');

  try {
    const profile = await agent.getProfile({
      userDid,
      scopes: ['a2p:preferences', 'a2p:professional', 'a2p:interests'],
    });

    console.log('   ✅ Access granted!');
    console.log(`   📋 Retrieved profile data for prompts\n`);

    // ============================================
    // 2. Build Personalized Prompt
    // ============================================
    console.log('2️⃣ Building personalized prompt...');

    const memories = profile.memories?.['a2p:episodic'] || [];
    const contextLines = memories.map(m => `- ${m.content}`).join('\n');

    const systemPrompt = `You are a helpful coding assistant.

What you know about the user:
${contextLines}

Use this context to personalize your responses. Match their communication preferences.`;

    console.log('\n   📝 System Prompt:');
    console.log('   ─────────────────────────────────────────');
    systemPrompt.split('\n').forEach(line => console.log(`   ${line}`));
    console.log('   ─────────────────────────────────────────\n');

    // ============================================
    // 3. Simulate Conversation & Learn
    // ============================================
    console.log('3️⃣ Simulating conversation...');
    console.log('   User: "Can you help me with Rust async programming?"');
    console.log('   Agent: "I\'d be happy to help! Given your TypeScript background...');
    console.log('          [provides detailed technical explanation with code]\n');

    // ============================================
    // 4. Propose New Memory
    // ============================================
    console.log('4️⃣ Proposing new memory from conversation...');

    const proposal = await agent.proposeMemory({
      userDid,
      content: 'Currently learning Rust programming language',
      category: 'a2p:context.currentProjects',
      confidence: 0.85,
      context: 'User asked about Rust async programming',
    });

    console.log(`   ✅ Memory proposed: ${proposal.proposalId}`);
    console.log(`   📬 Status: ${proposal.status} (awaiting user review)\n`);

  } catch (error) {
    console.error('   ❌ Access denied:', error);
  }
}

async function reviewProposals(userDid: DID) {
  console.log('👤 User reviewing proposals...\n');

  const user = createUserClient(sharedStorage);
  await user.loadProfile(userDid);

  const proposals = user.getPendingProposals();
  console.log(`   📬 Found ${proposals.length} pending proposal(s)\n`);

  for (const proposal of proposals) {
    console.log(`   Proposal from: ${proposal.proposedBy.agentDid}`);
    console.log(`   Content: "${proposal.memory.content}"`);
    console.log(`   Confidence: ${(proposal.memory.confidence || 0) * 100}%`);
    console.log(`   Context: ${proposal.context}\n`);

    // Approve the proposal
    const memory = await user.approveProposal(proposal.id);
    console.log(`   ✅ Approved! Memory saved: ${memory.id}\n`);
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           🚀 a2p Example: Agent Integration');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Setup
  const userDid = await setupUserProfile();

  // Agent interaction
  await runAgent(userDid);

  // User reviews proposals
  await reviewProposals(userDid);

  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    ✨ Example Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
