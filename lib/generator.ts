import {
  getProviderForCapability,
  LLMCapability,
} from './llm';
import { OpportunityAnalysis } from './analyzer';

export interface GeneratedContentResult {
  content: string;
  hook: string;
  cta: string;
  format: 'tweet' | 'thread' | 'article';
}

const CONTENT_TEMPLATES = {
  tweet: (opportunity: OpportunityAnalysis) => `
Generate a single confrontational tweet for The Biblical Man brand.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}
Suggested Hook: ${opportunity.hook}

BRAND VOICE:
- Confrontational, not soft
- Biblical truth that challenges comfortable Christianity
- Visceral imagery or historical parallels
- Forces binary choices (no middle ground)
- Pattern interrupt that stops the scroll

REQUIREMENTS:
- Open with pattern interrupt hook (can use or improve the suggested hook)
- Core message: Biblical truth that punches comfortable Christianity in the mouth
- Include visceral imagery or specific historical/biblical example
- End with binary choice or confrontational question
- 250 characters maximum
- NO hashtags unless organically part of the message
- NO soft language ("maybe", "consider", "perhaps")

CTA to include: ${opportunity.cta}

Return ONLY the tweet text. No quotes, no explanation, just the raw tweet.
`,

  thread: (opportunity: OpportunityAnalysis) => `
Generate a Twitter thread (6-8 tweets) for The Biblical Man brand.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}
Suggested Hook: ${opportunity.hook}

BRAND VOICE:
- Confrontational and visceral
- Biblical truth vs cultural Christianity
- Historical/biblical examples
- Forces readers to choose a side

THREAD STRUCTURE:
1. Hook tweet: Pattern interrupt, confrontational opener (use or improve suggested hook)
2. Problem: What comfortable Christianity gets wrong (visceral, specific)
3. Biblical truth: What Scripture actually says (confrontational interpretation)
4. Historical parallel: Example from history or biblical narrative
5. Modern application: What this means TODAY for the reader
6. Binary choice: Two paths - no middle ground
7. CTA: ${opportunity.cta}

REQUIREMENTS:
- Each tweet stands alone but builds on previous
- No soft language or hedging
- Specific examples, not vague principles
- 250 characters max per tweet
- NO numbering (1/7, 2/7, etc.)
- NO hashtags unless organic

Return tweets separated by "---" (three dashes on their own line).
Example format:
Your wife doesn't respect you because you've confused submission with simping.
---
Modern churches teach "servant leadership" but what they mean is "be her butler with a Bible."
---
[etc.]
`,

  article: (opportunity: OpportunityAnalysis) => `
Generate a Substack article outline and opening for The Biblical Man brand.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}
Suggested Hook: ${opportunity.hook}

BRAND VOICE:
- Long-form confrontational writing
- Biblical exegesis that challenges comfortable readings
- Historical and theological depth
- Visceral language and specific examples
- Forces readers to uncomfortable conclusions

REQUIRED OUTPUT:

1. TITLE (compelling, confrontational, SEO-friendly)

2. SUBTITLE (expands on title, sets expectation)

3. HOOK PARAGRAPH (150-200 words)
   - Opens with pattern interrupt
   - Uses suggested hook or improves it
   - Sets up the tension/problem
   - Visceral and specific

4. ARTICLE OUTLINE (7-10 sections)
   - Section titles as statements, not questions
   - Each section 2-3 sentences describing content
   - Builds logical argument from problem to solution
   - Includes biblical/historical evidence

5. CONCLUSION CTA
   - Ties to: ${opportunity.cta}
   - Direct, no soft sell

FORMAT:
# [TITLE]
## [SUBTITLE]

[HOOK PARAGRAPH]

### Outline:
1. **[Section Title]** - [Description]
2. **[Section Title]** - [Description]
[etc.]

### Conclusion CTA:
[CTA text]
`,
};

export async function generateContent(
  opportunity: OpportunityAnalysis,
  format?: 'tweet' | 'thread' | 'article'
): Promise<GeneratedContentResult> {
  const contentFormat = format || opportunity.suggested_format;
  const template = CONTENT_TEMPLATES[contentFormat];

  if (!template) {
    throw new Error(`Invalid content format: ${contentFormat}`);
  }

  const prompt = template(opportunity);

  try {
    // Use the best provider for content generation
    const provider = getProviderForCapability(LLMCapability.GENERATION);

    const response = await provider.complete({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      maxTokens: contentFormat === 'article' ? 4096 : 2048,
      temperature: 1,
      capability: LLMCapability.GENERATION,
    });

    const generatedText = response.content.trim();

    // Extract hook (first line or tweet for threads)
    let hook = opportunity.hook;
    if (contentFormat === 'thread') {
      const firstTweet = generatedText.split('---')[0].trim();
      hook = firstTweet.split('\n')[0].trim();
    } else if (contentFormat === 'tweet') {
      hook = generatedText.split('\n')[0].trim();
    }

    return {
      content: generatedText,
      hook: hook,
      cta: opportunity.cta,
      format: contentFormat,
    };

  } catch (error) {
    console.error('Error generating content:', error);
    throw new Error(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function regenerateWithFeedback(
  opportunity: OpportunityAnalysis,
  previousContent: string,
  feedback: string,
  format: 'tweet' | 'thread' | 'article'
): Promise<GeneratedContentResult> {
  const prompt = `
You previously generated this content for The Biblical Man:

${previousContent}

USER FEEDBACK:
${feedback}

ORIGINAL OPPORTUNITY:
${JSON.stringify(opportunity, null, 2)}

Regenerate the ${format} incorporating the feedback while maintaining the confrontational Biblical Man voice.

${CONTENT_TEMPLATES[format](opportunity)}
`;

  try {
    // Use the best provider for content generation
    const provider = getProviderForCapability(LLMCapability.GENERATION);

    const response = await provider.complete({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      maxTokens: format === 'article' ? 4096 : 2048,
      temperature: 1,
      capability: LLMCapability.GENERATION,
    });

    const generatedText = response.content.trim();

    let hook = opportunity.hook;
    if (format === 'thread') {
      const firstTweet = generatedText.split('---')[0].trim();
      hook = firstTweet.split('\n')[0].trim();
    } else if (format === 'tweet') {
      hook = generatedText.split('\n')[0].trim();
    }

    return {
      content: generatedText,
      hook: hook,
      cta: opportunity.cta,
      format: format,
    };

  } catch (error) {
    console.error('Error regenerating content:', error);
    throw new Error(`Content regeneration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
