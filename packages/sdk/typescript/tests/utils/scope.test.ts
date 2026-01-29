/**
 * Tests for scope utilities
 */

import { describe, it, expect } from 'vitest';
import {
  scopeMatches,
  anyScopeMatches,
  filterScopes,
  parseScope,
  buildScope,
  getParentScopes,
  getScopeSensitivity,
  SCOPE_SENSITIVITY,
} from '../../src/utils/scope';

describe('Scope Matching', () => {
  describe('scopeMatches', () => {
    it('should match exact scopes', () => {
      expect(scopeMatches('a2p:preferences', 'a2p:preferences')).toBe(true);
      expect(scopeMatches('a2p:professional', 'a2p:professional')).toBe(true);
      expect(scopeMatches('a2p:preferences', 'a2p:professional')).toBe(false);
    });

    it('should match wildcard suffix patterns', () => {
      expect(scopeMatches('a2p:preferences.communication', 'a2p:preferences.*')).toBe(true);
      expect(scopeMatches('a2p:preferences.ui', 'a2p:preferences.*')).toBe(true);
      expect(scopeMatches('a2p:professional', 'a2p:preferences.*')).toBe(false);
    });

    it('should match namespace wildcard', () => {
      expect(scopeMatches('a2p:preferences', 'a2p:*')).toBe(true);
      expect(scopeMatches('a2p:professional.skills', 'a2p:*')).toBe(true);
      expect(scopeMatches('ext:custom', 'a2p:*')).toBe(false);
    });
  });

  describe('anyScopeMatches', () => {
    it('should check if any scope matches', () => {
      const scopes = ['a2p:preferences', 'a2p:professional', 'a2p:interests'];
      expect(anyScopeMatches(scopes, 'a2p:preferences.*')).toBe(true);
      expect(anyScopeMatches(scopes, 'a2p:*')).toBe(true);
      expect(anyScopeMatches(scopes, 'a2p:health')).toBe(false);
    });
  });
});

describe('Scope Filtering', () => {
  describe('filterScopes', () => {
    it('should filter scopes with allow patterns', () => {
      const requested = ['a2p:preferences', 'a2p:professional', 'a2p:health'];
      const allowed = ['a2p:preferences.*', 'a2p:professional'];
      const result = filterScopes(requested, allowed);

      expect(result).toContain('a2p:preferences');
      expect(result).toContain('a2p:professional');
      expect(result).not.toContain('a2p:health');
    });

    it('should filter scopes with deny patterns', () => {
      const requested = ['a2p:preferences', 'a2p:health', 'a2p:financial'];
      const allowed = ['a2p:*'];
      const denied = ['a2p:health', 'a2p:financial'];
      const result = filterScopes(requested, allowed, denied);

      expect(result).toContain('a2p:preferences');
      expect(result).not.toContain('a2p:health');
      expect(result).not.toContain('a2p:financial');
    });

    it('should filter with wildcard', () => {
      const requested = ['a2p:preferences', 'a2p:professional', 'a2p:interests'];
      const allowed = ['a2p:*'];
      const result = filterScopes(requested, allowed);

      expect(result.length).toBe(3);
    });
  });
});

describe('Scope Parsing', () => {
  describe('parseScope', () => {
    it('should parse simple scope', () => {
      const result = parseScope('a2p:preferences');
      expect(result).not.toBeNull();
      expect(result?.namespace).toBe('a2p');
      expect(result?.category).toBe('preferences');
      expect(result?.path).toEqual([]);
    });

    it('should parse nested scope', () => {
      const result = parseScope('a2p:preferences.communication.style');
      expect(result).not.toBeNull();
      expect(result?.namespace).toBe('a2p');
      expect(result?.category).toBe('preferences');
      expect(result?.path).toEqual(['communication', 'style']);
    });

    it('should return null for invalid scope', () => {
      expect(parseScope('invalid')).toBeNull();
      expect(parseScope('a2p')).toBeNull();
    });
  });

  describe('buildScope', () => {
    it('should build simple scope', () => {
      const scope = buildScope('a2p', 'preferences');
      expect(scope).toBe('a2p:preferences');
    });

    it('should build scope with path', () => {
      const scope = buildScope('a2p', 'preferences', ['communication', 'style']);
      expect(scope).toBe('a2p:preferences.communication.style');
    });
  });

  describe('getParentScopes', () => {
    it('should get parent scopes', () => {
      const parents = getParentScopes('a2p:preferences.communication.style');
      expect(parents).toContain('a2p:preferences.communication');
      expect(parents).toContain('a2p:preferences');
      expect(parents).toContain('a2p:*');
    });
  });
});

describe('Scope Sensitivity', () => {
  describe('getScopeSensitivity', () => {
    it('should get sensitivity for exact scope', () => {
      expect(getScopeSensitivity('a2p:preferences')).toBe('public');
      expect(getScopeSensitivity('a2p:health')).toBe('sensitive');
      expect(getScopeSensitivity('a2p:financial')).toBe('restricted');
    });

    it('should get sensitivity for nested scope', () => {
      // Should inherit from parent
      expect(getScopeSensitivity('a2p:preferences.communication')).toBe('public');
      expect(getScopeSensitivity('a2p:health.conditions')).toBe('sensitive');
    });

    it('should return default for unknown scope', () => {
      expect(getScopeSensitivity('a2p:unknown')).toBe('standard');
      expect(getScopeSensitivity('ext:custom')).toBe('standard');
    });
  });
});
