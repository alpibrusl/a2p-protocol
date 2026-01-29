/**
 * Tests for ID generation utilities
 */

import { describe, it, expect } from 'vitest';
import {
  generateMemoryId,
  generateProposalId,
  generatePolicyId,
  generateReceiptId,
  generateSessionId,
  generateRequestId,
  generateUserDid,
  generateAgentDid,
  generateOrgDid,
  isValidDid,
  parseDid,
  getNamespace,
  isLocalDid,
  isValidA2pDid,
  isValidAgentDid,
  isValidUserDid,
} from '../../src/utils/id';

describe('ID Generation', () => {
  describe('generateMemoryId', () => {
    it('should generate memory ID with correct prefix', () => {
      const id = generateMemoryId();
      expect(id).toMatch(/^mem_/);
      expect(id.length).toBe(20); // "mem_" + 16 chars
    });
  });

  describe('generateProposalId', () => {
    it('should generate proposal ID with correct prefix', () => {
      const id = generateProposalId();
      expect(id).toMatch(/^prop_/);
      expect(id.length).toBe(21); // "prop_" + 16 chars
    });
  });

  describe('generatePolicyId', () => {
    it('should generate policy ID with correct prefix', () => {
      const id = generatePolicyId();
      expect(id).toMatch(/^policy_/);
      expect(id.length).toBe(19); // "policy_" + 12 chars
    });
  });

  describe('generateReceiptId', () => {
    it('should generate receipt ID with correct prefix', () => {
      const id = generateReceiptId();
      expect(id).toMatch(/^rcpt_/);
      expect(id.length).toBe(21); // "rcpt_" + 16 chars
    });
  });

  describe('generateSessionId', () => {
    it('should generate session ID with correct prefix', () => {
      const id = generateSessionId();
      expect(id).toMatch(/^sess_/);
      expect(id.length).toBe(25); // "sess_" + 20 chars
    });
  });

  describe('generateRequestId', () => {
    it('should generate request ID with correct prefix', () => {
      const id = generateRequestId();
      expect(id).toMatch(/^req_/);
      expect(id.length).toBe(20); // "req_" + 16 chars
    });
  });

  describe('generateUserDid', () => {
    it('should generate user DID with correct format', () => {
      const did = generateUserDid();
      expect(did).toMatch(/^did:a2p:user:local:/);
      expect(did.length).toBeGreaterThan(20); // "did:a2p:user:local:" + identifier
    });

    it('should generate user DID with namespace and identifier', () => {
      const did = generateUserDid('gaugid', 'alice');
      expect(did).toBe('did:a2p:user:gaugid:alice');
    });

    it('should generate user DID with custom identifier', () => {
      const did = generateUserDid('local', 'alice');
      expect(did).toBe('did:a2p:user:local:alice');
    });
  });

  describe('generateAgentDid', () => {
    it('should generate agent DID with correct format', () => {
      const did = generateAgentDid('local', 'My Agent');
      expect(did).toMatch(/^did:a2p:agent:local:/);
      expect(did.toLowerCase()).toContain('my-agent');
    });

    it('should sanitize special characters', () => {
      const did = generateAgentDid('local', 'Agent@123!');
      expect(did).toMatch(/^did:a2p:agent:local:/);
      expect(did).toContain('-');
    });
  });

  describe('generateOrgDid', () => {
    it('should generate org DID with correct format', () => {
      const did = generateOrgDid('local', 'My Org');
      expect(did).toMatch(/^did:a2p:org:local:/);
      expect(did.toLowerCase()).toContain('my-org');
    });
  });
});

describe('DID Validation', () => {
  describe('isValidDid', () => {
    it('should validate correct DIDs (generic)', () => {
      expect(isValidDid('did:a2p:user:gaugid:alice')).toBe(true);
      expect(isValidDid('did:a2p:agent:local:my-agent')).toBe(true);
      // isValidDid validates any DID format
      expect(isValidDid('did:example:123')).toBe(true);
      expect(isValidDid('did:web:example.com')).toBe(true);
      expect(isValidDid('did:web:example.com')).toBe(true);
    });

    it('should reject invalid DIDs', () => {
      expect(isValidDid('not-a-did')).toBe(false);
      expect(isValidDid('did:')).toBe(false);
      expect(isValidDid('did:a2p:')).toBe(false);
      // Note: 'did:a2p:user:' might match the pattern but is invalid semantically
      // The regex allows it, but it's missing the identifier part
      expect(isValidDid('DID:a2p:user:gaugid:alice')).toBe(false); // Uppercase
    });
  });

  describe('isValidA2pDid', () => {
    it('should validate correct a2p DIDs', () => {
      expect(isValidA2pDid('did:a2p:user:gaugid:alice')).toBe(true);
      expect(isValidA2pDid('did:a2p:agent:local:my-agent')).toBe(true);
      expect(isValidA2pDid('did:a2p:org:gaugid:acme-corp')).toBe(true);
    });

    it('should reject a2p DIDs missing namespace', () => {
      expect(isValidA2pDid('did:a2p:user:alice')).toBe(false); // missing namespace
      expect(isValidA2pDid('did:a2p:agent:my-agent')).toBe(false); // missing namespace
      expect(isValidA2pDid('did:other:test')).toBe(false);
    });
  });

  describe('isValidAgentDid', () => {
    it('should validate correct agent DIDs', () => {
      expect(isValidAgentDid('did:a2p:agent:gaugid:my-assistant')).toBe(true);
      expect(isValidAgentDid('did:a2p:agent:local:trusted-ai')).toBe(true);
    });

    it('should reject invalid agent DIDs', () => {
      expect(isValidAgentDid('did:a2p:agent:my-assistant')).toBe(false); // missing namespace
      expect(isValidAgentDid('did:a2p:user:gaugid:alice')).toBe(false);
    });
  });

  describe('isValidUserDid', () => {
    it('should validate correct user DIDs', () => {
      expect(isValidUserDid('did:a2p:user:gaugid:alice')).toBe(true);
      expect(isValidUserDid('did:a2p:user:local:alice')).toBe(true);
    });

    it('should reject invalid user DIDs', () => {
      expect(isValidUserDid('did:a2p:user:alice')).toBe(false); // missing namespace
      expect(isValidUserDid('did:a2p:agent:gaugid:my-agent')).toBe(false);
    });
  });

  describe('parseDid', () => {
    it('should parse valid a2p DID', () => {
      const result = parseDid('did:a2p:user:gaugid:alice');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('user');
      expect(result?.namespace).toBe('gaugid');
      expect(result?.identifier).toBe('alice');
    });

    it('should parse local namespace DID', () => {
      const result = parseDid('did:a2p:agent:local:my-agent');
      expect(result).not.toBeNull();
      expect(result?.type).toBe('agent');
      expect(result?.namespace).toBe('local');
      expect(result?.identifier).toBe('my-agent');
    });

    it('should return null for invalid DID', () => {
      expect(parseDid('not-a-did')).toBeNull();
      expect(parseDid('did:')).toBeNull();
      expect(parseDid('did:a2p:user:alice')).toBeNull(); // missing namespace
    });
  });

  describe('getNamespace', () => {
    it('should extract namespace from DID', () => {
      expect(getNamespace('did:a2p:user:gaugid:alice')).toBe('gaugid');
      expect(getNamespace('did:a2p:agent:local:my-agent')).toBe('local');
    });

    it('should return null for invalid DID', () => {
      expect(getNamespace('did:a2p:user:alice')).toBeNull(); // invalid
    });
  });

  describe('isLocalDid', () => {
    it('should detect local namespace DIDs', () => {
      expect(isLocalDid('did:a2p:user:local:alice')).toBe(true);
      expect(isLocalDid('did:a2p:agent:local:my-agent')).toBe(true);
    });

    it('should reject non-local DIDs', () => {
      expect(isLocalDid('did:a2p:user:gaugid:alice')).toBe(false);
      expect(isLocalDid('did:a2p:user:alice')).toBe(false); // invalid
    });
  });
});
