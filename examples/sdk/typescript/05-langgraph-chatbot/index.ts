/**
 * Example 05: LangGraph Chatbot with a2p Memory
 *
 * This example shows how to integrate a2p with LangGraph for
 * a personalized chatbot experience.
 *
 * Note: This is a simplified example. In production, you would
 * integrate with actual LangGraph and an LLM provider.
 */

import {
  createUserClient,
  addPolicy,
  addMemory,
  MemoryStorage,
  type DID,
  type PermissionLevel,
} from '@a2p/sdk';

import {
  A2PMemorySaver,
  formatUserContextForPrompt,
} from '@a2p/langgraph';

// Shared storage
const storage = new MemoryStorage();

async function setupUser(): Promise<DID> {
  console.log('👤 Setting up user profile...\n');

  const user = createUserClient(storage);
  let profile = await user.createProfile({ displayName: 'Charlie' });

  // Add some initial context
  await user.addMemory({
    content: 'Software developer with 5 years experience',
    category: 'a2p:professional',
  });

  await user.addMemory({
    content: 'Prefers concise, technical responses',
    category: 'a2p:preferences.communication',
  });

  await user.addMemory({
    content: 'Currently learning Rust and WebAssembly',
    category: 'a2p:context.currentProjects',
  });

  // Add agent access policy
  profile = user.getProfile()!;
  profile = addPolicy(profile, {
    agentPattern: 'did:a2p:agent:*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:preferences.*', 'a2p:professional.*', 'a2p:context.*', 'a2p:interests.*'],
    name: 'Allow chatbot',
  });
  await storage.set(profile.id, profile);

  console.log(`   ✅ Created user: ${profile.id}\n`);
  return profile.id;
}

async function runChatbot(userDid: DID) {
  console.log('🤖 Starting LangGraph Chatbot with a2p Memory\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create a2p memory saver for LangGraph
  const memorySaver = new A2PMemorySaver({
    clientConfig: {
      agentDid: 'did:a2p:agent:local:langgraph-chatbot' as DID,
    },
    storage,
    defaultScopes: ['a2p:preferences', 'a2p:professional', 'a2p:context'],
    autoPropose: true,
  });

  // ============================================
  // 1. Load User Context
  // ============================================
  console.log('1️⃣ Loading user context...\n');

  const userContext = await memorySaver.loadUserContext(userDid);
  const contextString = formatUserContextForPrompt(userContext);

  console.log('   📋 User context loaded:');
  console.log('   ─────────────────────────────────────────');
  contextString.split('\n').forEach(line => console.log(`   ${line}`));
  console.log('   ─────────────────────────────────────────\n');

  // ============================================
  // 2. Simulate Chat Conversation
  // ============================================
  console.log('2️⃣ Simulating conversation...\n');

  const conversation = [
    { role: 'user', content: 'Hi! Can you help me with async/await in Rust?' },
    { role: 'assistant', content: 'Of course! Since you\'re learning Rust, I\'ll be concise. Here\'s the key concept: async functions return a Future that must be .await\'ed...' },
    { role: 'user', content: 'I prefer using tokio as my runtime' },
    { role: 'assistant', content: 'Great choice! Tokio is the most popular async runtime. Here\'s a quick example...' },
  ];

  for (const msg of conversation) {
    const icon = msg.role === 'user' ? '👤' : '🤖';
    console.log(`   ${icon} ${msg.role}: ${msg.content.substring(0, 60)}...`);
  }
  console.log();

  // ============================================
  // 3. Extract and Propose Memories
  // ============================================
  console.log('3️⃣ Proposing memories from conversation...\n');

  // Agent noticed user mentioned Tokio preference
  await memorySaver.proposeMemory(
    userDid,
    'Prefers Tokio runtime for Rust async programming',
    {
      category: 'a2p:preferences.development',
      confidence: 0.85,
      context: 'User explicitly stated preference during Rust async discussion',
    }
  );
  console.log('   ✅ Proposed: Tokio runtime preference');

  // Agent inferred ongoing interest
  await memorySaver.proposeMemory(
    userDid,
    'Actively working on async Rust programming',
    {
      category: 'a2p:context.currentProjects',
      confidence: 0.75,
      context: 'User asked detailed questions about Rust async/await',
    }
  );
  console.log('   ✅ Proposed: Async Rust focus\n');

  // ============================================
  // 4. Show Pending Proposals
  // ============================================
  console.log('4️⃣ Pending proposals for user review:\n');

  const user = createUserClient(storage);
  await user.loadProfile(userDid);

  const proposals = user.getPendingProposals();
  for (const proposal of proposals) {
    console.log(`   📝 "${proposal.memory.content}"`);
    console.log(`      Category: ${proposal.memory.category}`);
    console.log(`      Confidence: ${((proposal.memory.confidence || 0) * 100).toFixed(0)}%`);
    console.log();
  }

  // ============================================
  // 5. User Approves (in real app, async)
  // ============================================
  console.log('5️⃣ User approving proposals...\n');

  for (const proposal of proposals) {
    await user.approveProposal(proposal.id);
    console.log(`   ✅ Approved: ${proposal.memory.content}`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    ✨ Example Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('        🚀 a2p Example: LangGraph Chatbot with Memory');
  console.log('═══════════════════════════════════════════════════════════\n');

  const userDid = await setupUser();
  await runChatbot(userDid);
}

main().catch(console.error);
