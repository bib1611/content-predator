import { NextRequest, NextResponse } from 'next/server';
import { createClient, requireUser } from '@/lib/supabase-server';
import { handleApiError, createSuccessResponse } from '@/lib/error-handler';
import {
  parseQueryParams,
  opportunityUpdateSchema,
  deleteOpportunitySchema
} from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, rateLimitExceeded } from '@/lib/rate-limit';

/**
 * GET /api/opportunities
 * Fetch opportunities for authenticated user with filters
 *
 * Query params:
 * - limit: number (1-100, default 10)
 * - unused: boolean
 * - minScore: number (0-100, default 0)
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, user.id);
    const rateLimit = checkRateLimit(rateLimitKey, 'opportunities');

    if (!rateLimit.success) {
      return NextResponse.json(
        rateLimitExceeded(rateLimit.resetTime),
        { status: 429 }
      );
    }

    // Validate and parse query parameters
    const params = parseQueryParams(request.nextUrl.searchParams);

    // Get authenticated Supabase client (respects RLS)
    const supabase = await createClient();

    // Build query - RLS will automatically filter by user_id
    let query = supabase
      .from('content_opportunities')
      .select('*')
      .gte('priority_score', params.minScore)
      .order('priority_score', { ascending: false })
      .order('date_scanned', { ascending: false })
      .limit(params.limit);

    if (params.unused) {
      query = query.eq('used', false);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return createSuccessResponse({
      success: true,
      count: data.length,
      opportunities: data,
    });

  } catch (error) {
    return handleApiError(error, 'Fetch opportunities');
  }
}

/**
 * PATCH /api/opportunities
 * Update an opportunity (mark as used, change priority)
 * Only allows updating opportunities owned by the authenticated user
 */
export async function PATCH(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, user.id);
    const rateLimit = checkRateLimit(rateLimitKey, 'opportunities');

    if (!rateLimit.success) {
      return NextResponse.json(
        rateLimitExceeded(rateLimit.resetTime),
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = opportunityUpdateSchema.parse(body);

    // Get authenticated Supabase client
    const supabase = await createClient();

    // Build update object
    const updates: Record<string, any> = {};
    if (validated.used !== undefined) updates.used = validated.used;
    if (validated.priority_score !== undefined) updates.priority_score = validated.priority_score;

    // Update opportunity - RLS ensures user owns this opportunity
    const { data, error } = await supabase
      .from('content_opportunities')
      .update(updates)
      .eq('id', validated.id)
      .select()
      .single();

    if (error) {
      // Check if error is because record doesn't exist or user doesn't own it
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Opportunity not found or you do not have permission to update it' },
          { status: 404 }
        );
      }
      throw error;
    }

    return createSuccessResponse({
      success: true,
      opportunity: data,
    });

  } catch (error) {
    return handleApiError(error, 'Update opportunity');
  }
}

/**
 * DELETE /api/opportunities
 * Delete an opportunity
 * Only allows deleting opportunities owned by the authenticated user
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();

    // Rate limiting
    const rateLimitKey = getRateLimitKey(request, user.id);
    const rateLimit = checkRateLimit(rateLimitKey, 'opportunities');

    if (!rateLimit.success) {
      return NextResponse.json(
        rateLimitExceeded(rateLimit.resetTime),
        { status: 429 }
      );
    }

    // Validate query parameter
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const validated = deleteOpportunitySchema.parse({ id });

    // Get authenticated Supabase client
    const supabase = await createClient();

    // Delete opportunity - RLS ensures user owns this opportunity
    const { error } = await supabase
      .from('content_opportunities')
      .delete()
      .eq('id', validated.id);

    if (error) {
      throw error;
    }

    return createSuccessResponse({
      success: true,
      message: 'Opportunity deleted. Hunt for more.',
    });

  } catch (error) {
    return handleApiError(error, 'Delete opportunity');
  }
}
