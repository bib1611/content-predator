import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export interface EmailExample {
  id: string;
  title: string;
  subject: string;
  author: string;
  style: string;
  category: string;
  key_patterns: string[];
  body: string;
  analysis: {
    opening_hook: string;
    paragraph_count: number;
    avg_paragraph_length: string;
    selling_technique: string;
    cliff_hanger: string;
    contrarian_angle: string;
    story_ratio: string;
  };
  conversion_elements: {
    urgency: string;
    social_proof: string;
    cta_strength: string;
    controversy_level: string;
    [key: string]: string;
  };
}

export interface PatternSummary {
  author: string;
  total_emails: number;
  common_patterns: string[];
  style_characteristics: string[];
  typical_structure: string;
  selling_approach: string;
  example_subjects: string[];
  key_techniques: string[];
}

class EmailPatternLibrary {
  private benSettleEmails: EmailExample[] = [];
  private garyHalbertEmails: EmailExample[] = [];
  private loaded = false;

  constructor() {
    this.loadEmails();
  }

  private loadEmails() {
    if (this.loaded) return;

    try {
      // Load Ben Settle emails
      const benSettlePath = join(process.cwd(), 'lib', 'data', 'emails', 'ben-settle');
      const benSettleFiles = readdirSync(benSettlePath).filter(f => f.endsWith('.json'));

      for (const file of benSettleFiles) {
        const content = readFileSync(join(benSettlePath, file), 'utf-8');
        this.benSettleEmails.push(JSON.parse(content));
      }

      // Load Gary Halbert emails
      const garyHalbertPath = join(process.cwd(), 'lib', 'data', 'emails', 'gary-halbert');
      const garyHalbertFiles = readdirSync(garyHalbertPath).filter(f => f.endsWith('.json'));

      for (const file of garyHalbertFiles) {
        const content = readFileSync(join(garyHalbertPath, file), 'utf-8');
        this.garyHalbertEmails.push(JSON.parse(content));
      }

      this.loaded = true;
    } catch (error) {
      console.error('Error loading email patterns:', error);
      // Don't throw - allow the app to work even if patterns aren't loaded
    }
  }

  getBenSettleEmails(): EmailExample[] {
    return this.benSettleEmails;
  }

  getGaryHalbertEmails(): EmailExample[] {
    return this.garyHalbertEmails;
  }

  getAllEmails(): EmailExample[] {
    return [...this.benSettleEmails, ...this.garyHalbertEmails];
  }

  getEmailsByPattern(pattern: string): EmailExample[] {
    return this.getAllEmails().filter(email =>
      email.key_patterns.includes(pattern)
    );
  }

  getRandomExample(author: 'ben_settle' | 'gary_halbert'): EmailExample | null {
    const emails = author === 'ben_settle' ? this.benSettleEmails : this.garyHalbertEmails;
    if (emails.length === 0) return null;
    return emails[Math.floor(Math.random() * emails.length)];
  }

  getBenSettlePatternSummary(): PatternSummary {
    const emails = this.benSettleEmails;
    const allPatterns = emails.flatMap(e => e.key_patterns);
    const patternCounts = allPatterns.reduce((acc, p) => {
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonPatterns = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern]) => pattern);

    return {
      author: 'Ben Settle',
      total_emails: emails.length,
      common_patterns: commonPatterns,
      style_characteristics: [
        'Very short paragraphs (1-3 sentences max)',
        'Story-driven with contrarian takes',
        'Entertainment first, selling second',
        'Subtle product mentions',
        'Daily email cliffs that build anticipation',
        'No desperate selling',
        'Controversial but true statements',
        'Pattern interrupt subject lines',
        'Teases more value tomorrow',
      ],
      typical_structure: 'Hook (story or controversy) → Contrarian insight → Industry critique → Truth they\'re missing → Subtle product mention → Tomorrow tease',
      selling_approach: 'Infotainment - weaves product into story, makes pitch part of entertainment, qualifies list by being deliberately polarizing',
      example_subjects: emails.map(e => e.subject),
      key_techniques: [
        'Villain origin stories',
        'Historical parallels',
        'Pop culture lessons',
        'Reverse psychology',
        'Anti-selling (hoping people leave)',
        'Email series that build on each other',
        'Teaching through stories',
        'Never stop entertainment to pitch',
      ],
    };
  }

  getGaryHalbertPatternSummary(): PatternSummary {
    const emails = this.garyHalbertEmails;
    const allPatterns = emails.flatMap(e => e.key_patterns);
    const patternCounts = allPatterns.reduce((acc, p) => {
      acc[p] = (acc[p] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const commonPatterns = Object.entries(patternCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([pattern]) => pattern);

    return {
      author: 'Gary Halbert',
      total_emails: emails.length,
      common_patterns: commonPatterns,
      style_characteristics: [
        'Long-form sales letters (complete arguments)',
        'Specific numbers and proof throughout',
        '"Reason why" copy - explains everything',
        'Benefit-driven bullets',
        'Conversational but commanding tone',
        'Strong guarantees that flip risk',
        'Price justification and value stacking',
        'Multiple CTAs throughout',
        'Addresses all objections',
      ],
      typical_structure: 'Attention-grabbing hook → Problem identification → Solution mechanism → Benefit bullets → Social proof → Price justification → Guarantee → Multiple CTAs',
      selling_approach: 'Classic direct response - builds massive desire through education, specificity, and proof before presenting offer with strong guarantee',
      example_subjects: emails.map(e => e.subject),
      key_techniques: [
        'Pattern interrupt devices (dollar bill)',
        'Transformation stories (before/after)',
        'Curiosity-driven long headlines',
        'Mechanism explanation',
        'Specificity over vagueness',
        'Strong risk reversal',
        'Value stacking',
        'Fascination hooks',
        'Reason why for every element',
      ],
    };
  }

  getBenSettleExampleForPrompt(): string {
    const email = this.getRandomExample('ben_settle');
    if (!email) return '';

    return `
REAL BEN SETTLE EMAIL EXAMPLE:

Subject: ${email.subject}

${email.body}

KEY PATTERNS IN THIS EMAIL:
${email.key_patterns.map(p => `- ${p}`).join('\n')}

STRUCTURE ANALYSIS:
- Opening Hook: ${email.analysis.opening_hook}
- Paragraph Style: ${email.analysis.avg_paragraph_length}
- Selling Technique: ${email.analysis.selling_technique}
- Contrarian Angle: ${email.analysis.contrarian_angle}

WHY IT WORKS:
- ${email.analysis.story_ratio}
- CTA Strength: ${email.conversion_elements.cta_strength}
- Controversy Level: ${email.conversion_elements.controversy_level}
`;
  }

  getGaryHalbertExampleForPrompt(): string {
    const email = this.getRandomExample('gary_halbert');
    if (!email) return '';

    return `
REAL GARY HALBERT LETTER EXAMPLE:

Subject: ${email.subject}

${email.body}

KEY PATTERNS IN THIS LETTER:
${email.key_patterns.map(p => `- ${p}`).join('\n')}

STRUCTURE ANALYSIS:
- Opening Hook: ${email.analysis.opening_hook}
- Selling Technique: ${email.analysis.selling_technique}
- Social Proof: ${email.conversion_elements.social_proof}
${email.conversion_elements.price_justification ? `- Price Justification: ${email.conversion_elements.price_justification}` : ''}
${email.conversion_elements.guarantee ? `- Guarantee: ${email.conversion_elements.guarantee}` : ''}

WHY IT WORKS:
- Specificity: ${email.conversion_elements.specificity}
- CTA Strength: ${email.conversion_elements.cta_strength}
- ${email.analysis.story_ratio}
`;
  }

  getPatternGuidance(pattern: string): string {
    const examples = this.getEmailsByPattern(pattern);
    if (examples.length === 0) return '';

    return `
PATTERN: ${pattern}

FOUND IN ${examples.length} EMAILS:
${examples.map(e => `- ${e.author}: "${e.title}"`).join('\n')}

COMMON CHARACTERISTICS:
${examples.map(e => `- ${e.analysis.opening_hook}`).join('\n')}
`;
  }

  getCritiqueReference(author: 'ben_settle' | 'gary_halbert'): string {
    const summary = author === 'ben_settle'
      ? this.getBenSettlePatternSummary()
      : this.getGaryHalbertPatternSummary();

    return `
${summary.author.toUpperCase()} STYLE REFERENCE:

CORE CHARACTERISTICS (from ${summary.total_emails} actual emails):
${summary.style_characteristics.map(c => `✓ ${c}`).join('\n')}

TYPICAL STRUCTURE:
${summary.typical_structure}

KEY TECHNIQUES:
${summary.key_techniques.map(t => `• ${t}`).join('\n')}

SELLING APPROACH:
${summary.selling_approach}

COMMON PATTERNS:
${summary.common_patterns.join(', ')}
`;
  }

  getComparisonGuide(): string {
    const benSettle = this.getBenSettlePatternSummary();
    const garyHalbert = this.getGaryHalbertPatternSummary();

    return `
BEN SETTLE vs GARY HALBERT - STYLE COMPARISON

BEN SETTLE:
- Length: Short, punchy (1-3 sentence paragraphs)
- Approach: Entertainment-first, selling second
- Structure: Story → Insight → Subtle pitch → Tomorrow tease
- Tone: Contrarian, deliberately polarizing
- CTA: Very soft, often just product name mention
- Best for: Daily emails, list engagement, infotainment

GARY HALBERT:
- Length: Long-form (complete argument from start to finish)
- Approach: Education-first, massive desire building
- Structure: Hook → Problem → Solution → Benefits → Proof → Guarantee → CTA
- Tone: Conversational but commanding, friendly expert
- CTA: Very strong with multiple CTAs, guarantees, urgency
- Best for: Sales letters, product launches, high-ticket offers

WHEN TO USE WHICH:

Use Ben Settle style when:
- Building daily engagement with list
- Establishing thought leadership
- Creating anticipation for offers
- Qualifying and filtering your audience
- Making the sales process feel natural and entertaining

Use Gary Halbert style when:
- Launching a product or service
- Making a direct ask for significant investment
- Need to overcome multiple objections
- Require detailed explanation of mechanism
- Want to close the sale in single communication
`;
  }
}

// Singleton instance
export const emailPatternLibrary = new EmailPatternLibrary();

// Convenience functions
export function getBenSettleExample(): EmailExample | null {
  return emailPatternLibrary.getRandomExample('ben_settle');
}

export function getGaryHalbertExample(): EmailExample | null {
  return emailPatternLibrary.getRandomExample('gary_halbert');
}

export function getBenSettlePatterns(): PatternSummary {
  return emailPatternLibrary.getBenSettlePatternSummary();
}

export function getGaryHalbertPatterns(): PatternSummary {
  return emailPatternLibrary.getGaryHalbertPatternSummary();
}

export function getEmailComparisonGuide(): string {
  return emailPatternLibrary.getComparisonGuide();
}

export function getCritiqueReferenceForStyle(style: 'ben_settle' | 'gary_halbert'): string {
  return emailPatternLibrary.getCritiqueReference(style);
}
