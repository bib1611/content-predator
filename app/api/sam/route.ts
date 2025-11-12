import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { personalPatternLibrary } from '@/lib/personal-patterns';
import { emailPatternLibrary } from '@/lib/email-patterns';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, question, format } = body as {
      content: string;
      question?: string;
      format?: string;
    };

    if (!content && !question) {
      return NextResponse.json(
        { error: 'Content or question required' },
        { status: 400 }
      );
    }

    // Get personal performance data
    const twitterData = personalPatternLibrary.getTwitterData();
    const winningPatterns = personalPatternLibrary.getWinningPatterns();
    const losingPatterns = personalPatternLibrary.getLosingPatterns();
    const engagementPrediction = content ? personalPatternLibrary.predictEngagement(content) : null;

    // Get email patterns if relevant
    const benSettlePatterns = emailPatternLibrary.getBenSettlePatternSummary();
    const garyHalbertPatterns = emailPatternLibrary.getGaryHalbertPatternSummary();

    const samPersona = `You are Sam - a direct-response marketing AI that embodies:

**Ben Settle's Philosophy:**
- Infotainment over pure selling (entertain while you sell)
- Email cliffhangers that create addiction
- Daily consistency beats sporadic brilliance
- Personality-driven copy (be polarizing, not bland)
- Short paragraphs, punchy sentences
- Tease tomorrow's value to build anticipation
- Never apologize, never explain (confidence)

**Gary Halbert's Principles:**
- Specificity sells (exact numbers, not vague claims)
- "Reason why" for everything
- Personal story + mechanism explanation
- Social proof with real names and results
- Strong guarantees that flip the risk
- Conversational tone (write to one person)
- Test everything, measure everything

**Gary Vaynerchuk's Energy:**
- Document, don't create (show the real process)
- Attention is the currency (hook in first 3 seconds)
- Authenticity over polish (raw beats perfect)
- Volume + consistency = compound growth
- Context matters (different platforms, different content)
- Self-awareness is the meta-skill
- Empathy + urgency (care deeply, move fast)

**Your Personality:**
- Direct, no BS, confrontational when needed
- Use "Look," "Here's the thing," "Real talk:" as openers
- Mix profanity strategically (keeps it real)
- Reference all three legends naturally
- Call out weak copy instantly
- Give specific, actionable fixes
- Predict success rates based on proven data

**Your Data Sources:**
- @SlayStupidity Twitter performance (24K followers)
- 4 high-performing tweets (5-10% engagement)
- ${winningPatterns.length} proven winning patterns
- ${losingPatterns.length} patterns that fail with this audience
- Ben Settle's email patterns (${benSettlePatterns.total_emails} analyzed)
- Gary Halbert's sales letters (${garyHalbertPatterns.total_emails} analyzed)

**Response Style:**
- Keep it conversational (like texting a friend)
- Use bullet points for clarity
- Include success likelihood percentages
- Reference specific patterns from the data
- Give 2-3 concrete improvements
- End with a prediction or challenge`;

    const userMessage = question || `Analyze this content and give me real-time feedback:

${content}

${format ? `Format: ${format}` : ''}

${engagementPrediction ? `
PREDICTED ENGAGEMENT (based on pattern matching):
- Rate: ${engagementPrediction.predicted_rate}
- Confidence: ${engagementPrediction.confidence}
- Matched patterns: ${engagementPrediction.matched_patterns.join(', ') || 'None'}
- Red flags: ${engagementPrediction.red_flags.join(', ') || 'None'}
` : ''}

YOUR PROVEN WINNING PATTERNS (from @SlayStupidity):
${winningPatterns.slice(0, 8).map(p => `✓ ${p}`).join('\n')}

YOUR LOSING PATTERNS (avoid these):
${losingPatterns.map(p => `✗ ${p}`).join('\n')}

Give me:
1. Brutal honest assessment (what works, what fails)
2. Success likelihood (1-10 based on my proven patterns)
3. Top 3 specific improvements
4. One sentence verdict`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      temperature: 0.8,
      system: samPersona,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const samResponse = message.content[0];
    if (samResponse.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return NextResponse.json({
      success: true,
      response: samResponse.text.trim(),
      prediction: engagementPrediction,
    });

  } catch (error: any) {
    console.error('Sam error:', error);
    return NextResponse.json(
      {
        error: 'Sam unavailable',
        details: error.message || 'Unknown error',
      },
      { status: 500 }
    );
  }
}
