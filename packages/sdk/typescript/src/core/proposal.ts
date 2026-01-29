/**
 * Proposal Management
 *
 * Functionality for creating, reviewing, and managing memory proposals.
 */

import type {
  Profile,
  Proposal,
  ProposalStatus,
  ProposalAction,
  ProposalEvidence,
  Memory,
  DID,
  SensitivityLevel,
} from '../types';
import { generateProposalId, generateMemoryId } from '../utils/id';
import { getScopeSensitivity } from '../utils/scope';

/**
 * Options for creating a proposal
 */
export interface CreateProposalOptions {
  agentDid: DID;
  agentName?: string;
  sessionId?: string;
  content: string;
  category?: string;
  memoryType?: 'episodic' | 'semantic' | 'procedural';
  confidence?: number;
  context?: string;
  evidence?: ProposalEvidence[];
  suggestedSensitivity?: SensitivityLevel;
  suggestedScope?: string[];
  suggestedTags?: string[];
  expiresIn?: number; // milliseconds
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Create a new memory proposal
 */
export function createProposal(options: CreateProposalOptions): Proposal {
  const now = new Date();
  const expiresAt = options.expiresIn
    ? new Date(now.getTime() + options.expiresIn).toISOString()
    : new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // Default: 7 days

  return {
    id: generateProposalId(),
    proposedBy: {
      agentDid: options.agentDid,
      agentName: options.agentName,
      sessionId: options.sessionId,
    },
    proposedAt: now.toISOString(),
    memory: {
      content: options.content,
      category: options.category,
      memoryType: options.memoryType || 'episodic',
      confidence: options.confidence ?? 0.7,
      suggestedSensitivity: options.suggestedSensitivity,
      suggestedScope: options.suggestedScope,
      suggestedTags: options.suggestedTags,
    },
    context: options.context,
    evidence: options.evidence,
    status: 'pending',
    expiresAt,
    priority: options.priority ?? 'normal',
  };
}

/**
 * Add a proposal to a profile
 */
export function addProposal(profile: Profile, proposal: Proposal): Profile {
  const existing = profile.pendingProposals || [];

  // Check for duplicates
  if (existing.some(p => p.id === proposal.id)) {
    throw new Error(`Proposal already exists: ${proposal.id}`);
  }

  return {
    ...profile,
    pendingProposals: [...existing, proposal],
    updated: new Date().toISOString(),
  };
}

/**
 * Approve a proposal and create a memory
 */
export function approveProposal(
  profile: Profile,
  proposalId: string,
  options?: {
    editedContent?: string;
    editedCategory?: string;
    editedSensitivity?: SensitivityLevel;
    editedScope?: string[];
    editedTags?: string[];
  }
): { profile: Profile; memory: Memory } {
  const proposals = profile.pendingProposals || [];
  const proposalIndex = proposals.findIndex(p => p.id === proposalId);

  if (proposalIndex === -1) {
    throw new Error(`Proposal not found: ${proposalId}`);
  }

  const proposal = proposals[proposalIndex];

  if (proposal.status !== 'pending') {
    throw new Error(`Proposal is not pending: ${proposal.status}`);
  }

  const now = new Date().toISOString();
  const memoryId = generateMemoryId();

  const isEdited = Boolean(
    options?.editedContent ||
    options?.editedCategory ||
    options?.editedSensitivity ||
    options?.editedScope ||
    options?.editedTags
  );

  // Create the memory
  const memory: Memory = {
    id: memoryId,
    content: options?.editedContent || proposal.memory.content,
    category: options?.editedCategory || proposal.memory.category,
    source: {
      type: 'agent_proposal',
      agentDid: proposal.proposedBy.agentDid,
      agentName: proposal.proposedBy.agentName,
      sessionId: proposal.proposedBy.sessionId,
      timestamp: proposal.proposedAt,
      context: proposal.context,
    },
    confidence: proposal.memory.confidence ?? 0.7,
    status: 'approved',
    sensitivity: options?.editedSensitivity ||
                 proposal.memory.suggestedSensitivity ||
                 getScopeSensitivity(proposal.memory.category || 'a2p:episodic'),
    scope: options?.editedScope || proposal.memory.suggestedScope,
    tags: options?.editedTags || proposal.memory.suggestedTags,
    metadata: {
      approvedAt: now,
      useCount: 0,
      initialConfidence: proposal.memory.confidence,
    },
  };

  // Update the proposal
  const updatedProposal: Proposal = {
    ...proposal,
    status: 'approved',
    resolution: {
      resolvedAt: now,
      action: isEdited ? 'approved_with_edits' : 'approved',
      editedContent: options?.editedContent,
      editedCategory: options?.editedCategory,
      createdMemoryId: memoryId,
    },
  };

  // Update profile
  const newProposals = [...proposals];
  newProposals[proposalIndex] = updatedProposal;

  const episodic = profile.memories?.['a2p:episodic'] || [];

  const updatedProfile: Profile = {
    ...profile,
    pendingProposals: newProposals,
    memories: {
      ...profile.memories,
      'a2p:episodic': [...episodic, memory],
    },
    updated: now,
  };

  return { profile: updatedProfile, memory };
}

/**
 * Reject a proposal
 */
export function rejectProposal(
  profile: Profile,
  proposalId: string,
  reason?: string
): Profile {
  const proposals = profile.pendingProposals || [];
  const proposalIndex = proposals.findIndex(p => p.id === proposalId);

  if (proposalIndex === -1) {
    throw new Error(`Proposal not found: ${proposalId}`);
  }

  const proposal = proposals[proposalIndex];

  if (proposal.status !== 'pending') {
    throw new Error(`Proposal is not pending: ${proposal.status}`);
  }

  const now = new Date().toISOString();

  const updatedProposal: Proposal = {
    ...proposal,
    status: 'rejected',
    resolution: {
      resolvedAt: now,
      action: 'rejected',
      reason,
    },
  };

  const newProposals = [...proposals];
  newProposals[proposalIndex] = updatedProposal;

  return {
    ...profile,
    pendingProposals: newProposals,
    updated: now,
  };
}

/**
 * Withdraw a proposal (agent-initiated)
 */
export function withdrawProposal(profile: Profile, proposalId: string): Profile {
  const proposals = profile.pendingProposals || [];
  const proposalIndex = proposals.findIndex(p => p.id === proposalId);

  if (proposalIndex === -1) {
    throw new Error(`Proposal not found: ${proposalId}`);
  }

  const proposal = proposals[proposalIndex];

  if (proposal.status !== 'pending') {
    throw new Error(`Proposal is not pending: ${proposal.status}`);
  }

  const now = new Date().toISOString();

  const updatedProposal: Proposal = {
    ...proposal,
    status: 'withdrawn',
    resolution: {
      resolvedAt: now,
      action: 'withdrawn',
    },
  };

  const newProposals = [...proposals];
  newProposals[proposalIndex] = updatedProposal;

  return {
    ...profile,
    pendingProposals: newProposals,
    updated: now,
  };
}

/**
 * Get pending proposals
 */
export function getPendingProposals(profile: Profile): Proposal[] {
  return (profile.pendingProposals || []).filter(p => p.status === 'pending');
}

/**
 * Get proposals by agent
 */
export function getProposalsByAgent(profile: Profile, agentDid: DID): Proposal[] {
  return (profile.pendingProposals || []).filter(
    p => p.proposedBy.agentDid === agentDid
  );
}

/**
 * Expire old proposals
 */
export function expireProposals(profile: Profile): Profile {
  const now = new Date();
  const proposals = profile.pendingProposals || [];
  let hasExpired = false;

  const updatedProposals = proposals.map(proposal => {
    if (
      proposal.status === 'pending' &&
      proposal.expiresAt &&
      new Date(proposal.expiresAt) < now
    ) {
      hasExpired = true;
      return {
        ...proposal,
        status: 'expired' as ProposalStatus,
        resolution: {
          resolvedAt: now.toISOString(),
          action: 'expired' as ProposalAction,
        },
      };
    }
    return proposal;
  });

  if (!hasExpired) {
    return profile;
  }

  return {
    ...profile,
    pendingProposals: updatedProposals,
    updated: now.toISOString(),
  };
}

/**
 * Clean up resolved proposals (remove from pending list)
 */
export function cleanupResolvedProposals(
  profile: Profile,
  options?: { keepDays?: number }
): Profile {
  const keepDays = options?.keepDays ?? 30;
  const cutoff = new Date(Date.now() - keepDays * 24 * 60 * 60 * 1000);

  const proposals = profile.pendingProposals || [];
  const filtered = proposals.filter(p => {
    if (p.status === 'pending') return true;
    if (!p.resolution?.resolvedAt) return true;
    return new Date(p.resolution.resolvedAt) > cutoff;
  });

  if (filtered.length === proposals.length) {
    return profile;
  }

  return {
    ...profile,
    pendingProposals: filtered,
    updated: new Date().toISOString(),
  };
}

/**
 * Find similar existing memories
 */
export function findSimilarMemories(
  profile: Profile,
  content: string,
  _threshold?: number
): Memory[] {
  const episodic = profile.memories?.['a2p:episodic'] || [];
  const contentLower = content.toLowerCase();
  const words = contentLower.split(/\s+/).filter(w => w.length > 3);

  return episodic.filter(memory => {
    const memoryLower = memory.content.toLowerCase();
    // Simple word overlap similarity
    const matchingWords = words.filter(w => memoryLower.includes(w));
    const similarity = matchingWords.length / words.length;
    return similarity > 0.5;
  });
}
