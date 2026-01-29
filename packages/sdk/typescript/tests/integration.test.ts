/**
 * Integration tests for a2p SDK
 *
 * These tests verify end-to-end workflows combining multiple components
 */

import { describe, it, expect } from 'vitest';
import { A2PClient, A2PUserClient, MemoryStorage, createAgentClient, createUserClient } from '../src/client';
import { createProfile, addPolicy } from '../src/core/profile';
import { createProposal } from '../src/core/proposal';

describe('End-to-End Workflows', () => {
  it('should complete full workflow: create profile, add policy, request access, propose memory', async () => {
    const storage = new MemoryStorage();

    // 1. User creates profile
    const userClient = createUserClient(storage);
    const profile = await userClient.createProfile({ displayName: 'Alice' });

    // 2. User adds policy for agent
    let updatedProfile = userClient.getProfile()!;
    updatedProfile = addPolicy(updatedProfile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped', 'propose'],
      allow: ['a2p:preferences.*'],
    });
    await storage.set(profile.id, updatedProfile);
    await userClient.loadProfile(profile.id);

    // 3. Agent requests access
    const agentClient = createAgentClient(
      { agentDid: 'did:a2p:agent:local:assistant' },
      storage
    );
    const accessResponse = await agentClient.requestAccess({
      userDid: profile.id,
      scopes: ['a2p:preferences.communication'],
    });

    expect(accessResponse.profile).toBeDefined();
    expect(accessResponse.consent.grantedScopes.length).toBeGreaterThan(0);

    // 4. Agent proposes memory
    const proposalResponse = await agentClient.proposeMemory({
      userDid: profile.id,
      content: 'User prefers email communication',
      category: 'a2p:preferences.communication',
    });

    expect(proposalResponse.proposalId).toBeDefined();

    // 5. User approves proposal
    await userClient.loadProfile(profile.id);
    const pending = userClient.getPendingProposals();
    expect(pending.length).toBe(1);

    const memory = await userClient.approveProposal(proposalResponse.proposalId);
    expect(memory.content).toBe('User prefers email communication');
    expect(memory.status).toBe('approved');
  });

  it('should handle multiple agents accessing same profile', async () => {
    const storage = new MemoryStorage();

    // User creates profile with policy for all agents
    const userClient = createUserClient(storage);
    const profile = await userClient.createProfile({ displayName: 'Bob' });

    let updatedProfile = userClient.getProfile()!;
    updatedProfile = addPolicy(updatedProfile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
    });
    await storage.set(profile.id, updatedProfile);

    // Multiple agents request access
    const agent1 = createAgentClient({ agentDid: 'did:a2p:agent:local:agent1' }, storage);
    const agent2 = createAgentClient({ agentDid: 'did:a2p:agent:local:agent2' }, storage);

    const response1 = await agent1.requestAccess({
      userDid: profile.id,
      scopes: ['a2p:preferences'],
    });

    const response2 = await agent2.requestAccess({
      userDid: profile.id,
      scopes: ['a2p:preferences'],
    });

    expect(response1.profile).toBeDefined();
    expect(response2.profile).toBeDefined();
    expect(response1.consent.grantedScopes.length).toBeGreaterThan(0);
    expect(response2.consent.grantedScopes.length).toBeGreaterThan(0);
  });

  it('should handle profile export and import workflow', async () => {
    const storage1 = new MemoryStorage();
    const storage2 = new MemoryStorage();

    // Create profile in first storage
    const client1 = createUserClient(storage1);
    await client1.createProfile({ displayName: 'Charlie' });
    await client1.addMemory({
      content: 'Likes Python programming',
      category: 'a2p:preferences',
    });

    // Export profile
    const json = client1.exportProfile();
    expect(json.length).toBeGreaterThan(0);

    // Import into second storage
    const client2 = createUserClient(storage2);
    const imported = await client2.importProfile(json);

    expect(imported.identity.displayName).toBe('Charlie');
    const episodic = imported.memories?.['a2p:episodic'] || [];
    expect(episodic.length).toBe(1);
    expect(episodic[0].content).toBe('Likes Python programming');
  });

  it('should handle proposal rejection workflow', async () => {
    const storage = new MemoryStorage();

    // User creates profile
    const userClient = createUserClient(storage);
    const profile = await userClient.createProfile();

    // Add policy
    let updatedProfile = userClient.getProfile()!;
    updatedProfile = addPolicy(updatedProfile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['propose'],
      allow: ['a2p:preferences.*'],
    });
    await storage.set(profile.id, updatedProfile);

    // Agent proposes memory
    const agentClient = createAgentClient(
      { agentDid: 'did:a2p:agent:local:test' },
      storage
    );
    const proposalResponse = await agentClient.proposeMemory({
      userDid: profile.id,
      content: 'Incorrect information',
      category: 'a2p:preferences',
    });

    // User rejects proposal
    await userClient.loadProfile(profile.id);
    await userClient.rejectProposal(proposalResponse.proposalId, 'Not accurate');

    // Verify proposal is rejected
    const finalProfile = userClient.getProfile()!;
    const rejected = finalProfile.pendingProposals?.find(
      p => p.id === proposalResponse.proposalId
    );
    expect(rejected?.status).toBe('rejected');
  });

  it('should handle scope filtering correctly', async () => {
    const storage = new MemoryStorage();

    // Create profile with memories in different categories
    const userClient = createUserClient(storage);
    const profile = await userClient.createProfile();

    await userClient.addMemory({
      content: 'Public preference',
      category: 'a2p:preferences.communication',
    });
    await userClient.addMemory({
      content: 'Sensitive health info',
      category: 'a2p:health',
    });

    // Add policy allowing only preferences
    let updatedProfile = userClient.getProfile()!;
    updatedProfile = addPolicy(updatedProfile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      deny: ['a2p:health.*'],
    });
    await storage.set(profile.id, updatedProfile);

    // Agent requests access
    const agentClient = createAgentClient(
      { agentDid: 'did:a2p:agent:local:test' },
      storage
    );
    const response = await agentClient.requestAccess({
      userDid: profile.id,
      scopes: ['a2p:preferences.*', 'a2p:health.*'],
    });

    // Should only see preferences, not health
    // The granted scopes will be the patterns that match, not the specific sub-scopes
    expect(response.consent.grantedScopes.length).toBeGreaterThan(0);
    // Health scopes should be denied or not granted
    const hasHealthGranted = response.consent.grantedScopes.some(s => s.includes('health'));
    expect(hasHealthGranted).toBe(false);
  });
});

describe('Concurrent Operations', () => {
  it('should handle concurrent profile access', async () => {
    const storage = new MemoryStorage();
    const profile = createProfile();
    await storage.set(profile.id, profile);

    const agent1 = createAgentClient({ agentDid: 'did:a2p:agent:local:a1' }, storage);
    const agent2 = createAgentClient({ agentDid: 'did:a2p:agent:local:a2' }, storage);

    // Add policy for both agents
    let updatedProfile = profile;
    updatedProfile = addPolicy(updatedProfile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
    });
    await storage.set(profile.id, updatedProfile);

    // Concurrent access requests
    const [response1, response2] = await Promise.all([
      agent1.requestAccess({
        userDid: profile.id,
        scopes: ['a2p:preferences'],
      }),
      agent2.requestAccess({
        userDid: profile.id,
        scopes: ['a2p:preferences'],
      }),
    ]);

    expect(response1.profile).toBeDefined();
    expect(response2.profile).toBeDefined();
  });
});
