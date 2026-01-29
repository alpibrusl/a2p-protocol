/**
 * Profile Management
 *
 * Core functionality for creating, reading, and updating a2p profiles.
 */

import type {
  Profile,
  ProfileType,
  Identity,
  Common,
  Memories,
  Memory,
  SubProfile,
  ConsentPolicy,
  DID,
} from '../types';
import { generateUserDid, generateMemoryId, generatePolicyId, isValidDid } from '../utils/id';
import { getScopeSensitivity } from '../utils/scope';

/**
 * Options for creating a new profile
 */
export interface CreateProfileOptions {
  did?: DID;
  displayName?: string;
  profileType?: ProfileType;
  preferences?: Common['preferences'];
}

/**
 * Create a new empty profile
 */
export function createProfile(options: CreateProfileOptions = {}): Profile {
  const did = options.did || (generateUserDid() as DID);
  const now = new Date().toISOString();

  return {
    id: did,
    version: '1.0',
    profileType: options.profileType || 'human',
    created: now,
    updated: now,
    identity: {
      did,
      displayName: options.displayName,
    },
    common: options.preferences ? { preferences: options.preferences } : undefined,
    memories: {},
    subProfiles: [],
    pendingProposals: [],
    accessPolicies: [],
    settings: {
      memorySettings: {
        decayEnabled: true,
        decayRate: 0.1,
        decayInterval: '30d',
        reviewThreshold: 0.5,
        archiveThreshold: 0.3,
      },
      notificationSettings: {
        proposalNotifications: true,
        accessNotifications: false,
        consolidationReminders: true,
      },
      privacySettings: {
        defaultSensitivity: 'standard',
        allowAnonymousAccess: false,
      },
    },
  };
}

/**
 * Update profile identity
 */
export function updateIdentity(profile: Profile, identity: Partial<Identity>): Profile {
  return {
    ...profile,
    identity: { ...profile.identity, ...identity },
    updated: new Date().toISOString(),
  };
}

/**
 * Update profile preferences
 */
export function updatePreferences(
  profile: Profile,
  preferences: Partial<Common['preferences']>
): Profile {
  return {
    ...profile,
    common: {
      ...profile.common,
      preferences: {
        ...profile.common?.preferences,
        ...preferences,
      },
    },
    updated: new Date().toISOString(),
  };
}

/**
 * Add a memory to the profile
 */
export function addMemory(
  profile: Profile,
  memory: Omit<Memory, 'id' | 'metadata'> & { id?: string }
): Profile {
  const memoryId = memory.id || generateMemoryId();
  const now = new Date().toISOString();

  const newMemory: Memory = {
    ...memory,
    id: memoryId,
    confidence: memory.confidence ?? 0.8,
    sensitivity: memory.sensitivity ?? getScopeSensitivity(memory.category || 'a2p:episodic'),
    metadata: {
      approvedAt: memory.status === 'approved' ? now : undefined,
      useCount: 0,
    },
  };

  const episodic = profile.memories?.['a2p:episodic'] || [];

  return {
    ...profile,
    memories: {
      ...profile.memories,
      'a2p:episodic': [...episodic, newMemory],
    },
    updated: now,
  };
}

/**
 * Update a memory in the profile
 */
export function updateMemory(
  profile: Profile,
  memoryId: string,
  updates: Partial<Memory>
): Profile {
  const episodic = profile.memories?.['a2p:episodic'] || [];
  const memoryIndex = episodic.findIndex(m => m.id === memoryId);

  if (memoryIndex === -1) {
    throw new Error(`Memory not found: ${memoryId}`);
  }

  const existingMemory = episodic[memoryIndex];
  const updatedMemory: Memory = {
    ...existingMemory,
    ...updates,
    metadata: {
      ...existingMemory.metadata,
      ...updates.metadata,
    },
  };

  const newEpisodic = [...episodic];
  newEpisodic[memoryIndex] = updatedMemory;

  return {
    ...profile,
    memories: {
      ...profile.memories,
      'a2p:episodic': newEpisodic,
    },
    updated: new Date().toISOString(),
  };
}

/**
 * Remove a memory from the profile
 */
export function removeMemory(profile: Profile, memoryId: string): Profile {
  const episodic = profile.memories?.['a2p:episodic'] || [];

  return {
    ...profile,
    memories: {
      ...profile.memories,
      'a2p:episodic': episodic.filter(m => m.id !== memoryId),
    },
    updated: new Date().toISOString(),
  };
}

/**
 * Archive a memory (soft delete)
 */
export function archiveMemory(profile: Profile, memoryId: string): Profile {
  return updateMemory(profile, memoryId, {
    status: 'archived',
    metadata: {
      archivedAt: new Date().toISOString(),
    },
  });
}

/**
 * Add a sub-profile
 */
export function addSubProfile(profile: Profile, subProfile: SubProfile): Profile {
  const existing = profile.subProfiles || [];

  if (existing.some(sp => sp.id === subProfile.id)) {
    throw new Error(`Sub-profile already exists: ${subProfile.id}`);
  }

  return {
    ...profile,
    subProfiles: [...existing, subProfile],
    updated: new Date().toISOString(),
  };
}

/**
 * Update a sub-profile
 */
export function updateSubProfile(
  profile: Profile,
  subProfileId: DID,
  updates: Partial<SubProfile>
): Profile {
  const subProfiles = profile.subProfiles || [];
  const index = subProfiles.findIndex(sp => sp.id === subProfileId);

  if (index === -1) {
    throw new Error(`Sub-profile not found: ${subProfileId}`);
  }

  const newSubProfiles = [...subProfiles];
  newSubProfiles[index] = { ...subProfiles[index], ...updates };

  return {
    ...profile,
    subProfiles: newSubProfiles,
    updated: new Date().toISOString(),
  };
}

/**
 * Remove a sub-profile
 */
export function removeSubProfile(profile: Profile, subProfileId: DID): Profile {
  return {
    ...profile,
    subProfiles: (profile.subProfiles || []).filter(sp => sp.id !== subProfileId),
    updated: new Date().toISOString(),
  };
}

/**
 * Add a consent policy
 */
export function addPolicy(
  profile: Profile,
  policy: Omit<ConsentPolicy, 'id' | 'created'> & { id?: string }
): Profile {
  const policyId = policy.id || generatePolicyId();
  const now = new Date().toISOString();

  const newPolicy: ConsentPolicy = {
    ...policy,
    id: policyId,
    created: now,
    updated: now,
    enabled: policy.enabled ?? true,
    priority: policy.priority ?? 100,
  };

  return {
    ...profile,
    accessPolicies: [...(profile.accessPolicies || []), newPolicy],
    updated: now,
  };
}

/**
 * Update a consent policy
 */
export function updatePolicy(
  profile: Profile,
  policyId: string,
  updates: Partial<ConsentPolicy>
): Profile {
  const policies = profile.accessPolicies || [];
  const index = policies.findIndex(p => p.id === policyId);

  if (index === -1) {
    throw new Error(`Policy not found: ${policyId}`);
  }

  const newPolicies = [...policies];
  newPolicies[index] = {
    ...policies[index],
    ...updates,
    updated: new Date().toISOString(),
  };

  return {
    ...profile,
    accessPolicies: newPolicies,
    updated: new Date().toISOString(),
  };
}

/**
 * Remove a consent policy
 */
export function removePolicy(profile: Profile, policyId: string): Profile {
  return {
    ...profile,
    accessPolicies: (profile.accessPolicies || []).filter(p => p.id !== policyId),
    updated: new Date().toISOString(),
  };
}

/**
 * Get filtered profile based on allowed scopes
 */
export function getFilteredProfile(
  profile: Profile,
  allowedScopes: string[],
  subProfileId?: DID
): Partial<Profile> {
  const filtered: Partial<Profile> = {
    id: profile.id,
    version: profile.version,
    profileType: profile.profileType,
  };

  // Always include basic identity
  if (allowedScopes.some(s => s.startsWith('a2p:identity') || s === 'a2p:*')) {
    filtered.identity = profile.identity;
  }

  // Filter common preferences
  if (allowedScopes.some(s => s.startsWith('a2p:preferences') || s === 'a2p:*')) {
    filtered.common = profile.common;
  }

  // Filter memories
  if (profile.memories) {
    const filteredMemories: Memories = {};

    for (const [category, data] of Object.entries(profile.memories)) {
      if (allowedScopes.some(s => category.startsWith(s.replace('.*', '')) || s === 'a2p:*')) {
        if (category === 'a2p:episodic') {
          // Filter episodic memories by scope
          const memories = data as Memory[];
          filteredMemories[category] = memories.filter(
            m => !m.scope || m.scope.length === 0 || m.scope.some(s => allowedScopes.includes(s))
          );
        } else {
          filteredMemories[category as keyof Memories] = data as never;
        }
      }
    }

    filtered.memories = filteredMemories;
  }

  // Include sub-profile data if specified
  if (subProfileId && profile.subProfiles) {
    const subProfile = profile.subProfiles.find(sp => sp.id === subProfileId);
    if (subProfile?.specialized) {
      filtered.memories = {
        ...filtered.memories,
        ...subProfile.specialized,
      };
    }
  }

  return filtered;
}

/**
 * Validate a profile structure
 */
export function validateProfile(profile: unknown): profile is Profile {
  if (!profile || typeof profile !== 'object') return false;

  const p = profile as Record<string, unknown>;

  if (typeof p.id !== 'string' || !isValidDid(p.id)) return false;
  if (typeof p.version !== 'string') return false;
  if (!['human', 'agent', 'entity'].includes(p.profileType as string)) return false;
  if (!p.identity || typeof p.identity !== 'object') return false;

  const identity = p.identity as Record<string, unknown>;
  if (typeof identity.did !== 'string' || !isValidDid(identity.did)) return false;

  return true;
}

/**
 * Export profile to JSON
 */
export function exportProfile(profile: Profile): string {
  return JSON.stringify(profile, null, 2);
}

/**
 * Import profile from JSON
 */
export function importProfile(json: string): Profile {
  const parsed = JSON.parse(json);

  if (!validateProfile(parsed)) {
    throw new Error('Invalid profile structure');
  }

  return parsed;
}
