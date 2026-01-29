/**
 * Tests for a2p clients
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { A2PClient, A2PUserClient, MemoryStorage, createAgentClient, createUserClient } from '../src/client';
import { createProfile, addPolicy } from '../src/core/profile';
import { createProposal } from '../src/core/proposal';
import type { Profile } from '../src/types';

describe('MemoryStorage', () => {
  it('should get and set profiles', async () => {
    const storage = new MemoryStorage();
    const profile = createProfile();

    await storage.set(profile.id, profile);
    const retrieved = await storage.get(profile.id);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(profile.id);
  });

  it('should delete profiles', async () => {
    const storage = new MemoryStorage();
    const profile = createProfile();

    await storage.set(profile.id, profile);
    await storage.delete(profile.id);

    const retrieved = await storage.get(profile.id);
    expect(retrieved).toBeNull();
  });
});

describe('A2PUserClient', () => {
  it('should create profile', async () => {
    const client = new A2PUserClient();
    const profile = await client.createProfile({ displayName: 'Alice' });

    expect(profile.identity.displayName).toBe('Alice');
    expect(profile.id).toMatch(/^did:a2p:user:/);
  });

  it('should load profile', async () => {
    const client = new A2PUserClient();
    const profile = await client.createProfile({ displayName: 'Alice' });
    const profileId = profile.id;

    const loaded = await client.loadProfile(profileId);
    expect(loaded).not.toBeNull();
    expect(loaded?.identity.displayName).toBe('Alice');
  });

  it('should add memory', async () => {
    const client = new A2PUserClient();
    await client.createProfile();

    const memory = await client.addMemory({
      content: 'User likes Python',
      category: 'a2p:preferences',
    });

    expect(memory.content).toBe('User likes Python');
    expect(memory.status).toBe('approved');
  });

  it('should get pending proposals', async () => {
    const client = new A2PUserClient();
    await client.createProfile();
    const userDid = client.getProfile()?.id;

    if (!userDid) throw new Error('User DID not found');

    // Add policy to allow proposals
    let profile = client.getProfile();
    if (!profile) throw new Error('Profile not found');

    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['propose'],
      allow: ['a2p:preferences.*'],
    });
    await client.storage.set(userDid, profile);
    await client.loadProfile(userDid);

    // Create proposal via agent client
    const agentClient = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      client.storage
    );

    await agentClient.proposeMemory({
      userDid,
      content: 'Test proposal',
      category: 'a2p:preferences',
    });

    // Reload profile to get the proposal
    await client.loadProfile(userDid);

    const proposals = client.getPendingProposals();
    expect(proposals.length).toBe(1);
    expect(proposals[0].memory.content).toBe('Test proposal');
  });

  it('should approve proposal', async () => {
    const client = new A2PUserClient();
    await client.createProfile();
    const userDid = client.getProfile()?.id;

    if (!userDid) throw new Error('User DID not found');

    // Setup policy
    let profile = client.getProfile();
    if (!profile) throw new Error('Profile not found');

    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['propose'],
      allow: ['a2p:preferences.*'],
    });
    await client.storage.set(userDid, profile);
    await client.loadProfile(userDid);

    // Create proposal
    const agentClient = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      client.storage
    );
    const result = await agentClient.proposeMemory({
      userDid,
      content: 'Test proposal',
      category: 'a2p:preferences',
    });

    // Reload profile to get the proposal
    await client.loadProfile(userDid);

    // Approve it
    const memory = await client.approveProposal(result.proposalId);
    expect(memory.content).toBe('Test proposal');
    expect(memory.status).toBe('approved');

    // Verify proposal is removed from pending
    const pending = client.getPendingProposals();
    expect(pending.length).toBe(0);
  });

  it('should export and import profile', async () => {
    const client = new A2PUserClient();
    await client.createProfile({ displayName: 'Alice' });
    await client.addMemory({
      content: 'Test memory',
      category: 'a2p:preferences',
    });

    // Use exportProfile method which validates the profile
    const json = client.exportProfile();
    expect(typeof json).toBe('string');
    expect(json.length).toBeGreaterThan(0);

    // Create new client and import
    const newClient = new A2PUserClient();
    const imported = await newClient.importProfile(json);
    const profile = client.getProfile();
    if (!profile) throw new Error('Profile not found');

    expect(imported.identity.displayName).toBe('Alice');
    expect(imported.id).toBe(profile.id);
    const episodic = imported.memories?.['a2p:episodic'] || [];
    expect(episodic.length).toBe(1);
    expect(episodic[0].content).toBe('Test memory');
  });
});

describe('A2PClient', () => {
  it('should request access with granted policy', async () => {
    const storage = new MemoryStorage();
    const userClient = new A2PUserClient(storage);
    await userClient.createProfile();
    const userDid = userClient.getProfile()?.id;

    if (!userDid) throw new Error('User DID not found');

    // Add policy
    let profile = userClient.getProfile();
    if (!profile) throw new Error('Profile not found');

    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read'],
      allow: ['a2p:preferences.*'],
    });
    await storage.set(userDid, profile);

    // Request access
    const agentClient = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      storage
    );
    const response = await agentClient.requestAccess({
      userDid,
      scopes: ['a2p:preferences.communication'],
    });

    expect(response.profile).toBeDefined();
    expect(response.consent).toBeDefined();
    expect(response.consent.grantedScopes.length).toBeGreaterThan(0);
    expect(response.consent.grantedAt).toBeDefined();
  });

  it('should throw error for access without policy', async () => {
    const storage = new MemoryStorage();
    const userClient = new A2PUserClient(storage);
    await userClient.createProfile();
    const userDid = userClient.getProfile()?.id;

    if (!userDid) throw new Error('User DID not found');

    const agentClient = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      storage
    );

    await expect(
      agentClient.requestAccess({
        userDid,
        scopes: ['a2p:preferences'],
      })
    ).rejects.toThrow('Access denied');
  });

  it('should propose memory', async () => {
    const storage = new MemoryStorage();
    const userClient = new A2PUserClient(storage);
    await userClient.createProfile();
    const userDid = userClient.getProfile()?.id;

    if (!userDid) throw new Error('User DID not found');

    // Add policy
    let profile = userClient.getProfile();
    if (!profile) throw new Error('Profile not found');

    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['propose'],
      allow: ['a2p:preferences.*'],
    });
    await storage.set(userDid, profile);

    const agentClient = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      storage
    );
    const result = await agentClient.proposeMemory({
      userDid,
      content: 'Agent learned this',
      category: 'a2p:preferences',
      confidence: 0.8,
    });

    expect(result.proposalId).toBeDefined();
    expect(result.status).toBe('pending');
  });

  it('should check permission', async () => {
    const storage = new MemoryStorage();
    const userClient = new A2PUserClient(storage);
    await userClient.createProfile();
    const userDid = userClient.getProfile()?.id;

    if (!userDid) throw new Error('User DID not found');

    // Add policy
    let profile = userClient.getProfile();
    if (!profile) throw new Error('Profile not found');

    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read'],
      allow: ['a2p:preferences.*'],
    });
    await storage.set(userDid, profile);

    const agentClient = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      storage
    );

    const hasRead = await agentClient.checkPermission(userDid, 'read', 'a2p:preferences');
    expect(hasRead).toBe(true);

    const hasPropose = await agentClient.checkPermission(userDid, 'propose', 'a2p:preferences');
    expect(hasPropose).toBe(false);
  });

  it('should manage session ID', () => {
    const client = new A2PClient({ agentDid: 'did:a2p:agent:test' });
    const sessionId = client.getSessionId();

    expect(sessionId).toMatch(/^sess_/);

    const newSessionId = client.newSession();
    expect(newSessionId).not.toBe(sessionId);
    expect(client.getSessionId()).toBe(newSessionId);
  });
});

describe('Factory Functions', () => {
  it('should create agent client', () => {
    const client = createAgentClient({ agentDid: 'did:a2p:agent:test' });
    expect(client).toBeInstanceOf(A2PClient);
    expect(client['config'].agentDid).toBe('did:a2p:agent:test');
  });

  it('should create user client', () => {
    const client = createUserClient();
    expect(client).toBeInstanceOf(A2PUserClient);
  });
});
