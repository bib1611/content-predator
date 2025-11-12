/**
 * Kimi 2 (Moonshot AI) Provider Implementation
 * Kimi excels at deep thinking, long-context understanding, and research
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

interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface KimiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
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
}

export class KimiProvider implements ILLMProvider {
  readonly name = LLMProvider.KIMI;
  readonly capabilities = [
    LLMCapability.THINKING,      // Kimi's strength: deep reasoning
    LLMCapability.RESEARCH,      // Excellent for research tasks
    LLMCapability.ANALYSIS,      // Strong analysis capabilities
    LLMCapability.GENERATION,    // Also supports generation
  ];

  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.moonshot.cn/v1';
    // moonshot-v1-128k: 128K context, excellent for long documents
    // moonshot-v1-32k: 32K context, faster for shorter tasks
    // moonshot-v1-8k: 8K context, fastest for quick tasks
    this.defaultModel = config.defaultModel || 'moonshot-v1-128k';
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Build messages array - Kimi supports system role natively
      const messages: KimiMessage[] = [];

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

      const requestBody = {
        model: this.defaultModel,
        messages: messages,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature !== undefined ? request.temperature : 0.8,
        // Kimi-specific: enable thinking mode for deeper reasoning
        ...(request.capability === LLMCapability.THINKING && {
          thinking: true,
        }),
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
        throw new Error(`Kimi API error: ${response.status} ${errorText}`);
      }

      const data: KimiResponse = await response.json();

      if (!data.choices || data.choices.length === 0) {
        throw new Error('No choices returned from Kimi API');
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
        },
      };
    } catch (error: any) {
      console.error('Kimi API error:', error);
      throw new Error(`Kimi completion failed: ${error.message}`);
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
          model: this.defaultModel,
          messages: [
            {
              role: 'user',
              content: '你好，请回复OK',
            },
          ],
          max_tokens: 10,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Kimi connection test failed:', error);
      return false;
    }
  }

  getModelForCapability(capability: LLMCapability): string {
    switch (capability) {
      case LLMCapability.THINKING:
      case LLMCapability.RESEARCH:
        // Use the largest context model for deep thinking and research
        return 'moonshot-v1-128k';
      case LLMCapability.ANALYSIS:
        // 32K is sufficient for most analysis tasks
        return 'moonshot-v1-32k';
      case LLMCapability.GENERATION:
        // Faster model for quick generation
        return 'moonshot-v1-8k';
      default:
        return this.defaultModel;
    }
  }
}
