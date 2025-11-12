import Anthropic from '@anthropic-ai/sdk';
import { OpportunityAnalysis } from './analyzer';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type MarketingFormat =
  | 'launch_email'
  | 'feature_email'
  | 'ben_settle_email'
  | 'gary_halbert_letter'
  | 'long_tweet'
  | 'thread_10x'
  | 'landing_page'
  | 'sales_page';

export interface MarketingContent {
  content: string;
  subject?: string;
  hook: string;
  cta: string;
  format: MarketingFormat;
}

const MARKETING_TEMPLATES = {
  launch_email: (opp: OpportunityAnalysis) => `
Generate a direct-response launch email for The Biblical Man brand.

OPPORTUNITY:
${opp.description}
Angle: ${opp.angle}
Hook: ${opp.hook}

BRAND VOICE:
- Ben Settle / Gary Halbert style
- Confrontational, not soft
- Story-driven with personal stakes
- Biblical truth that challenges comfortable Christianity
- Zero corporate speak

EMAIL STRUCTURE:

**Subject Line:**
[Controversial statement about their problem - make them HAVE to open]

**Body:**

[First name],

[Open with a story - 2-3 sentences about a painful moment they'll relate to]

That was me [timeframe] ago.

[Brief struggle, then the turn]

[Product/insight] changed everything.

**Here's what shifts:**

Before:
- [Specific pain 1]
- [Specific pain 2]
- [Specific pain 3]

After:
- [Specific transformation 1]
- [Specific transformation 2]
- [Specific transformation 3]

[Bold claim with number/metric]

[Social proof if available - one brutal line]

The catch? [Address main objection honestly - no BS]

But if you're done with [pain], here's your move:

[Strong CTA]

${opp.cta}

[Real urgency/scarcity]

-[Name]

P.S. [Restate benefit + cost of inaction]

Requirements:
- Subject must be pattern interrupt
- Open with relatable pain story
- Use "you" 3x more than "we"
- One clear action
- No fake urgency
- Grade 8 reading level
`,

  ben_settle_email: (opp: OpportunityAnalysis) => `
Generate an email in Ben Settle's style for The Biblical Man brand.

OPPORTUNITY:
${opp.description}
Angle: ${opp.angle}

BEN SETTLE STYLE RULES:
- Short paragraphs (1-3 sentences max)
- Contrarian take that pisses people off
- Story that proves the point
- Subtle product mention (if at all)
- Email cliff - makes them want tomorrow's email
- Zero selling in the traditional sense
- Entertaining first, selling second

STRUCTURE:

Subject: [Contrarian statement or story hook]

[Story opening - grab attention immediately]

Here's the thing:

[Contrarian insight about the industry/topic]

Most [target audience] don't get this.

They're too busy [wasteful common behavior].

Meanwhile...

[What's really happening / the truth they're missing]

[Biblical or historical parallel that drives it home]

This is why [percentage]% of [group] fail at [goal].

[Your product] fixes this.

But not how you think.

[Tease the mechanism without explaining]

More on that tomorrow.

[Sign off]

P.S. [Intriguing question or statement that sets up next email]

Requirements:
- Must be entertaining even without buying
- Tease more value tomorrow
- No desperate selling
- Controversial but true
- Story-driven
`,

  gary_halbert_letter: (opp: OpportunityAnalysis) => `
Generate a sales letter in Gary Halbert's style for The Biblical Man brand.

OPPORTUNITY:
${opp.description}
Angle: ${opp.angle}

GARY HALBERT STYLE:
- Start with attention-grabbing mechanism
- "Reason why" copy - explain everything
- Specificity over vagueness
- Bullets that sell (feature + hidden benefit)
- Conversational but commanding
- Build massive desire before the ask

LETTER STRUCTURE:

**Headline:**
[Specific, bold claim with mechanism]
"How [specific group] [achieved result] Using [unexpected method]"

Dear Friend,

[Opening story or shocking fact that proves the problem]

Look, I'm going to be straight with you:

[Brutal truth about their situation]

And here's why this matters NOW:

[Urgency based on real consequences]

**The [Method/System] That Changes Everything:**

[Explain the core mechanism - be specific]

Here's exactly what this means for you:

• [Benefit with specific number] - because [reason why]
• [Benefit with specific number] - which means [hidden benefit]
• [Benefit with specific number] - so you can finally [desire]
• [Benefit with specific number] - without [common pain]
• [Benefit with specific number] - even if [objection]

**Social Proof:**

[Specific results from real people with numbers]

**The Investment:**

[Price justification - compare to cost of problem]

**Guarantee:**

[Strong, specific guarantee that flips the risk]

**Order Now:**

${opp.cta}

[Reason to act immediately]

Your friend in [topic],

[Signature]

P.S. [Restate biggest benefit + urgency]
P.P.S. [Address final objection]

Requirements:
- Specific numbers everywhere
- "Reason why" for everything
- Conversational tone
- Build massive desire
- Clear mechanism explanation
`,

  long_tweet: (opp: OpportunityAnalysis) => `
Generate a long-form standalone tweet for The Biblical Man (280+ characters).

OPPORTUNITY:
${opp.description}
Hook: ${opp.hook}
Angle: ${opp.angle}

LONG TWEET STRUCTURE:

[Punchy hook - stops the scroll]

[2-3 sentences building tension or revealing truth]

[Biblical or historical parallel that drives it home]

[The shift/solution]

[Specific benefit or call to action]

${opp.cta}

Requirements:
- 280-600 characters
- Can stand alone (not thread)
- Pattern interrupt opening
- Biblical/historical reference
- One clear point
- End with action or provocative question
- NO hashtags unless organic
`,

  thread_10x: (opp: OpportunityAnalysis) => `
Generate a high-value Twitter thread (10-15 tweets) for The Biblical Man.

OPPORTUNITY:
${opp.description}
Angle: ${opp.angle}
Hook: ${opp.hook}

THREAD STRUCTURE:

**Tweet 1 - Hook:**
[Controversial statement + thread promise]
[Number] things about [topic] that will [benefit]:
🧵

**Tweet 2 - Set Context:**
[Why this matters / the problem]

**Tweets 3-11 - Value:**
Each tweet = 1 specific insight with:
- Number or label
- Core insight
- Why it matters
- Specific example

Format each as:
[Number]. [Insight headline]

[2-3 sentences explaining + example]

[Why this changes everything]

**Tweet 12 - Synthesis:**
Here's what all this means:
[Connect the dots]

**Tweet 13 - Social Proof:**
Real results:
• [Result 1 with number]
• [Result 2 with number]

**Tweet 14 - Cost of Inaction:**
Every day without [understanding] = [specific loss]

While you [hesitate], [competition action]

**Tweet 15 - CTA:**
Ready to [transformation]?

${opp.cta}

[Benefit or incentive]

Your move.

Requirements:
- 10-15 tweets minimum
- Each tweet standalone valuable
- Build to crescendo
- Mix insights, examples, stories
- Strong CTA
- NO numbering like "1/15"
- Separate tweets with "---"
`,

  landing_page: (opp: OpportunityAnalysis) => `
Generate a conversion-focused landing page for The Biblical Man brand.

OPPORTUNITY:
${opp.description}
Angle: ${opp.angle}

LANDING PAGE STRUCTURE:

**Hero Section:**
# [Headline: Specific bold claim]
## [Subheadline: Who it's for + core benefit]

[One sentence value proposition]

[CTA BUTTON: ${opp.cta}]

**Problem Section:**
## You're Probably [Wasteful Behavior] Like Everyone Else

[Describe current painful reality]

While you [wasteful behavior], [negative consequence].

Most [target audience] waste [specific metric] on [problem].

Here's why that's costing you:
• [Cost 1 with number]
• [Cost 2 with number]
• [Cost 3 with number]

**Solution Section:**
## [Product] Changes That With [Mechanism]

[Explain how it works - one paragraph]

What this means for you:
• [Benefit 1] - [How it saves time/money]
• [Benefit 2] - [What it prevents]
• [Benefit 3] - [What it enables]

[Specific outcome] in [specific timeframe].

**Social Proof:**
## Real Results From [Type of People]

"[Specific testimonial with numbers]" - [Name, Title]

"[Specific result achieved]" - [Name, Title]

"[Transformation described]" - [Name, Title]

**How It Works:**
## Three Steps To [Desired Outcome]

1. **[Action 1]** - [What happens]
2. **[Automated Step]** - [System does work]
3. **[Result]** - [Specific transformation]

No [objection]. No [objection]. Just [benefit].

**Pricing:**
## The Investment

[Price justification paragraph]

**[PRICE]** - [What they get]

[What this prevents vs. costs]

[CTA BUTTON: ${opp.cta}]

[Money-back guarantee]

**Final Push:**
## The Cost of Waiting

Every [time period] without [product] = [specific loss]

While you hesitate, [competition action].

[CTA BUTTON: Stop Losing, Start [Benefit]]

Requirements:
- Specific numbers everywhere
- Address objections
- Social proof with results
- Clear value ladder
- Multiple CTAs
- Benefit-driven copy
`,

  feature_email: (opp: OpportunityAnalysis) => `
Generate a feature announcement email for The Biblical Man brand.

OPPORTUNITY:
${opp.description}

STRUCTURE:

Subject: [Product] Just Killed [Old Painful Way]

[First name],

Remember when I said [product] would [bold promise]?

Just shipped it.

**[Feature Name] is live.**

What it does:
[One sentence - crystal clear]

What it means for you:
[Specific benefit with number/metric]

How to use it:
1. [Step 1 - 5 words max]
2. [Step 2 - 5 words max]
3. [Watch it happen]

Already using [product]?
→ It's in your dashboard now

Not yet?
→ ${opp.cta}

This feature alone saves [specific metric].

No BS. No learning curve.

Just [core benefit].

-[Name]

P.S. Next week: [Tease next feature - build anticipation]

Requirements:
- Direct, no fluff
- Clear steps
- Specific savings/benefit
- CTA for both users and non-users
`,

  sales_page: (opp: OpportunityAnalysis) => `
Generate long-form sales page copy for The Biblical Man brand.

OPPORTUNITY:
${opp.description}
Angle: ${opp.angle}

SALES PAGE STRUCTURE:

# [Headline: Specific transformation promise]

## [Subheadline: Time frame + mechanism]

[Pre-headline: Who this is for]

---

**[Opening Story - 3-4 paragraphs]**

[Paint the picture of struggle]
[The turning point]
[The discovery]
[The transformation]

---

## The Problem Most [Audience] Face

[Describe painful current state - 2-3 paragraphs]

You've probably tried:
- [Common solution 1] - [why it fails]
- [Common solution 2] - [why it fails]
- [Common solution 3] - [why it fails]

None of them work because [root cause].

## The [Method/System] That Actually Works

[Introduce your solution - 2 paragraphs]

Here's exactly what you get:

### Module 1: [Name]
[What it covers] - [Specific benefit]

### Module 2: [Name]
[What it covers] - [Specific benefit]

### Module 3: [Name]
[What it covers] - [Specific benefit]

**Plus These Bonuses:**
• [Bonus 1 with value]
• [Bonus 2 with value]
• [Bonus 3 with value]

## Who This Is For (And Who It's Not)

**This IS for you if:**
- [Qualifier 1]
- [Qualifier 2]
- [Qualifier 3]

**This is NOT for you if:**
- [Disqualifier 1]
- [Disqualifier 2]

## Real Results

[3-5 specific testimonials with numbers and names]

## The Investment

[Value stack showing total worth]

**Regular Price:** $[Higher price]

**Today:** $[Actual price]

[Why the discount/offer]

**Guarantee:**
[Specific, strong guarantee that flips risk]

## FAQ

**Q: [Common question]**
A: [Direct answer]

**Q: [Objection]**
A: [Handle objection]

**Q: [Technical question]**
A: [Clear answer]

## Final Decision

[Recap the transformation]

[Urgency based on real scarcity or opportunity cost]

[CTA BUTTON: ${opp.cta}]

[Final P.S. with biggest benefit]

Requirements:
- 2000+ words
- Story-driven opening
- Address ALL objections
- Social proof throughout
- Value stacking
- Strong guarantee
- Multiple CTAs
`,
};

export async function generateMarketingContent(
  opportunity: OpportunityAnalysis,
  format: MarketingFormat
): Promise<MarketingContent> {
  const template = MARKETING_TEMPLATES[format];

  if (!template) {
    throw new Error(`Invalid marketing format: ${format}`);
  }

  const prompt = template(opportunity);

  try {
    const maxTokens = ['sales_page', 'landing_page', 'gary_halbert_letter'].includes(format)
      ? 8192
      : ['thread_10x'].includes(format)
      ? 4096
      : 2048;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
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

    // Extract subject line for emails
    let subject: string | undefined;
    if (format.includes('email') || format === 'gary_halbert_letter') {
      const subjectMatch = generatedText.match(/Subject:\s*(.+)/i);
      subject = subjectMatch ? subjectMatch[1].trim() : undefined;
    }

    // Extract hook
    const lines = generatedText.split('\n');
    const hook = lines.find(l => l.trim() && !l.startsWith('#') && !l.startsWith('Subject'))?.trim() || opportunity.hook;

    return {
      content: generatedText,
      subject,
      hook,
      cta: opportunity.cta,
      format,
    };

  } catch (error) {
    console.error('Error generating marketing content:', error);
    throw new Error(`Marketing content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
