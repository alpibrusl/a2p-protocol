/**
 * @a2p/conformance-tests - Conformance test suite for a2p protocol
 *
 * Provides tests to validate a2p implementations against the specification.
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Test result types
export interface TestResult {
  name: string;
  category: string;
  passed: boolean;
  message: string;
  duration: number;
  details?: Record<string, unknown>;
}

export interface TestSuiteResult {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  results: TestResult[];
  timestamp: string;
  version: string;
}

export interface TestContext {
  baseUrl: string;
  agentDid: string;
  userDid: string;
  authToken?: string;
  verbose?: boolean;
}

// Test categories
export type TestCategory =
  | 'schema'
  | 'authentication'
  | 'profiles'
  | 'memories'
  | 'proposals'
  | 'consent'
  | 'rate_limiting'
  | 'versioning';

// Test definition
export interface TestDefinition {
  name: string;
  category: TestCategory;
  description: string;
  required: boolean;
  run: (ctx: TestContext) => Promise<TestResult>;
}

// Schema validation
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

// Profile schema (simplified for testing)
const profileSchema = {
  type: 'object',
  required: ['id', 'profileType'],
  properties: {
    id: { type: 'string', pattern: '^did:' },
    profileType: { type: 'string', enum: ['human', 'agent', 'entity'] },
    version: { type: 'string' },
    created: { type: 'string', format: 'date-time' },
    updated: { type: 'string', format: 'date-time' },
    common: { type: 'object' },
    memories: { type: 'object' },
  },
};

const proposalSchema = {
  type: 'object',
  required: ['id', 'userDid', 'agentDid', 'content', 'category', 'status'],
  properties: {
    id: { type: 'string', pattern: '^prop_' },
    userDid: { type: 'string', pattern: '^did:' },
    agentDid: { type: 'string', pattern: '^did:' },
    content: { type: 'string' },
    category: { type: 'string', pattern: '^(a2p|ext):' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'expired'] },
    proposedAt: { type: 'string', format: 'date-time' },
  },
};

const consentReceiptSchema = {
  type: 'object',
  required: ['receiptId', 'userDid', 'agentDid', 'grantedScopes', 'grantedAt'],
  properties: {
    receiptId: { type: 'string', pattern: '^rcpt_' },
    userDid: { type: 'string', pattern: '^did:' },
    agentDid: { type: 'string', pattern: '^did:' },
    grantedScopes: { type: 'array', items: { type: 'string' } },
    deniedScopes: { type: 'array', items: { type: 'string' } },
    grantedAt: { type: 'string', format: 'date-time' },
    expiresAt: { type: 'string', format: 'date-time' },
  },
};

// Register schemas
ajv.addSchema(profileSchema, 'profile');
ajv.addSchema(proposalSchema, 'proposal');
ajv.addSchema(consentReceiptSchema, 'consent-receipt');

// Helper functions
async function fetchWithAuth(
  ctx: TestContext,
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${ctx.baseUrl}${path}`;
  const headers = new Headers(options.headers);

  headers.set('Content-Type', 'application/json');
  headers.set('A2P-Version', '1.0');

  if (ctx.authToken) {
    headers.set('Authorization', ctx.authToken);
  } else {
    // Generate simplified auth header
    const ts = new Date().toISOString();
    const nonce = Math.random().toString(36).substring(2);
    headers.set(
      'Authorization',
      `A2P-Signature did="${ctx.agentDid}",sig="test",ts="${ts}",nonce="${nonce}"`
    );
  }

  return fetch(url, { ...options, headers });
}

function createResult(
  name: string,
  category: TestCategory,
  passed: boolean,
  message: string,
  duration: number,
  details?: Record<string, unknown>
): TestResult {
  return { name, category, passed, message, duration, details };
}

// Test definitions
const tests: TestDefinition[] = [
  // Schema validation tests
  {
    name: 'Profile schema validation',
    category: 'schema',
    description: 'Validates that returned profiles match the expected schema',
    required: true,
    run: async (ctx) => {
      const start = Date.now();
      try {
        const res = await fetchWithAuth(ctx, `/a2p/v1/profile/${ctx.userDid}`);
        const data = await res.json();

        if (!res.ok) {
          return createResult(
            'Profile schema validation',
            'schema',
            false,
            `Failed to fetch profile: ${data.error?.message || res.statusText}`,
            Date.now() - start
          );
        }

        const validate = ajv.getSchema('profile');
        const valid = validate!(data.data);

        return createResult(
          'Profile schema validation',
          'schema',
          valid as boolean,
          valid ? 'Profile matches schema' : `Schema validation failed: ${ajv.errorsText(validate!.errors)}`,
          Date.now() - start,
          { errors: validate!.errors }
        );
      } catch (error) {
        return createResult(
          'Profile schema validation',
          'schema',
          false,
          `Error: ${(error as Error).message}`,
          Date.now() - start
        );
      }
    },
  },

  // Authentication tests
  {
    name: 'Authentication required',
    category: 'authentication',
    description: 'Verifies that unauthenticated requests are rejected',
    required: true,
    run: async (ctx) => {
      const start = Date.now();
      try {
        const res = await fetch(`${ctx.baseUrl}/a2p/v1/profile/${ctx.userDid}`);

        return createResult(
          'Authentication required',
          'authentication',
          res.status === 401,
          res.status === 401
            ? 'Unauthenticated requests correctly rejected'
            : `Expected 401, got ${res.status}`,
          Date.now() - start
        );
      } catch (error) {
        return createResult(
          'Authentication required',
          'authentication',
          false,
          `Error: ${(error as Error).message}`,
          Date.now() - start
        );
      }
    },
  },

  {
    name: 'Invalid timestamp rejected',
    category: 'authentication',
    description: 'Verifies that requests with old timestamps are rejected',
    required: true,
    run: async (ctx) => {
      const start = Date.now();
      try {
        const oldTs = new Date(Date.now() - 10 * 60 * 1000).toISOString();
        const nonce = Math.random().toString(36).substring(2);

        const res = await fetch(`${ctx.baseUrl}/a2p/v1/profile/${ctx.userDid}`, {
          headers: {
            'Content-Type': 'application/json',
            'A2P-Version': '1.0',
            Authorization: `A2P-Signature did="${ctx.agentDid}",sig="test",ts="${oldTs}",nonce="${nonce}"`,
          },
        });

        return createResult(
          'Invalid timestamp rejected',
          'authentication',
          res.status === 401,
          res.status === 401
            ? 'Old timestamps correctly rejected'
            : `Expected 401, got ${res.status}`,
          Date.now() - start
        );
      } catch (error) {
        return createResult(
          'Invalid timestamp rejected',
          'authentication',
          false,
          `Error: ${(error as Error).message}`,
          Date.now() - start
        );
      }
    },
  },

  // Profile tests
  {
    name: 'Get profile',
    category: 'profiles',
    description: 'Verifies profile retrieval endpoint',
    required: true,
    run: async (ctx) => {
      const start = Date.now();
      try {
        const res = await fetchWithAuth(ctx, `/a2p/v1/profile/${ctx.userDid}`);
        const data = await res.json();

        return createResult(
          'Get profile',
          'profiles',
          res.ok && data.success,
          res.ok ? 'Profile retrieved successfully' : `Failed: ${data.error?.message}`,
          Date.now() - start,
          { status: res.status }
        );
      } catch (error) {
        return createResult(
          'Get profile',
          'profiles',
          false,
          `Error: ${(error as Error).message}`,
          Date.now() - start
        );
      }
    },
  },

  {
    name: 'Profile not found returns 404',
    category: 'profiles',
    description: 'Verifies 404 for non-existent profiles',
    required: true,
    run: async (ctx) => {
      const start = Date.now();
      try {
        const res = await fetchWithAuth(ctx, '/a2p/v1/profile/did:a2p:user:nonexistent');

        return createResult(
          'Profile not found returns 404',
          'profiles',
          res.status === 404,
          res.status === 404
            ? 'Non-existent profile returns 404'
            : `Expected 404, got ${res.status}`,
          Date.now() - start
        );
      } catch (error) {
        return createResult(
          'Profile not found returns 404',
          'profiles',
          false,
          `Error: ${(error as Error).message}`,
          Date.now() - start
        );
      }
    },
  },

  // Proposal tests
  {
    name: 'Submit proposal',
    category: 'proposals',
    description: 'Verifies proposal submission endpoint',
    required: true,
    run: async (ctx) => {
      const start = Date.now();
      try {
        const res = await fetchWithAuth(ctx, `/a2p/v1/profile/${ctx.userDid}/memories/propose`, {
          method: 'POST',
          body: JSON.stringify({
            content: 'Test proposal from conformance suite',
            category: 'a2p:test.conformance',
            confidence: 0.9,
          }),
        });
        const data = await res.json();

        return createResult(
          'Submit proposal',
          'proposals',
          res.status === 201 && data.data?.proposalId,
          res.status === 201
            ? `Proposal submitted: ${data.data?.proposalId}`
            : `Failed: ${data.error?.message}`,
          Date.now() - start,
          { proposalId: data.data?.proposalId }
        );
      } catch (error) {
        return createResult(
          'Submit proposal',
          'proposals',
          false,
          `Error: ${(error as Error).message}`,
          Date.now() - start
        );
      }
    },
  },

  {
    name: 'Invalid proposal rejected',
    category: 'proposals',
    description: 'Verifies invalid proposals are rejected',
    required: true,
    run: async (ctx) => {
      const start = Date.now();
      try {
        const res = await fetchWithAuth(ctx, `/a2p/v1/profile/${ctx.userDid}/memories/propose`, {
          method: 'POST',
          body: JSON.stringify({
            content: '', // Invalid: empty content
            category: 'invalid-category', // Invalid: wrong format
          }),
        });

        return createResult(
          'Invalid proposal rejected',
          'proposals',
          res.status === 400,
          res.status === 400
            ? 'Invalid proposals correctly rejected'
            : `Expected 400, got ${res.status}`,
          Date.now() - start
        );
      } catch (error) {
        return createResult(
          'Invalid proposal rejected',
          'proposals',
          false,
          `Error: ${(error as Error).message}`,
          Date.now() - start
        );
      }
    },
  },

  // Consent tests
  {
    name: 'Request access',
    category: 'consent',
    description: 'Verifies access request endpoint',
    required: true,
    run: async (ctx) => {
      const start = Date.now();
      try {
        const res = await fetchWithAuth(ctx, `/a2p/v1/profile/${ctx.userDid}/access`, {
          method: 'POST',
          body: JSON.stringify({
            scopes: ['a2p:preferences', 'a2p:interests'],
            purpose: {
              type: 'personalization',
              description: 'Conformance test access request',
              legalBasis: 'consent',
            },
          }),
        });
        const data = await res.json();

        const validate = ajv.getSchema('consent-receipt');
        const valid = res.ok && validate!(data.data);

        return createResult(
          'Request access',
          'consent',
          valid as boolean,
          valid
            ? `Consent receipt: ${data.data?.receiptId}`
            : `Failed: ${data.error?.message || 'Schema validation failed'}`,
          Date.now() - start,
          { receiptId: data.data?.receiptId }
        );
      } catch (error) {
        return createResult(
          'Request access',
          'consent',
          false,
          `Error: ${(error as Error).message}`,
          Date.now() - start
        );
      }
    },
  },

  // Rate limiting tests
  {
    name: 'Rate limit headers present',
    category: 'rate_limiting',
    description: 'Verifies rate limit headers are included',
    required: true,
    run: async (ctx) => {
      const start = Date.now();
      try {
        const res = await fetchWithAuth(ctx, `/a2p/v1/profile/${ctx.userDid}`);

        const hasHeaders =
          res.headers.has('X-RateLimit-Limit') &&
          res.headers.has('X-RateLimit-Remaining');

        return createResult(
          'Rate limit headers present',
          'rate_limiting',
          hasHeaders,
          hasHeaders
            ? `Limit: ${res.headers.get('X-RateLimit-Limit')}, Remaining: ${res.headers.get('X-RateLimit-Remaining')}`
            : 'Missing rate limit headers',
          Date.now() - start
        );
      } catch (error) {
        return createResult(
          'Rate limit headers present',
          'rate_limiting',
          false,
          `Error: ${(error as Error).message}`,
          Date.now() - start
        );
      }
    },
  },

  // Versioning tests
  {
    name: 'Version header present',
    category: 'versioning',
    description: 'Verifies A2P-Version header in responses',
    required: true,
    run: async (ctx) => {
      const start = Date.now();
      try {
        const res = await fetchWithAuth(ctx, `/a2p/v1/profile/${ctx.userDid}`);

        const version = res.headers.get('A2P-Version');
        const hasVersion = version !== null;

        return createResult(
          'Version header present',
          'versioning',
          hasVersion,
          hasVersion
            ? `Version: ${version}`
            : 'Missing A2P-Version header',
          Date.now() - start
        );
      } catch (error) {
        return createResult(
          'Version header present',
          'versioning',
          false,
          `Error: ${(error as Error).message}`,
          Date.now() - start
        );
      }
    },
  },
];

/**
 * Run all conformance tests
 */
export async function runConformanceTests(ctx: TestContext): Promise<TestSuiteResult> {
  const results: TestResult[] = [];
  const startTime = Date.now();

  for (const test of tests) {
    if (ctx.verbose) {
      console.log(`Running: ${test.name}...`);
    }
    const result = await test.run(ctx);
    results.push(result);
    if (ctx.verbose) {
      console.log(`  ${result.passed ? '✓' : '✗'} ${result.message}`);
    }
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    totalTests: tests.length,
    passed,
    failed,
    skipped: 0,
    duration: Date.now() - startTime,
    results,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
}

/**
 * Run tests for a specific category
 */
export async function runCategoryTests(
  ctx: TestContext,
  category: TestCategory
): Promise<TestSuiteResult> {
  const categoryTests = tests.filter((t) => t.category === category);
  const results: TestResult[] = [];
  const startTime = Date.now();

  for (const test of categoryTests) {
    const result = await test.run(ctx);
    results.push(result);
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    totalTests: categoryTests.length,
    passed,
    failed,
    skipped: 0,
    duration: Date.now() - startTime,
    results,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
}

/**
 * Get list of all test definitions
 */
export function getTestDefinitions(): TestDefinition[] {
  return tests;
}

/**
 * Get test categories
 */
export function getCategories(): TestCategory[] {
  return ['schema', 'authentication', 'profiles', 'memories', 'proposals', 'consent', 'rate_limiting', 'versioning'];
}

export { ajv, profileSchema, proposalSchema, consentReceiptSchema };
