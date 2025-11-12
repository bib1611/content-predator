'use client';

import { useState, useEffect, useRef } from 'react';
import AppLayout from '@/components/AppLayout';
import { useConversations } from '@/lib/conversation-context';
import { ContentOpportunity } from '@/lib/supabase';

type MarketingFormat =
  | 'launch_email'
  | 'feature_email'
  | 'ben_settle_email'
  | 'gary_halbert_letter'
  | 'long_tweet'
  | 'thread_10x'
  | 'landing_page'
  | 'sales_page'
  | 'tweet'
  | 'thread'
  | 'article';

const FORMAT_LABELS: Record<MarketingFormat, string> = {
  launch_email: '📧 Launch Email',
  feature_email: '✨ Feature Email',
  ben_settle_email: '📝 Ben Settle Style',
  gary_halbert_letter: '✍️ Gary Halbert Letter',
  long_tweet: '🐦 Long Tweet',
  thread_10x: '🧵 Thread (10-15)',
  landing_page: '🎯 Landing Page',
  sales_page: '💰 Sales Page',
  tweet: '💬 Single Tweet',
  thread: '🧵 Thread (6-8)',
  article: '📄 Article',
};

export default function EnhancedStudio() {
  const {
    activeConversation,
    setActiveConversation,
    createConversation,
    messages,
    addMessage,
  } = useConversations();

  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<ContentOpportunity | null>(null);
  const [format, setFormat] = useState<MarketingFormat>('launch_email');
  const [content, setContent] = useState('');
  const [generating, setGenerating] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  useEffect(() => {
    const words = content.trim().split(/\s+/).length;
    const chars = content.length;
    setWordCount(content.trim() ? words : 0);
    setCharCount(chars);
  }, [content]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/opportunities?unused=true&limit=20&minScore=6');
      const data = await response.json();
      if (data.success) {
        setOpportunities(data.opportunities);
        if (data.opportunities.length > 0) {
          setSelectedOpp(data.opportunities[0]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedOpp) return;

    // Create conversation if none exists
    let conv = activeConversation;
    if (!conv) {
      conv = await createConversation({
        title: `${FORMAT_LABELS[format]}: ${selectedOpp.hook?.substring(0, 50)}...`,
        icon: '✨',
        tags: [format, selectedOpp.opportunity_type],
      });
      if (conv) {
        setActiveConversation(conv);
      } else {
        return;
      }
    }

    // Add user message
    await addMessage(
      conv.id,
      'user',
      `Generate ${FORMAT_LABELS[format]} for: ${selectedOpp.suggested_angle}`,
      { opportunityId: selectedOpp.id, format }
    );

    setGenerating(true);

    try {
      const endpoint = ['launch_email', 'feature_email', 'ben_settle_email', 'gary_halbert_letter', 'long_tweet', 'thread_10x', 'landing_page', 'sales_page'].includes(format)
        ? '/api/generate-marketing'
        : '/api/generate';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity: {
            id: selectedOpp.id,
            type: selectedOpp.opportunity_type,
            platform: selectedOpp.platform,
            description: selectedOpp.content_snippet || selectedOpp.suggested_angle,
            viral_potential: selectedOpp.priority_score,
            suggested_format: selectedOpp.suggested_format,
            hook: selectedOpp.hook || '',
            angle: selectedOpp.suggested_angle,
            cta: selectedOpp.cta || 'Join the Brotherhood',
            engagement_estimate: '1K-5K',
          },
          format,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setContent(data.content.content);
        // Add assistant message
        await addMessage(
          conv.id,
          'assistant',
          data.content.content,
          { format, opportunityId: selectedOpp.id }
        );
      } else {
        alert('Generation failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Generation failed. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCritique = async () => {
    if (!content.trim() || !activeConversation) {
      alert('Write some content first or create a conversation.');
      return;
    }

    // Add user message for critique request
    await addMessage(
      activeConversation.id,
      'user',
      `Critique this ${FORMAT_LABELS[format]}: ${content.substring(0, 100)}...`,
      { action: 'critique', format }
    );

    setGenerating(true);

    try {
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          format: FORMAT_LABELS[format],
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Add assistant critique message
        await addMessage(
          activeConversation.id,
          'assistant',
          data.critique,
          { action: 'critique', format }
        );
      } else {
        alert('Critique failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Critique failed:', error);
      alert('Critique failed. Try again.');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert('Copied to clipboard');
  };

  const clearContent = () => {
    if (confirm('Clear current content? (Conversation history will be preserved)')) {
      setContent('');
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col bg-white">
        {/* Studio Header */}
        <div className="border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Content Studio</h1>
              <p className="text-gray-600 text-sm mt-1">
                {activeConversation ? `💬 ${activeConversation.title}` : 'Create a new conversation to get started'}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-xs text-gray-500">
                {wordCount} words · {charCount} chars
              </div>
            </div>
          </div>

          {/* Control Bar */}
          <div className="flex items-end gap-3">
            {/* Opportunity Selector */}
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-700 block mb-2">Opportunity</label>
              <select
                value={selectedOpp?.id || ''}
                onChange={(e) => {
                  const opp = opportunities.find(o => o.id === e.target.value);
                  setSelectedOpp(opp || null);
                }}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    ⭐ {opp.priority_score}/10 - {opp.hook?.substring(0, 60)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Format Selector */}
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-700 block mb-2">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as MarketingFormat)}
                className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                <optgroup label="📧 Emails">
                  <option value="launch_email">{FORMAT_LABELS.launch_email}</option>
                  <option value="feature_email">{FORMAT_LABELS.feature_email}</option>
                  <option value="ben_settle_email">{FORMAT_LABELS.ben_settle_email}</option>
                  <option value="gary_halbert_letter">{FORMAT_LABELS.gary_halbert_letter}</option>
                </optgroup>
                <optgroup label="🐦 Twitter">
                  <option value="long_tweet">{FORMAT_LABELS.long_tweet}</option>
                  <option value="thread_10x">{FORMAT_LABELS.thread_10x}</option>
                  <option value="tweet">{FORMAT_LABELS.tweet}</option>
                  <option value="thread">{FORMAT_LABELS.thread}</option>
                </optgroup>
                <optgroup label="📄 Long-Form">
                  <option value="landing_page">{FORMAT_LABELS.landing_page}</option>
                  <option value="sales_page">{FORMAT_LABELS.sales_page}</option>
                  <option value="article">{FORMAT_LABELS.article}</option>
                </optgroup>
              </select>
            </div>

            {/* Actions */}
            <button
              onClick={handleGenerate}
              disabled={generating || !selectedOpp}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </span>
              ) : '✨ Generate'}
            </button>
            <button
              onClick={handleCritique}
              disabled={generating || !content.trim()}
              className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🔍 Critique
            </button>
          </div>
        </div>

        {/* Main Content Area - Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Pane */}
          <div className="flex-1 flex flex-col border-r border-gray-200">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
              <span className="text-sm font-medium text-gray-700">Content Editor</span>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  disabled={!content.trim()}
                  className="px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  📋 Copy
                </button>
                <button
                  onClick={clearContent}
                  disabled={!content.trim()}
                  className="px-3 py-1.5 text-xs bg-white border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  🗑 Clear
                </button>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="✨ Generated content appears here. Click Generate to start, or type your own content to get a critique..."
              className="flex-1 w-full bg-white text-gray-900 px-6 py-4 text-base leading-relaxed focus:outline-none resize-none placeholder:text-gray-400"
              spellCheck={false}
            />
          </div>

          {/* Conversation Thread Pane */}
          <div className="w-96 flex flex-col bg-gray-50">
            <div className="px-4 py-3 border-b border-gray-200 bg-white">
              <h2 className="text-sm font-semibold text-gray-900">Conversation History</h2>
              <p className="text-xs text-gray-600 mt-0.5">
                {messages.length} message{messages.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-3">💭</div>
                  <p className="text-sm font-medium text-gray-900 mb-1">No messages yet</p>
                  <p className="text-xs text-gray-600">
                    Generate content to start a conversation
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-100 border border-blue-200 ml-8'
                        : 'bg-white border border-gray-200 mr-8'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-gray-700">
                        {msg.role === 'user' ? '👤 You' : '🤖 AI'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatMessageTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
                      {msg.content.length > 300
                        ? msg.content.substring(0, 300) + '...'
                        : msg.content}
                    </p>
                    {msg.metadata?.format && (
                      <div className="mt-2">
                        <span className="inline-block text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                          {FORMAT_LABELS[msg.metadata.format as MarketingFormat]}
                        </span>
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
