import Anthropic from '@anthropic-ai/sdk';
import { OpportunityAnalysis } from './analyzer';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ContentFormat =
  | 'tweet'
  | 'thread'
  | 'article'
  | 'quote_tweet'
  | 'poll_tweet'
  | 'list_thread'
  | 'story_thread'
  | 'linkedin_post'
  | 'linkedin_article'
  | 'listicle'
  | 'case_study'
  | 'myth_buster';

export interface GeneratedContentResult {
  content: string;
  hook: string;
  cta: string;
  format: ContentFormat;
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

  quote_tweet: (opportunity: OpportunityAnalysis) => `
Generate a quote tweet response for The Biblical Man brand.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}

A quote tweet adds your take to someone else's post. Be confrontational but not petty.

REQUIREMENTS:
- Open with strong take that reframes or challenges the quoted post
- Add depth or contrarian angle
- Biblical principle or masculine truth
- 250 characters maximum
- Can reference "this take" or "this mindset" without being personal

Return ONLY the quote tweet text.
`,

  poll_tweet: (opportunity: OpportunityAnalysis) => `
Generate a Twitter poll for The Biblical Man brand.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}

POLL STRUCTURE:
1. Setup question (provocative, forces choice) - 150 chars max
2. Four poll options (binary or spectrum choices)
3. Optional: Follow-up context tweet

REQUIREMENTS:
- Question forces uncomfortable binary choice
- Options reveal reader's beliefs
- No "moderate" cop-out option
- Setup is confrontational but fair

FORMAT:
[QUESTION]

OPTIONS:
- [Option 1]
- [Option 2]
- [Option 3]
- [Option 4]

[CONTEXT TWEET - optional, 250 chars]
`,

  list_thread: (opportunity: OpportunityAnalysis) => `
Generate a numbered list thread (7-10 items) for The Biblical Man brand.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}
Hook: ${opportunity.hook}

THREAD STRUCTURE:
1. Hook tweet: "X things about [topic] that [audience] won't tell you"
2-10. Each item: Bold claim + one-sentence explanation
Final. CTA: ${opportunity.cta}

REQUIREMENTS:
- Each item is confrontational truth
- Specific, not vague principles
- Mix of tactical and philosophical
- 250 characters max per tweet
- Number each (1., 2., 3., etc.)
- NO soft language

Return tweets separated by "---".
`,

  story_thread: (opportunity: OpportunityAnalysis) => `
Generate a narrative story thread (8-12 tweets) for The Biblical Man brand.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}

STORY STRUCTURE:
1. Hook: Pattern interrupt that teases story
2-3. Setup: Context, protagonist, situation
4-6. Conflict: Problem, tension, stakes
7-9. Climax: Turning point, decision made
10-11. Resolution: Outcome, lesson learned
12. Lesson + CTA: ${opportunity.cta}

REQUIREMENTS:
- True story or biblical narrative (not hypothetical)
- Visceral details and specific moments
- Clear masculine lesson
- Conversational but not soft
- 250 chars per tweet

Return tweets separated by "---".
`,

  linkedin_post: (opportunity: OpportunityAnalysis) => `
Generate a LinkedIn post for The Biblical Man brand (adapted for professional audience).

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}

LINKEDIN VOICE:
- Professional but direct (not corporate)
- Challenges conventional wisdom in business/leadership
- Biblical principles applied to work/leadership
- Less visceral than Twitter, more authoritative

STRUCTURE:
- Hook (first 2 lines - shown in feed)
- Problem statement (what leaders get wrong)
- Biblical/historical perspective
- Modern application to leadership/business
- CTA: ${opportunity.cta}

REQUIREMENTS:
- 1300 characters maximum
- Line breaks for readability
- Can use one emoji max
- Professional but confrontational

Return complete post.
`,

  linkedin_article: (opportunity: OpportunityAnalysis) => `
Generate a LinkedIn article outline for The Biblical Man brand.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}

Similar to Substack article but for LinkedIn audience:
- Professional leaders and executives
- Biblical principles applied to business
- Leadership, decision-making, culture
- Less theological depth, more practical application

OUTPUT:
1. TITLE (SEO-friendly for business/leadership)
2. HOOK PARAGRAPH (150 words)
3. OUTLINE (5-7 sections for LinkedIn length)
4. CTA: ${opportunity.cta}

Professional but direct voice.
`,

  listicle: (opportunity: OpportunityAnalysis) => `
Generate a listicle article for The Biblical Man brand.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}

LISTICLE STRUCTURE:
- TITLE: "X [Things] About [Topic] That [Audience] Need to Hear"
- INTRO: 100-150 words, sets up the list
- 7-10 ITEMS: Each with:
  * Bold headline (confrontational statement)
  * 2-3 paragraphs explaining
  * Specific example or biblical reference
- CONCLUSION + CTA: ${opportunity.cta}

REQUIREMENTS:
- Each item can stand alone
- Confrontational but substantive
- Mix of mindset and tactics
- Scannable format

Return full outline.
`,

  case_study: (opportunity: OpportunityAnalysis) => `
Generate a case study article analyzing a specific example.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}

CASE STUDY STRUCTURE:
1. TITLE: "What [Person/Situation] Teaches Us About [Principle]"
2. INTRODUCTION: Set up the case (biblical figure, historical leader, or modern example)
3. CONTEXT: Situation and stakes
4. ANALYSIS: What they did right/wrong through Biblical Man lens
5. PRINCIPLES: 3-5 extracted lessons
6. APPLICATION: How readers apply this today
7. CTA: ${opportunity.cta}

REQUIREMENTS:
- Real example (biblical or historical preferred)
- Deep analysis, not surface observation
- Confrontational interpretations
- Actionable principles

Return full outline with section descriptions.
`,

  myth_buster: (opportunity: OpportunityAnalysis) => `
Generate a "myth-busting" article for The Biblical Man brand.

OPPORTUNITY CONTEXT:
Type: ${opportunity.type}
Description: ${opportunity.description}
Angle: ${opportunity.angle}

MYTH-BUSTER STRUCTURE:
- TITLE: "X Lies About [Topic] (And The Truth They're Hiding)"
- INTRO: Why these myths matter and who benefits from them
- 5-7 MYTHS: For each:
  * THE LIE: What culture/church teaches
  * WHY IT'S WRONG: Biblical/historical evidence
  * THE TRUTH: Confrontational reality
  * WHAT TO DO: Practical application
- CONCLUSION: Ties myths together, CTA: ${opportunity.cta}

REQUIREMENTS:
- Myths are commonly believed
- Biblical/historical evidence for rebuttal
- Not just contrarian, substantive
- Forces uncomfortable conclusions

Return full outline.
`,
};

export async function generateContent(
  opportunity: OpportunityAnalysis,
  format?: ContentFormat
): Promise<GeneratedContentResult> {
  const contentFormat = format || opportunity.suggested_format;
  const template = CONTENT_TEMPLATES[contentFormat];

  if (!template) {
    throw new Error(`Invalid content format: ${contentFormat}`);
  }

  const prompt = template(opportunity);

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: contentFormat === 'article' ? 4096 : 2048,
      temperature: 1,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const generatedText = content.text.trim();

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
  format: ContentFormat
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
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: format === 'article' ? 4096 : 2048,
      temperature: 1,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const generatedText = content.text.trim();

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
