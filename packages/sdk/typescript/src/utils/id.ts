/**
 * ID Generation Utilities
 *
 * Utilities for generating unique identifiers for a2p entities.
 */

/**
 * Generate a random alphanumeric string
 */
function randomAlphanumeric(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    result += chars[randomValues[i] % chars.length];
  }
  return result;
}

/**
 * Generate a unique memory ID
 */
export function generateMemoryId(): string {
  return `mem_${randomAlphanumeric(16)}`;
}

/**
 * Generate a unique proposal ID
 */
export function generateProposalId(): string {
  return `prop_${randomAlphanumeric(16)}`;
}

/**
 * Generate a unique policy ID
 */
export function generatePolicyId(): string {
  return `policy_${randomAlphanumeric(12)}`;
}

/**
 * Generate a unique consent receipt ID
 */
export function generateReceiptId(): string {
  return `rcpt_${randomAlphanumeric(16)}`;
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `sess_${randomAlphanumeric(20)}`;
}

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return `req_${randomAlphanumeric(16)}`;
}

/**
 * Generate a DID for a user
 */
export function generateUserDid(namespace: string = 'local', identifier?: string): string {
  const id = identifier || randomAlphanumeric(12);
  return `did:a2p:user:${namespace}:${id}`;
}

/**
 * Generate a DID for an agent
 */
export function generateAgentDid(namespace: string = 'local', name?: string, identifier?: string): string {
  let id: string;
  if (identifier) {
    id = identifier;
  } else if (name) {
    id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  } else {
    id = randomAlphanumeric(12);
  }
  return `did:a2p:agent:${namespace}:${id}`;
}

/**
 * Generate a DID for an organization
 */
export function generateOrgDid(namespace: string = 'local', name?: string, identifier?: string): string {
  let id: string;
  if (identifier) {
    id = identifier;
  } else if (name) {
    id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  } else {
    id = randomAlphanumeric(12);
  }
  return `did:a2p:org:${namespace}:${id}`;
}

/**
 * Check if a string is a valid DID
 */
export function isValidDid(did: string): boolean {
  // Basic DID format: did:method:id
  // Method can be lowercase alphanumeric
  // ID can contain alphanumeric, dots, underscores, hyphens, and colons (for sub-identifiers)
  return /^did:[a-z0-9]+:[a-zA-Z0-9._:\-]+$/.test(did);
}

/**
 * DID type patterns as per a2p protocol spec Section 4.4
 * All patterns require namespace: did:a2p:<type>:<namespace>:<identifier>
 */
const DID_PATTERNS = {
  user: /^did:a2p:user:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/,
  agent: /^did:a2p:agent:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/,
  org: /^did:a2p:org:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/,
  entity: /^did:a2p:entity:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/,
  service: /^did:a2p:service:[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/,
} as const;

/**
 * General a2p DID pattern (requires namespace)
 */
const A2P_DID_PATTERN = /^did:a2p:(user|agent|org|entity|service):[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/;

/**
 * Local namespace pattern (for self-hosted profiles)
 */
const LOCAL_DID_PATTERN = /^did:a2p:(user|agent|org|entity|service):local:[a-zA-Z0-9._-]+$/;

/**
 * Check if a string is a valid a2p protocol DID.
 *
 * Validates against the pattern defined in a2p protocol spec Section 4.4:
 * ^did:a2p:(user|agent|org|entity|service):<namespace>:<identifier>
 *
 * All a2p DIDs MUST include a namespace component.
 *
 * @param did - The DID string to validate
 * @returns True if valid a2p DID, false otherwise
 *
 * @example
 * isValidA2pDid("did:a2p:agent:gaugid:my-assistant") // true
 * isValidA2pDid("did:a2p:user:local:alice") // true
 * isValidA2pDid("did:a2p:agent:my-assistant") // false (missing namespace)
 * isValidA2pDid("did:other:test") // false
 */
export function isValidA2pDid(did: string): boolean {
  return A2P_DID_PATTERN.test(did);
}

/**
 * Check if a string is a valid a2p agent DID.
 *
 * Validates against the pattern: ^did:a2p:agent:<namespace>:<identifier>$
 *
 * This is a protocol requirement (a2p spec Section 4.4.2).
 * Invalid agent DIDs should return error code A2P010.
 *
 * @param did - The DID string to validate
 * @returns True if valid agent DID, false otherwise
 *
 * @example
 * isValidAgentDid("did:a2p:agent:gaugid:my-assistant") // true
 * isValidAgentDid("did:a2p:agent:local:trusted-ai") // true
 * isValidAgentDid("did:a2p:agent:my-assistant") // false (missing namespace)
 * isValidAgentDid("did:a2p:user:gaugid:alice") // false
 * isValidAgentDid("did:a2p:agent:gaugid:") // false
 */
export function isValidAgentDid(did: string): boolean {
  return DID_PATTERNS.agent.test(did);
}

/**
 * Check if a string is a valid a2p user DID.
 *
 * Validates against the pattern: ^did:a2p:user:<namespace>:<identifier>$
 *
 * @param did - The DID string to validate
 * @returns True if valid user DID, false otherwise
 *
 * @example
 * isValidUserDid("did:a2p:user:gaugid:alice") // true
 * isValidUserDid("did:a2p:user:local:alice") // true
 * isValidUserDid("did:a2p:user:alice") // false (missing namespace)
 */
export function isValidUserDid(did: string): boolean {
  return DID_PATTERNS.user.test(did);
}

/**
 * Validation error structure
 */
export interface ValidationError {
  code: string;
  message: string;
}

/**
 * Validate an agent DID and return structured error if invalid.
 *
 * This follows the a2p protocol spec error codes (Section 11.4).
 *
 * @param did - The DID string to validate
 * @returns Object with valid boolean and optional error
 *
 * @example
 * validateAgentDid("did:a2p:agent:my-assistant")
 * // { valid: true }
 *
 * validateAgentDid("invalid-did")
 * // { valid: false, error: { code: 'A2P010', message: 'Invalid agent DID format' } }
 */
export function validateAgentDid(did: string): { valid: true } | { valid: false; error: ValidationError } {
  if (isValidAgentDid(did)) {
    return { valid: true };
  }

  return {
    valid: false,
    error: {
      code: 'A2P010',
      message: 'Invalid agent DID format',
    },
  };
}

/**
 * Parse an a2p DID into its components: type, namespace, identifier.
 *
 * @param did - The DID string to parse
 * @returns Object with type, namespace, identifier, or null if invalid
 *
 * @example
 * parseDid("did:a2p:agent:gaugid:my-assistant")
 * // { type: 'agent', namespace: 'gaugid', identifier: 'my-assistant' }
 *
 * parseDid("did:a2p:user:local:alice")
 * // { type: 'user', namespace: 'local', identifier: 'alice' }
 */
export function parseDid(did: string): { type: string; namespace: string; identifier: string } | null {
  const match = did.match(/^did:a2p:(user|agent|org|entity|service):([a-zA-Z0-9._-]+):([a-zA-Z0-9._-]+)$/);
  if (!match) return null;
  return {
    type: match[1],
    namespace: match[2],
    identifier: match[3],
  };
}

/**
 * Extract namespace from an a2p DID.
 *
 * @param did - The DID string
 * @returns Namespace string, or null if DID is invalid
 *
 * @example
 * getNamespace("did:a2p:agent:gaugid:my-assistant") // 'gaugid'
 * getNamespace("did:a2p:user:local:alice") // 'local'
 */
export function getNamespace(did: string): string | null {
  const parsed = parseDid(did);
  return parsed?.namespace || null;
}

/**
 * Check if a DID uses the local namespace (for self-hosted profiles).
 *
 * @param did - The DID string to check
 * @returns True if DID uses 'local' namespace, false otherwise
 *
 * @example
 * isLocalDid("did:a2p:user:local:alice") // true
 * isLocalDid("did:a2p:agent:gaugid:my-assistant") // false
 */
export function isLocalDid(did: string): boolean {
  return LOCAL_DID_PATTERN.test(did);
}
