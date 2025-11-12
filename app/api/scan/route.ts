import { NextRequest, NextResponse } from 'next/server';
import { analyzeContentOpportunity } from '@/lib/analyzer';
import { createClient, requireUser } from '@/lib/supabase-server';
import { handleApiError, createSuccessResponse } from '@/lib/error-handler';
import { scanDataSchema } from '@/lib/validation';
import { checkRateLimit, getRateLimitKey, rateLimitExceeded } from '@/lib/rate-limit';

/**
 * POST /api/scan
 * Analyze social media data for content opportunities
 * Requires authentication and respects daily/hourly rate limits
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Require authentication
    const user = await requireUser();

    // Rate limiting (hourly)
    const rateLimitKey = getRateLimitKey(request, user.id);
    const rateLimit = checkRateLimit(rateLimitKey, 'scan');

    if (!rateLimit.success) {
      return NextResponse.json(
        rateLimitExceeded(rateLimit.resetTime),
        { status: 429 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validated = scanDataSchema.parse(body);

    // Validate at least one data source provided
    if (!validated.notifications && !validated.trendingPosts && !validated.substackComments) {
      return NextResponse.json(
        { error: 'At least one data source required. Stop wasting time.' },
        { status: 400 }
      );
    }

    // Check daily scan limit (per user)
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    const { count, error: countError } = await supabase
      .from('scan_history')
      .select('*', { count: 'exact', head: true })
      .gte('scan_date', `${today}T00:00:00`)
      .lte('scan_date', `${today}T23:59:59`);

    if (countError) {
      console.error('Error checking scan limit:', countError);
    }

    const dailyLimit = parseInt(process.env.DAILY_SCAN_LIMIT || '5');
    if (count && count >= dailyLimit) {
      return NextResponse.json(
        { error: `Daily limit of ${dailyLimit} scans reached. Hunt harder tomorrow.` },
        { status: 429 }
      );
    }

    // Analyze content with Claude
    // Note: Input sanitization happens in the analyzer
    const opportunities = await analyzeContentOpportunity({
      notifications: validated.notifications || '',
      trendingPosts: validated.trendingPosts || '',
      substackComments: validated.substackComments || '',
    });

    // Insert opportunities into database with user_id
    const insertPromises = opportunities.map(opp =>
      supabase.from('content_opportunities').insert({
        user_id: user.id, // Associate with authenticated user
        platform: opp.platform,
        opportunity_type: opp.type,
        content_snippet: opp.content_snippet || null,
        engagement_metrics: { estimate: opp.engagement_estimate },
        suggested_angle: opp.angle,
        suggested_format: opp.suggested_format,
        hook: opp.hook,
        cta: opp.cta,
        priority_score: opp.viral_potential,
        used: false,
      })
    );

    const results = await Promise.allSettled(insertPromises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failedCount = results.length - successCount;

    // Log scan history with user_id
    const scanDuration = Math.floor((Date.now() - startTime) / 1000);
    const platforms = [
      validated.notifications ? 'twitter' : null,
      validated.substackComments ? 'substack' : null,
    ].filter(Boolean) as string[];

    await supabase.from('scan_history').insert({
      user_id: user.id, // Associate with authenticated user
      platforms_scanned: platforms,
      opportunities_found: successCount,
      scan_duration: scanDuration,
      error_log: failedCount > 0 ? `${failedCount} opportunities failed to save` : null,
    });

    return createSuccessResponse({
      success: true,
      opportunities_found: successCount,
      opportunities_failed: failedCount,
      scan_duration: scanDuration,
      opportunities: opportunities,
    });

  } catch (error) {
    console.error('Scan error:', error);

    // Log failed scan if we have user context
    try {
      const user = await requireUser();
      const supabase = await createClient();
      const scanDuration = Math.floor((Date.now() - startTime) / 1000);

      await supabase.from('scan_history').insert({
        user_id: user.id,
        platforms_scanned: [],
        opportunities_found: 0,
        scan_duration: scanDuration,
        error_log: error instanceof Error ? error.message : 'Unknown error',
      });
    } catch {
      // Silently fail if we can't log - user not authenticated or DB error
    }

    return handleApiError(error, 'Scan');
  }
}

/**
 * GET /api/scan
 * Check scan status and remaining limits for authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await requireUser();

    // Get authenticated Supabase client
    const supabase = await createClient();

    // Check scans today for this user
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabase
      .from('scan_history')
      .select('*', { count: 'exact', head: true })
      .gte('scan_date', `${today}T00:00:00`)
      .lte('scan_date', `${today}T23:59:59`);

    const dailyLimit = parseInt(process.env.DAILY_SCAN_LIMIT || '5');

    return createSuccessResponse({
      scans_today: count || 0,
      daily_limit: dailyLimit,
      scans_remaining: Math.max(0, dailyLimit - (count || 0)),
    });

  } catch (error) {
    return handleApiError(error, 'Check scan status');
  }
}
