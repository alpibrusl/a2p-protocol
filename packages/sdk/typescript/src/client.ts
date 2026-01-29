/**
 * a2p Client
 *
 * Main client for interacting with the a2p protocol.
 */

import type {
  Profile,
  AgentProfile,
  Memory,
  Proposal,
  ConsentReceipt,
  DID,
  A2PClientConfig,
  ProfileAccessRequest,
  ProfileAccessResponse,
  MemoryProposalRequest,
  MemoryProposalResponse,
  PermissionLevel,
  SensitivityLevel,
  ProposalEvidence,
} from './types';
import { createProfile, getFilteredProfile, addMemory, validateProfile } from './core/profile';
import { createProposal, addProposal, approveProposal, rejectProposal } from './core/proposal';
import { evaluateAccess, createConsentReceipt, hasPermission } from './core/consent';
import { generateSessionId } from './utils/id';

/**
 * Storage interface for profile persistence
 */
export interface ProfileStorage {
  get(did: DID): Promise<Profile | null>;
  set(did: DID, profile: Profile): Promise<void>;
  delete(did: DID): Promise<void>;
}

/**
 * In-memory storage implementation
 */
export class MemoryStorage implements ProfileStorage {
  private profiles = new Map<string, Profile>();

  async get(did: DID): Promise<Profile | null> {
    return this.profiles.get(did) || null;
  }

  async set(did: DID, profile: Profile): Promise<void> {
    this.profiles.set(did, profile);
  }

  async delete(did: DID): Promise<void> {
    this.profiles.delete(did);
  }
}

/**
 * a2p Client for agents
 *
 * This client is used by AI agents to interact with user profiles.
 */
export class A2PClient {
  private config: A2PClientConfig;
  private storage: ProfileStorage;
  private sessionId: string;
  private agentProfile?: AgentProfile;

  constructor(config: A2PClientConfig, storage?: ProfileStorage) {
    this.config = config;
    this.storage = storage || new MemoryStorage();
    this.sessionId = generateSessionId();
  }

  /**
   * Set the agent profile for trust evaluation
   */
  setAgentProfile(profile: AgentProfile): void {
    this.agentProfile = profile;
  }

  /**
   * Request access to a user's profile
   */
  async requestAccess(request: ProfileAccessRequest): Promise<ProfileAccessResponse> {
    const profile = await this.storage.get(request.userDid);

    if (!profile) {
      throw new Error(`Profile not found: ${request.userDid}`);
    }

    // Evaluate access based on policies
    const accessResult = evaluateAccess(
      profile,
      this.config.agentDid,
      request.scopes,
      this.agentProfile
    );

    if (!accessResult.granted) {
      throw new Error('Access denied: No matching policy grants access');
    }

    // Create consent receipt
    const consent = createConsentReceipt({
      userDid: request.userDid,
      agentDid: this.config.agentDid,
      operatorDid: this.agentProfile?.operator?.did,
      policyId: accessResult.matchedPolicy?.id,
      grantedScopes: accessResult.allowedScopes,
      deniedScopes: accessResult.deniedScopes,
      permissions: accessResult.permissions,
      subProfile: request.subProfile,
      purpose: request.purpose,
    });

    // Get filtered profile
    const filteredProfile = getFilteredProfile(
      profile,
      accessResult.allowedScopes,
      request.subProfile as DID | undefined
    );

    return {
      profile: filteredProfile,
      consent,
      filteredScopes: accessResult.allowedScopes,
    };
  }

  /**
   * Get a user's profile (convenience method)
   */
  async getProfile(options: {
    userDid: DID;
    scopes: string[];
    subProfile?: string;
  }): Promise<Partial<Profile>> {
    const response = await this.requestAccess({
      userDid: options.userDid,
      scopes: options.scopes,
      subProfile: options.subProfile,
    });

    return response.profile;
  }

  /**
   * Propose a new memory to a user's profile
   */
  async proposeMemory(request: MemoryProposalRequest): Promise<MemoryProposalResponse> {
    const profile = await this.storage.get(request.userDid);

    if (!profile) {
      throw new Error(`Profile not found: ${request.userDid}`);
    }

    // Check if agent has propose permission
    const accessResult = evaluateAccess(
      profile,
      this.config.agentDid,
      [request.category || 'a2p:episodic'],
      this.agentProfile
    );

    if (!hasPermission(accessResult.permissions, 'propose')) {
      throw new Error('Access denied: Agent does not have propose permission');
    }

    // Create proposal
    const proposal = createProposal({
      agentDid: this.config.agentDid,
      agentName: this.agentProfile?.identity?.name,
      sessionId: this.sessionId,
      content: request.content,
      category: request.category,
      memoryType: request.memoryType || 'episodic',
      confidence: request.confidence,
      context: request.context,
      evidence: request.evidence,
      suggestedSensitivity: request.suggestedSensitivity,
    });

    // Add proposal to profile
    const updatedProfile = addProposal(profile, proposal);
    await this.storage.set(request.userDid, updatedProfile);

    return {
      proposalId: proposal.id,
      status: proposal.status,
    };
  }

  /**
   * Check if agent has a specific permission for a user
   */
  async checkPermission(
    userDid: DID,
    permission: PermissionLevel,
    scope?: string
  ): Promise<boolean> {
    const profile = await this.storage.get(userDid);

    if (!profile) {
      return false;
    }

    const scopes = scope ? [scope] : ['a2p:*'];
    const accessResult = evaluateAccess(
      profile,
      this.config.agentDid,
      scopes,
      this.agentProfile
    );

    return hasPermission(accessResult.permissions, permission);
  }

  /**
   * Get current session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }

  /**
   * Start a new session
   */
  newSession(): string {
    this.sessionId = generateSessionId();
    return this.sessionId;
  }
}

/**
 * a2p User Client
 *
 * This client is used by users to manage their own profiles.
 */
export class A2PUserClient {
  private storage: ProfileStorage;
  private profile: Profile | null = null;

  constructor(storage?: ProfileStorage) {
    this.storage = storage || new MemoryStorage();
  }

  /**
   * Create a new profile
   */
  async createProfile(options?: {
    displayName?: string;
    preferences?: Profile['common'];
  }): Promise<Profile> {
    this.profile = createProfile({
      displayName: options?.displayName,
      preferences: options?.preferences?.preferences,
    });

    await this.storage.set(this.profile.id, this.profile);
    return this.profile;
  }

  /**
   * Load an existing profile
   */
  async loadProfile(did: DID): Promise<Profile | null> {
    this.profile = await this.storage.get(did);
    return this.profile;
  }

  /**
   * Get the current profile
   */
  getProfile(): Profile | null {
    return this.profile;
  }

  /**
   * Save the current profile
   */
  async saveProfile(): Promise<void> {
    if (!this.profile) {
      throw new Error('No profile loaded');
    }

    await this.storage.set(this.profile.id, this.profile);
  }

  /**
   * Add a memory manually
   */
  async addMemory(memory: {
    content: string;
    category?: string;
    sensitivity?: SensitivityLevel;
    scope?: string[];
    tags?: string[];
  }): Promise<Memory> {
    if (!this.profile) {
      throw new Error('No profile loaded');
    }

    const newMemory: Omit<Memory, 'id' | 'metadata'> = {
      content: memory.content,
      category: memory.category,
      source: {
        type: 'user_manual',
        timestamp: new Date().toISOString(),
      },
      confidence: 1.0,
      status: 'approved',
      sensitivity: memory.sensitivity,
      scope: memory.scope,
      tags: memory.tags,
    };

    this.profile = addMemory(this.profile, newMemory);
    await this.saveProfile();

    const episodic = this.profile.memories?.['a2p:episodic'] || [];
    return episodic[episodic.length - 1];
  }

  /**
   * Get pending proposals
   */
  getPendingProposals(): Proposal[] {
    if (!this.profile) {
      return [];
    }

    return (this.profile.pendingProposals || []).filter(
      p => p.status === 'pending'
    );
  }

  /**
   * Approve a proposal
   */
  async approveProposal(
    proposalId: string,
    options?: {
      editedContent?: string;
      editedCategory?: string;
    }
  ): Promise<Memory> {
    if (!this.profile) {
      throw new Error('No profile loaded');
    }

    const result = approveProposal(this.profile, proposalId, options);
    this.profile = result.profile;
    await this.saveProfile();

    return result.memory;
  }

  /**
   * Reject a proposal
   */
  async rejectProposal(proposalId: string, reason?: string): Promise<void> {
    if (!this.profile) {
      throw new Error('No profile loaded');
    }

    this.profile = rejectProposal(this.profile, proposalId, reason);
    await this.saveProfile();
  }

  /**
   * Export profile to JSON
   */
  exportProfile(): string {
    if (!this.profile) {
      throw new Error('No profile loaded');
    }

    return JSON.stringify(this.profile, null, 2);
  }

  /**
   * Import profile from JSON
   */
  async importProfile(json: string): Promise<Profile> {
    const parsed = JSON.parse(json);

    if (!validateProfile(parsed)) {
      throw new Error('Invalid profile structure');
    }

    this.profile = parsed;
    await this.saveProfile();

    return this.profile;
  }
}

/**
 * Create an agent client
 */
export function createAgentClient(
  config: A2PClientConfig,
  storage?: ProfileStorage
): A2PClient {
  return new A2PClient(config, storage);
}

/**
 * Create a user client
 */
export function createUserClient(storage?: ProfileStorage): A2PUserClient {
  return new A2PUserClient(storage);
}
