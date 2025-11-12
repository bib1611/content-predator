import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET all opportunities with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const unused = searchParams.get('unused') === 'true';
    const minScore = parseInt(searchParams.get('minScore') || '0');

    let query = supabaseAdmin
      .from('content_opportunities')
      .select('*')
      .gte('priority_score', minScore)
      .order('priority_score', { ascending: false })
      .order('date_scanned', { ascending: false })
      .limit(limit);

    if (unused) {
      query = query.eq('used', false);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      count: data.length,
      opportunities: data,
    });

  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch opportunities',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// PATCH to update opportunity (mark as used, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, used, priority_score } = body as {
      id: string;
      used?: boolean;
      priority_score?: number;
    };

    if (!id) {
      return NextResponse.json(
        { error: 'Opportunity ID required' },
        { status: 400 }
      );
    }

    const updates: Record<string, any> = {};
    if (typeof used === 'boolean') updates.used = used;
    if (typeof priority_score === 'number') updates.priority_score = priority_score;

    const { data, error } = await supabaseAdmin
      .from('content_opportunities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      opportunity: data,
    });

  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      {
        error: 'Failed to update opportunity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE opportunity
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Opportunity ID required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('content_opportunities')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Opportunity deleted',
    });

  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete opportunity',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
