/**
 * @a2p/langchain - LangChain adapter for the a2p protocol
 *
 * This adapter provides integration between LangChain and the a2p protocol,
 * enabling LangChain agents to use a2p profiles for memory and personalization.
 */

import {
  A2PClient,
  createAgentClient,
  type DID,
  type Profile,
  type Memory,
  type Storage,
} from '@a2p/sdk';
import type { BaseMemory, InputValues, OutputValues, MemoryVariables } from 'langchain/memory';
import type { BaseChatMessageHistory } from 'langchain/schema';

/**
 * Configuration for the A2P LangChain memory adapter
 */
export interface A2PMemoryConfig {
  /** Agent DID for authentication */
  agentDid: DID;
  /** User DID whose profile to access */
  userDid: DID;
  /** a2p storage implementation */
  storage: Storage;
  /** Scopes to request from user profile */
  scopes?: string[];
  /** Whether to propose learned information as memories */
  proposeMemories?: boolean;
  /** Minimum confidence to propose a memory */
  minProposalConfidence?: number;
  /** Memory key for input */
  inputKey?: string;
  /** Memory key for output */
  outputKey?: string;
  /** Human prefix in conversation */
  humanPrefix?: string;
  /** AI prefix in conversation */
  aiPrefix?: string;
}

/**
 * A2P Memory adapter for LangChain
 *
 * Implements LangChain's BaseMemory interface to provide a2p profile
 * data as context for LangChain chains and agents.
 *
 * @example
 * ```typescript
 * import { A2PMemory } from '@a2p/langchain';
 * import { ConversationChain } from 'langchain/chains';
 *
 * const memory = new A2PMemory({
 *   agentDid: 'did:a2p:agent:my-agent',
 *   userDid: 'did:a2p:user:alice',
 *   storage: new MemoryStorage(),
 * });
 *
 * const chain = new ConversationChain({
 *   llm: model,
 *   memory: memory,
 * });
 * ```
 */
export class A2PMemory implements BaseMemory {
  private client: A2PClient;
  private config: Required<A2PMemoryConfig>;
  private profile: Profile | null = null;
  private conversationHistory: Array<{ role: string; content: string }> = [];

  constructor(config: A2PMemoryConfig) {
    this.config = {
      scopes: ['a2p:preferences', 'a2p:interests', 'a2p:context'],
      proposeMemories: true,
      minProposalConfidence: 0.8,
      inputKey: 'input',
      outputKey: 'output',
      humanPrefix: 'Human',
      aiPrefix: 'AI',
      ...config,
    };

    this.client = createAgentClient(
      { agentDid: this.config.agentDid },
      this.config.storage
    );
  }

  /**
   * Memory keys exposed by this memory
   */
  get memoryKeys(): string[] {
    return ['a2p_context', 'chat_history'];
  }

  /**
   * Load memory variables for the chain
   */
  async loadMemoryVariables(_values: InputValues): Promise<MemoryVariables> {
    // Fetch profile if not cached
    if (!this.profile) {
      this.profile = await this.client.getProfile({
        userDid: this.config.userDid,
        scopes: this.config.scopes,
      });
    }

    // Build context from profile
    const a2pContext = this.buildContextFromProfile(this.profile);

    // Build chat history
    const chatHistory = this.conversationHistory
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join('\n');

    return {
      a2p_context: a2pContext,
      chat_history: chatHistory,
    };
  }

  /**
   * Save context from the chain interaction
   */
  async saveContext(inputValues: InputValues, outputValues: OutputValues): Promise<void> {
    const input = inputValues[this.config.inputKey] as string;
    const output = outputValues[this.config.outputKey] as string;

    // Add to conversation history
    this.conversationHistory.push(
      { role: this.config.humanPrefix, content: input },
      { role: this.config.aiPrefix, content: output }
    );

    // Optionally propose learned information as memory
    if (this.config.proposeMemories) {
      await this.extractAndProposeMemories(input, output);
    }
  }

  /**
   * Clear memory
   */
  async clear(): Promise<void> {
    this.conversationHistory = [];
    this.profile = null;
  }

  /**
   * Build a context string from profile data
   */
  private buildContextFromProfile(profile: Profile): string {
    const parts: string[] = [];

    // Add preferences
    if (profile.common?.preferences) {
      const prefs = profile.common.preferences;
      if (prefs.language) {
        parts.push(`Language preference: ${prefs.language}`);
      }
      if (prefs.communication?.style) {
        parts.push(`Communication style: ${prefs.communication.style}`);
      }
    }

    // Add professional context
    const professional = profile.memories?.['a2p:professional'];
    if (professional) {
      if (professional.occupation) {
        parts.push(`Occupation: ${professional.occupation}`);
      }
      if (professional.skills) {
        parts.push(`Skills: ${(professional.skills as string[]).join(', ')}`);
      }
    }

    // Add interests
    const interests = profile.memories?.['a2p:interests'];
    if (interests) {
      if (interests.topics) {
        parts.push(`Interests: ${(interests.topics as string[]).join(', ')}`);
      }
    }

    // Add episodic memories
    const episodic = profile.memories?.['a2p:episodic'];
    if (episodic && Array.isArray(episodic)) {
      const recentMemories = episodic
        .slice(-5)
        .map((m: Memory) => m.content)
        .join('; ');
      if (recentMemories) {
        parts.push(`Recent context: ${recentMemories}`);
      }
    }

    return parts.length > 0
      ? `User context from a2p profile:\n${parts.join('\n')}`
      : 'No user context available.';
  }

  /**
   * Extract potential memories from conversation and propose them
   */
  private async extractAndProposeMemories(
    _input: string,
    output: string
  ): Promise<void> {
    // This is a simplified extraction - in production, you'd use
    // an LLM to extract facts from the conversation
    const potentialMemories = this.simpleMemoryExtraction(output);

    for (const memory of potentialMemories) {
      if (memory.confidence >= this.config.minProposalConfidence) {
        await this.client.proposeMemory({
          userDid: this.config.userDid,
          content: memory.content,
          category: memory.category,
          confidence: memory.confidence,
          context: 'Extracted from conversation',
        });
      }
    }
  }

  /**
   * Simple rule-based memory extraction (placeholder for LLM-based extraction)
   */
  private simpleMemoryExtraction(
    _text: string
  ): Array<{ content: string; category: string; confidence: number }> {
    // In production, this would use an LLM to extract facts
    // This is a placeholder that returns empty for safety
    return [];
  }

  /**
   * Refresh the cached profile
   */
  async refreshProfile(): Promise<void> {
    this.profile = await this.client.getProfile({
      userDid: this.config.userDid,
      scopes: this.config.scopes,
    });
  }

  /**
   * Get the current profile
   */
  getProfile(): Profile | null {
    return this.profile;
  }

  /**
   * Manually propose a memory
   */
  async proposeMemory(
    content: string,
    category: string,
    memoryType: 'episodic' | 'semantic' | 'procedural' = 'episodic',
    confidence: number = 0.8
  ): Promise<void> {
    await this.client.proposeMemory({
      userDid: this.config.userDid,
      content,
      category,
      memoryType,
      confidence,
    });
  }
}

/**
 * A2P Chat Message History for LangChain
 *
 * Stores chat history in the user's a2p profile.
 */
export class A2PChatMessageHistory implements BaseChatMessageHistory {
  private client: A2PClient;
  private userDid: DID;
  private messages: Array<{ type: string; content: string }> = [];

  constructor(agentDid: DID, userDid: DID, storage: Storage) {
    this.client = createAgentClient({ agentDid }, storage);
    this.userDid = userDid;
  }

  async getMessages(): Promise<Array<{ type: string; content: string }>> {
    return this.messages;
  }

  async addMessage(message: { type: string; content: string }): Promise<void> {
    this.messages.push(message);
  }

  async addUserMessage(content: string): Promise<void> {
    await this.addMessage({ type: 'human', content });
  }

  async addAIMessage(content: string): Promise<void> {
    await this.addMessage({ type: 'ai', content });
  }

  async clear(): Promise<void> {
    this.messages = [];
  }
}

/**
 * Create an A2P-enabled LangChain memory instance
 */
export function createA2PMemory(config: A2PMemoryConfig): A2PMemory {
  return new A2PMemory(config);
}

/**
 * Create a system prompt with a2p context
 */
export async function getA2PSystemPrompt(
  client: A2PClient,
  userDid: DID,
  scopes: string[] = ['a2p:preferences']
): Promise<string> {
  const profile = await client.getProfile({ userDid, scopes });

  const parts: string[] = [
    'You are a helpful AI assistant.',
    '',
    'User Profile Information:',
  ];

  if (profile.common?.preferences) {
    const prefs = profile.common.preferences;
    if (prefs.communication?.style) {
      parts.push(`- Communication style preference: ${prefs.communication.style}`);
    }
    if (prefs.language) {
      parts.push(`- Language preference: ${prefs.language}`);
    }
  }

  const professional = profile.memories?.['a2p:professional'];
  if (professional?.occupation) {
    parts.push(`- Occupation: ${professional.occupation}`);
  }

  parts.push('', 'Please tailor your responses according to these preferences.');

  return parts.join('\n');
}

export { A2PClient, createAgentClient };
export type { A2PMemoryConfig };
