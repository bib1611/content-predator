import { z } from 'zod';

/**
 * Validation schemas for API inputs
 * Provides input validation and sanitization to prevent injection attacks
 */

// Scan data validation
export const scanDataSchema = z.object({
  notifications: z.string().max(50000).optional(),
  trendingPosts: z.string().max(50000).optional(),
  substackComments: z.string().max(50000).optional(),
});

// Opportunity update validation
export const opportunityUpdateSchema = z.object({
  id: z.string().uuid('Invalid opportunity ID'),
  used: z.boolean().optional(),
  priority_score: z.number().min(0).max(100).optional(),
});

// Query parameters validation
export const opportunityQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(10),
  unused: z.boolean().optional(),
  minScore: z.number().min(0).max(100).default(0),
});

// Generate content validation
export const generateContentSchema = z.object({
  opportunityId: z.string().uuid('Invalid opportunity ID'),
  format: z.enum(['tweet', 'thread', 'article']),
});

// Regenerate with feedback validation
export const regenerateContentSchema = z.object({
  opportunityId: z.string().uuid('Invalid opportunity ID'),
  previousContent: z.string().min(1).max(50000),
  feedback: z.string().min(1).max(5000),
  format: z.enum(['tweet', 'thread', 'article']),
});

// Marketing content generation validation
export const generateMarketingSchema = z.object({
  opportunityId: z.string().uuid('Invalid opportunity ID'),
  platform: z.enum(['twitter', 'linkedin', 'instagram', 'email', 'blog']),
  customInstructions: z.string().max(5000).optional(),
});

// Critique validation
export const critiqueSchema = z.object({
  content: z.string().min(1).max(50000),
  format: z.enum(['tweet', 'thread', 'article', 'marketing']).optional(),
  applyFixes: z.boolean().optional(),
});

// Delete opportunity validation
export const deleteOpportunitySchema = z.object({
  id: z.string().uuid('Invalid opportunity ID'),
});

/**
 * Helper function to validate and parse query parameters
 */
export function parseQueryParams(searchParams: URLSearchParams) {
  const limit = parseInt(searchParams.get('limit') || '10');
  const unused = searchParams.get('unused') === 'true';
  const minScore = parseInt(searchParams.get('minScore') || '0');

  // Validate parsed values
  const result = opportunityQuerySchema.safeParse({
    limit: isNaN(limit) ? 10 : limit,
    unused,
    minScore: isNaN(minScore) ? 0 : minScore,
  });

  if (!result.success) {
    throw new Error('Invalid query parameters');
  }

  return result.data;
}
