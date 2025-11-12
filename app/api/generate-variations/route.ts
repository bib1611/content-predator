import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { opportunity, format = 'tweet' } = body;

    if (!opportunity) {
      return NextResponse.json({ success: false, error: 'Opportunity required' }, { status: 400 });
    }

    const prompt = `You are a content strategist creating 3 distinct variations of the same content idea.

OPPORTUNITY:
Type: ${opportunity.type}
Platform: ${opportunity.platform}
Angle: ${opportunity.angle}
Hook: ${opportunity.hook}
CTA: ${opportunity.cta}
Context: ${opportunity.description}

FORMAT: ${format}

Create 3 completely different versions. Each version should have:
1. A UNIQUE HOOK (different opening, different angle)
2. A UNIQUE BODY (different examples, different flow)
3. A UNIQUE CTA (different call-to-action approach)

Version 1: Direct and confrontational (hit them between the eyes)
Version 2: Story-driven (use narrative, example, or case study)
Version 3: Data/logic-driven (use stats, logic, frameworks)

${format === 'tweet' ? 'Each version: MAX 250 characters' : ''}
${format === 'thread' ? 'Each version: 6-8 tweets, confrontational tone' : ''}
${format === 'article' ? 'Each version: Article outline with sections' : ''}

Return as JSON:
{
  "variations": [
    {
      "version": 1,
      "style": "Confrontational",
      "hook": "...",
      "content": "...",
      "cta": "...",
      "why_this_works": "Brief explanation"
    },
    {
      "version": 2,
      "style": "Story-driven",
      "hook": "...",
      "content": "...",
      "cta": "...",
      "why_this_works": "Brief explanation"
    },
    {
      "version": 3,
      "style": "Data/Logic",
      "hook": "...",
      "content": "...",
      "cta": "...",
      "why_this_works": "Brief explanation"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
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
      throw new Error('Unexpected response type');
    }

    // Parse JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not parse variations from response');
    }

    const variations = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      variations: variations.variations,
    });
  } catch (error: any) {
    console.error('Variation generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Generation failed' },
      { status: 500 }
    );
  }
}
