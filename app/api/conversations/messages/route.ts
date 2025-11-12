import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import type { ConversationMessage } from '@/lib/supabase';

// GET /api/conversations/messages - Get messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!conversationId) {
      return NextResponse.json(
        { error: 'Conversation ID is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('conversation_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('position', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ messages: data });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/conversations/messages - Add a message to a conversation
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      conversationId,
      role,
      content,
      contentType,
      opportunityId,
      generatedContentId,
      metadata,
    } = body;

    if (!conversationId || !role || !content) {
      return NextResponse.json(
        { error: 'conversationId, role, and content are required' },
        { status: 400 }
      );
    }

    // Get current message count for position
    const { count } = await supabaseAdmin
      .from('conversation_messages')
      .select('*', { count: 'exact', head: true })
      .eq('conversation_id', conversationId);

    const position = (count || 0) + 1;

    const { data, error } = await supabaseAdmin
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        role,
        content,
        content_type: contentType || 'text',
        opportunity_id: opportunityId,
        generated_content_id: generatedContentId,
        metadata: metadata || {},
        position,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: data }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create message' },
      { status: 500 }
    );
  }
}

// PATCH /api/conversations/messages - Update a message
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, metadata } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const updates: Partial<ConversationMessage> = {
      edited_at: new Date().toISOString(),
    };
    if (content !== undefined) updates.content = content;
    if (metadata !== undefined) updates.metadata = metadata;

    const { data, error } = await supabaseAdmin
      .from('conversation_messages')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ message: data });
  } catch (error: any) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE /api/conversations/messages - Delete a message
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('conversation_messages')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Message deleted' });
  } catch (error: any) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete message' },
      { status: 500 }
    );
  }
}
