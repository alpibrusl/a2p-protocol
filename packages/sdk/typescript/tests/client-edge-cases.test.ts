/**
 * Tests for edge cases in a2p clients
 */

import { describe, it, expect } from 'vitest';
import { A2PClient, A2PUserClient, MemoryStorage } from '../src/client';
import { createProfile, addPolicy } from '../src/core/profile';
import type { Profile } from '../src/types';

describe('A2PClient Edge Cases', () => {
  it('should handle empty scopes array', async () => {
    const storage = new MemoryStorage();
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:*'], // Allow all scopes for empty array test
    });
    await storage.set(profile.id, profile);

    const client = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      storage
    );

    // Empty scopes should be denied
    await expect(
      client.requestAccess({
        userDid: profile.id,
        scopes: [],
      })
    ).rejects.toThrow('Access denied');
  });

  it('should handle multiple scopes with partial access', async () => {
    const storage = new MemoryStorage();
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.communication'],
      deny: ['a2p:preferences.sensitive'],
    });
    await storage.set(profile.id, profile);

    const client = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      storage
    );

    const response = await client.requestAccess({
      userDid: profile.id,
      scopes: [
        'a2p:preferences.communication',
        'a2p:preferences.sensitive',
        'a2p:preferences.other',
      ],
    });

    expect(response.consent.grantedScopes).toContain('a2p:preferences.communication');
    expect(response.consent.deniedScopes).toContain('a2p:preferences.sensitive');
  });

  it('should handle session ID generation', () => {
    const client1 = new A2PClient({ agentDid: 'did:a2p:agent:test' });
    const client2 = new A2PClient({ agentDid: 'did:a2p:agent:test' });

    const session1 = client1.getSessionId();
    const session2 = client2.getSessionId();

    expect(session1).toBeDefined();
    expect(session2).toBeDefined();
    expect(session1).not.toBe(session2);
  });

  it('should handle new session creation', () => {
    const client = new A2PClient({ agentDid: 'did:a2p:agent:test' });
    const session1 = client.getSessionId();

    const session2 = client.newSession();

    expect(session2).toBeDefined();
    expect(session2).not.toBe(session1);
    expect(client.getSessionId()).toBe(session2);
  });

  it('should handle sub-profile access', async () => {
    const storage = new MemoryStorage();
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
    });
    await storage.set(profile.id, profile);

    const client = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      storage
    );

    const response = await client.requestAccess({
      userDid: profile.id,
      scopes: ['a2p:preferences'],
      subProfile: 'did:a2p:user:test:subprofile',
    });

    expect(response.consent.subProfile).toBe('did:a2p:user:test:subprofile');
  });
});

describe('A2PUserClient Edge Cases', () => {
  it('should handle creating profile with minimal options', async () => {
    const client = new A2PUserClient();
    const profile = await client.createProfile();

    expect(profile.id).toBeDefined();
    expect(profile.version).toBe('1.0');
    expect(profile.profileType).toBe('human');
  });

  it('should handle creating profile with all options', async () => {
    const client = new A2PUserClient();
    const profile = await client.createProfile({
      displayName: 'Test User',
    });

    expect(profile.identity.displayName).toBe('Test User');
  });

  it('should handle adding multiple memories', async () => {
    const client = new A2PUserClient();
    await client.createProfile();

    await client.addMemory({
      content: 'Memory 1',
      category: 'a2p:preferences',
    });
    await client.addMemory({
      content: 'Memory 2',
      category: 'a2p:preferences',
    });

    const profile = client.getProfile();
    const episodic = profile?.memories?.['a2p:episodic'] || [];
    expect(episodic.length).toBe(2);
  });

  it('should handle getting latest memory from profile', async () => {
    const client = new A2PUserClient();
    await client.createProfile();
    await client.addMemory({
      content: 'First memory',
      category: 'a2p:preferences',
    });
    const second = await client.addMemory({
      content: 'Second memory',
      category: 'a2p:preferences',
    });

    const profile = client.getProfile();
    const episodic = profile?.memories?.['a2p:episodic'] || [];
    const latest = episodic[episodic.length - 1];
    expect(latest?.content).toBe('Second memory');
  });

  it('should handle empty pending proposals', () => {
    const client = new A2PUserClient();
    client.createProfile();

    const proposals = client.getPendingProposals();
    expect(proposals).toEqual([]);
  });

  it('should handle profile with no memories', async () => {
    const client = new A2PUserClient();
    await client.createProfile();

    const profile = client.getProfile();
    expect(profile?.memories).toBeDefined();
    const episodic = profile?.memories?.['a2p:episodic'] || [];
    expect(episodic.length).toBe(0);
  });

  it('should handle profile with no policies', async () => {
    const client = new A2PUserClient();
    await client.createProfile();

    const profile = client.getProfile();
    expect(profile?.accessPolicies).toEqual([]);
  });
});

describe('Storage Edge Cases', () => {
  it('should handle storing and retrieving same profile multiple times', async () => {
    const storage = new MemoryStorage();
    const profile = createProfile();

    await storage.set(profile.id, profile);
    await storage.set(profile.id, profile);
    await storage.set(profile.id, profile);

    const retrieved = await storage.get(profile.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(profile.id);
  });

  it('should handle concurrent storage operations', async () => {
    const storage = new MemoryStorage();
    const profile1 = createProfile();
    const profile2 = createProfile();

    await Promise.all([
      storage.set(profile1.id, profile1),
      storage.set(profile2.id, profile2),
    ]);

    const [retrieved1, retrieved2] = await Promise.all([
      storage.get(profile1.id),
      storage.get(profile2.id),
    ]);

    expect(retrieved1).toBeDefined();
    expect(retrieved2).toBeDefined();
  });
});
