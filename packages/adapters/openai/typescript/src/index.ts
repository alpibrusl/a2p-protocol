/**
 * @a2p/openai - OpenAI Assistants API adapter for the a2p protocol
 *
 * This adapter provides integration between OpenAI Assistants API and a2p,
 * enabling OpenAI assistants to use a2p profiles for personalization.
 */

import {
  A2PClient,
  createAgentClient,
  type DID,
  type Profile,
  type Memory,
  type Storage,
} from '@a2p/sdk';

/**
 * Configuration for the A2P OpenAI adapter
 */
export interface A2POpenAIConfig {
  /** Agent DID for authentication */
  agentDid: DID;
  /** a2p storage implementation */
  storage: Storage;
  /** Scopes to request from user profile */
  scopes?: string[];
  /** Whether to propose learned information as memories */
  proposeMemories?: boolean;
  /** Minimum confidence to propose a memory */
  minProposalConfidence?: number;
}

/**
 * A2P context for OpenAI Assistants
 */
export interface A2PAssistantContext {
  /** System instructions with a2p context */
  instructions: string;
  /** Additional context as metadata */
  metadata: Record<string, string>;
  /** User profile data */
  profile: Profile;
}

/**
 * A2P OpenAI Assistant Adapter
 *
 * Provides methods to integrate a2p profiles with OpenAI Assistants API.
 *
 * @example
 * ```typescript
 * import { A2POpenAIAdapter } from '@a2p/openai';
 * import OpenAI from 'openai';
 *
 * const openai = new OpenAI();
 * const adapter = new A2POpenAIAdapter({
 *   agentDid: 'did:a2p:agent:my-openai-assistant',
 *   storage: new MemoryStorage(),
 * });
 *
 * // Get context for a user
 * const context = await adapter.getContext('did:a2p:user:alice');
 *
 * // Create assistant with a2p context
 * const assistant = await openai.beta.assistants.create({
 *   name: 'Personalized Assistant',
 *   instructions: context.instructions,
 *   model: 'gpt-4-turbo-preview',
 *   metadata: context.metadata,
 * });
 * ```
 */
export class A2POpenAIAdapter {
  private client: A2PClient;
  private config: Required<A2POpenAIConfig>;
  private profileCache: Map<string, { profile: Profile; cachedAt: number }> = new Map();
  private cacheTTL = 5 * 60 * 1000; // 5 minutes

  constructor(config: A2POpenAIConfig) {
    this.config = {
      scopes: ['a2p:preferences', 'a2p:interests', 'a2p:professional', 'a2p:context'],
      proposeMemories: true,
      minProposalConfidence: 0.8,
      ...config,
    };

    this.client = createAgentClient(
      { agentDid: this.config.agentDid },
      this.config.storage
    );
  }

  /**
   * Get a2p context for an OpenAI assistant
   */
  async getContext(userDid: DID): Promise<A2PAssistantContext> {
    const profile = await this.getProfile(userDid);
    const instructions = this.buildInstructions(profile);
    const metadata = this.buildMetadata(profile);

    return {
      instructions,
      metadata,
      profile,
    };
  }

  /**
   * Get user profile (with caching)
   */
  async getProfile(userDid: DID): Promise<Profile> {
    const cached = this.profileCache.get(userDid);
    if (cached && Date.now() - cached.cachedAt < this.cacheTTL) {
      return cached.profile;
    }

    const profile = await this.client.getProfile({
      userDid,
      scopes: this.config.scopes,
    });

    this.profileCache.set(userDid, { profile, cachedAt: Date.now() });
    return profile;
  }

  /**
   * Build system instructions from profile
   */
  private buildInstructions(profile: Profile): string {
    const parts: string[] = [
      'You are a helpful AI assistant.',
      '',
      '## User Profile',
      '',
    ];

    // Preferences
    if (profile.common?.preferences) {
      const prefs = profile.common.preferences;
      parts.push('### Communication Preferences');

      if (prefs.language) {
        parts.push(`- Preferred language: ${prefs.language}`);
      }
      if (prefs.communication) {
        if (prefs.communication.style) {
          parts.push(`- Response style: ${prefs.communication.style}`);
        }
        if (prefs.communication.formality) {
          parts.push(`- Formality level: ${prefs.communication.formality}`);
        }
        if (prefs.communication.humor !== undefined) {
          parts.push(`- Humor: ${prefs.communication.humor ? 'appreciated' : 'minimal'}`);
        }
      }
      parts.push('');
    }

    // Professional context
    const professional = profile.memories?.['a2p:professional'];
    if (professional) {
      parts.push('### Professional Background');
      if (professional.occupation) {
        parts.push(`- Occupation: ${professional.occupation}`);
      }
      if (professional.title) {
        parts.push(`- Title: ${professional.title}`);
      }
      if (professional.skills && Array.isArray(professional.skills)) {
        parts.push(`- Skills: ${professional.skills.join(', ')}`);
      }
      if (professional.experience) {
        const exp = professional.experience as { level?: string };
        if (exp.level) {
          parts.push(`- Experience level: ${exp.level}`);
        }
      }
      parts.push('');
    }

    // Interests
    const interests = profile.memories?.['a2p:interests'];
    if (interests) {
      parts.push('### Interests');
      if (interests.topics && Array.isArray(interests.topics)) {
        parts.push(`- Topics: ${interests.topics.join(', ')}`);
      }
      if (interests.hobbies && Array.isArray(interests.hobbies)) {
        parts.push(`- Hobbies: ${interests.hobbies.join(', ')}`);
      }
      parts.push('');
    }

    // Current context
    const context = profile.memories?.['a2p:context'];
    if (context) {
      parts.push('### Current Context');
      if (context.currentProjects && Array.isArray(context.currentProjects)) {
        parts.push(`- Current projects: ${context.currentProjects.join(', ')}`);
      }
      if (context.currentFocus) {
        parts.push(`- Current focus: ${context.currentFocus}`);
      }
      parts.push('');
    }

    // Recent episodic memories
    const episodic = profile.memories?.['a2p:episodic'];
    if (episodic && Array.isArray(episodic) && episodic.length > 0) {
      parts.push('### Recent Context');
      const recentMemories = episodic
        .slice(-5)
        .map((m: Memory) => `- ${m.content}`);
      parts.push(...recentMemories);
      parts.push('');
    }

    parts.push('## Instructions');
    parts.push('Please tailor your responses according to the user profile above.');
    parts.push('Adapt your communication style, examples, and explanations to match their background and preferences.');

    return parts.join('\n');
  }

  /**
   * Build metadata from profile
   */
  private buildMetadata(profile: Profile): Record<string, string> {
    const metadata: Record<string, string> = {
      a2p_user_did: profile.id,
      a2p_protocol_version: '1.0',
    };

    if (profile.common?.preferences?.language) {
      metadata.user_language = profile.common.preferences.language;
    }

    const professional = profile.memories?.['a2p:professional'];
    if (professional?.occupation) {
      metadata.user_occupation = professional.occupation as string;
    }

    return metadata;
  }

  /**
   * Propose a memory from assistant interaction
   */
  async proposeMemory(
    userDid: DID,
    content: string,
    category: string,
    memoryType: 'episodic' | 'semantic' | 'procedural' = 'episodic',
    confidence: number = 0.8,
    context?: string
  ): Promise<void> {
    if (confidence >= this.config.minProposalConfidence) {
      await this.client.proposeMemory({
        userDid,
        content,
        category,
        memoryType,
        confidence,
        context,
      });
    }
  }

  /**
   * Create function tool definitions for a2p operations
   */
  getFunctionTools(): Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }> {
    return [
      {
        type: 'function',
        function: {
          name: 'a2p_propose_memory',
          description: 'Propose a new memory to be added to the user\'s a2p profile. Use this when you learn something important about the user that should be remembered for future interactions.',
          parameters: {
            type: 'object',
            properties: {
              content: {
                type: 'string',
                description: 'The memory content to propose (e.g., "User prefers Python for data analysis")',
              },
              category: {
                type: 'string',
                description: 'The category for this memory',
                enum: [
                  'a2p:preferences.communication',
                  'a2p:preferences.content',
                  'a2p:professional.skills',
                  'a2p:professional.preferences',
                  'a2p:interests.topics',
                  'a2p:context.currentProjects',
                ],
              },
              confidence: {
                type: 'number',
                description: 'Confidence level (0-1) in this observation',
                minimum: 0,
                maximum: 1,
              },
            },
            required: ['content', 'category', 'confidence'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'a2p_get_preferences',
          description: 'Get specific user preferences from their a2p profile.',
          parameters: {
            type: 'object',
            properties: {
              category: {
                type: 'string',
                description: 'The preference category to retrieve',
                enum: ['communication', 'content', 'all'],
              },
            },
            required: ['category'],
          },
        },
      },
    ];
  }

  /**
   * Handle function tool calls
   */
  async handleFunctionCall(
    userDid: DID,
    name: string,
    args: Record<string, unknown>
  ): Promise<string> {
    switch (name) {
      case 'a2p_propose_memory': {
        const { content, category, confidence } = args as {
          content: string;
          category: string;
          confidence: number;
        };
        await this.proposeMemory(userDid, content, category, confidence);
        return JSON.stringify({
          success: true,
          message: 'Memory proposal submitted for user review.',
        });
      }

      case 'a2p_get_preferences': {
        const { category } = args as { category: string };
        const profile = await this.getProfile(userDid);

        if (category === 'all') {
          return JSON.stringify(profile.common?.preferences || {});
        }

        const prefs = profile.common?.preferences;
        if (!prefs) return JSON.stringify({});

        if (category === 'communication') {
          return JSON.stringify(prefs.communication || {});
        }
        if (category === 'content') {
          return JSON.stringify(prefs.content || {});
        }

        return JSON.stringify({});
      }

      default:
        return JSON.stringify({ error: 'Unknown function' });
    }
  }

  /**
   * Clear profile cache
   */
  clearCache(userDid?: DID): void {
    if (userDid) {
      this.profileCache.delete(userDid);
    } else {
      this.profileCache.clear();
    }
  }
}

/**
 * Create an A2P OpenAI adapter instance
 */
export function createA2POpenAIAdapter(config: A2POpenAIConfig): A2POpenAIAdapter {
  return new A2POpenAIAdapter(config);
}

export { A2PClient, createAgentClient };
export type { A2POpenAIConfig, A2PAssistantContext };
