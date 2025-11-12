'use client';

import React, { useState } from 'react';
import { useConversations } from '@/lib/conversation-context';
import type { Conversation } from '@/lib/supabase';

export default function ConversationSidebar() {
  const {
    conversations,
    activeConversation,
    setActiveConversation,
    createConversation,
    updateConversation,
    deleteConversation,
    loadingConversations,
    sidebarCollapsed,
    setSidebarCollapsed,
  } = useConversations();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateNew = async () => {
    const newConv = await createConversation({
      title: 'New Conversation',
      icon: '💬',
    });
    if (newConv) {
      setActiveConversation(newConv);
      setEditingId(newConv.id);
      setEditingTitle(newConv.title);
    }
  };

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const handleSaveEdit = async (id: string) => {
    if (editingTitle.trim()) {
      await updateConversation(id, { title: editingTitle.trim() });
    }
    setEditingId(null);
  };

  const handleToggleFavorite = async (conv: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    await updateConversation(conv.id, { favorite: !conv.favorite });
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Delete this conversation? This cannot be undone.')) {
      await deleteConversation(id);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-16 bg-white border-r border-gray-200 flex flex-col items-center py-4 space-y-4">
        <button
          onClick={() => setSidebarCollapsed(false)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={handleCreateNew}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="New conversation"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
          <div className="flex items-center space-x-1">
            <button
              onClick={handleCreateNew}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="New conversation (⌘+N)"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            <button
              onClick={() => setSidebarCollapsed(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Collapse sidebar"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loadingConversations ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4">
            <p className="text-gray-500 text-sm mb-4">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={handleCreateNew}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first conversation
              </button>
            )}
          </div>
        ) : (
          <div className="py-2">
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setActiveConversation(conv)}
                className={`
                  group px-3 py-2 mx-2 mb-1 rounded-lg cursor-pointer transition-all
                  ${activeConversation?.id === conv.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                  }
                `}
              >
                <div className="flex items-start space-x-2">
                  <span className="text-xl mt-0.5 flex-shrink-0">{conv.icon}</span>
                  <div className="flex-1 min-w-0">
                    {editingId === conv.id ? (
                      <input
                        type="text"
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => handleSaveEdit(conv.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(conv.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className="w-full px-2 py-1 text-sm font-medium border border-blue-500 rounded focus:outline-none"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {conv.title}
                        </h3>
                        <button
                          onClick={(e) => handleToggleFavorite(conv, e)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <svg
                            className={`w-4 h-4 ${conv.favorite ? 'text-yellow-500 fill-current' : 'text-gray-400'}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                        </button>
                      </div>
                    )}
                    {conv.description && (
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {conv.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-400">
                        {formatDate(conv.updated_at)}
                      </span>
                      <span className="text-xs text-gray-400">
                        {conv.message_count} msg{conv.message_count !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {conv.tags && conv.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {conv.tags.slice(0, 3).map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartEdit(conv);
                    }}
                    className="p-1 hover:bg-gray-200 rounded text-gray-600"
                    title="Rename"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => handleDelete(conv.id, e)}
                    className="p-1 hover:bg-red-100 rounded text-red-600"
                    title="Delete"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
