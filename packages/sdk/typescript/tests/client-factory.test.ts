/**
 * Tests for client factory functions
 */

import { describe, it, expect } from 'vitest';
import {
  createAgentClient,
  createUserClient,
  MemoryStorage,
  A2PClient,
  A2PUserClient,
} from '../src/client';

describe('createAgentClient', () => {
  it('should create agent client with default storage', () => {
    const client = createAgentClient({ agentDid: 'did:a2p:agent:local:test' });

    expect(client).toBeInstanceOf(A2PClient);
    expect(client.getSessionId()).toBeDefined();
  });

  it('should create agent client with custom storage', () => {
    const storage = new MemoryStorage();
    const client = createAgentClient(
      { agentDid: 'did:a2p:agent:local:test' },
      storage
    );

    expect(client).toBeInstanceOf(A2PClient);
    expect(client.getSessionId()).toBeDefined();
  });

  it('should create agent client with agent profile', () => {
    const client = createAgentClient({
      agentDid: 'did:a2p:agent:local:test',
      agentProfile: {
        did: 'did:a2p:agent:local:test',
        name: 'Test Agent',
      },
    });

    expect(client).toBeInstanceOf(A2PClient);
  });
});

describe('createUserClient', () => {
  it('should create user client with default storage', () => {
    const client = createUserClient();

    expect(client).toBeInstanceOf(A2PUserClient);
    expect(client.getProfile()).toBeNull();
  });

  it('should create user client with custom storage', () => {
    const storage = new MemoryStorage();
    const client = createUserClient(storage);

    expect(client).toBeInstanceOf(A2PUserClient);
    expect(client.getProfile()).toBeNull();
  });

  it('should allow creating and loading profiles', async () => {
    const client = createUserClient();
    const profile = await client.createProfile({ displayName: 'Test User' });

    expect(profile.identity.displayName).toBe('Test User');
    expect(client.getProfile()).not.toBeNull();
  });
});
