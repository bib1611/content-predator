import { NextRequest, NextResponse } from 'next/server';
import { generateMarketingContent, MarketingFormat } from '@/lib/marketing-generator';
import { OpportunityAnalysis } from '@/lib/analyzer';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      opportunity,
      format,
    } = body as {
      opportunity: OpportunityAnalysis & { id?: string };
      format: MarketingFormat;
    };

    if (!opportunity) {
      return NextResponse.json(
        { error: 'No opportunity provided' },
        { status: 400 }
      );
    }

    if (!format) {
      return NextResponse.json(
        { error: 'No format specified' },
        { status: 400 }
      );
    }

    const result = await generateMarketingContent(opportunity, format);

    // Save to database if opportunity has an ID
    if (opportunity.id) {
      const { data, error } = await supabaseAdmin
        .from('generated_content')
        .insert({
          opportunity_id: opportunity.id,
          content_type: format,
          content: result.content,
          hook: result.hook,
          cta: result.cta,
          published: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving generated content:', error);
      } else {
        return NextResponse.json({
          success: true,
          content: { ...result, id: data.id },
        });
      }
    }

    return NextResponse.json({
      success: true,
      content: result,
    });

  } catch (error) {
    console.error('Marketing generation error:', error);
    return NextResponse.json(
      {
        error: 'Marketing content generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
