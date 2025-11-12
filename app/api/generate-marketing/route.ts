import { NextRequest, NextResponse } from 'next/server';
import { generateMarketingContent, MarketingFormat } from '@/lib/marketing-generator';
import { OpportunityAnalysis } from '@/lib/analyzer';
import { createClient, requireUser } from '@/lib/supabase-server';
import { handleApiError, createSuccessResponse } from '@/lib/error-handler';
import { generateMarketingSchema } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, rateLimitExceeded } from '@/lib/rate-limit';

/**
 * POST /api/generate-marketing
 * Generate marketing content from an opportunity
 */
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, user.id);
    const rateLimit = checkRateLimit(rateLimitKey, 'generateMarketing');

    if (!rateLimit.success) {
      return NextResponse.json(
        rateLimitExceeded(rateLimit.resetTime),
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = generateMarketingSchema.parse(body);

    // Get authenticated Supabase client
    const supabase = await createClient();

    // Fetch opportunity and verify ownership
    const { data: opportunity, error: fetchError } = await supabase
      .from('content_opportunities')
      .select('*')
      .eq('id', validated.opportunityId)
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

    // Generate marketing content (sanitization happens in marketing-generator)
    const result = await generateMarketingContent(
      opportunityData,
      validated.platform as MarketingFormat,
      validated.customInstructions
    );

    // Save to database with user_id
    const { data: savedContent, error: saveError } = await supabase
      .from('generated_content')
      .insert({
        user_id: user.id, // Associate with authenticated user
        opportunity_id: validated.opportunityId,
        content_type: validated.platform,
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
      return createSuccessResponse({
        success: true,
        content: { ...result, id: savedContent.id },
      });
    }

    return createSuccessResponse({
      success: true,
      content: result,
    });

  } catch (error) {
    return handleApiError(error, 'Marketing content generation');
  }
}
