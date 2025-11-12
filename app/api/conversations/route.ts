import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { Conversation } from '@/lib/supabase';

// GET /api/conversations - List all conversations
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const archived = searchParams.get('archived') === 'true';
    const favorite = searchParams.get('favorite') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search');

    let query = supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('archived', archived)
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (favorite) {
      query = query.eq('favorite', true);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({ conversations: data });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}

// POST /api/conversations - Create a new conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, icon, tags } = body;

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({
        title: title || 'Untitled Conversation',
        description,
        icon: icon || '💬',
        tags: tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ conversation: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations - Update a conversation
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, icon, tags, favorite, archived } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const updates: Partial<Conversation> = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (icon !== undefined) updates.icon = icon;
    if (tags !== undefined) updates.tags = tags;
    if (favorite !== undefined) updates.favorite = favorite;
    if (archived !== undefined) updates.archived = archived;

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ conversation: data });
  } catch (error: any) {
    console.error('Error updating conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update conversation' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations - Delete a conversation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Conversation deleted' });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete conversation' },
      { status: 500 }
    );
  }
}
