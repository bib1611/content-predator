import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createClient();

    // Get date 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Count scans this week
    const { data: scansData, error: scansError } = await supabase
      .from('scan_history')
      .select('id, scan_date')
      .gte('scan_date', oneWeekAgo.toISOString());

    if (scansError) throw scansError;

    const scansThisWeek = scansData?.length || 0;

    // Count content generated this week
    const { data: contentData, error: contentError } = await supabase
      .from('generated_content')
      .select('id, generated_at')
      .gte('generated_at', oneWeekAgo.toISOString());

    if (contentError) throw contentError;

    const contentGeneratedThisWeek = contentData?.length || 0;

    // Count published content this week
    const { data: publishedData, error: publishedError } = await supabase
      .from('generated_content')
      .select('id')
      .eq('published', true)
      .gte('published_at', oneWeekAgo.toISOString());

    if (publishedError) throw publishedError;

    const publishedThisWeek = publishedData?.length || 0;

    // Get top opportunity score
    const { data: topOppData, error: topOppError } = await supabase
      .from('content_opportunities')
      .select('priority_score')
      .eq('used', false)
      .order('priority_score', { ascending: false })
      .limit(1)
      .single();

    const topScore = topOppData?.priority_score || 0;

    // Count unused opportunities
    const { data: unusedData, error: unusedError } = await supabase
      .from('content_opportunities')
      .select('id', { count: 'exact', head: true })
      .eq('used', false)
      .gte('priority_score', 6);

    const unusedOpportunities = unusedData || 0;

    // Calculate streak (consecutive days with at least 1 scan)
    const { data: allScans, error: streakError } = await supabase
      .from('scan_history')
      .select('scan_date')
      .order('scan_date', { ascending: false })
      .limit(30);

    let streak = 0;
    if (allScans && allScans.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const scanDates = allScans.map(s => {
        const d = new Date(s.scan_date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      });

      const uniqueDates = [...new Set(scanDates)].sort((a, b) => b - a);

      let currentDate = today.getTime();
      for (const scanDate of uniqueDates) {
        if (scanDate === currentDate) {
          streak++;
          currentDate -= 86400000; // Subtract 1 day in milliseconds
        } else if (scanDate < currentDate) {
          break;
        }
      }
    }

    // Get most common opportunity type
    const { data: typeData, error: typeError } = await supabase
      .from('content_opportunities')
      .select('opportunity_type')
      .gte('date_scanned', oneWeekAgo.toISOString());

    let mostCommonType = 'none';
    if (typeData && typeData.length > 0) {
      const typeCounts: Record<string, number> = {};
      typeData.forEach(t => {
        typeCounts[t.opportunity_type] = (typeCounts[t.opportunity_type] || 0) + 1;
      });
      mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0][0];
    }

    return NextResponse.json({
      success: true,
      stats: {
        scansThisWeek,
        contentGeneratedThisWeek,
        publishedThisWeek,
        topScore,
        unusedOpportunities,
        streak,
        mostCommonType,
      },
    });
  } catch (error: any) {
    console.error('Stats fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
