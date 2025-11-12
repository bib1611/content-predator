import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { requireUser } from '@/lib/supabase-server';
import { handleApiError, createSuccessResponse } from '@/lib/error-handler';
import { critiqueSchema } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, rateLimitExceeded } from '@/lib/rate-limit';
import { wrapUserInput, validateFeedback } from '@/lib/prompt-sanitizer';

// Validate API key
const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error('Missing required environment variable: ANTHROPIC_API_KEY must be set');
}

const anthropic = new Anthropic({ apiKey });

/**
 * POST /api/critique
 * Critique content or apply fixes from critique
 * Most expensive endpoint - strict rate limiting
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();

    // Strict rate limiting (this is expensive - multiple Claude calls)
    const rateLimitKey = getRateLimitKey(request, user.id);
    const rateLimit = checkRateLimit(rateLimitKey, 'critique');

    if (!rateLimit.success) {
      return NextResponse.json(
        rateLimitExceeded(rateLimit.resetTime),
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = critiqueSchema.parse(body);

    // If applyFixes is true, apply the critique fixes to the content
    if (validated.applyFixes && body.critique) {
      // Validate critique doesn't contain suspicious patterns
      const feedbackValidation = validateFeedback(body.critique);
      if (!feedbackValidation.valid) {
        return NextResponse.json(
          { error: `Invalid critique: ${feedbackValidation.reason}` },
          { status: 400 }
        );
      }

      // Wrap user inputs to prevent prompt injection
      const wrappedContent = wrapUserInput(validated.content, 'ORIGINAL CONTENT');
      const wrappedCritique = wrapUserInput(body.critique, 'CRITIQUE WITH FIXES');

      const fixPrompt = `You are a copy editor implementing fixes. Apply ALL the suggested fixes from the critique to improve this content.

${wrappedContent}

${wrappedCritique}

INSTRUCTIONS:
- Apply every fix mentioned in the critique
- Maintain the same format and structure
- Keep the same tone and voice
- Only change what the critique specifically called out
- Return ONLY the fixed content, no explanation

OUTPUT THE FIXED CONTENT:`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: fixPrompt,
          },
        ],
      });

      const fixedContent = message.content[0];
      if (fixedContent.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return createSuccessResponse({
        success: true,
        fixedContent: fixedContent.text.trim(),
      });
    }

    // Otherwise, generate critique
    // Wrap user content to prevent prompt injection
    const wrappedContent = wrapUserInput(validated.content, 'CONTENT TO CRITIQUE');
    const formatLabel = validated.format || 'content';

    const prompt = `You are a brutal copy editor for direct-response marketing. Analyze this ${formatLabel} and provide actionable critique.

${wrappedContent}

PROVIDE:

**WHAT WORKS:** (2-3 specific things)
- [Specific element] - [Why it's effective]

**WHAT FAILS:** (2-3 specific problems)
- [Specific element] - [Why it's killing conversions]

**IMMEDIATE FIXES:**
1. [Specific line/section to change] → [Exact replacement]
2. [Specific problem] → [Specific solution]
3. [Specific weakness] → [Specific strength]

**CONVERSION SCORE:** [1-10]/10

**ONE-LINE VERDICT:**
[Brutal, honest assessment in 10 words or less]

CRITIQUE RULES:
- Be specific (line numbers, exact phrases)
- Focus on conversion impact
- No praise without improvement
- Direct, confrontational tone
- Actionable fixes only
- Call out jargon and BS
`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const critiqueContent = message.content[0];
    if (critiqueContent.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return createSuccessResponse({
      success: true,
      critique: critiqueContent.text.trim(),
    });

  } catch (error) {
    return handleApiError(error, 'Critique');
  }
}
