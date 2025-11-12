import { NextRequest, NextResponse } from 'next/server';
import { analyzeContentOpportunity, ScanData } from '@/lib/analyzer';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await request.json();
    const { notifications, trendingPosts, substackComments } = body as ScanData;

    // Validate input
    if (!notifications && !trendingPosts && !substackComments) {
      return NextResponse.json(
        { error: 'At least one data source required. Stop wasting time.' },
        { status: 400 }
      );
    }

    // Check daily scan limit
    const today = new Date().toISOString().split('T')[0];
    const { count, error: countError } = await supabaseAdmin
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
    const opportunities = await analyzeContentOpportunity({
      notifications: notifications || '',
      trendingPosts: trendingPosts || '',
      substackComments: substackComments || '',
    });

    // Insert opportunities into database
    const insertPromises = opportunities.map(opp =>
      supabaseAdmin.from('content_opportunities').insert({
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

    // Log scan history
    const scanDuration = Math.floor((Date.now() - startTime) / 1000);
    const platforms = [
      notifications ? 'twitter' : null,
      substackComments ? 'substack' : null,
    ].filter(Boolean) as string[];

    await supabaseAdmin.from('scan_history').insert({
      platforms_scanned: platforms,
      opportunities_found: successCount,
      scan_duration: scanDuration,
      error_log: failedCount > 0 ? `${failedCount} opportunities failed to save` : null,
    });

    return NextResponse.json({
      success: true,
      opportunities_found: successCount,
      opportunities_failed: failedCount,
      scan_duration: scanDuration,
      opportunities: opportunities,
    });

  } catch (error) {
    console.error('Scan error:', error);

    // Log failed scan
    const scanDuration = Math.floor((Date.now() - startTime) / 1000);
    await supabaseAdmin.from('scan_history').insert({
      platforms_scanned: [],
      opportunities_found: 0,
      scan_duration: scanDuration,
      error_log: error instanceof Error ? error.message : 'Unknown error',
    });

    return NextResponse.json(
      {
        error: 'Scan failed. Check your data or quit whining.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check scan status and limits
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { count } = await supabaseAdmin
      .from('scan_history')
      .select('*', { count: 'exact', head: true })
      .gte('scan_date', `${today}T00:00:00`)
      .lte('scan_date', `${today}T23:59:59`);

    const dailyLimit = parseInt(process.env.DAILY_SCAN_LIMIT || '5');

    return NextResponse.json({
      scans_today: count || 0,
      daily_limit: dailyLimit,
      scans_remaining: Math.max(0, dailyLimit - (count || 0)),
    });
  } catch (error) {
    console.error('Error checking scan status:', error);
    return NextResponse.json(
      { error: 'Failed to check scan status' },
      { status: 500 }
    );
  }
}
