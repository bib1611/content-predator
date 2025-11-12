/**
 * Cohere Provider Implementation
 * Cohere excels at generation, classification, and semantic understanding
 */

import {
  ILLMProvider,
  LLMProvider,
  LLMCapability,
  LLMRequest,
  LLMResponse,
  LLMProviderConfig,
} from '../types';

interface CohereMessage {
  role: 'USER' | 'CHATBOT' | 'SYSTEM';
  message: string;
}

interface CohereChatResponse {
  response_id: string;
  text: string;
  generation_id: string;
  chat_history: CohereMessage[];
  finish_reason: string;
  meta: {
    api_version: {
      version: string;
    };
    billed_units: {
      input_tokens: number;
      output_tokens: number;
    };
  };
}

export class CohereProvider implements ILLMProvider {
  readonly name = LLMProvider.COHERE;
  readonly capabilities = [
    LLMCapability.GENERATION,    // Strong text generation
    LLMCapability.ANALYSIS,      // Good at semantic analysis
    LLMCapability.CRITIQUE,      // Can provide feedback on content
  ];

  private apiKey: string;
  private baseURL: string;
  private defaultModel: string;

  constructor(config: LLMProviderConfig) {
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.cohere.ai/v1';
    // command-r-plus: Most capable model
    // command-r: Balanced performance and speed
    // command: Faster, more affordable
    this.defaultModel = config.defaultModel || 'command-r-plus';
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    try {
      // Build chat history
      const chatHistory: CohereMessage[] = [];

      // Convert messages to Cohere format
      for (const msg of request.messages) {
        if (msg.role === 'system') {
          // System messages are handled via preamble parameter
          continue;
        }
        chatHistory.push({
          role: msg.role === 'user' ? 'USER' : 'CHATBOT',
          message: msg.content,
        });
      }

      // Get the last user message (required by Cohere)
      const lastUserMessage = [...request.messages]
        .reverse()
        .find(m => m.role === 'user');

      if (!lastUserMessage) {
        throw new Error('At least one user message is required for Cohere');
      }

      // Remove the last message from history (it goes in the message field)
      const historyWithoutLast = chatHistory.slice(0, -1);

      const requestBody = {
        model: this.defaultModel,
        message: lastUserMessage.content,
        chat_history: historyWithoutLast.length > 0 ? historyWithoutLast : undefined,
        preamble: request.systemPrompt,
        max_tokens: request.maxTokens || 4096,
        temperature: request.temperature !== undefined ? request.temperature : 0.8,
        // Cohere-specific parameters
        connectors: request.metadata?.enableWebSearch
          ? [{ id: 'web-search' }]
          : undefined,
        prompt_truncation: 'AUTO',
      };

      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Cohere API error: ${response.status} ${errorText}`);
      }

      const data: CohereChatResponse = await response.json();

      const inputTokens = data.meta?.billed_units?.input_tokens || 0;
      const outputTokens = data.meta?.billed_units?.output_tokens || 0;

      return {
        content: data.text.trim(),
        provider: this.name,
        model: this.defaultModel,
        tokensUsed: inputTokens + outputTokens,
        finishReason: data.finish_reason,
        metadata: {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          responseId: data.response_id,
          generationId: data.generation_id,
        },
      };
    } catch (error: any) {
      console.error('Cohere API error:', error);
      throw new Error(`Cohere completion failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: this.defaultModel,
          message: 'Respond with OK',
          max_tokens: 10,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Cohere connection test failed:', error);
      return false;
    }
  }

  getModelForCapability(capability: LLMCapability): string {
    switch (capability) {
      case LLMCapability.GENERATION:
      case LLMCapability.CRITIQUE:
        // Use the most powerful model for complex tasks
        return 'command-r-plus';
      case LLMCapability.ANALYSIS:
        // Balanced model for analysis
        return 'command-r';
      default:
        return this.defaultModel;
    }
  }
}
