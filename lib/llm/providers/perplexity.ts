/**
 * Perplexity AI Provider Implementation
 * Perplexity excels at real-time web research and search-augmented generation
 * API is OpenAI-compatible
 */

import {
  ILLMProvider,
  LLMProvider,
  LLMCapability,
  LLMRequest,
  LLMResponse,
  LLMProviderConfig,
} from '../types';

interface PerplexityMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface PerplexityCitation {
  url: string;
  text: string;
}

interface PerplexityResponse {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  citations?: string[];
}

export class PerplexityProvider implements ILLMProvider {
  readonly name = LLMProvider.PERPLEXITY;
  readonly capabilities = [
    LLMCapability.RESEARCH,      // Primary strength: real-time web search
    LLMCapability.ANALYSIS,      // Good at analyzing current information
    LLMCapability.GENERATION,    // Also supports general generation
  ];

  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.perplexity.ai';
    // llama-3.1-sonar-large-128k-online: Best for comprehensive research
    // llama-3.1-sonar-small-128k-online: Faster for simpler queries
    // llama-3.1-sonar-huge-128k-online: Maximum capability (Perplexity Max)
    this.defaultModel = config.defaultModel || 'llama-3.1-sonar-huge-128k-online';
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Build messages array
      const messages: PerplexityMessage[] = [];

      // Add system prompt if provided
      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt,
        });
      }

      // Add user messages
      messages.push(...request.messages.map(msg => ({
        role: msg.role as 'system' | 'user' | 'assistant',
        content: msg.content,
      })));

      // Determine if we should use online search
      const useOnlineSearch = request.capability === LLMCapability.RESEARCH ||
        request.metadata?.enableSearch !== false;

      const requestBody = {
        model: useOnlineSearch ? this.defaultModel : this.defaultModel.replace('-online', ''),
        messages: messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature !== undefined ? request.temperature : 0.7,
        // Enable search for research tasks
        search_domain_filter: request.metadata?.searchDomains || undefined,
        return_citations: true,
        return_images: false,
      };

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Perplexity API error: ${response.status} ${errorText}`);
      }

      const data: PerplexityResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No choices returned from Perplexity API');
      }

      const choice = data.choices[0];

      return {
        content: choice.message.content.trim(),
        provider: this.name,
        model: data.model,
        tokensUsed: data.usage.total_tokens,
        finishReason: choice.finish_reason,
        metadata: {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
          citations: data.citations || [],
        },
      };
    } catch (error: any) {
      console.error('Perplexity API error:', error);
      throw new Error(`Perplexity completion failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'user',
              content: 'Respond with OK',
            },
          ],
          max_tokens: 10,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Perplexity connection test failed:', error);
      return false;
    }
  }

  getModelForCapability(capability: LLMCapability): string {
    switch (capability) {
      case LLMCapability.RESEARCH:
        // Use the most powerful online model for research
        return 'llama-3.1-sonar-huge-128k-online';
      case LLMCapability.ANALYSIS:
        // Large model for analysis
        return 'llama-3.1-sonar-large-128k-online';
      case LLMCapability.GENERATION:
        // Smaller model for quick generation
        return 'llama-3.1-sonar-small-128k-online';
      default:
        return this.defaultModel;
    }
  }
}
