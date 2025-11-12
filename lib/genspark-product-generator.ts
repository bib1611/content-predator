import conversionData from './data/personal/gumroad-conversion-data.json';

export interface ProductIdea {
  title: string;
  niche: string;
  description: string;
  targetAudience: string;
  pricePoint: number;
  pageCount: number;
}

export interface GensparkPrompt {
  prompt: string;
  productDetails: ProductIdea;
  estimatedConversionRate: string;
}

export function generateGensparkPrompt(idea: ProductIdea): GensparkPrompt {
  const { title, niche, description, targetAudience, pricePoint, pageCount } = idea;

  const priceTier = pricePoint < 20 ? 'low_ticket' : pricePoint < 50 ? 'mid_ticket' : 'high_ticket';
  const structure = conversionData.high_converting_patterns.pdf_structure.high_converting_outline;
  const qualityReqs = conversionData.genspark_optimization.quality_requirements;

  const prompt = `# Genspark Max: Create High-Converting Gumroad PDF Product

## Product Overview
**Title:** ${title}
**Niche:** ${niche}
**Target Audience:** ${targetAudience}
**Price Point:** $${pricePoint} (${priceTier} positioning)
**Target Page Count:** ${pageCount} pages
**Brand Voice:** The Biblical Man - Raw, reverent, masculine, confrontational truth

---

## Your Mission
Create a complete, ready-to-sell PDF product that converts at 3-5% on Gumroad. This must be actionable, biblical, and designed for Christian men seeking ${niche.toLowerCase()}.

**Product Description:**
${description}

---

## Research & Foundation (Before Writing)

1. **Biblical Foundation**
   - Find 5-7 relevant scripture passages that support this system
   - Include OT warrior/king examples (David, Joshua, Daniel, Joseph)
   - Show where modern Christianity went soft vs biblical masculinity

2. **Problem Research**
   - What keeps Christian men stuck in ${niche.toLowerCase()}?
   - What have they already tried that failed?
   - What's the root cause (not surface symptoms)?

3. **Solution Positioning**
   - Why is this different from generic Christian advice?
   - What's the mechanism that makes it work?
   - What's the minimum viable action they can take today?

---

## PDF Structure (Exact Outline)

${structure.map((section, idx) => `### ${idx + 1}. ${section}
${getSectionInstructions(section, niche)}`).join('\n\n')}

---

## Writing Style Requirements

**Tone & Voice:**
- Direct, confrontational when needed
- No corporate speak, no church-ese
- Raw + Reverent (honest about struggle, grounded in truth)
- Diagnostic not victim framing (explain what's broken, show the fix)
- Present tense for stories (makes it visceral)

**Sentence Structure:**
- Short, punchy sentences (1-3 per paragraph max)
- Mix short and medium length for rhythm
- No academic complexity - Grade 8 reading level
- Active voice always

**Formatting:**
- Clear hierarchy (H1, H2, bullets)
- White space between sections
- Pull quotes from scripture or key insights
- Action boxes (shaded sections with immediate next steps)
- Checklists and templates (high perceived value)

**Content Quality Standards:**
${qualityReqs.map(req => `- ${req}`).join('\n')}

---

## What Success Looks Like

**Reader Experience:**
- Can scan the entire PDF in 10 minutes and extract key insights
- Has 3-5 immediate actions they can take today
- Feels convicted, challenged, and equipped (not shamed)
- Sees clear path from current state to desired outcome
- Wants to share with other men (viral potential)

**Conversion Metrics:**
- 60%+ read completion rate (engaging enough to finish)
- 15%+ implementation rate (actually use the system)
- 10%+ referral rate (recommend to others)
- 3-5% conversion on sales page (industry standard for good products)

---

## Deliverable Specifications

**File Format:** PDF (optimized for digital reading)
**Page Size:** 8.5" x 11" (standard US letter)
**Margins:** 1" all sides
**Font:** Sans-serif for headings (bold), serif for body (readable)
**Colors:** Black text, red accent (#DC2626 for The Biblical Man brand)
**Images:** Minimal - only if they add value (diagrams, frameworks)

**What to Include:**
- Cover page with title and author attribution
- Table of contents (if over 20 pages)
- Page numbers
- Footer with copyright and website
- Internal links (clickable table of contents)

---

## Quality Checklist

Before finalizing, ensure:
- [ ] Every page provides actionable value (no fluff)
- [ ] 5+ scripture references with context
- [ ] 3+ real-world examples or case studies
- [ ] At least 2 checklists or templates
- [ ] Clear implementation steps (what to do Monday morning)
- [ ] Masculine, confrontational tone (not soft or generic)
- [ ] No typos, grammar errors, or formatting issues
- [ ] PDF is under 10MB for easy download
- [ ] Scannable structure (can extract value quickly)

---

## Output Instructions

**Create the complete PDF content with:**
1. Full text for every page
2. Section headings and subheadings
3. Bullet points, numbered lists, and action steps
4. Pull quotes and highlighted insights
5. Checklists and implementation guides
6. Design notes (font sizes, spacing, emphasis)

**Format your output as:**
- Markdown for text structure
- Clear page breaks (--- or ========)
- Design notes in [brackets] where needed
- Ready to copy-paste into PDF software

---

## Example Opening (for calibration):

**COVER PAGE**
[Bold, large title - red accent]
${title}

[Subtitle in smaller text]
${description}

[Author attribution]
By The Biblical Man
TheStupidMan.com

---

**PAGE 2: LETTER FROM THE AUTHOR**

[Heading]
You're Not Broken. You're Just Fighting The Wrong Battle.

[Body - present tense narrative, visceral]
It's 2 AM. You're lying next to your wife. She's asleep. You're not.

You're thinking about ${niche.toLowerCase()}. Again.

The same thoughts loop. The same frustration builds. The same shame creeps in.

Here's what nobody tells you: [Insert contrarian truth that challenges conventional Christian advice]

I learned this the hard way...

[Continue with personal story, then transition to system]

---

Begin creating the full product now. Focus on making this the most actionable, biblical, and conversion-optimized ${niche} resource for Christian men.`;

  const estimatedConversion = pricePoint < 20 ? '4-6%' : pricePoint < 50 ? '3-5%' : '2-4%';

  return {
    prompt,
    productDetails: idea,
    estimatedConversionRate: estimatedConversion,
  };
}

function getSectionInstructions(section: string, niche: string): string {
  const instructions: Record<string, string> = {
    'Cover Page (Strong visual + bold title)': `
- Product title (large, bold, attention-grabbing)
- Subtitle explaining the outcome
- Author attribution (The Biblical Man)
- Visual element suggestion: [Relevant biblical imagery or masculine symbol]`,

    'Letter from Author (Personal story, 1-2 pages)': `
- Open with visceral moment reader will relate to
- Share your struggle with ${niche}
- The turning point (what changed)
- Promise of what's inside
- Make it personal, raw, honest`,

    'The Problem (Paint the pain, 2-3 pages)': `
- Describe current painful reality for ${niche}
- Why conventional solutions fail
- The root cause (not just symptoms)
- Cost of staying stuck (be specific with numbers/impact)
- Transition to hope (there IS a way out)`,

    'The Method Overview (1 page summary)': `
- Name the system/method
- Core principles (3-5 key pillars)
- Why it works (mechanism explanation)
- What makes it different
- Set expectations for what's ahead`,

    'Step-by-Step System (Core content, 10-20 pages)': `
- Break into clear numbered steps
- Each step: What to do + Why it matters + How to implement
- Include scripture grounding for each step
- Real examples or case studies
- Common mistakes to avoid
- Quick wins within each step`,

    'Implementation Checklist (Actionable, 1-2 pages)': `
- 30-day action plan (daily/weekly tasks)
- Checklist format (can print and use)
- Specific, measurable actions
- Accountability suggestions
- Victory milestones`,

    'Bonus Resources (Links, templates, 1-2 pages)': `
- Templates they can copy-paste
- Recommended tools or resources
- Links to related content
- Community or support options
- Extra reading (biblical references)`,

    'Next Steps / Upsell Tease (1 page)': `
- Recap transformation journey
- Encourage immediate action
- Tease next level (coaching, course, community)
- Call to share with other men
- Final encouragement`,
  };

  return instructions[section] || `Create compelling content for: ${section}`;
}

export function getProductSuggestions(opportunity: string): ProductIdea[] {
  const niches = conversionData.proven_niches_for_biblical_man;

  // Find relevant niche based on opportunity text
  const relevantNiche = niches.find(n =>
    opportunity.toLowerCase().includes(n.niche.toLowerCase())
  ) || niches[0];

  return relevantNiche.product_ideas.map((idea, idx) => ({
    title: idea,
    niche: relevantNiche.niche,
    description: `A comprehensive guide for Christian men seeking ${relevantNiche.niche.toLowerCase()}`,
    targetAudience: `Christian men aged 25-45 struggling with ${relevantNiche.niche.toLowerCase()}`,
    pricePoint: [19, 27, 37][idx] || 27,
    pageCount: [20, 25, 30][idx] || 25,
  }));
}

export function getOptimalPricing(niche: string, pageCount: number): number {
  const pricingData = conversionData.high_converting_patterns.pricing_psychology;

  if (pageCount < 20) {
    return 19;
  } else if (pageCount < 30) {
    return 27;
  } else if (pageCount < 40) {
    return 37;
  } else {
    return 47;
  }
}
