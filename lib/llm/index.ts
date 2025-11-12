/**
 * LLM Module - Multi-Provider AI Integration
 *
 * This module provides a unified interface for multiple LLM providers:
 * - Anthropic Claude: High-quality generation, analysis, and critique
 * - Kimi 2 (Moonshot AI): Deep thinking and long-context research
 * - Perplexity Max: Real-time web search and research
 * - Cohere: Semantic understanding and generation
 *
 * Usage:
 * ```typescript
 * import { getProviderForCapability, LLMCapability } from '@/lib/llm';
 *
 * const provider = getProviderForCapability(LLMCapability.RESEARCH);
 * const response = await provider.complete({
 *   messages: [{ role: 'user', content: 'Research the latest AI trends' }],
 *   maxTokens: 4096,
 * });
 * ```
 */

// Types and Interfaces
export {
  LLMProvider,
  LLMCapability,
  type LLMMessage,
  type LLMRequest,
  type LLMResponse,
  type LLMProviderConfig,
  type ILLMProvider,
  type LLMProviderFactory,
} from './types';

// Provider Implementations
export { AnthropicProvider } from './providers/anthropic';
export { KimiProvider } from './providers/kimi';
export { PerplexityProvider } from './providers/perplexity';
export { CohereProvider } from './providers/cohere';

// Factory and Utilities
export {
  LLMFactory,
  getLLMFactory,
  getProviderForCapability,
  getProvider,
} from './factory';
