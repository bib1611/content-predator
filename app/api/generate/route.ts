import { NextRequest, NextResponse } from 'next/server';
import { generateContent, regenerateWithFeedback } from '@/lib/generator';
import { OpportunityAnalysis } from '@/lib/analyzer';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      opportunity,
      format,
      regenerate,
      previousContent,
      feedback,
    } = body as {
      opportunity: OpportunityAnalysis & { id?: string };
      format?: 'tweet' | 'thread' | 'article';
      regenerate?: boolean;
      previousContent?: string;
      feedback?: string;
    };

    if (!opportunity) {
      return NextResponse.json(
        { error: 'No opportunity provided. What are you doing?' },
        { status: 400 }
      );
    }

    let result;
    if (regenerate && previousContent && feedback) {
      result = await regenerateWithFeedback(
        opportunity,
        previousContent,
        feedback,
        format || opportunity.suggested_format
      );
    } else {
      result = await generateContent(opportunity, format);
    }

    // Save to database if opportunity has an ID
    if (opportunity.id) {
      const { data, error } = await supabaseAdmin
        .from('generated_content')
        .insert({
          opportunity_id: opportunity.id,
          content_type: result.format,
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
        result = { ...result, id: data.id };
      }
    }

    return NextResponse.json({
      success: true,
      content: result,
    });

  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      {
        error: 'Content generation failed. Try again or give up.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
