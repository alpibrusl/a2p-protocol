/**
 * Tests for consent management
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateAccess,
  createConsentReceipt,
  isConsentValid,
  revokeConsent,
  createDefaultPolicy,
  createCategoryPolicy,
  getMatchingPolicies,
  hasPermission,
  mergePermissions,
} from '../../src/core/consent';
import { createProfile, addPolicy } from '../../src/core/profile';
import type { Profile, AgentProfile } from '../../src/types';

describe('evaluateAccess', () => {
  it('should deny access when no policies exist', () => {
    const profile = createProfile();
    const result = evaluateAccess(profile, 'did:a2p:agent:test', ['a2p:preferences']);

    expect(result.granted).toBe(false);
    expect(result.allowedScopes).toEqual([]);
    expect(result.deniedScopes).toEqual(['a2p:preferences']);
    expect(result.permissions).toEqual(['none']);
  });

  it('should grant access when policy matches', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
    });

    const result = evaluateAccess(profile, 'did:a2p:agent:test', ['a2p:preferences.communication']);

    expect(result.granted).toBe(true);
    expect(result.allowedScopes).toContain('a2p:preferences.communication');
    expect(result.deniedScopes).toEqual([]);
    expect(result.permissions).toContain('read_scoped');
    expect(result.matchedPolicy).toBeDefined();
  });

  it('should deny access when policy does not match', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:other',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
    });

    const result = evaluateAccess(profile, 'did:a2p:agent:test', ['a2p:preferences.communication']);

    expect(result.granted).toBe(false);
    expect(result.allowedScopes).toEqual([]);
    expect(result.deniedScopes).toEqual(['a2p:preferences.communication']);
  });

  it('should filter scopes based on allow/deny patterns', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      deny: ['a2p:preferences.sensitive'],
    });

    const result = evaluateAccess(profile, 'did:a2p:agent:test', [
      'a2p:preferences.communication',
      'a2p:preferences.sensitive',
    ]);

    expect(result.granted).toBe(true);
    expect(result.allowedScopes).toContain('a2p:preferences.communication');
    expect(result.deniedScopes).toContain('a2p:preferences.sensitive');
  });

  it('should check operator DIDs when agent profile provided', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      operatorDids: ['did:a2p:org:company-a'],
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(true);
  });

  it('should deny access when operator DID does not match', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      operatorDids: ['did:a2p:org:company-a'],
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-b',
        name: 'Company B',
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });
});

describe('createConsentReceipt', () => {
  it('should create a valid consent receipt', () => {
    const receipt = createConsentReceipt({
      userDid: 'did:a2p:user:test',
      agentDid: 'did:a2p:agent:test',
      grantedScopes: ['a2p:preferences.communication'],
      permissions: ['read_scoped'],
    });

    expect(receipt.receiptId).toBeDefined();
    expect(receipt.userDid).toBe('did:a2p:user:test');
    expect(receipt.agentDid).toBe('did:a2p:agent:test');
    expect(receipt.grantedScopes).toEqual(['a2p:preferences.communication']);
    expect(receipt.permissions).toEqual(['read_scoped']);
    expect(receipt.grantedAt).toBeDefined();
    expect(receipt.consentMethod).toBe('explicit_grant');
  });

  it('should set consent method to policy_match when policyId provided', () => {
    const receipt = createConsentReceipt({
      userDid: 'did:a2p:user:test',
      agentDid: 'did:a2p:agent:test',
      policyId: 'policy-123',
      grantedScopes: ['a2p:preferences.communication'],
      permissions: ['read_scoped'],
    });

    expect(receipt.consentMethod).toBe('policy_match');
    expect(receipt.policyId).toBe('policy-123');
  });
});

describe('isConsentValid', () => {
  it('should return true for valid consent', () => {
    const receipt = createConsentReceipt({
      userDid: 'did:a2p:user:test',
      agentDid: 'did:a2p:agent:test',
      grantedScopes: ['a2p:preferences.communication'],
      permissions: ['read_scoped'],
    });

    expect(isConsentValid(receipt)).toBe(true);
  });

  it('should return false for revoked consent', () => {
    const receipt = createConsentReceipt({
      userDid: 'did:a2p:user:test',
      agentDid: 'did:a2p:agent:test',
      grantedScopes: ['a2p:preferences.communication'],
      permissions: ['read_scoped'],
    });

    const revoked = revokeConsent(receipt, 'User requested');
    expect(isConsentValid(revoked)).toBe(false);
  });

  it('should return false for expired consent', () => {
    const receipt = createConsentReceipt({
      userDid: 'did:a2p:user:test',
      agentDid: 'did:a2p:agent:test',
      grantedScopes: ['a2p:preferences.communication'],
      permissions: ['read_scoped'],
      expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
    });

    expect(isConsentValid(receipt)).toBe(false);
  });
});

describe('revokeConsent', () => {
  it('should revoke consent with reason', () => {
    const receipt = createConsentReceipt({
      userDid: 'did:a2p:user:test',
      agentDid: 'did:a2p:agent:test',
      grantedScopes: ['a2p:preferences.communication'],
      permissions: ['read_scoped'],
    });

    const revoked = revokeConsent(receipt, 'User requested revocation');
    expect(revoked.revokedAt).toBeDefined();
    expect(revoked.revokedReason).toBe('User requested revocation');
  });
});

describe('createDefaultPolicy', () => {
  it('should create a default policy for an agent', () => {
    const policy = createDefaultPolicy('did:a2p:agent:test');

    expect(policy.id).toBeDefined();
    expect(policy.agentPattern).toBe('did:a2p:agent:test');
    expect(policy.allow).toContain('a2p:preferences.*');
    expect(policy.deny).toContain('a2p:health.*');
    expect(policy.permissions).toContain('read_scoped');
    expect(policy.enabled).toBe(true);
  });

  it('should create policy with custom options', () => {
    const policy = createDefaultPolicy('did:a2p:agent:test', {
      name: 'Custom Policy',
      scopes: ['a2p:identity.*'],
      permissions: ['read_full'],
    });

    expect(policy.name).toBe('Custom Policy');
    expect(policy.allow).toEqual(['a2p:identity.*']);
    expect(policy.permissions).toEqual(['read_full']);
  });
});

describe('createCategoryPolicy', () => {
  it('should create a category policy', () => {
    const policy = createCategoryPolicy('did:a2p:agent:*', {
      name: 'All Agents Policy',
      allow: ['a2p:preferences.*'],
      deny: ['a2p:health.*'],
      permissions: ['read_scoped'],
    });

    expect(policy.agentPattern).toBe('did:a2p:agent:*');
    expect(policy.name).toBe('All Agents Policy');
    expect(policy.allow).toEqual(['a2p:preferences.*']);
    expect(policy.deny).toEqual(['a2p:health.*']);
    expect(policy.priority).toBe(50);
  });
});

describe('getMatchingPolicies', () => {
  it('should return matching policies for an agent', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
    });
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:other',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
    });

    const matching = getMatchingPolicies(profile, 'did:a2p:agent:test');
    expect(matching.length).toBe(1);
    expect(matching[0].agentPattern).toBe('did:a2p:agent:*');
  });
});

describe('hasPermission', () => {
  it('should check if permission is granted', () => {
    expect(hasPermission(['read_scoped'], 'read_scoped')).toBe(true);
    expect(hasPermission(['read_full'], 'read_scoped')).toBe(true);
    expect(hasPermission(['read_scoped'], 'read_full')).toBe(false);
    expect(hasPermission(['none'], 'read_scoped')).toBe(false);
  });
});

describe('mergePermissions', () => {
  it('should merge permissions from multiple policies', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
    });
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['propose'],
      allow: ['a2p:preferences.*'],
    });

    const matching = getMatchingPolicies(profile, 'did:a2p:agent:test');
    const merged = mergePermissions(matching);

    expect(merged).toContain('read_scoped');
    expect(merged).toContain('propose');
  });
});

describe('Policy Conditions Evaluation', () => {
  it('should grant access when requireVerifiedOperator is met', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        requireVerifiedOperator: true,
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
        verified: true,
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(true);
  });

  it('should deny access when requireVerifiedOperator is not met', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        requireVerifiedOperator: true,
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
        verified: false,
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });

  it('should deny access when operator is missing and requireVerifiedOperator is true', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        requireVerifiedOperator: true,
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });

  it('should grant access when minTrustScore is met', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        minTrustScore: 0.7,
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      trustMetrics: {
        communityScore: 0.8,
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(true);
  });

  it('should deny access when minTrustScore is not met', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        minTrustScore: 0.7,
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      trustMetrics: {
        communityScore: 0.5,
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });

  it('should use default score of 0 when trustMetrics missing', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        minTrustScore: 0.1,
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });

  it('should grant access when requireAudit is met', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        requireAudit: true,
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      trustMetrics: {
        securityAudit: true,
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(true);
  });

  it('should deny access when requireAudit is not met', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        requireAudit: true,
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      trustMetrics: {
        securityAudit: false,
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });

  it('should deny access when trustMetrics missing and requireAudit is true', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        requireAudit: true,
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });

  it('should grant access when jurisdiction is in allowedJurisdictions', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        allowedJurisdictions: ['US', 'EU'],
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
        jurisdiction: 'US',
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(true);
  });

  it('should deny access when jurisdiction is not in allowedJurisdictions', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        allowedJurisdictions: ['US', 'EU'],
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
        jurisdiction: 'CN',
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });

  it('should deny access when jurisdiction is missing and allowedJurisdictions is required', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        allowedJurisdictions: ['US', 'EU'],
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });

  it('should deny access when jurisdiction is in blockedJurisdictions', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        blockedJurisdictions: ['CN', 'RU'],
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
        jurisdiction: 'CN',
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });

  it('should grant access when jurisdiction is not in blockedJurisdictions', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        blockedJurisdictions: ['CN', 'RU'],
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
        jurisdiction: 'US',
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(true);
  });

  it('should grant access when jurisdiction is missing and blockedJurisdictions is set', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        blockedJurisdictions: ['CN', 'RU'],
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(true);
  });

  it('should evaluate combined conditions correctly', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        requireVerifiedOperator: true,
        minTrustScore: 0.7,
        requireAudit: true,
        allowedJurisdictions: ['US', 'EU'],
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
        verified: true,
        jurisdiction: 'US',
      },
      trustMetrics: {
        communityScore: 0.8,
        securityAudit: true,
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(true);
  });

  it('should deny access when any condition fails', () => {
    let profile = createProfile();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      conditions: {
        requireVerifiedOperator: true,
        minTrustScore: 0.7,
      },
    });

    const agentProfile: AgentProfile = {
      did: 'did:a2p:agent:test',
      operator: {
        did: 'did:a2p:org:company-a',
        name: 'Company A',
        verified: true,
      },
      trustMetrics: {
        communityScore: 0.5, // Below threshold
      },
    };

    const result = evaluateAccess(
      profile,
      'did:a2p:agent:test',
      ['a2p:preferences.communication'],
      agentProfile
    );

    expect(result.granted).toBe(false);
  });

  it('should check policy expiry', () => {
    let profile = createProfile();
    const expiredDate = new Date(Date.now() - 1000).toISOString();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      expiry: expiredDate,
    });

    const result = evaluateAccess(profile, 'did:a2p:agent:test', ['a2p:preferences.communication']);

    expect(result.granted).toBe(false);
  });

  it('should grant access when policy is not expired', () => {
    let profile = createProfile();
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    profile = addPolicy(profile, {
      agentPattern: 'did:a2p:agent:*',
      permissions: ['read_scoped'],
      allow: ['a2p:preferences.*'],
      expiry: futureDate,
    });

    const result = evaluateAccess(profile, 'did:a2p:agent:test', ['a2p:preferences.communication']);

    expect(result.granted).toBe(true);
  });
});
