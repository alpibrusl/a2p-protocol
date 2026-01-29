/**
 * Consent Management
 *
 * Functionality for managing consent policies and access control.
 */

import type {
  Profile,
  ConsentPolicy,
  ConsentReceipt,
  PermissionLevel,
  DID,
  AgentProfile,
} from '../types';
import { generateReceiptId, generatePolicyId } from '../utils/id';
import { filterScopes } from '../utils/scope';

/**
 * Evaluate if an agent has access based on policies
 */
export function evaluateAccess(
  profile: Profile,
  agentDid: DID,
  requestedScopes: string[],
  agentProfile?: AgentProfile
): {
  granted: boolean;
  allowedScopes: string[];
  deniedScopes: string[];
  permissions: PermissionLevel[];
  matchedPolicy?: ConsentPolicy;
} {
  const policies = (profile.accessPolicies || [])
    .filter(p => p.enabled !== false)
    .sort((a, b) => (a.priority || 100) - (b.priority || 100));

  if (policies.length === 0) {
    return {
      granted: false,
      allowedScopes: [],
      deniedScopes: requestedScopes,
      permissions: ['none'],
    };
  }

  // Find matching policy
  const matchedPolicy = policies.find(policy => {
    // Check agent pattern
    if (policy.agentPattern) {
      if (!agentMatchesPattern(agentDid, policy.agentPattern)) {
        return false;
      }
    }

    // Check specific agent DIDs
    if (policy.agentDids && policy.agentDids.length > 0) {
      if (!policy.agentDids.includes(agentDid)) {
        return false;
      }
    }

    // Check operator DIDs
    if (policy.operatorDids && policy.operatorDids.length > 0 && agentProfile) {
      if (!agentProfile.operator?.did || !policy.operatorDids.includes(agentProfile.operator.did)) {
        return false;
      }
    }

    // Check conditions
    if (policy.conditions && agentProfile) {
      if (!evaluateConditions(policy.conditions, agentProfile)) {
        return false;
      }
    }

    // Check expiry
    if (policy.expiry && new Date(policy.expiry) < new Date()) {
      return false;
    }

    return true;
  });

  if (!matchedPolicy) {
    return {
      granted: false,
      allowedScopes: [],
      deniedScopes: requestedScopes,
      permissions: ['none'],
    };
  }

  // Filter scopes based on allow/deny
  const allowPatterns = matchedPolicy.allow || [];
  const denyPatterns = matchedPolicy.deny || [];

  const allowedScopes = filterScopes(requestedScopes, allowPatterns, denyPatterns);
  const deniedScopes = requestedScopes.filter(s => !allowedScopes.includes(s));

  return {
    granted: allowedScopes.length > 0,
    allowedScopes,
    deniedScopes,
    permissions: matchedPolicy.permissions,
    matchedPolicy,
  };
}

/**
 * Check if an agent DID matches a pattern
 */
function agentMatchesPattern(agentDid: DID, pattern: string): boolean {
  if (pattern === '*') return true;

  // Convert pattern to regex
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');

  return new RegExp(`^${regexPattern}$`).test(agentDid);
}

/**
 * Evaluate policy conditions against agent profile
 */
function evaluateConditions(
  conditions: ConsentPolicy['conditions'],
  agentProfile: AgentProfile
): boolean {
  if (!conditions) return true;

  if (conditions.requireVerifiedOperator) {
    if (!agentProfile.operator?.verified) {
      return false;
    }
  }

  if (conditions.minTrustScore !== undefined) {
    const score = agentProfile.trustMetrics?.communityScore ?? 0;
    if (score < conditions.minTrustScore) {
      return false;
    }
  }

  if (conditions.requireAudit) {
    if (!agentProfile.trustMetrics?.securityAudit) {
      return false;
    }
  }

  if (conditions.allowedJurisdictions && conditions.allowedJurisdictions.length > 0) {
    const jurisdiction = agentProfile.operator?.jurisdiction;
    if (!jurisdiction || !conditions.allowedJurisdictions.includes(jurisdiction)) {
      return false;
    }
  }

  if (conditions.blockedJurisdictions && conditions.blockedJurisdictions.length > 0) {
    const jurisdiction = agentProfile.operator?.jurisdiction;
    if (jurisdiction && conditions.blockedJurisdictions.includes(jurisdiction)) {
      return false;
    }
  }

  return true;
}

/**
 * Create a consent receipt
 */
export function createConsentReceipt(options: {
  userDid: DID;
  agentDid: DID;
  operatorDid?: DID;
  policyId?: string;
  grantedScopes: string[];
  deniedScopes?: string[];
  permissions: PermissionLevel[];
  subProfile?: string;
  expiresAt?: string | null;
  purpose?: string;
  legalBasis?: ConsentReceipt['legalBasis'];
}): ConsentReceipt {
  const now = new Date().toISOString();

  return {
    receiptId: generateReceiptId(),
    userDid: options.userDid,
    agentDid: options.agentDid,
    operatorDid: options.operatorDid,
    policyId: options.policyId,
    grantedScopes: options.grantedScopes,
    deniedScopes: options.deniedScopes,
    permissions: options.permissions,
    subProfile: options.subProfile,
    grantedAt: now,
    expiresAt: options.expiresAt,
    consentMethod: options.policyId ? 'policy_match' : 'explicit_grant',
    purpose: options.purpose,
    legalBasis: options.legalBasis ?? 'consent',
  };
}

/**
 * Check if a consent receipt is still valid
 */
export function isConsentValid(receipt: ConsentReceipt): boolean {
  if (receipt.revokedAt) {
    return false;
  }

  if (receipt.expiresAt && new Date(receipt.expiresAt) < new Date()) {
    return false;
  }

  return true;
}

/**
 * Revoke a consent receipt
 */
export function revokeConsent(
  receipt: ConsentReceipt,
  reason?: string
): ConsentReceipt {
  return {
    ...receipt,
    revokedAt: new Date().toISOString(),
    revokedReason: reason,
  };
}

/**
 * Create a default policy for an agent
 */
export function createDefaultPolicy(
  agentDid: DID,
  options?: {
    name?: string;
    scopes?: string[];
    permissions?: PermissionLevel[];
  }
): ConsentPolicy {
  return {
    id: generatePolicyId(),
    name: options?.name ?? `Policy for ${agentDid}`,
    agentPattern: agentDid,
    allow: options?.scopes ?? ['a2p:preferences.*'],
    deny: ['a2p:health.*', 'a2p:financial.*'],
    permissions: options?.permissions ?? ['read_scoped', 'propose'],
    enabled: true,
    priority: 100,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

/**
 * Create a policy for a category of agents
 */
export function createCategoryPolicy(
  agentPattern: string,
  options: {
    name: string;
    allow: string[];
    deny?: string[];
    permissions: PermissionLevel[];
    conditions?: ConsentPolicy['conditions'];
  }
): ConsentPolicy {
  return {
    id: generatePolicyId(),
    name: options.name,
    agentPattern,
    allow: options.allow,
    deny: options.deny ?? [],
    permissions: options.permissions,
    conditions: options.conditions,
    enabled: true,
    priority: 50,
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

/**
 * Get all active policies for an agent
 */
export function getMatchingPolicies(
  profile: Profile,
  agentDid: DID
): ConsentPolicy[] {
  return (profile.accessPolicies || [])
    .filter(p => p.enabled !== false)
    .filter(p => agentMatchesPattern(agentDid, p.agentPattern))
    .sort((a, b) => (a.priority || 100) - (b.priority || 100));
}

/**
 * Check if a specific permission is granted
 */
export function hasPermission(
  permissions: PermissionLevel[],
  required: PermissionLevel
): boolean {
  const hierarchy: PermissionLevel[] = [
    'none',
    'read_public',
    'read_scoped',
    'read_full',
    'propose',
    'write',
  ];

  const requiredIndex = hierarchy.indexOf(required);

  return permissions.some(p => hierarchy.indexOf(p) >= requiredIndex);
}

/**
 * Merge permissions from multiple policies
 */
export function mergePermissions(
  policies: ConsentPolicy[]
): PermissionLevel[] {
  const allPermissions = new Set<PermissionLevel>();

  for (const policy of policies) {
    for (const permission of policy.permissions) {
      allPermissions.add(permission);
    }
  }

  return Array.from(allPermissions);
}
