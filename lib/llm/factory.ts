/**
 * LLM Provider Factory
 * Central management and routing for all LLM providers
 */

import {
  ILLMProvider,
  LLMProvider,
  LLMCapability,
  LLMProviderFactory,
  LLMProviderConfig,
} from './types';
import { AnthropicProvider } from './providers/anthropic';
import { KimiProvider } from './providers/kimi';
import { PerplexityProvider } from './providers/perplexity';
import { CohereProvider } from './providers/cohere';

export class LLMFactory implements LLMProviderFactory {
  private providers: Map<LLMProvider, ILLMProvider> = new Map();
  private capabilityMap: Map<LLMCapability, LLMProvider[]> = new Map();

  constructor() {
    this.initializeProviders();
    this.buildCapabilityMap();
  }

  private initializeProviders(): void {
    // Initialize Anthropic (always available)
    if (process.env.ANTHROPIC_API_KEY) {
      const anthropic = new AnthropicProvider({
        apiKey: process.env.ANTHROPIC_API_KEY,
        defaultModel: 'claude-sonnet-4-20250514',
      });
      this.providers.set(LLMProvider.ANTHROPIC, anthropic);
    }

    // Initialize Kimi (Moonshot AI) - for deep thinking and research
    if (process.env.KIMI_API_KEY) {
      const kimi = new KimiProvider({
        apiKey: process.env.KIMI_API_KEY,
        defaultModel: 'moonshot-v1-128k',
      });
      this.providers.set(LLMProvider.KIMI, kimi);
    }

    // Initialize Perplexity - for real-time web research
    if (process.env.PERPLEXITY_API_KEY) {
      const perplexity = new PerplexityProvider({
        apiKey: process.env.PERPLEXITY_API_KEY,
        defaultModel: 'llama-3.1-sonar-huge-128k-online',
      });
      this.providers.set(LLMProvider.PERPLEXITY, perplexity);
    }

    // Initialize Cohere - for generation and analysis
    if (process.env.COHERE_API_KEY) {
      const cohere = new CohereProvider({
        apiKey: process.env.COHERE_API_KEY,
        defaultModel: 'command-r-plus',
      });
      this.providers.set(LLMProvider.COHERE, cohere);
    }
  }

  private buildCapabilityMap(): void {
    // Build a map of capabilities to providers
    this.capabilityMap = new Map([
      // Thinking: Kimi is best, fallback to Anthropic
      [LLMCapability.THINKING, [LLMProvider.KIMI, LLMProvider.ANTHROPIC]],
      // Research: Perplexity first (real-time search), then Kimi, then others
      [LLMCapability.RESEARCH, [
        LLMProvider.PERPLEXITY,
        LLMProvider.KIMI,
        LLMProvider.ANTHROPIC,
      ]],
      // Generation: All providers, prioritize Anthropic for quality
      [LLMCapability.GENERATION, [
        LLMProvider.ANTHROPIC,
        LLMProvider.COHERE,
        LLMProvider.KIMI,
      ]],
      // Analysis: Anthropic first, then others
      [LLMCapability.ANALYSIS, [
        LLMProvider.ANTHROPIC,
        LLMProvider.KIMI,
        LLMProvider.COHERE,
        LLMProvider.PERPLEXITY,
      ]],
      // Critique: Anthropic best for nuanced feedback
      [LLMCapability.CRITIQUE, [
        LLMProvider.ANTHROPIC,
        LLMProvider.COHERE,
      ]],
    ]);
  }

  getProvider(provider: LLMProvider): ILLMProvider {
    const providerInstance = this.providers.get(provider);
    if (!providerInstance) {
      throw new Error(
        `Provider ${provider} not available. Check API key configuration.`
      );
    }
    return providerInstance;
  }

  getProviderForCapability(capability: LLMCapability): ILLMProvider {
    const preferredProviders = this.capabilityMap.get(capability) || [];

    // Find the first available provider that supports this capability
    for (const providerName of preferredProviders) {
      const provider = this.providers.get(providerName);
      if (provider && provider.capabilities.includes(capability)) {
        return provider;
      }
    }

    // Fallback: return any available provider
    const fallbackProvider = this.providers.values().next().value;
    if (!fallbackProvider) {
      throw new Error('No LLM providers are configured. Check your API keys.');
    }

    console.warn(
      `No optimal provider for ${capability}, using ${fallbackProvider.name}`
    );
    return fallbackProvider;
  }

  getAllProviders(): ILLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Check which providers are available
   */
  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Test all provider connections
   */
  async testAllConnections(): Promise<Record<LLMProvider, boolean>> {
    const results: Record<string, boolean> = {};

    for (const [name, provider] of this.providers.entries()) {
      try {
        results[name] = await provider.testConnection();
      } catch (error) {
        console.error(`Failed to test ${name}:`, error);
        results[name] = false;
      }
    }

    return results as Record<LLMProvider, boolean>;
  }

  /**
   * Get provider statistics
   */
  getProviderStats() {
    return {
      total: this.providers.size,
      available: Array.from(this.providers.keys()),
      capabilities: Object.fromEntries(this.capabilityMap.entries()),
    };
  }
}

// Singleton instance
let factoryInstance: LLMFactory | null = null;

export function getLLMFactory(): LLMFactory {
  if (!factoryInstance) {
    factoryInstance = new LLMFactory();
  }
  return factoryInstance;
}

/**
 * Convenience function to get a provider by capability
 */
export function getProviderForCapability(
  capability: LLMCapability
): ILLMProvider {
  return getLLMFactory().getProviderForCapability(capability);
}

/**
 * Convenience function to get a specific provider
 */
export function getProvider(provider: LLMProvider): ILLMProvider {
  return getLLMFactory().getProvider(provider);
}
