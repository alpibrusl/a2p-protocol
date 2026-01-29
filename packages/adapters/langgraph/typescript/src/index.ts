/**
 * a2p LangGraph Adapter
 *
 * Integrates a2p profiles with LangGraph's memory system.
 */

import {
  A2PClient,
  createAgentClient,
  type Profile,
  type Memory,
  type DID,
  type A2PClientConfig,
  type ProfileStorage,
  type SensitivityLevel,
} from '@a2p/sdk';

/**
 * Configuration for the A2P Memory Saver
 */
export interface A2PMemorySaverConfig {
  /** a2p client configuration */
  clientConfig: A2PClientConfig;
  /** Optional storage backend */
  storage?: ProfileStorage;
  /** Default scopes to request */
  defaultScopes?: string[];
  /** Whether to auto-propose memories from state changes */
  autoPropose?: boolean;
}

/**
 * A2P-backed memory saver for LangGraph
 *
 * This class implements a LangGraph-compatible checkpointer that uses
 * a2p profiles for persistent memory storage.
 *
 * @example
 * ```typescript
 * import { A2PMemorySaver } from '@a2p/langgraph';
 * import { StateGraph } from '@langchain/langgraph';
 *
 * const memorySaver = new A2PMemorySaver({
 *   clientConfig: {
 *     agentDid: 'did:a2p:agent:my-agent',
 *   },
 *   defaultScopes: ['a2p:preferences', 'a2p:context'],
 * });
 *
 * const graph = new StateGraph({ ... });
 * const app = graph.compile({ checkpointer: memorySaver });
 * ```
 */
export class A2PMemorySaver {
  private client: A2PClient;
  private defaultScopes: string[];
  private autoPropose: boolean;
  private loadedProfiles: Map<string, Partial<Profile>> = new Map();

  constructor(config: A2PMemorySaverConfig) {
    this.client = createAgentClient(config.clientConfig, config.storage);
    this.defaultScopes = config.defaultScopes || ['a2p:preferences', 'a2p:context'];
    this.autoPropose = config.autoPropose ?? true;
  }

  /**
   * Load user profile into LangGraph state
   */
  async loadUserContext(
    userDid: DID,
    scopes?: string[]
  ): Promise<Record<string, unknown>> {
    const profile = await this.client.getProfile({
      userDid,
      scopes: scopes || this.defaultScopes,
    });

    this.loadedProfiles.set(userDid, profile);

    return this.profileToState(profile);
  }

  /**
   * Convert a2p profile to LangGraph state format
   */
  private profileToState(profile: Partial<Profile>): Record<string, unknown> {
    const state: Record<string, unknown> = {};

    // Add preferences
    if (profile.common?.preferences) {
      state.userPreferences = profile.common.preferences;
    }

    // Add memories as context
    if (profile.memories) {
      const memories: string[] = [];

      // Add episodic memories
      const episodic = profile.memories['a2p:episodic'] as Memory[] | undefined;
      if (episodic) {
        for (const memory of episodic) {
          if (memory.status === 'approved') {
            memories.push(memory.content);
          }
        }
      }

      // Add professional info
      const professional = profile.memories['a2p:professional'];
      if (professional) {
        if (typeof professional === 'object' && 'occupation' in professional) {
          memories.push(`User works as: ${professional.occupation}`);
        }
        if (typeof professional === 'object' && 'skills' in professional) {
          const skills = professional.skills as string[];
          if (skills?.length) {
            memories.push(`User skills: ${skills.join(', ')}`);
          }
        }
      }

      // Add interests
      const interests = profile.memories['a2p:interests'];
      if (interests) {
        if (typeof interests === 'object' && 'topics' in interests) {
          const topics = interests.topics as string[];
          if (topics?.length) {
            memories.push(`User interests: ${topics.join(', ')}`);
          }
        }
      }

      state.userMemories = memories;
      state.userContext = memories.join('\n');
    }

    return state;
  }

  /**
   * Propose a memory based on conversation
   */
  async proposeMemory(
    userDid: DID,
    content: string,
    options?: {
      category?: string;
      memoryType?: 'episodic' | 'semantic' | 'procedural';
      confidence?: number;
      context?: string;
      sensitivity?: SensitivityLevel;
    }
  ): Promise<{ proposalId: string; status: string }> {
    return this.client.proposeMemory({
      userDid,
      content,
      category: options?.category,
      memoryType: options?.memoryType || 'episodic',
      confidence: options?.confidence,
      context: options?.context,
      suggestedSensitivity: options?.sensitivity,
    });
  }

  /**
   * Extract and propose memories from state changes
   */
  async extractAndProposeMemories(
    userDid: DID,
    previousState: Record<string, unknown>,
    currentState: Record<string, unknown>,
    context?: string
  ): Promise<void> {
    if (!this.autoPropose) return;

    // Simple heuristic: look for new information in messages
    const previousMessages = (previousState.messages as unknown[]) || [];
    const currentMessages = (currentState.messages as unknown[]) || [];

    if (currentMessages.length <= previousMessages.length) return;

    // Get new messages
    const newMessages = currentMessages.slice(previousMessages.length);

    for (const message of newMessages) {
      // Extract potential memories from assistant responses
      if (typeof message === 'object' && message !== null) {
        const msg = message as Record<string, unknown>;
        if (msg.role === 'user' || msg.type === 'human') {
          const content = msg.content as string;

          // Simple patterns for memory extraction
          const patterns = [
            { regex: /I work (?:as|at|for) (.+)/i, category: 'a2p:professional' },
            { regex: /I like (.+)/i, category: 'a2p:interests' },
            { regex: /I prefer (.+)/i, category: 'a2p:preferences' },
            { regex: /I'm interested in (.+)/i, category: 'a2p:interests' },
            { regex: /My name is (.+)/i, category: 'a2p:identity' },
          ];

          for (const { regex, category } of patterns) {
            const match = content.match(regex);
            if (match) {
              await this.proposeMemory(userDid, content, {
                category,
                confidence: 0.7,
                context: context || 'Extracted from conversation',
              });
              break;
            }
          }
        }
      }
    }
  }

  /**
   * Get the underlying a2p client
   */
  getClient(): A2PClient {
    return this.client;
  }

  /**
   * Get loaded profile for a user
   */
  getLoadedProfile(userDid: DID): Partial<Profile> | undefined {
    return this.loadedProfiles.get(userDid);
  }

  /**
   * Clear loaded profiles cache
   */
  clearCache(): void {
    this.loadedProfiles.clear();
  }
}

/**
 * Create an A2P memory saver for LangGraph
 */
export function createA2PMemorySaver(
  config: A2PMemorySaverConfig
): A2PMemorySaver {
  return new A2PMemorySaver(config);
}

/**
 * Helper to format user context for LLM prompts
 */
export function formatUserContextForPrompt(
  state: Record<string, unknown>
): string {
  const parts: string[] = [];

  if (state.userPreferences) {
    const prefs = state.userPreferences as Record<string, unknown>;
    if (prefs.communication) {
      const comm = prefs.communication as Record<string, unknown>;
      if (comm.style) parts.push(`Communication style: ${comm.style}`);
      if (comm.formality) parts.push(`Formality: ${comm.formality}`);
    }
    if (prefs.language) parts.push(`Language: ${prefs.language}`);
  }

  if (state.userContext) {
    parts.push(`\nUser context:\n${state.userContext}`);
  }

  return parts.join('\n');
}

// Re-export types
export type { A2PClient, Profile, Memory, DID, A2PClientConfig, ProfileStorage };
