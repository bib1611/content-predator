import twitterData from './data/personal/twitter-performance.json';

export interface TweetPerformer {
  tweet_text: string;
  engagement_rate: number;
  hook_type: string;
  patterns: string[];
  why_worked?: string;
  why_failed?: string;
}

export interface TwitterPerformance {
  account: string;
  followers: number;
  analysis_period: string;
  high_performers: TweetPerformer[];
  low_performers: TweetPerformer[];
  winning_patterns: string[];
  losing_patterns: string[];
  optimal_structure: {
    hook: string;
    body: string;
    tone: string;
    length: string;
    visual: string;
  };
}

export const personalPatternLibrary = {
  getTwitterData(): TwitterPerformance {
    return twitterData as TwitterPerformance;
  },

  getWinningPatterns(): string[] {
    return twitterData.winning_patterns;
  },

  getLosingPatterns(): string[] {
    return twitterData.losing_patterns;
  },

  getHighPerformers(): TweetPerformer[] {
    return twitterData.high_performers;
  },

  getLowPerformers(): TweetPerformer[] {
    return twitterData.low_performers;
  },

  getOptimalStructure() {
    return twitterData.optimal_structure;
  },

  // Get examples for prompt injection (Twitter/Thread content)
  getTwitterExamplesForPrompt(): string {
    const highPerformers = this.getHighPerformers();

    let examples = '📊 YOUR PROVEN HIGH-PERFORMING CONTENT (@SlayStupidity - 24K followers):\n\n';

    highPerformers.slice(0, 3).forEach((tweet, idx) => {
      examples += `EXAMPLE ${idx + 1} (${tweet.engagement_rate}% engagement - ${tweet.hook_type}):\n`;
      examples += `"${tweet.tweet_text}"\n\n`;
      examples += `WHY IT WORKED:\n${tweet.why_worked}\n\n`;
      examples += `PATTERNS USED:\n${tweet.patterns.map(p => `• ${p}`).join('\n')}\n\n`;
      examples += `---\n\n`;
    });

    return examples;
  },

  // Get pattern summary for prompt injection
  getPatternSummaryForPrompt(): string {
    const winningPatterns = this.getWinningPatterns();
    const losingPatterns = this.getLosingPatterns();
    const structure = this.getOptimalStructure();

    return `
YOUR PROVEN WINNING PATTERNS (from @SlayStupidity analysis):

✅ WHAT WORKS FOR YOUR AUDIENCE:
${winningPatterns.map(p => `✓ ${p}`).join('\n')}

❌ WHAT FAILS WITH YOUR AUDIENCE (AVOID THESE):
${losingPatterns.map(p => `✗ ${p}`).join('\n')}

🎯 YOUR OPTIMAL STRUCTURE:
• Hook: ${structure.hook}
• Body: ${structure.body}
• Tone: ${structure.tone}
• Length: ${structure.length}
• Visual: ${structure.visual}
`;
  },

  // Get critique reference (compare new content against your best)
  getCritiqueReference(): string {
    const highPerformers = this.getHighPerformers();
    const winningPatterns = this.getWinningPatterns();
    const losingPatterns = this.getLosingPatterns();

    let reference = '📊 CRITIQUE STANDARDS (based on YOUR proven content):\n\n';

    reference += '✅ YOUR HIGH-PERFORMING CONTENT:\n\n';
    highPerformers.slice(0, 2).forEach((tweet, idx) => {
      reference += `${idx + 1}. "${tweet.tweet_text.substring(0, 100)}..."\n`;
      reference += `   Engagement: ${tweet.engagement_rate}% | Hook: ${tweet.hook_type}\n`;
      reference += `   Key patterns: ${tweet.patterns.slice(0, 3).join(', ')}\n\n`;
    });

    reference += '\n✅ PATTERNS THAT WORK FOR YOUR AUDIENCE:\n';
    reference += winningPatterns.slice(0, 8).map(p => `• ${p}`).join('\n');

    reference += '\n\n❌ PATTERNS THAT FAIL WITH YOUR AUDIENCE:\n';
    reference += losingPatterns.map(p => `• ${p}`).join('\n');

    reference += '\n\n🎯 CRITIQUE INSTRUCTIONS:\n';
    reference += '1. Compare the content against the high-performing examples above\n';
    reference += '2. Identify which winning patterns are present/missing\n';
    reference += '3. Check if any losing patterns are present (red flags)\n';
    reference += '4. Predict engagement based on pattern match to proven content\n';
    reference += '5. Provide specific fixes to align with proven winners\n';

    return reference;
  },

  // Predict engagement based on pattern matching
  predictEngagement(content: string): {
    predicted_rate: string;
    confidence: string;
    reasoning: string;
    matched_patterns: string[];
    red_flags: string[];
  } {
    const winningPatterns = this.getWinningPatterns();
    const losingPatterns = this.getLosingPatterns();

    const contentLower = content.toLowerCase();

    // Check for winning patterns
    const matchedPatterns: string[] = [];

    if (contentLower.includes('blood') || contentLower.includes('feet') || contentLower.includes('sticky') || contentLower.includes('cold')) {
      matchedPatterns.push('Sensory/visceral details');
    }

    if (content.split('.').length > 5 && content.split('.').some(s => s.trim().length < 50)) {
      matchedPatterns.push('Short punchy sentences');
    }

    if (contentLower.match(/the more i|i realize|honestly|confession|truth is/)) {
      matchedPatterns.push('Simple confession/realization');
    }

    if (contentLower.match(/everything .* became|.* became .*/)) {
      matchedPatterns.push('Pattern framework (X became Y)');
    }

    // Check for red flags (losing patterns)
    const redFlags: string[] = [];

    if (contentLower.includes('your church') && contentLower.includes('dying')) {
      redFlags.push('Overused church-criticism phrase');
    }

    if (contentLower.match(/someone (said|told me|at church)/)) {
      redFlags.push('Secondhand outrage');
    }

    if (contentLower.includes('?') && content.split('?').length > 2) {
      redFlags.push('Multiple vague questions');
    }

    if (!content.includes('.') || content.split('\n\n').length < 2) {
      redFlags.push('Incomplete thought / no structure');
    }

    // Calculate prediction
    let predictedRate = '2-4%';
    let confidence = 'Low';
    let reasoning = '';

    if (matchedPatterns.length >= 3 && redFlags.length === 0) {
      predictedRate = '5-10%';
      confidence = 'High';
      reasoning = 'Strong match with your proven high-performers. Multiple winning patterns present, no red flags.';
    } else if (matchedPatterns.length >= 2 && redFlags.length <= 1) {
      predictedRate = '3-6%';
      confidence = 'Medium';
      reasoning = 'Moderate match with proven patterns. Has some winning elements but room for improvement.';
    } else if (redFlags.length >= 2) {
      predictedRate = '1-3%';
      confidence = 'High';
      reasoning = 'Multiple red flags present that have failed with your audience before. Likely to underperform.';
    } else {
      predictedRate = '2-4%';
      confidence = 'Low';
      reasoning = 'Insufficient pattern matching. Content doesn\'t strongly align with your proven winners or losers.';
    }

    return {
      predicted_rate: predictedRate,
      confidence,
      reasoning,
      matched_patterns: matchedPatterns,
      red_flags: redFlags,
    };
  },

  // Get top 3 hooks that work for this audience
  getProvenHooks(): { hook_type: string; example: string; why_it_works: string }[] {
    const performers = this.getHighPerformers();

    return performers.slice(0, 3).map(p => ({
      hook_type: p.hook_type,
      example: p.tweet_text.split('...')[0] + '...',
      why_it_works: p.why_worked || 'High engagement',
    }));
  },
};
