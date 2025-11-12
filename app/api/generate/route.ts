import { NextRequest, NextResponse } from 'next/server';
import { generateContent, regenerateWithFeedback } from '@/lib/generator';
import { OpportunityAnalysis } from '@/lib/analyzer';
import { createClient, requireUser } from '@/lib/supabase-server';
import { handleApiError, createSuccessResponse } from '@/lib/error-handler';
import { generateContentSchema, regenerateContentSchema } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, rateLimitExceeded } from '@/lib/rate-limit';

/**
 * POST /api/generate
 * Generate content from an opportunity
 * Supports both initial generation and regeneration with feedback
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, user.id);
    const rateLimit = checkRateLimit(rateLimitKey, 'generate');

    if (!rateLimit.success) {
      return NextResponse.json(
        rateLimitExceeded(rateLimit.resetTime),
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const isRegenerate = body.regenerate === true;

    // Get authenticated Supabase client
    const supabase = await createClient();

    // Fetch the opportunity to verify ownership
    let opportunityId: string;
    let format: 'tweet' | 'thread' | 'article';

    if (isRegenerate) {
      // Validate regeneration request
      const validated = regenerateContentSchema.parse(body);
      opportunityId = validated.opportunityId;
      format = validated.format;
    } else {
      // Validate generation request
      const validated = generateContentSchema.parse(body);
      opportunityId = validated.opportunityId;
      format = validated.format;
    }

    // Fetch opportunity and verify ownership
    const { data: opportunity, error: fetchError } = await supabase
      .from('content_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (fetchError || !opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found or you do not have permission to access it' },
        { status: 404 }
      );
    }

    // Convert database opportunity to OpportunityAnalysis format
    const opportunityData: OpportunityAnalysis = {
      type: opportunity.opportunity_type as 'gap' | 'viral_format' | 'trending_topic',
      platform: opportunity.platform as 'twitter' | 'substack',
      description: opportunity.suggested_angle,
      viral_potential: opportunity.priority_score,
      suggested_format: opportunity.suggested_format as 'tweet' | 'thread' | 'article',
      hook: opportunity.hook || '',
      angle: opportunity.suggested_angle,
      cta: opportunity.cta || '',
      engagement_estimate: opportunity.engagement_metrics?.estimate || 'Unknown',
      content_snippet: opportunity.content_snippet || undefined,
    };

    // Generate content
    let result;
    if (isRegenerate && body.previousContent && body.feedback) {
      // Regenerate with feedback (sanitization happens in generator)
      result = await regenerateWithFeedback(
        opportunityData,
        body.previousContent,
        body.feedback,
        format
      );
    } else {
      // Initial generation
      result = await generateContent(opportunityData, format);
    }

    // Save to database with user_id
    const { data: savedContent, error: saveError } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id, // Associate with authenticated user
        opportunity_id: opportunityId,
        content_type: result.format,
        content: result.content,
        hook: result.hook,
        cta: result.cta,
        published: false,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving generated content:', saveError);
      // Continue even if save fails - return the generated content
    } else {
      result = { ...result, id: savedContent.id };
    }

    return createSuccessResponse({
      success: true,
      content: result,
    });

  } catch (error) {
    return handleApiError(error, 'Content generation');
  }
}
