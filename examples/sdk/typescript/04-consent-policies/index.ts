/**
 * Example 04: Consent Policies
 *
 * This example demonstrates how to configure access control policies.
 */

import {
  createUserClient,
  createAgentClient,
  addPolicy,
  evaluateAccess,
  createCategoryPolicy,
  createDefaultPolicy,
  MemoryStorage,
  type DID,
  type PermissionLevel,
  type AgentProfile,
} from '@a2p/sdk';

const storage = new MemoryStorage();

async function main() {
  console.log('🚀 a2p Example: Consent Policies\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // ============================================
  // 1. Create User Profile
  // ============================================
  console.log('1️⃣ Creating user profile...\n');

  const user = createUserClient(storage);
  let profile = await user.createProfile({ displayName: 'Eve' });

  // Add some memories
  await user.addMemory({ content: 'Software developer', category: 'a2p:professional' });
  await user.addMemory({ content: 'Prefers dark mode', category: 'a2p:preferences.ui' });
  await user.addMemory({ content: 'Allergic to peanuts', category: 'a2p:health' });
  await user.addMemory({ content: 'Bank: XYZ Bank', category: 'a2p:financial' });

  profile = user.getProfile()!;
  console.log(`   ✅ Created profile with 4 memories\n`);

  // ============================================
  // 2. Add Different Policies
  // ============================================
  console.log('2️⃣ Adding access control policies...\n');

  // Policy 1: Work agents - can access professional info
  profile = addPolicy(profile, {
    name: 'Work Agents',
    agentPattern: 'did:a2p:agent:local:work-*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:professional.*', 'a2p:preferences.*', 'a2p:context.*'],
    deny: ['a2p:health.*', 'a2p:financial.*'],
    priority: 10,
  });
  console.log('   📋 Policy 1: Work Agents');
  console.log('      Pattern: did:a2p:agent:local:work-*');
  console.log('      Allow: professional, preferences, context');
  console.log('      Deny: health, financial\n');

  // Policy 2: Health agents - can access health info
  profile = addPolicy(profile, {
    name: 'Health Agents',
    agentPattern: 'did:a2p:agent:local:health-*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:health.*', 'a2p:identity.name'],
    deny: ['a2p:financial.*'],
    priority: 10,
    conditions: {
      requireVerifiedOperator: true,
    },
  });
  console.log('   📋 Policy 2: Health Agents');
  console.log('      Pattern: did:a2p:agent:local:health-*');
  console.log('      Allow: health, identity.name');
  console.log('      Requires: Verified operator\n');

  // Policy 3: Trusted agents with high trust score
  profile = addPolicy(profile, {
    name: 'Trusted AI Assistants',
    agentPattern: 'did:a2p:agent:*',
    permissions: ['read_scoped', 'propose'] as PermissionLevel[],
    allow: ['a2p:preferences.*'],
    deny: ['a2p:health.*', 'a2p:financial.*', 'a2p:relationships.*'],
    priority: 100,
    conditions: {
      minTrustScore: 0.8,
    },
  });
  console.log('   📋 Policy 3: Trusted Assistants');
  console.log('      Pattern: did:a2p:agent:* (any agent)');
  console.log('      Allow: preferences only');
  console.log('      Requires: Trust score >= 0.8\n');

  await storage.set(profile.id, profile);

  // ============================================
  // 3. Test Access for Different Agents
  // ============================================
  console.log('3️⃣ Testing access for different agents...\n');

  const testCases = [
    {
      did: 'did:a2p:agent:local:work-slack-assistant' as DID,
      scopes: ['a2p:professional', 'a2p:health', 'a2p:preferences'],
      agentProfile: undefined,
      description: 'Work Slack Assistant',
    },
    {
      did: 'did:a2p:agent:local:health-tracker' as DID,
      scopes: ['a2p:health', 'a2p:identity.name'],
      agentProfile: {
        id: 'did:a2p:agent:local:health-tracker',
        profileType: 'agent',
        identity: { name: 'Health Tracker' },
        operator: { name: 'HealthCorp', verified: true },
        a2pSupport: { protocolVersion: '1.0' },
      } as AgentProfile,
      description: 'Verified Health Tracker',
    },
    {
      did: 'did:a2p:agent:local:random-chatbot' as DID,
      scopes: ['a2p:preferences', 'a2p:health'],
      agentProfile: {
        id: 'did:a2p:agent:local:random-chatbot',
        profileType: 'agent',
        identity: { name: 'Random Bot' },
        operator: { name: 'Unknown' },
        a2pSupport: { protocolVersion: '1.0' },
        trustMetrics: { communityScore: 0.9 },
      } as AgentProfile,
      description: 'High-trust General Chatbot',
    },
    {
      did: 'did:a2p:agent:local:untrusted-bot' as DID,
      scopes: ['a2p:preferences', 'a2p:professional'],
      agentProfile: {
        id: 'did:a2p:agent:local:untrusted-bot',
        profileType: 'agent',
        identity: { name: 'New Bot' },
        operator: { name: 'StartupCo' },
        a2pSupport: { protocolVersion: '1.0' },
        trustMetrics: { communityScore: 0.3 },
      } as AgentProfile,
      description: 'Low-trust Bot',
    },
  ];

  for (const test of testCases) {
    console.log(`   🤖 ${test.description}`);
    console.log(`      DID: ${test.did}`);
    console.log(`      Requested: [${test.scopes.join(', ')}]`);

    await user.loadProfile(profile.id);
    const currentProfile = user.getProfile()!;

    const result = evaluateAccess(
      currentProfile,
      test.did,
      test.scopes,
      test.agentProfile
    );

    if (result.granted) {
      console.log(`      ✅ GRANTED`);
      console.log(`      Allowed: [${result.allowedScopes.join(', ')}]`);
      if (result.deniedScopes.length > 0) {
        console.log(`      Denied: [${result.deniedScopes.join(', ')}]`);
      }
      console.log(`      Policy: ${result.matchedPolicy?.name}`);
    } else {
      console.log(`      ❌ DENIED - No matching policy`);
    }
    console.log();
  }

  // ============================================
  // 4. Show Policy Summary
  // ============================================
  console.log('4️⃣ Policy Summary:\n');
  console.log('   ┌─────────────────────────┬───────────────────────┬──────────────────┐');
  console.log('   │ Policy                  │ Pattern               │ Priority         │');
  console.log('   ├─────────────────────────┼───────────────────────┼──────────────────┤');

  await user.loadProfile(profile.id);
  const finalProfile = user.getProfile()!;

  for (const policy of finalProfile.accessPolicies || []) {
    const name = (policy.name || 'Unnamed').padEnd(23);
    const pattern = policy.agentPattern.padEnd(21);
    const priority = String(policy.priority).padEnd(16);
    console.log(`   │ ${name} │ ${pattern} │ ${priority} │`);
  }

  console.log('   └─────────────────────────┴───────────────────────┴──────────────────┘\n');

  console.log('═══════════════════════════════════════════════════════════');
  console.log('                    ✨ Example Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main().catch(console.error);
