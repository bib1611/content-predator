import {
  getProviderForCapability,
  LLMCapability,
  type ILLMProvider,
} from './llm';

export interface OpportunityAnalysis {
  type: 'gap' | 'viral_format' | 'trending_topic';
  platform: 'twitter' | 'substack';
  description: string;
  viral_potential: number;
  suggested_format: 'tweet' | 'thread' | 'article';
  hook: string;
  angle: string;
  cta: string;
  engagement_estimate: string;
  content_snippet?: string;
}

export interface ScanData {
  notifications: string;
  trendingPosts: string;
  substackComments: string;
}

export async function analyzeContentOpportunity(data: ScanData): Promise<OpportunityAnalysis[]> {
  const prompt = `You are analyzing social media signals for The Biblical Man brand.

BRAND CONTEXT:
- Target: Christian men 30-55, traditionalist/fundamentalist
- Voice: Confrontational, visceral, forcing binary choices
- Style: Pattern interrupt hooks, biblical truth that challenges comfortable Christianity
- Goal: Drive engagement and conversions to paid products

NOTIFICATIONS DATA:
${data.notifications}

TRENDING POSTS:
${data.trendingPosts}

SUBSTACK ENGAGEMENT:
${data.substackComments}

ANALYSIS TASK:
Identify content opportunities in these categories:

1. GAPS: What questions aren't being answered? What pain points are raw and unaddressed?
2. VIRAL FORMATS: What structure/style is crushing it right now? What patterns are getting massive engagement?
3. TRENDING TOPICS: What conversations are heating up that we can dominate?

For each opportunity, provide:
- type: "gap", "viral_format", or "trending_topic"
- platform: "twitter" or "substack"
- description: Clear explanation of the opportunity
- viral_potential: Score 1-10 (10 = highest viral potential)
- suggested_format: "tweet", "thread", or "article"
- hook: Specific opening line that will stop the scroll (confrontational, pattern interrupt)
- angle: The Biblical Man's specific take that differentiates from mainstream Christian content
- cta: Call to action that drives to paid products (King's Marriage Manual, Brotherhood, etc.)
- engagement_estimate: Realistic projection based on similar content
- content_snippet: (optional) Specific post/comment that inspired this opportunity

REQUIREMENTS:
- Only identify opportunities with viral_potential of 6 or higher
- Hooks must be confrontational, not soft or "nice"
- Angles must challenge comfortable Christianity
- CTAs must be direct and tied to specific products
- Maximum 10 opportunities total

Return ONLY valid JSON array. No markdown, no explanation, just the array:
[
  {
    "type": "gap",
    "platform": "twitter",
    "description": "...",
    "viral_potential": 8,
    "suggested_format": "thread",
    "hook": "...",
    "angle": "...",
    "cta": "...",
    "engagement_estimate": "..."
  }
]`;

  try {
    // Use Kimi for deep thinking analysis, fallback to Anthropic
    const provider = getProviderForCapability(LLMCapability.THINKING);

    const response = await provider.complete({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      maxTokens: 4096,
      temperature: 1,
      capability: LLMCapability.THINKING,
    });

    // Parse the JSON response
    const responseText = response.content.trim();

    // Remove markdown code blocks if present
    const jsonText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/, '')
      .replace(/```\s*$/, '')
      .trim();

    const opportunities: OpportunityAnalysis[] = JSON.parse(jsonText);

    // Validate the response
    if (!Array.isArray(opportunities)) {
      throw new Error('Response is not an array');
    }

    // Filter and validate each opportunity
    return opportunities
      .filter(opp => opp.viral_potential >= 6)
      .slice(0, 10)
      .map(opp => ({
        type: opp.type,
        platform: opp.platform,
        description: opp.description,
        viral_potential: opp.viral_potential,
        suggested_format: opp.suggested_format,
        hook: opp.hook,
        angle: opp.angle,
        cta: opp.cta,
        engagement_estimate: opp.engagement_estimate,
        content_snippet: opp.content_snippet,
      }));

  } catch (error) {
    console.error('Error analyzing content opportunity:', error);
    throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function testLLMConnection(): Promise<boolean> {
  try {
    // Test the primary analysis provider
    const provider = getProviderForCapability(LLMCapability.THINKING);

    const response = await provider.complete({
      messages: [
        {
          role: 'user',
          content: 'Respond with just the word "connected"',
        },
      ],
      maxTokens: 100,
    });

    return response.content.toLowerCase().includes('connected');
  } catch (error) {
    console.error('LLM connection test failed:', error);
    return false;
  }
}

// Backward compatibility
export const testClaudeConnection = testLLMConnection;
