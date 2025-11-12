import { NextRequest, NextResponse } from 'next/server';
import {
  getProviderForCapability,
  LLMCapability,
} from '@/lib/llm';

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

      // Use critique-capable provider for applying fixes
      const provider = getProviderForCapability(LLMCapability.CRITIQUE);

      const response = await provider.complete({
        messages: [
          {
            role: 'user',
            content: fixPrompt,
          },
        ],
        maxTokens: 4096,
        temperature: 0.7,
        capability: LLMCapability.CRITIQUE,
      });

      return NextResponse.json({
        success: true,
        fixedContent: response.content.trim(),
      });
    }

    // Otherwise, generate critique
    const prompt = `You are a brutal copy editor for direct-response marketing. Analyze this ${format} and provide actionable critique.

CONTENT TO CRITIQUE:
${content}

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

    // Use critique-capable provider
    const provider = getProviderForCapability(LLMCapability.CRITIQUE);

    const response = await provider.complete({
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      maxTokens: 2048,
      temperature: 0.7,
      capability: LLMCapability.CRITIQUE,
    });

    return NextResponse.json({
      success: true,
      critique: response.content.trim(),
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
