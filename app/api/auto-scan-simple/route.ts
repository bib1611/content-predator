import { NextRequest, NextResponse } from 'next/server';
import { analyzeContentOpportunity } from '@/lib/analyzer';
import { supabaseAdmin } from '@/lib/supabase';
import { searchTwitter, convertToScrapedContent, getTrendingTopics } from '@/lib/twitter-api';

/**
 * SIMPLIFIED AUTO-SCAN ENDPOINT
 * Bypasses Browserbase - uses Twitter API directly (or mock data)
 * Much simpler, faster, and more reliable
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('🚀 Starting simplified auto-scan...');

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
        {
          error: `Daily limit of ${dailyLimit} scans reached. Try again tomorrow.`,
        },
        { status: 429 }
      );
    }

    // Get search queries
    const body = await request.json().catch(() => ({}));
    const { customQueries = [] } = body as { customQueries?: string[] };

    // Get trending topics if no custom queries
    let searchQueries = customQueries;
    if (searchQueries.length === 0) {
      const trending = await getTrendingTopics();
      searchQueries = trending.slice(0, 3); // Search top 3 trending topics
    }

    console.log(`🔍 Searching ${searchQueries.length} topics...`);

    // Search Twitter for each query
    const allTweets = [];
    for (const query of searchQueries) {
      console.log(`Searching: ${query}`);
      const tweets = await searchTwitter(query, 10);
      allTweets.push(...tweets);
    }

    console.log(`✅ Found ${allTweets.length} tweets`);

    if (allTweets.length === 0) {
      return NextResponse.json(
        {
          error: 'No content found during scan.',
          hint: 'Try adding custom search queries or check Twitter API configuration.',
        },
        { status: 404 }
      );
    }

    // Convert to scraper format
    const scrapedContent = convertToScrapedContent(allTweets);

    // Format for analyzer
    const twitterData = scrapedContent.map((item) => ({
      content: item.content,
      engagement: item.engagement,
      url: item.url,
    }));

    console.log('🤖 Analyzing content with Claude AI...');

    // Analyze with Claude
    const opportunities = await analyzeContentOpportunity({
      twitterPosts: twitterData,
      substackArticles: [],
    });

    console.log(`✅ Found ${opportunities.length} opportunities`);

    // Save opportunities to database
    let successCount = 0;
    let failedCount = 0;

    for (const opp of opportunities) {
      try {
        const { error } = await supabaseAdmin.from('content_opportunities').insert({
          platform: 'twitter',
          opportunity_type: opp.type,
          content_snippet: opp.description.substring(0, 500),
          suggested_angle: opp.angle,
          hook: opp.hook,
          cta: opp.cta,
          priority_score: opp.viral_potential,
          suggested_format: opp.suggested_format,
          is_used: false,
        });

        if (error) {
          console.error('Failed to save opportunity:', error);
          failedCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        console.error('Error saving opportunity:', err);
        failedCount++;
      }
    }

    // Log scan history
    const scanDuration = Math.floor((Date.now() - startTime) / 1000);
    await supabaseAdmin.from('scan_history').insert({
      platforms_scanned: ['twitter'],
      opportunities_found: successCount,
      scan_duration: scanDuration,
      error_log: failedCount > 0 ? `${failedCount} opportunities failed to save` : null,
    });

    console.log(`✅ Auto-scan complete in ${scanDuration}s`);

    return NextResponse.json({
      success: true,
      mode: 'simplified-auto-scan',
      content_scanned: allTweets.length,
      opportunities_found: successCount,
      opportunities_failed: failedCount,
      scan_duration: scanDuration,
      queries_searched: searchQueries,
      opportunities: opportunities.map((opp) => ({
        type: opp.type,
        platform: opp.platform,
        description: opp.description.substring(0, 200) + '...',
        viral_potential: opp.viral_potential,
      })),
    });
  } catch (error) {
    console.error('❌ Auto-scan error:', error);

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

    return NextResponse.json(
      {
        error: 'Auto-scan failed.',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check server logs for details or contact support.',
      },
      { status: 500 }
    );
  }
}
