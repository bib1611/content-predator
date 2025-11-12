/**
 * LLM Provider Types and Interfaces
 * Unified abstraction layer for multiple LLM providers
 */

export enum LLMProvider {
  ANTHROPIC = 'anthropic',
  KIMI = 'kimi',
  PERPLEXITY = 'perplexity',
  COHERE = 'cohere',
}

export enum LLMCapability {
  GENERATION = 'generation',           // Standard content generation
  THINKING = 'thinking',               // Deep reasoning and analysis
  RESEARCH = 'research',               // Real-time web search and research
  ANALYSIS = 'analysis',               // Content analysis
  CRITIQUE = 'critique',               // Content critique and improvement
}

export interface LLMMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface LLMRequest {
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  capability?: LLMCapability;
  metadata?: Record<string, any>;
}

export interface LLMResponse {
  content: string;
  provider: LLMProvider;
  model: string;
  tokensUsed?: number;
  finishReason?: string;
  metadata?: Record<string, any>;
}

export interface LLMProviderConfig {
  apiKey: string;
  baseURL?: string;
  defaultModel?: string;
  timeout?: number;
}

export interface ILLMProvider {
  readonly name: LLMProvider;
  readonly capabilities: LLMCapability[];

  /**
   * Generate a completion from the LLM
   */
  complete(request: LLMRequest): Promise<LLMResponse>;

  /**
   * Test if the provider is available and configured correctly
   */
  testConnection(): Promise<boolean>;

  /**
   * Get the recommended model for a specific capability
   */
  getModelForCapability(capability: LLMCapability): string;
}

export interface LLMProviderFactory {
  /**
   * Get a provider instance by name
   */
  getProvider(provider: LLMProvider): ILLMProvider;

  /**
   * Get the best provider for a specific capability
   */
  getProviderForCapability(capability: LLMCapability): ILLMProvider;

  /**
   * Get all available providers
   */
  getAllProviders(): ILLMProvider[];
}
