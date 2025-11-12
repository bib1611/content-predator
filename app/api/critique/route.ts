import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { emailPatternLibrary } from '@/lib/email-patterns';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, format, applyFixes, critique } = body as {
      content: string;
      format: string;
      applyFixes?: boolean;
      critique?: string;
    };

    if (!content) {
      return NextResponse.json(
        { error: 'No content provided' },
        { status: 400 }
      );
    }

    // If applyFixes is true, apply the critique fixes to the content
    if (applyFixes && critique) {
      const fixPrompt = `You are a copy editor implementing fixes. Apply ALL the suggested fixes from the critique to improve this content.

ORIGINAL CONTENT:
${content}

CRITIQUE WITH FIXES:
${critique}

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

      return NextResponse.json({
        success: true,
        fixedContent: fixedContent.text.trim(),
      });
    }

    // Otherwise, generate critique
    // Get reference patterns based on format
    let styleReference = '';
    if (format === 'ben_settle_email' || format.toLowerCase().includes('ben settle')) {
      styleReference = emailPatternLibrary.getCritiqueReference('ben_settle');
    } else if (format === 'gary_halbert_letter' || format.toLowerCase().includes('gary halbert') || format.toLowerCase().includes('sales letter')) {
      styleReference = emailPatternLibrary.getCritiqueReference('gary_halbert');
    } else if (format.toLowerCase().includes('email')) {
      // For generic emails, provide comparison guide
      styleReference = emailPatternLibrary.getComparisonGuide();
    }

    const prompt = `You are a brutal copy editor for direct-response marketing. Analyze this ${format} and provide actionable critique.

CONTENT TO CRITIQUE:
${content}

${styleReference ? `
REFERENCE STANDARDS (from proven emails):
${styleReference}

Compare the content against these proven patterns and techniques.
` : ''}

PROVIDE:

**WHAT WORKS:** (2-3 specific things)
- [Specific element] - [Why it's effective]

**WHAT FAILS:** (2-3 specific problems)
- [Specific element] - [Why it's killing conversions]
${styleReference ? '- [How it deviates from proven patterns above]' : ''}

**IMMEDIATE FIXES:**
1. [Specific line/section to change] → [Exact replacement]
2. [Specific problem] → [Specific solution with reference to proven techniques]
3. [Specific weakness] → [Specific strength based on examples]

**CONVERSION SCORE:** [1-10]/10
${styleReference ? '[Compare to proven examples - would this stand alongside them?]' : ''}

**ONE-LINE VERDICT:**
[Brutal, honest assessment in 10 words or less]

CRITIQUE RULES:
- Be specific (line numbers, exact phrases)
- Focus on conversion impact
- Reference proven patterns from above when applicable
- No praise without improvement
- Direct, confrontational tone
- Actionable fixes only
- Call out jargon and BS
- Show how to match the masters (Ben Settle, Gary Halbert)
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

    return NextResponse.json({
      success: true,
      critique: critiqueContent.text.trim(),
    });

  } catch (error) {
    console.error('Critique error:', error);
    return NextResponse.json(
      {
        error: 'Critique failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
