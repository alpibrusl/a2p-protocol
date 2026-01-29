/**
 * Example 06: CrewAI Research Crew with a2p Memory
 *
 * This example shows how to integrate a2p with CrewAI for
 * personalized multi-agent research crews.
 *
 * Note: This is a simplified example. In production, you would
 * integrate with actual CrewAI and an LLM provider.
 */

import {
  createUserClient,
  createAgentClient,
  addPolicy,
  MemoryStorage,
  type DID,
  type PermissionLevel,
} from '@a2p/sdk';

// Shared storage
const storage = new MemoryStorage();

// Simulated CrewAI memory interface
interface CrewMemory {
  loadUserContext(userDid: DID): Promise<string>;
  proposeMemory(params: {
    userDid: DID;
    content: string;
    category: string;
    confidence: number;
    context: string;
  }): Promise<void>;
}

function createCrewMemory(agentDid: DID, defaultScopes: string[]): CrewMemory {
  const agent = createAgentClient({ agentDid }, storage);

  return {
    async loadUserContext(userDid: DID): Promise<string> {
      const profile = await agent.getProfile({
        userDid,
        scopes: defaultScopes,
      });

      const memories = profile.memories?.['a2p:episodic'] || [];
      return memories
        .map((m) => `[${m.category}] ${m.content}`)
        .join('\n');
    },

    async proposeMemory(params: {
      userDid: DID;
      content: string;
      category: string;
      confidence: number;
      context: string;
    }): Promise<void> {
      await agent.proposeMemory({
        userDid: params.userDid,
        content: params.content,
        category: params.category,
        confidence: params.confidence,
        context: params.context,
      });
    },
  };
}

async function setupUser(): Promise<DID> {
  console.log('👤 Setting up user profile...\n');

  const user = createUserClient(storage);
  let profile = await user.createProfile({ displayName: 'Diana' });

  // Add research interests
  await user.addMemory({
    content: 'PhD researcher in Computer Science',
    category: 'a2p:professional',
  });

  await user.addMemory({
    content: 'Researching distributed systems and consensus algorithms',
    category: 'a2p:interests.topics',
  });

  await user.addMemory({
    content: 'Prefers academic writing style with citations',
    category: 'a2p:preferences.communication',
  });

  await user.addMemory({
    content: 'Currently writing a paper on Byzantine fault tolerance',
    category: 'a2p:context.currentProjects',
  });

  // Add agent access policy
  profile = user.getProfile()!;
  profile = addPolicy(profile, {
    agentPattern: 'did:a2p:agent:*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:preferences.*', 'a2p:professional.*', 'a2p:context.*', 'a2p:interests.*'],
    name: 'Allow research crew',
  });
  await storage.set(profile.id, profile);

  console.log(`   ✅ Created user: ${profile.id}\n`);
  return profile.id;
}

async function runResearchCrew(userDid: DID) {
  console.log('🔬 Starting CrewAI Research Crew with a2p Memory\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Create a2p memory for the crew
  const memory = createCrewMemory(
    'did:a2p:agent:local:research-crew' as DID,
    ['a2p:preferences', 'a2p:professional', 'a2p:context', 'a2p:interests']
  );

  // ============================================
  // 1. Load User Context
  // ============================================
  console.log('1️⃣ Loading user context for crew agents...\n');

  const userContext = await memory.loadUserContext(userDid);

  console.log('   📋 User context loaded:');
  console.log('   ─────────────────────────────────────────');
  for (const line of userContext.split('\n')) {
    console.log(`   ${line}`);
  }
  console.log('   ─────────────────────────────────────────\n');

  // ============================================
  // 2. Define Crew Agents (simplified)
  // ============================================
  console.log('2️⃣ Configuring crew agents with user context...\n');

  // In real CrewAI, you would do:
  // import { Agent, Crew, Task } from 'crewai';
  //
  // const researcher = new Agent({
  //   role: 'Research Specialist',
  //   goal: 'Find relevant academic papers',
  //   backstory: `You are helping a user. Context:\n${userContext}`,
  // });

  const agents = [
    {
      role: 'Research Specialist',
      goal: 'Find relevant academic papers on distributed systems',
      usesContext: true,
    },
    {
      role: 'Content Analyst',
      goal: 'Analyze and summarize research findings',
      usesContext: true,
    },
    {
      role: 'Technical Writer',
      goal: 'Write academic-style summaries with citations',
      usesContext: true,
    },
  ];

  for (const agent of agents) {
    console.log(`   🤖 ${agent.role}`);
    console.log(`      Goal: ${agent.goal}`);
    console.log(`      Uses user context: ✅`);
    console.log();
  }

  // ============================================
  // 3. Simulate Crew Execution
  // ============================================
  console.log('3️⃣ Crew executing research task...\n');

  const task = 'Research recent advances in Byzantine fault tolerance algorithms';
  console.log(`   📋 Task: ${task}\n`);

  // Simulated crew output
  const steps = [
    ['Research Specialist', 'Found 15 relevant papers from 2023-2024'],
    ['Content Analyst', 'Identified 3 key themes: PBFT improvements, DAG-based consensus, and hybrid approaches'],
    ['Technical Writer', 'Produced academic summary with 12 citations'],
  ];

  for (const [agentName, action] of steps) {
    console.log(`   🤖 ${agentName}: ${action}`);
  }

  console.log();

  // ============================================
  // 4. Propose Learned Memories
  // ============================================
  console.log('4️⃣ Proposing memories from research session...\n');

  // Memory about research interests
  await memory.proposeMemory({
    userDid,
    content: 'Interested in DAG-based consensus algorithms as an alternative to PBFT',
    category: 'a2p:interests.topics',
    confidence: 0.8,
    context: "User's research task focused on BFT, DAG emerged as key theme",
  });
  console.log('   ✅ Proposed: DAG consensus interest');

  // Memory about working style
  await memory.proposeMemory({
    userDid,
    content: 'Prefers comprehensive literature reviews with categorized themes',
    category: 'a2p:preferences.research',
    confidence: 0.7,
    context: 'Based on the successful research output format',
  });
  console.log('   ✅ Proposed: Literature review preference\n');

  // ============================================
  // 5. Show Final Results
  // ============================================
  console.log('5️⃣ Research output (personalized for user):\n');
  console.log('   ─────────────────────────────────────────');
  console.log('   📄 Byzantine Fault Tolerance: Recent Advances');
  console.log('   ');
  console.log('   Abstract: This review examines recent developments');
  console.log('   in BFT algorithms, focusing on three key areas...');
  console.log('   ');
  console.log('   [Written in academic style with citations,');
  console.log("    matching user's stated preferences]");
  console.log('   ─────────────────────────────────────────\n');

  // ============================================
  // 6. User Reviews Proposals
  // ============================================
  console.log('6️⃣ User reviewing proposals...\n');

  const user = createUserClient(storage);
  await user.loadProfile(userDid);

  const proposals = user.getPendingProposals();
  console.log(`   📬 ${proposals.length} proposals pending\n`);

  for (const proposal of proposals) {
    console.log(`   📝 "${proposal.memory.content}"`);
    await user.approveProposal(proposal.id);
    console.log('      ✅ Approved\n');
  }

  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    ✨ Example Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('      🚀 a2p Example: CrewAI Research with User Context');
  console.log('═══════════════════════════════════════════════════════════\n');

  const userDid = await setupUser();
  await runResearchCrew(userDid);
}

main().catch(console.error);
