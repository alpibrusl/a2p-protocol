/**
 * Tests for error handling in a2p clients
 */

import { describe, it, expect } from 'vitest';
import { A2PClient, A2PUserClient, MemoryStorage } from '../src/client';
import { createProfile, addPolicy } from '../src/core/profile';
import type { Profile } from '../src/types';

describe('A2PClient Error Handling', () => {
  it('should throw error when profile not found', async () => {
    const client = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      new MemoryStorage()
    );

    await expect(
      client.requestAccess({
        userDid: 'did:a2p:user:test:nonexistent',
        scopes: ['a2p:preferences'],
      })
    ).rejects.toThrow('Profile not found');
  });

  it('should throw error when access denied', async () => {
    const storage = new MemoryStorage();
    const profile = createProfile();
    await storage.set(profile.id, profile);

    const client = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      storage
    );

    await expect(
      client.requestAccess({
        userDid: profile.id,
        scopes: ['a2p:preferences'],
      })
    ).rejects.toThrow('Access denied');
  });

  it('should throw error when proposing to non-existent profile', async () => {
    const client = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      new MemoryStorage()
    );

    await expect(
      client.proposeMemory({
        userDid: 'did:a2p:user:test:nonexistent',
        content: 'Test proposal',
      })
    ).rejects.toThrow('Profile not found');
  });

  it('should throw error when proposing without permission', async () => {
    const storage = new MemoryStorage();
    const profile = createProfile();
    await storage.set(profile.id, profile);

    const client = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      storage
    );

    await expect(
      client.proposeMemory({
        userDid: profile.id,
        content: 'Test proposal',
      })
    ).rejects.toThrow();
  });

  it('should throw error when checking permission for non-existent profile', async () => {
    const client = new A2PClient(
      { agentDid: 'did:a2p:agent:test' },
      new MemoryStorage()
    );

    const hasPermission = await client.checkPermission({
      userDid: 'did:a2p:user:test:nonexistent',
      scope: 'a2p:preferences',
      permission: 'read_scoped',
    });

    expect(hasPermission).toBe(false);
  });
});

describe('A2PUserClient Error Handling', () => {
  it('should return null when loading non-existent profile', async () => {
    const client = new A2PUserClient();

    const result = await client.loadProfile('did:a2p:user:test:nonexistent');
    expect(result).toBeNull();
  });

  it('should throw error when approving non-existent proposal', async () => {
    const client = new A2PUserClient();
    await client.createProfile();

    await expect(client.approveProposal('non-existent-proposal-id')).rejects.toThrow();
  });

  it('should throw error when rejecting non-existent proposal', async () => {
    const client = new A2PUserClient();
    await client.createProfile();

    await expect(client.rejectProposal('non-existent-proposal-id')).rejects.toThrow();
  });

  it('should throw error when exporting without profile', () => {
    const client = new A2PUserClient();

    expect(() => client.exportProfile()).toThrow('No profile loaded');
  });

  it('should throw error when importing invalid JSON', async () => {
    const client = new A2PUserClient();

    await expect(client.importProfile('invalid json')).rejects.toThrow();
  });

  it('should throw error when importing invalid profile structure', async () => {
    const client = new A2PUserClient();

    await expect(
      client.importProfile('{"invalid": "structure"}')
    ).rejects.toThrow('Invalid profile structure');
  });

  it('should throw error when adding memory without profile', async () => {
    const client = new A2PUserClient();

    await expect(
      client.addMemory({
        content: 'Test memory',
        category: 'a2p:preferences',
      })
    ).rejects.toThrow('No profile loaded');
  });

  it('should return null profile when not loaded', () => {
    const client = new A2PUserClient();

    const profile = client.getProfile();
    expect(profile).toBeNull();
  });
});

describe('MemoryStorage Error Handling', () => {
  it('should return null for non-existent profile', async () => {
    const storage = new MemoryStorage();

    const result = await storage.get('did:a2p:user:test:nonexistent');
    expect(result).toBeNull();
  });

  it('should handle delete of non-existent profile gracefully', async () => {
    const storage = new MemoryStorage();

    // Should not throw
    await storage.delete('did:a2p:user:test:nonexistent');
  });
});
