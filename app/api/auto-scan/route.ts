import { NextRequest, NextResponse } from 'next/server';
import { analyzeContentOpportunity } from '@/lib/analyzer';
import { supabaseAdmin } from '@/lib/supabase';
import { initBrowserSession, closeBrowserSession } from '@/lib/browserbase';
import {
  scrapeTwitter,
  scrapeTwitterByQuery,
  formatContentForScan,
  ScrapedContent,
} from '@/lib/content-scraper';

/**
 * AUTO-SCAN ENDPOINT
 * Automatically scrapes Twitter/X for trending content in the biblical masculinity niche
 * and analyzes it for content opportunities using Claude AI.
 *
 * No manual copy-paste required - fully automated content discovery.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let browser = null;
  let sessionId = null;

  try {
    console.log('🚀 Starting automated content scan...');

    // Parse optional search queries from request
    const body = await request.json().catch(() => ({}));
    const { customQueries = [] } = body as { customQueries?: string[] };

    // Check daily scan limit (reuse same logic as manual scan)
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
        {
          error: `Daily limit of ${dailyLimit} scans reached. Auto-scan blocked.`,
        },
        { status: 429 }
      );
    }

    // Initialize Browserbase session
    console.log('🌐 Initializing browser session...');
    const session = await initBrowserSession();
    browser = session.browser;
    sessionId = session.sessionId;
    const { page } = session;

    console.log(`✅ Browser session created: ${sessionId}`);

    // Scrape Twitter content
    console.log('🔍 Scraping Twitter for biblical masculinity content...');
    const allScrapedContent: ScrapedContent[] = [];

    // Default search: biblical masculinity niche
    const defaultContent = await scrapeTwitter(page);
    allScrapedContent.push(...defaultContent);

    // Custom queries if provided
    if (customQueries.length > 0) {
      console.log(`🎯 Scraping ${customQueries.length} custom queries...`);
      for (const query of customQueries) {
        const queryContent = await scrapeTwitterByQuery(page, query);
        allScrapedContent.push(...queryContent);
      }
    }

    console.log(`✅ Scraped ${allScrapedContent.length} total pieces of content`);

    if (allScrapedContent.length === 0) {
      // Close browser before returning
      await closeBrowserSession(browser, sessionId);

      return NextResponse.json(
        {
          error: 'No content found during auto-scan. Twitter may be blocking scraping.',
          hint: 'Try using manual scan or check Browserbase logs.',
        },
        { status: 404 }
      );
    }

    // Format scraped content for analysis
    const { twitterData, substackData } = formatContentForScan(allScrapedContent);

    console.log('🤖 Analyzing content with Claude AI...');

    // Analyze content with Claude (reuse existing analyzer)
    const opportunities = await analyzeContentOpportunity({
      notifications: '',
      trendingPosts: twitterData,
      substackComments: substackData,
    });

    console.log(`✅ Found ${opportunities.length} opportunities`);

    // Insert opportunities into database
    const insertPromises = opportunities.map((opp) =>
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
    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failedCount = results.length - successCount;

    // Log scan history
    const scanDuration = Math.floor((Date.now() - startTime) / 1000);
    await supabaseAdmin.from('scan_history').insert({
      platforms_scanned: ['twitter'],
      opportunities_found: successCount,
      scan_duration: scanDuration,
      error_log:
        failedCount > 0
          ? `Auto-scan: ${failedCount} opportunities failed to save`
          : null,
    });

    // Close browser session
    console.log('🔒 Closing browser session...');
    await closeBrowserSession(browser, sessionId);

    console.log(`✅ Auto-scan complete in ${scanDuration}s`);

    return NextResponse.json({
      success: true,
      mode: 'auto-scan',
      content_scraped: allScrapedContent.length,
      opportunities_found: successCount,
      opportunities_failed: failedCount,
      scan_duration: scanDuration,
      opportunities: opportunities,
    });
  } catch (error) {
    console.error('❌ Auto-scan error:', error);

    // Try to close browser if it was opened
    if (browser) {
      try {
        await closeBrowserSession(browser, sessionId || undefined);
      } catch (closeError) {
        console.error('Failed to close browser:', closeError);
      }
    }

    // Log failed scan
    const scanDuration = Math.floor((Date.now() - startTime) / 1000);
    await supabaseAdmin.from('scan_history').insert({
      platforms_scanned: ['twitter'],
      opportunities_found: 0,
      scan_duration: scanDuration,
      error_log: `Auto-scan failed: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    });

    // Provide specific error messages
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let hint = 'Check server logs for details.';

    if (errorMessage.includes('concurrent sessions limit')) {
      hint = 'Browserbase concurrent session limit reached. Wait a few minutes for previous sessions to close, or upgrade your Browserbase plan.';
    } else if (errorMessage.includes('BROWSERBASE_API_KEY')) {
      hint = 'Check BROWSERBASE_API_KEY in .env.local file.';
    } else if (errorMessage.includes('Timeout')) {
      hint = 'Twitter scraping timed out. Twitter may require authentication. See AGENTIC_BROWSER_STATUS.md for solutions.';
    }

    return NextResponse.json(
      {
        error: 'Auto-scan failed.',
        details: errorMessage,
        hint,
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check auto-scan configuration status
 */
export async function GET() {
  try {
    const hasBrowserbaseKey = !!process.env.BROWSERBASE_API_KEY;
    const hasBrowserbaseProject = !!process.env.BROWSERBASE_PROJECT_ID;

    return NextResponse.json({
      configured: hasBrowserbaseKey && hasBrowserbaseProject,
      browserbase_key: hasBrowserbaseKey ? 'Set' : 'Missing',
      browserbase_project: hasBrowserbaseProject ? 'Set' : 'Missing',
      status: hasBrowserbaseKey && hasBrowserbaseProject ? 'ready' : 'not_configured',
    });
  } catch (error) {
    console.error('Error checking auto-scan config:', error);
    return NextResponse.json(
      { error: 'Failed to check configuration' },
      { status: 500 }
    );
  }
}
