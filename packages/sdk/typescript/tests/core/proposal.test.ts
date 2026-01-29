/**
 * Tests for proposal management
 */

import { describe, it, expect } from 'vitest';
import {
  createProposal,
  addProposal,
  approveProposal,
  rejectProposal,
  withdrawProposal,
  getProposalsByAgent,
  expireProposals,
  cleanupResolvedProposals,
  findSimilarMemories,
} from '../../src/core/proposal';
import { createProfile, addMemory } from '../../src/core/profile';
import type { Profile } from '../../src/types';

describe('createProposal', () => {
  it('should create a proposal with defaults', () => {
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Test proposal',
    });

    expect(proposal.id).toBeDefined();
    expect(proposal.proposedBy.agentDid).toBe('did:a2p:agent:test');
    expect(proposal.memory.content).toBe('Test proposal');
    expect(proposal.memory.memoryType).toBe('episodic');
    expect(proposal.status).toBe('pending');
    expect(proposal.expiresAt).toBeDefined();
  });

  it('should create proposal with custom options', () => {
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      agentName: 'Test Agent',
      content: 'Test proposal',
      category: 'a2p:preferences',
      memoryType: 'semantic',
      confidence: 0.9,
      expiresIn: 24 * 60 * 60 * 1000, // 1 day
    });

    expect(proposal.proposedBy.agentName).toBe('Test Agent');
    expect(proposal.memory.category).toBe('a2p:preferences');
    expect(proposal.memory.memoryType).toBe('semantic');
    expect(proposal.memory.confidence).toBe(0.9);
  });
});

describe('addProposal', () => {
  it('should add proposal to profile', () => {
    const profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Test proposal',
    });

    const updated = addProposal(profile, proposal);

    expect(updated.pendingProposals?.length).toBe(1);
    expect(updated.pendingProposals?.[0].id).toBe(proposal.id);
  });

  it('should throw error for duplicate proposal', () => {
    const profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Test proposal',
    });

    const updated = addProposal(profile, proposal);

    expect(() => addProposal(updated, proposal)).toThrow('Proposal already exists');
  });
});

describe('approveProposal', () => {
  it('should approve proposal and create memory', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Test proposal',
      category: 'a2p:preferences',
    });
    profile = addProposal(profile, proposal);

    const result = approveProposal(profile, proposal.id);

    expect(result.memory.content).toBe('Test proposal');
    expect(result.memory.status).toBe('approved');
    expect(result.memory.category).toBe('a2p:preferences');

    // Proposal is updated in pendingProposals with status 'approved'
    const pending = result.profile.pendingProposals || [];
    expect(pending.length).toBe(1);
    expect(pending[0].status).toBe('approved');

    // Memory is added to episodic memories
    const episodic = result.profile.memories?.['a2p:episodic'] || [];
    expect(episodic.length).toBe(1);
    expect(episodic[0].content).toBe('Test proposal');
  });

  it('should approve proposal with edited content', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Original proposal',
      category: 'a2p:preferences',
    });
    profile = addProposal(profile, proposal);

    const result = approveProposal(profile, proposal.id, {
      editedContent: 'Edited content',
    });

    expect(result.memory.content).toBe('Edited content');
    expect(result.memory.status).toBe('approved');
  });

  it('should approve proposal with edited category', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Test proposal',
      category: 'a2p:preferences',
    });
    profile = addProposal(profile, proposal);

    const result = approveProposal(profile, proposal.id, {
      editedCategory: 'a2p:interests',
    });

    expect(result.memory.category).toBe('a2p:interests');
  });

  it('should throw error for non-existent proposal', () => {
    const profile = createProfile();

    expect(() => approveProposal(profile, 'non-existent')).toThrow('Proposal not found');
  });
});

describe('rejectProposal', () => {
  it('should reject proposal', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Test proposal',
    });
    const proposal2 = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Test proposal 2',
    });
    profile = addProposal(profile, proposal);
    profile = addProposal(profile, proposal2);

    const updated = rejectProposal(profile, proposal.id, 'Not relevant');

    // Rejected proposals stay in pendingProposals but with status 'rejected'
    const pending = updated.pendingProposals || [];
    expect(pending.length).toBe(2);

    const rejected = pending.find(p => p.id === proposal.id);
    expect(rejected).toBeDefined();
    expect(rejected?.status).toBe('rejected');
    expect(rejected?.resolution?.action).toBe('rejected');
    expect(rejected?.resolution?.reason).toBe('Not relevant');

    const stillPending = pending.find(p => p.id === proposal2.id);
    expect(stillPending?.status).toBe('pending');
  });

  it('should throw error for non-existent proposal', () => {
    const profile = createProfile();

    expect(() => rejectProposal(profile, 'non-existent')).toThrow('Proposal not found');
  });
});

describe('withdrawProposal', () => {
  it('should withdraw proposal', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Test proposal',
    });
    profile = addProposal(profile, proposal);

    const updated = withdrawProposal(profile, proposal.id);

    // Withdrawn proposals stay in pendingProposals but with status 'withdrawn'
    const pending = updated.pendingProposals || [];
    expect(pending.length).toBe(1);
    expect(pending[0].status).toBe('withdrawn');
  });
});

describe('getProposalsByAgent', () => {
  it('should get proposals by agent DID', () => {
    let profile = createProfile();
    const proposal1 = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Proposal 1',
    });
    const proposal2 = createProposal({
      agentDid: 'did:a2p:agent:other',
      content: 'Proposal 2',
    });
    profile = addProposal(profile, proposal1);
    profile = addProposal(profile, proposal2);

    const found = getProposalsByAgent(profile, 'did:a2p:agent:test');

    expect(found.length).toBe(1);
    expect(found[0].id).toBe(proposal1.id);
  });
});

describe('getPendingProposals', () => {
  it('should return all pending proposals', () => {
    let profile = createProfile();
    const proposal1 = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Proposal 1',
    });
    const proposal2 = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Proposal 2',
    });
    profile = addProposal(profile, proposal1);
    profile = addProposal(profile, proposal2);

    const pending = profile.pendingProposals || [];

    expect(pending.length).toBe(2);
  });

  it('should mark proposals as rejected but keep in pendingProposals', () => {
    let profile = createProfile();
    const proposal1 = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Proposal 1',
    });
    const proposal2 = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Proposal 2',
    });
    profile = addProposal(profile, proposal1);
    profile = addProposal(profile, proposal2);
    profile = rejectProposal(profile, proposal1.id);

    // Rejected proposals stay in pendingProposals but with status 'rejected'
    const pending = profile.pendingProposals || [];
    expect(pending.length).toBe(2);

    const rejected = pending.find(p => p.id === proposal1.id);
    expect(rejected?.status).toBe('rejected');

    const stillPending = pending.find(p => p.id === proposal2.id);
    expect(stillPending?.status).toBe('pending');
  });
});

describe('expireProposals', () => {
  it('should expire old proposals', () => {
    let profile = createProfile();
    // Create proposal with past expiry date
    const oldProposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Old proposal',
    });
    // Manually set expired date
    oldProposal.expiresAt = new Date(Date.now() - 1000).toISOString();

    const newProposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'New proposal',
      expiresIn: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    profile = addProposal(profile, oldProposal);
    profile = addProposal(profile, newProposal);

    const updated = expireProposals(profile);

    // Expired proposals stay in pendingProposals but with status 'expired'
    const pending = updated.pendingProposals || [];

    // Both proposals should still be in pendingProposals
    expect(pending.length).toBe(2);

    const expired = pending.find(p => p.id === oldProposal.id);
    expect(expired?.status).toBe('expired');

    const stillPending = pending.find(p => p.id === newProposal.id);
    expect(stillPending?.status).toBe('pending');
  });
});

describe('cleanupResolvedProposals', () => {
  it('should keep pending proposals', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Pending proposal',
    });
    profile = addProposal(profile, proposal);

    const updated = cleanupResolvedProposals(profile);

    expect(updated.pendingProposals?.length).toBe(1);
    expect(updated.pendingProposals?.[0].status).toBe('pending');
  });

  it('should keep recently resolved proposals', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Recent proposal',
    });
    profile = addProposal(profile, proposal);
    profile = approveProposal(profile, proposal.id).profile;

    const updated = cleanupResolvedProposals(profile, { keepDays: 30 });

    expect(updated.pendingProposals?.length).toBe(1);
  });

  it('should remove old resolved proposals', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Old proposal',
    });
    profile = addProposal(profile, proposal);
    profile = approveProposal(profile, proposal.id).profile;

    // Manually set old resolution date
    const pending = profile.pendingProposals || [];
    if (pending[0]?.resolution) {
      pending[0].resolution.resolvedAt = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
    }

    const updated = cleanupResolvedProposals(profile, { keepDays: 30 });

    expect(updated.pendingProposals?.length).toBe(0);
  });

  it('should use default keepDays of 30', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Recent proposal',
    });
    profile = addProposal(profile, proposal);
    profile = approveProposal(profile, proposal.id).profile;

    const updated = cleanupResolvedProposals(profile);

    expect(updated.pendingProposals?.length).toBe(1);
  });

  it('should keep proposals without resolution date', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Proposal without resolution',
    });
    profile = addProposal(profile, proposal);
    profile = rejectProposal(profile, proposal.id);

    // Remove resolution date
    const pending = profile.pendingProposals || [];
    if (pending[0]?.resolution) {
      delete pending[0].resolution.resolvedAt;
    }

    const updated = cleanupResolvedProposals(profile);

    expect(updated.pendingProposals?.length).toBe(1);
  });

  it('should return same profile if no cleanup needed', () => {
    let profile = createProfile();
    const proposal = createProposal({
      agentDid: 'did:a2p:agent:test',
      content: 'Pending proposal',
    });
    profile = addProposal(profile, proposal);

    const updated = cleanupResolvedProposals(profile);

    expect(updated).toBe(profile);
  });
});

describe('findSimilarMemories', () => {
  it('should find similar memories based on word overlap', () => {
    let profile = createProfile();
    profile = addMemory(profile, {
      content: 'User likes to play tennis on weekends',
      category: 'a2p:episodic',
    });
    profile = addMemory(profile, {
      content: 'User prefers coffee over tea',
      category: 'a2p:episodic',
    });

    // Algorithm: filters words > 3 chars from search, checks if memory includes each word
    // Search words (>3 chars): "likes", "play", "tennis", "weekends" = 4 words
    // Memory "User likes to play tennis on weekends" includes all 4 words
    // Similarity: 4/4 = 1.0 > 0.5 ✓
    const similar = findSimilarMemories(profile, 'User likes to play tennis on weekends');

    expect(similar.length).toBe(1);
    expect(similar[0].content.toLowerCase()).toContain('tennis');
  });

  it('should return empty array when no similar memories', () => {
    let profile = createProfile();
    profile = addMemory(profile, {
      content: 'User likes coffee',
      category: 'a2p:episodic',
    });

    const similar = findSimilarMemories(profile, 'User loves hiking mountains');

    expect(similar.length).toBe(0);
  });

  it('should handle empty profile', () => {
    const profile = createProfile();

    const similar = findSimilarMemories(profile, 'Some content');

    expect(similar.length).toBe(0);
  });

  it('should filter out short words', () => {
    let profile = createProfile();
    profile = addMemory(profile, {
      content: 'User likes tennis',
      category: 'a2p:episodic',
    });

    const similar = findSimilarMemories(profile, 'User likes tennis');

    expect(similar.length).toBe(1);
  });

  it('should handle case insensitivity', () => {
    let profile = createProfile();
    profile = addMemory(profile, {
      content: 'User LIKES TENNIS',
      category: 'a2p:episodic',
    });

    const similar = findSimilarMemories(profile, 'user likes tennis');

    expect(similar.length).toBe(1);
  });

  it('should require similarity threshold above 0.5', () => {
    let profile = createProfile();
    profile = addMemory(profile, {
      content: 'User likes tennis and swimming',
      category: 'a2p:episodic',
    });

    const similar = findSimilarMemories(profile, 'User loves hiking mountains');

    // Should not match as similarity is below 0.5
    expect(similar.length).toBe(0);
  });
});
