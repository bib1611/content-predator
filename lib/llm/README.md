# Multi-LLM Provider System

Content Predator features an intelligent multi-provider LLM system that automatically routes tasks to the best AI model for each specific capability.

## Overview

The system supports four LLM providers, each with unique strengths:

| Provider | Strengths | Use Cases |
|----------|-----------|-----------|
| **Anthropic Claude** | High-quality generation, nuanced understanding, critique | Content generation, editing, critique (Required) |
| **Kimi 2 (Moonshot)** | Deep thinking, 128K context, reasoning | Content analysis, research, long-context tasks (Optional) |
| **Perplexity Max** | Real-time web search, current events | Trend research, fact-checking, citations (Optional) |
| **Cohere** | Semantic understanding, fast generation | Alternative generation, classification (Optional) |

## Architecture

### Core Components

```
lib/llm/
├── types.ts                    # TypeScript interfaces and enums
├── factory.ts                  # Provider factory and routing logic
├── index.ts                    # Public API exports
├── providers/
│   ├── anthropic.ts           # Claude integration
│   ├── kimi.ts                # Moonshot AI integration
│   ├── perplexity.ts          # Perplexity AI integration
│   └── cohere.ts              # Cohere integration
└── README.md                   # This file
```

### Key Concepts

#### Capabilities

Tasks are categorized by capability:

- `GENERATION` - Content creation (tweets, threads, articles, emails)
- `THINKING` - Deep analysis and reasoning
- `RESEARCH` - Web search and current information
- `ANALYSIS` - Content opportunity analysis
- `CRITIQUE` - Content review and improvement

#### Intelligent Routing

The factory automatically selects the best provider for each capability:

```typescript
// Analysis/Thinking: Kimi → Anthropic
LLMCapability.THINKING → [Kimi, Anthropic]

// Research: Perplexity → Kimi → Anthropic
LLMCapability.RESEARCH → [Perplexity, Kimi, Anthropic]

// Generation: Anthropic → Cohere → Kimi
LLMCapability.GENERATION → [Anthropic, Cohere, Kimi]

// Critique: Anthropic → Cohere
LLMCapability.CRITIQUE → [Anthropic, Cohere]
```

## Usage

### Basic Usage

```typescript
import { getProviderForCapability, LLMCapability } from '@/lib/llm';

// Get the best provider for a specific capability
const provider = getProviderForCapability(LLMCapability.GENERATION);

// Generate content
const response = await provider.complete({
  messages: [
    { role: 'user', content: 'Write a tweet about AI trends' }
  ],
  maxTokens: 2048,
  temperature: 0.8,
  capability: LLMCapability.GENERATION,
});

console.log(response.content);
```

### Using a Specific Provider

```typescript
import { getProvider, LLMProvider } from '@/lib/llm';

// Force use of a specific provider
const kimiProvider = getProvider(LLMProvider.KIMI);

const response = await kimiProvider.complete({
  messages: [
    { role: 'user', content: 'Analyze this complex dataset...' }
  ],
  maxTokens: 4096,
  capability: LLMCapability.THINKING,
});
```

### With System Prompts

```typescript
const response = await provider.complete({
  systemPrompt: 'You are a marketing expert...',
  messages: [
    { role: 'user', content: 'Create a campaign strategy' }
  ],
  maxTokens: 4096,
  temperature: 0.9,
});
```

### Advanced: Provider-Specific Features

#### Kimi - Enable Thinking Mode

```typescript
const response = await kimiProvider.complete({
  messages: [...],
  capability: LLMCapability.THINKING, // Enables thinking mode
  maxTokens: 4096,
});
```

#### Perplexity - Web Search with Domain Filtering

```typescript
const response = await perplexityProvider.complete({
  messages: [...],
  capability: LLMCapability.RESEARCH,
  metadata: {
    searchDomains: ['twitter.com', 'reddit.com'], // Optional domain filter
    enableSearch: true,
  },
});

// Access citations
console.log(response.metadata?.citations);
```

#### Cohere - Web Search

```typescript
const response = await cohereProvider.complete({
  messages: [...],
  metadata: {
    enableWebSearch: true, // Enable web connector
  },
});
```

## Configuration

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-your_key_here

# Optional - add for enhanced capabilities
KIMI_API_KEY=your_moonshot_key_here
PERPLEXITY_API_KEY=your_perplexity_key_here
COHERE_API_KEY=your_cohere_key_here
```

### Factory Initialization

The factory automatically initializes all providers with available API keys:

```typescript
import { getLLMFactory } from '@/lib/llm';

const factory = getLLMFactory();

// Check available providers
const available = factory.getAvailableProviders();
console.log(available); // ['anthropic', 'kimi', 'perplexity']

// Test all connections
const results = await factory.testAllConnections();
console.log(results);
// { anthropic: true, kimi: true, perplexity: false }

// Get statistics
const stats = factory.getProviderStats();
console.log(stats);
```

## Provider Details

### Anthropic Claude

**Model:** `claude-sonnet-4-20250514`

**Capabilities:** Generation, Analysis, Critique

**Strengths:**
- Excellent writing quality
- Nuanced understanding of context
- Strong at following complex instructions
- Best for content that requires human-like quality

**Best For:**
- Primary content generation
- Content critique and editing
- Complex creative tasks

### Kimi 2 (Moonshot AI)

**Models:**
- `moonshot-v1-128k` - 128K context (default)
- `moonshot-v1-32k` - 32K context
- `moonshot-v1-8k` - 8K context

**Capabilities:** Thinking, Research, Analysis, Generation

**Strengths:**
- Exceptional at deep reasoning
- 128K context window for long documents
- Thinking mode for complex analysis
- Strong at research tasks

**Best For:**
- Analyzing large amounts of social media data
- Deep content opportunity analysis
- Complex reasoning tasks
- Long-context understanding

### Perplexity Max

**Model:** `llama-3.1-sonar-huge-128k-online`

**Capabilities:** Research, Analysis, Generation

**Strengths:**
- Real-time web search
- Access to current information
- Provides citations
- Up-to-date knowledge

**Best For:**
- Researching current trends
- Fact-checking
- Finding real-time social media trends
- Getting current event context

### Cohere

**Models:**
- `command-r-plus` - Most capable (default)
- `command-r` - Balanced
- `command` - Fast and affordable

**Capabilities:** Generation, Analysis, Critique

**Strengths:**
- Fast generation
- Strong semantic understanding
- Good at classification
- Free tier available

**Best For:**
- Alternative generation engine
- Semantic analysis
- Cost-effective operations

## Extending the System

### Adding a New Provider

1. Create provider implementation in `lib/llm/providers/`:

```typescript
import { ILLMProvider, LLMProvider, LLMCapability } from '../types';

export class NewProvider implements ILLMProvider {
  readonly name = LLMProvider.NEW_PROVIDER;
  readonly capabilities = [LLMCapability.GENERATION];

  async complete(request: LLMRequest): Promise<LLMResponse> {
    // Implementation
  }

  async testConnection(): Promise<boolean> {
    // Implementation
  }

  getModelForCapability(capability: LLMCapability): string {
    // Implementation
  }
}
```

2. Add to factory in `lib/llm/factory.ts`:

```typescript
if (process.env.NEW_PROVIDER_API_KEY) {
  const newProvider = new NewProvider({
    apiKey: process.env.NEW_PROVIDER_API_KEY,
  });
  this.providers.set(LLMProvider.NEW_PROVIDER, newProvider);
}
```

3. Update capability map for intelligent routing.

## Best Practices

1. **Use Capability-Based Routing**: Let the system choose the best provider
   ```typescript
   const provider = getProviderForCapability(capability);
   ```

2. **Handle Fallbacks Gracefully**: The system automatically falls back to available providers

3. **Set Appropriate Temperatures**:
   - Creative content: 0.8-1.0
   - Editing/critique: 0.6-0.7
   - Analysis: 0.7-0.8

4. **Use Metadata for Provider-Specific Features**:
   ```typescript
   metadata: {
     enableSearch: true,
     searchDomains: ['specific.com'],
   }
   ```

5. **Test Connections on Startup**: Verify providers are configured correctly

## Troubleshooting

### Provider Not Available

```typescript
// Error: Provider kimi not available. Check API key configuration.
```

**Solution:** Ensure the API key is set in `.env.local`

### Rate Limiting

Each provider has different rate limits:
- Anthropic: 50 req/min (free tier)
- Kimi: Check Moonshot docs
- Perplexity: Varies by plan
- Cohere: 1000 calls/month (free tier)

### Token Limits

Adjust `maxTokens` based on your needs:
- Tweets: 2048
- Threads: 4096
- Articles: 4096-8192
- Sales pages: 8192

## Performance Considerations

- **Kimi**: Slightly slower but better for complex reasoning
- **Perplexity**: Slower due to web search, but provides current data
- **Anthropic**: Fast and reliable, good baseline
- **Cohere**: Fastest for simple generation tasks

## API Costs

Approximate costs (check provider docs for current pricing):

- **Anthropic**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
- **Kimi**: ~¥12 per 1M tokens (~$1.70)
- **Perplexity**: Included in Pro subscription (~$20/month)
- **Cohere**: Free tier available, paid plans start at $0.40 per 1M tokens

## License

Part of Content Predator - MIT License
