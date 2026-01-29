/**
 * @a2p/gateway - Reference a2p gateway server implementation
 *
 * This package provides a reference implementation of an a2p gateway server
 * that can be used for development, testing, or as a starting point for
 * production deployments.
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { z } from 'zod';
import type { Context } from 'hono';

// DID validation pattern (requires namespace)
const A2P_DID_PATTERN = /^did:a2p:(user|agent|org|entity|service):[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/;

function isValidA2pDid(did: string): boolean {
  return A2P_DID_PATTERN.test(did);
}

// DID validation middleware
function didValidationMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    const did = c.req.param('did');
    if (did && !isValidA2pDid(did)) {
      return c.json(
        {
          error: {
            code: 'A2P010',
            message: 'Invalid DID format (namespace required)',
          },
        },
        400
      );
    }
    await next();
  };
}

// Types
export interface GatewayConfig {
  port?: number;
  host?: string;
  corsOrigins?: string[];
  rateLimit?: {
    requestsPerMinute: number;
    burstSize: number;
  };
  storage?: StorageAdapter;
}

export interface StorageAdapter {
  getProfile(did: string): Promise<Profile | null>;
  saveProfile(did: string, profile: Profile): Promise<void>;
  deleteProfile(did: string): Promise<void>;
  getProposals(userDid: string): Promise<Proposal[]>;
  saveProposal(proposal: Proposal): Promise<void>;
  updateProposalStatus(id: string, status: string): Promise<void>;
}

export interface Profile {
  id: string;
  profileType: string;
  version: string;
  common?: Record<string, unknown>;
  memories?: Record<string, unknown>;
  policies?: unknown[];
  created?: string;
  updated?: string;
}

export interface Proposal {
  id: string;
  userDid: string;
  agentDid: string;
  content: string;
  category: string;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  proposedAt: string;
  expiresAt?: string;
}

// Validation schemas
const proposalSchema = z.object({
  content: z.string().min(1).max(10000),
  category: z.string().regex(/^(a2p|ext):[a-zA-Z0-9_.]+$/),
  confidence: z.number().min(0).max(1).optional().default(0.8),
  context: z.string().max(500).optional(),
});

const accessRequestSchema = z.object({
  scopes: z.array(z.string()).min(1),
  purpose: z.object({
    type: z.enum([
      'personalization',
      'context_enrichment',
      'recommendation',
      'analysis',
      'communication',
      'service_delivery',
      'research',
      'legal_compliance',
      'other',
    ]),
    description: z.string().max(500),
    legalBasis: z.enum([
      'consent',
      'contract',
      'legal_obligation',
      'vital_interests',
      'public_task',
      'legitimate_interests',
    ]),
  }),
});

const proposalReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  editedContent: z.string().optional(),
  reason: z.string().optional(),
});

// In-memory storage adapter (for development/testing)
export class MemoryStorageAdapter implements StorageAdapter {
  private profiles = new Map<string, Profile>();
  private proposals = new Map<string, Proposal>();

  async getProfile(did: string): Promise<Profile | null> {
    return this.profiles.get(did) || null;
  }

  async saveProfile(did: string, profile: Profile): Promise<void> {
    this.profiles.set(did, { ...profile, updated: new Date().toISOString() });
  }

  async deleteProfile(did: string): Promise<void> {
    this.profiles.delete(did);
  }

  async getProposals(userDid: string): Promise<Proposal[]> {
    return Array.from(this.proposals.values()).filter(
      (p) => p.userDid === userDid
    );
  }

  async saveProposal(proposal: Proposal): Promise<void> {
    this.proposals.set(proposal.id, proposal);
  }

  async updateProposalStatus(id: string, status: string): Promise<void> {
    const proposal = this.proposals.get(id);
    if (proposal) {
      proposal.status = status as Proposal['status'];
    }
  }
}

// Rate limiting middleware
function createRateLimiter(config: { requestsPerMinute: number; burstSize: number }) {
  const buckets = new Map<string, { tokens: number; lastRefill: number }>();
  const refillRate = config.requestsPerMinute / 60;

  return async (c: Context, next: () => Promise<void>) => {
    const key = c.req.header('X-Agent-DID') || c.req.header('X-Forwarded-For') || 'anonymous';
    const now = Date.now();

    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { tokens: config.burstSize, lastRefill: now };
      buckets.set(key, bucket);
    }

    // Refill tokens
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(config.burstSize, bucket.tokens + elapsed * refillRate);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      const retryAfter = Math.ceil((1 - bucket.tokens) / refillRate);
      c.header('Retry-After', retryAfter.toString());
      c.header('X-RateLimit-Limit', config.requestsPerMinute.toString());
      c.header('X-RateLimit-Remaining', '0');
      return c.json(
        {
          error: {
            code: 'A2P005',
            message: 'Rate limit exceeded',
            retryAfter,
          },
        },
        429
      );
    }

    bucket.tokens -= 1;
    c.header('X-RateLimit-Limit', config.requestsPerMinute.toString());
    c.header('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());

    await next();
  };
}

// Authentication middleware (simplified for reference)
function authMiddleware() {
  return async (c: Context, next: () => Promise<void>) => {
    const authHeader = c.req.header('Authorization');

    if (!authHeader?.startsWith('A2P-Signature ')) {
      return c.json(
        {
          error: {
            code: 'A2P001',
            message: 'Missing or invalid authentication',
          },
        },
        401
      );
    }

    // Parse auth header (simplified - production would verify signature)
    const params = new Map<string, string>();
    const paramStr = authHeader.slice('A2P-Signature '.length);
    for (const part of paramStr.split(',')) {
      const [key, value] = part.split('=').map((s) => s.trim());
      params.set(key, value.replace(/"/g, ''));
    }

    const did = params.get('did');
    const ts = params.get('ts');
    const nonce = params.get('nonce');

    if (!did || !ts) {
      return c.json(
        {
          error: {
            code: 'A2P001',
            message: 'Invalid authentication header format',
          },
        },
        401
      );
    }

    // Check timestamp (within 5 minutes)
    const timestamp = new Date(ts).getTime();
    if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
      return c.json(
        {
          error: {
            code: 'A2P007',
            message: 'Request timestamp out of acceptable range',
          },
        },
        401
      );
    }

    // Store auth info in context
    c.set('agentDid', did);
    c.set('nonce', nonce);

    await next();
  };
}

// Generate unique ID
function generateId(prefix: string): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = prefix + '_';
  for (let i = 0; i < 16; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Create an a2p gateway server
 */
export function createGateway(config: GatewayConfig = {}): Hono {
  const app = new Hono();
  const storage = config.storage || new MemoryStorageAdapter();
  const rateConfig = config.rateLimit || { requestsPerMinute: 60, burstSize: 10 };

  // Middleware
  app.use('*', logger());
  app.use('*', secureHeaders());
  app.use(
    '*',
    cors({
      origin: config.corsOrigins || '*',
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'A2P-Version'],
    })
  );
  app.use('/a2p/v1/*', createRateLimiter(rateConfig));

  // Health check
  app.get('/health', (c) => {
    return c.json({ status: 'ok', version: '1.0.0' });
  });

  // API version header
  app.use('/a2p/v1/*', async (c, next) => {
    c.header('A2P-Version', '1.0');
    c.header('A2P-Version-Supported', '1.0');
    await next();
  });

  // Get profile
  app.get('/a2p/v1/profile/:did', didValidationMiddleware(), authMiddleware(), async (c) => {
    const { did } = c.req.param();
    const agentDid = c.get('agentDid');

    const profile = await storage.getProfile(did);
    if (!profile) {
      return c.json(
        {
          error: {
            code: 'A2P003',
            message: 'Profile not found',
          },
        },
        404
      );
    }

    // TODO: Apply consent policies to filter profile data
    // For now, return filtered view
    const filteredProfile = {
      id: profile.id,
      profileType: profile.profileType,
      version: profile.version,
      common: profile.common,
      // Memories would be filtered based on agent permissions
    };

    return c.json({
      success: true,
      data: filteredProfile,
      meta: {
        requestId: generateId('req'),
        timestamp: new Date().toISOString(),
        agentDid,
      },
    });
  });

  // Request access to profile
  app.post('/a2p/v1/profile/:did/access', didValidationMiddleware(), authMiddleware(), async (c) => {
    const { did } = c.req.param();
    const agentDid = c.get('agentDid');

    try {
      const body = await c.req.json();
      const parsed = accessRequestSchema.parse(body);

      const profile = await storage.getProfile(did);
      if (!profile) {
        return c.json(
          {
            error: {
              code: 'A2P003',
              message: 'Profile not found',
            },
          },
          404
        );
      }

      // TODO: Check against consent policies
      // For now, grant access to requested scopes
      const consentReceipt = {
        receiptId: generateId('rcpt'),
        userDid: did,
        agentDid,
        grantedScopes: parsed.scopes,
        deniedScopes: [],
        purpose: parsed.purpose,
        grantedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      return c.json({
        success: true,
        data: consentReceipt,
        meta: {
          requestId: generateId('req'),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: {
              code: 'A2P006',
              message: 'Invalid request format',
              details: error.errors,
            },
          },
          400
        );
      }
      throw error;
    }
  });

  // List memories
  app.get('/a2p/v1/profile/:did/memories', didValidationMiddleware(), authMiddleware(), async (c) => {
    const { did } = c.req.param();
    const category = c.req.query('category');

    const profile = await storage.getProfile(did);
    if (!profile) {
      return c.json(
        {
          error: {
            code: 'A2P003',
            message: 'Profile not found',
          },
        },
        404
      );
    }

    let memories = profile.memories || {};
    if (category) {
      memories = { [category]: memories[category] };
    }

    return c.json({
      success: true,
      data: memories,
      meta: {
        requestId: generateId('req'),
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Propose memory
  app.post('/a2p/v1/profile/:did/memories/propose', didValidationMiddleware(), authMiddleware(), async (c) => {
    const { did } = c.req.param();
    const agentDid = c.get('agentDid');

    try {
      const body = await c.req.json();
      const parsed = proposalSchema.parse(body);

      const profile = await storage.getProfile(did);
      if (!profile) {
        return c.json(
          {
            error: {
              code: 'A2P003',
              message: 'Profile not found',
            },
          },
          404
        );
      }

      const proposal: Proposal = {
        id: generateId('prop'),
        userDid: did,
        agentDid,
        content: parsed.content,
        category: parsed.category,
        confidence: parsed.confidence,
        status: 'pending',
        proposedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      await storage.saveProposal(proposal);

      return c.json(
        {
          success: true,
          data: {
            proposalId: proposal.id,
            status: proposal.status,
            expiresAt: proposal.expiresAt,
          },
          meta: {
            requestId: generateId('req'),
            timestamp: new Date().toISOString(),
          },
        },
        201
      );
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: {
              code: 'A2P006',
              message: 'Invalid proposal format',
              details: error.errors,
            },
          },
          400
        );
      }
      throw error;
    }
  });

  // List proposals (for user)
  app.get('/a2p/v1/profile/:did/proposals', didValidationMiddleware(), authMiddleware(), async (c) => {
    const { did } = c.req.param();
    const status = c.req.query('status');

    let proposals = await storage.getProposals(did);

    if (status) {
      proposals = proposals.filter((p) => p.status === status);
    }

    return c.json({
      success: true,
      data: proposals,
      meta: {
        requestId: generateId('req'),
        timestamp: new Date().toISOString(),
        count: proposals.length,
      },
    });
  });

  // Review proposal
  app.post('/a2p/v1/profile/:did/proposals/:proposalId/review', didValidationMiddleware(), authMiddleware(), async (c) => {
    const { did, proposalId } = c.req.param();

    try {
      const body = await c.req.json();
      const parsed = proposalReviewSchema.parse(body);

      const proposals = await storage.getProposals(did);
      const proposal = proposals.find((p) => p.id === proposalId);

      if (!proposal) {
        return c.json(
          {
            error: {
              code: 'A2P003',
              message: 'Proposal not found',
            },
          },
          404
        );
      }

      if (proposal.status !== 'pending') {
        return c.json(
          {
            error: {
              code: 'A2P006',
              message: 'Proposal already reviewed',
            },
          },
          400
        );
      }

      if (parsed.action === 'approve') {
        // Add memory to profile
        const profile = await storage.getProfile(did);
        if (profile) {
          profile.memories = profile.memories || {};
          const category = proposal.category;

          if (!profile.memories[category]) {
            profile.memories[category] = [];
          }

          if (Array.isArray(profile.memories[category])) {
            (profile.memories[category] as unknown[]).push({
              id: generateId('mem'),
              content: parsed.editedContent || proposal.content,
              source: { type: 'proposal', agentDid: proposal.agentDid },
              createdAt: new Date().toISOString(),
              confidence: proposal.confidence,
            });
          }

          await storage.saveProfile(did, profile);
        }
      }

      await storage.updateProposalStatus(proposalId, parsed.action === 'approve' ? 'approved' : 'rejected');

      return c.json({
        success: true,
        data: {
          proposalId,
          status: parsed.action === 'approve' ? 'approved' : 'rejected',
        },
        meta: {
          requestId: generateId('req'),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json(
          {
            error: {
              code: 'A2P006',
              message: 'Invalid review format',
              details: error.errors,
            },
          },
          400
        );
      }
      throw error;
    }
  });

  // Get agent profile
  app.get('/a2p/v1/agents/:did', didValidationMiddleware(), async (c) => {
    const { did } = c.req.param();

    // TODO: Fetch from agent registry
    return c.json({
      success: true,
      data: {
        id: did,
        profileType: 'agent',
        message: 'Agent profiles would be fetched from registry',
      },
      meta: {
        requestId: generateId('req'),
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Error handler
  app.onError((err, c) => {
    console.error('Gateway error:', err);
    return c.json(
      {
        error: {
          code: 'A2P500',
          message: 'Internal server error',
        },
      },
      500
    );
  });

  // 404 handler
  app.notFound((c) => {
    return c.json(
      {
        error: {
          code: 'A2P003',
          message: 'Endpoint not found',
        },
      },
      404
    );
  });

  return app;
}

export { MemoryStorageAdapter };
export type { GatewayConfig, StorageAdapter, Profile, Proposal };
