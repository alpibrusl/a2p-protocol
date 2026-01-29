/**
 * Scope Utilities
 *
 * Utilities for working with a2p scopes and access control.
 */

/**
 * Check if a scope matches a pattern (supports wildcards)
 *
 * @example
 * scopeMatches('a2p:preferences.communication', 'a2p:preferences.*') // true
 * scopeMatches('a2p:health', 'a2p:*') // true
 * scopeMatches('a2p:preferences', 'a2p:professional') // false
 */
export function scopeMatches(scope: string, pattern: string): boolean {
  // Exact match
  if (scope === pattern) return true;

  // Pattern with wildcard
  if (pattern.endsWith('.*')) {
    const prefix = pattern.slice(0, -2);
    return scope === prefix || scope.startsWith(prefix + '.');
  }

  // Pattern is just namespace:*
  if (pattern.endsWith(':*')) {
    const namespace = pattern.slice(0, -2);
    return scope.startsWith(namespace + ':');
  }

  return false;
}

/**
 * Check if any scope in a list matches a pattern
 */
export function anyScopeMatches(scopes: string[], pattern: string): boolean {
  return scopes.some(scope => scopeMatches(scope, pattern));
}

/**
 * Filter scopes based on allowed and denied patterns
 */
export function filterScopes(
  requestedScopes: string[],
  allowPatterns: string[],
  denyPatterns: string[] = []
): string[] {
  return requestedScopes.filter(scope => {
    // Check if explicitly denied
    if (denyPatterns.some(pattern => scopeMatches(scope, pattern))) {
      return false;
    }
    // Check if allowed
    return allowPatterns.some(pattern => scopeMatches(scope, pattern));
  });
}

/**
 * Parse a scope into its components
 *
 * @example
 * parseScope('a2p:preferences.communication.style')
 * // { namespace: 'a2p', category: 'preferences', path: ['communication', 'style'] }
 */
export function parseScope(scope: string): {
  namespace: string;
  category: string;
  path: string[];
} | null {
  const match = scope.match(/^(a2p|ext:[a-zA-Z0-9_]+):([a-zA-Z0-9_]+)((?:\.[a-zA-Z0-9_]+)*)$/);
  if (!match) return null;

  const [, namespace, category, pathStr] = match;
  const path = pathStr ? pathStr.slice(1).split('.') : [];

  return { namespace, category, path };
}

/**
 * Build a scope string from components
 */
export function buildScope(
  namespace: string,
  category: string,
  path: string[] = []
): string {
  const base = `${namespace}:${category}`;
  return path.length > 0 ? `${base}.${path.join('.')}` : base;
}

/**
 * Get all parent scopes for a given scope
 *
 * @example
 * getParentScopes('a2p:preferences.communication.style')
 * // ['a2p:preferences.communication', 'a2p:preferences', 'a2p:*']
 */
export function getParentScopes(scope: string): string[] {
  const parsed = parseScope(scope);
  if (!parsed) return [];

  const parents: string[] = [];
  const { namespace, category, path } = parsed;

  // Add intermediate parents
  for (let i = path.length - 1; i >= 0; i--) {
    parents.push(buildScope(namespace, category, path.slice(0, i)));
  }

  // Add namespace wildcard
  parents.push(`${namespace}:*`);

  return parents;
}

/**
 * Standard a2p scopes
 */
export const STANDARD_SCOPES = {
  // Identity
  IDENTITY: 'a2p:identity',
  IDENTITY_NAME: 'a2p:identity.name',
  IDENTITY_LOCATION: 'a2p:identity.location',

  // Preferences
  PREFERENCES: 'a2p:preferences',
  PREFERENCES_COMMUNICATION: 'a2p:preferences.communication',
  PREFERENCES_CONTENT: 'a2p:preferences.content',
  PREFERENCES_UI: 'a2p:preferences.ui',

  // Professional
  PROFESSIONAL: 'a2p:professional',
  PROFESSIONAL_SKILLS: 'a2p:professional.skills',

  // Interests
  INTERESTS: 'a2p:interests',
  INTERESTS_TOPICS: 'a2p:interests.topics',
  INTERESTS_MUSIC: 'a2p:interests.music',
  INTERESTS_READING: 'a2p:interests.reading',

  // Context
  CONTEXT: 'a2p:context',
  CONTEXT_PROJECTS: 'a2p:context.currentProjects',
  CONTEXT_GOALS: 'a2p:context.ongoingGoals',

  // Sensitive
  HEALTH: 'a2p:health',
  RELATIONSHIPS: 'a2p:relationships',
  FINANCIAL: 'a2p:financial',

  // Episodic
  EPISODIC: 'a2p:episodic',

  // Wildcards
  ALL: 'a2p:*',
  ALL_PREFERENCES: 'a2p:preferences.*',
  ALL_PROFESSIONAL: 'a2p:professional.*',
  ALL_INTERESTS: 'a2p:interests.*',
} as const;

/**
 * Sensitivity levels for standard scopes
 */
export const SCOPE_SENSITIVITY: Record<string, 'public' | 'standard' | 'sensitive' | 'restricted'> = {
  'a2p:preferences': 'public',
  'a2p:preferences.communication': 'public',
  'a2p:preferences.content': 'public',
  'a2p:identity': 'standard',
  'a2p:professional': 'standard',
  'a2p:interests': 'standard',
  'a2p:context': 'standard',
  'a2p:health': 'sensitive',
  'a2p:relationships': 'sensitive',
  'a2p:financial': 'restricted',
};

/**
 * Get the sensitivity level for a scope
 */
export function getScopeSensitivity(scope: string): 'public' | 'standard' | 'sensitive' | 'restricted' {
  // Check exact match
  if (scope in SCOPE_SENSITIVITY) {
    return SCOPE_SENSITIVITY[scope];
  }

  // Check parent scopes
  const parsed = parseScope(scope);
  if (!parsed) return 'standard';

  const categoryScope = `${parsed.namespace}:${parsed.category}`;
  if (categoryScope in SCOPE_SENSITIVITY) {
    return SCOPE_SENSITIVITY[categoryScope];
  }

  return 'standard';
}
