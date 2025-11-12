/**
 * Anthropic Claude Provider Implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  ILLMProvider,
  LLMProvider,
  LLMCapability,
  LLMRequest,
  LLMResponse,
  LLMProviderConfig,
} from '../types';

export class AnthropicProvider implements ILLMProvider {
  readonly name = LLMProvider.ANTHROPIC;
  readonly capabilities = [
    LLMCapability.GENERATION,
    LLMCapability.ANALYSIS,
    LLMCapability.CRITIQUE,
  ];

  private client: Anthropic;
  private defaultModel: string;

  constructor(config: LLMProviderConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
    this.defaultModel = config.defaultModel || 'claude-sonnet-4-20250514';
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Extract system prompt if present in messages
      const systemPrompt = request.systemPrompt ||
        request.messages.find(m => m.role === 'system')?.content;

      // Build messages array (exclude system messages as they go in system param)
      const messages: Anthropic.MessageParam[] = request.messages
        .filter(msg => msg.role !== 'system')
        .map((msg) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      const response = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature || 1,
        system: systemPrompt,
        messages: messages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }

      return {
        content: content.text.trim(),
        provider: this.name,
        model: this.defaultModel,
        tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
        finishReason: response.stop_reason || undefined,
      };
    } catch (error: any) {
      console.error('Anthropic API error:', error);
      throw new Error(`Anthropic completion failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.messages.create({
        model: this.defaultModel,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: 'Respond with "OK" if you can read this.',
          },
        ],
      });

      return response.content[0].type === 'text';
    } catch (error) {
      console.error('Anthropic connection test failed:', error);
      return false;
    }
  }

  getModelForCapability(capability: LLMCapability): string {
    // Claude Sonnet 4 is excellent for all supported capabilities
    return this.defaultModel;
  }
}
