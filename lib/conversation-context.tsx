'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Conversation, ConversationMessage } from './supabase';

interface ConversationContextType {
  // Conversations
  conversations: Conversation[];
  activeConversation: Conversation | null;
  loadingConversations: boolean;

  // Messages
  messages: ConversationMessage[];
  loadingMessages: boolean;

  // Actions
  fetchConversations: () => Promise<void>;
  createConversation: (data: { title?: string; description?: string; icon?: string; tags?: string[] }) => Promise<Conversation | null>;
  updateConversation: (id: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  setActiveConversation: (conversation: Conversation | null) => void;

  // Message actions
  fetchMessages: (conversationId: string) => Promise<void>;
  addMessage: (conversationId: string, role: 'user' | 'assistant', content: string, metadata?: any) => Promise<ConversationMessage | null>;
  clearMessages: () => void;

  // UI state
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      const response = await fetch('/api/conversations');
      const data = await response.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  // Create conversation
  const createConversation = useCallback(async (data: { title?: string; description?: string; icon?: string; tags?: string[] }) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (result.conversation) {
        setConversations(prev => [result.conversation, ...prev]);
        return result.conversation;
      }
      return null;
    } catch (error) {
      console.error('Error creating conversation:', error);
      return null;
    }
  }, []);

  // Update conversation
  const updateConversation = useCallback(async (id: string, updates: Partial<Conversation>) => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });
      const result = await response.json();
      if (result.conversation) {
        setConversations(prev =>
          prev.map(c => c.id === id ? result.conversation : c)
        );
        if (activeConversation?.id === id) {
          setActiveConversation(result.conversation);
        }
      }
    } catch (error) {
      console.error('Error updating conversation:', error);
    }
  }, [activeConversation]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await fetch(`/api/conversations?id=${id}`, {
        method: 'DELETE',
      });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [activeConversation]);

  // Fetch messages for a conversation
  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/conversations/messages?conversationId=${conversationId}`);
      const data = await response.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // Add message to conversation
  const addMessage = useCallback(async (conversationId: string, role: 'user' | 'assistant', content: string, metadata?: any) => {
    try {
      const response = await fetch('/api/conversations/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          role,
          content,
          contentType: 'text',
          metadata: metadata || {},
        }),
      });
      const result = await response.json();
      if (result.message) {
        setMessages(prev => [...prev, result.message]);
        // Update conversation's updated_at time
        await fetchConversations();
        return result.message;
      }
      return null;
    } catch (error) {
      console.error('Error adding message:', error);
      return null;
    }
  }, [fetchConversations]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation.id);
    } else {
      clearMessages();
    }
  }, [activeConversation, fetchMessages, clearMessages]);

  const value: ConversationContextType = {
    conversations,
    activeConversation,
    loadingConversations,
    messages,
    loadingMessages,
    fetchConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    setActiveConversation,
    fetchMessages,
    addMessage,
    clearMessages,
    sidebarCollapsed,
    setSidebarCollapsed,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversations() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversations must be used within a ConversationProvider');
  }
  return context;
}
