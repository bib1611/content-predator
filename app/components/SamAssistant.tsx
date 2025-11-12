'use client';

import { useState } from 'react';

interface SamMessage {
  role: 'user' | 'sam';
  content: string;
  prediction?: {
    predicted_rate: string;
    confidence: string;
    reasoning: string;
    matched_patterns: string[];
    red_flags: string[];
  };
}

interface SamAssistantProps {
  currentContent: string;
  format?: string;
}

export default function SamAssistant({ currentContent, format }: SamAssistantProps) {
  const [messages, setMessages] = useState<SamMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const askSam = async (customQuestion?: string) => {
    const userQuestion = customQuestion || question;
    if (!userQuestion && !currentContent) return;

    setLoading(true);

    // Add user message if there's a question
    if (userQuestion) {
      setMessages((prev) => [...prev, { role: 'user', content: userQuestion }]);
      setQuestion('');
    }

    try {
      const response = await fetch('/api/sam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: currentContent,
          question: userQuestion,
          format,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'sam',
            content: data.response,
            prediction: data.prediction,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: 'sam',
            content: `Error: ${data.error || 'Something went wrong'}`,
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'sam',
          content: 'Error: Unable to reach Sam. Check your connection.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: 'Rate this', question: 'Rate this content 1-10 and tell me why' },
    { label: 'Improve hook', question: 'How can I improve the hook?' },
    { label: 'Will it work?', question: 'Will this work with my audience?' },
    { label: 'Make it better', question: 'Give me 3 specific improvements' },
  ];

  if (isCollapsed) {
    return (
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl p-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
              S
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Sam</h3>
              <p className="text-xs text-gray-600">Your AI marketing coach</p>
            </div>
          </div>
          <svg
            className="w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
            S
          </div>
          <div>
            <h3 className="font-bold">Sam</h3>
            <p className="text-xs text-white/80">Ben Settle + Gary Halbert + Gary V</p>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(true)}
          className="text-white/80 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 15l7-7 7 7"
            />
          </svg>
        </button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-purple-200 bg-white/50">
        <p className="text-xs text-gray-600 mb-2 font-medium">Quick Actions:</p>
        <div className="grid grid-cols-2 gap-2">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => askSam(action.question)}
              disabled={loading || !currentContent}
              className="px-3 py-2 bg-white border border-purple-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-purple-50 hover:border-purple-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white/30">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-2xl mx-auto mb-3">
              S
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Hey, I'm Sam</h4>
            <p className="text-sm text-gray-600 mb-4">
              I combine Ben Settle's infotainment, Gary Halbert's specificity, and Gary V's
              authenticity to help you write killer content.
            </p>
            <p className="text-xs text-gray-500">
              Ask me anything or use a quick action above.
            </p>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'sam' && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                S
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user'
                  ? 'bg-gray-800 text-white'
                  : 'bg-white border border-purple-200'
              }`}
            >
              {msg.prediction && (
                <div className="mb-3 pb-3 border-b border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-purple-700">
                      ENGAGEMENT PREDICTION
                    </span>
                  </div>
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="font-medium">Rate:</span>{' '}
                      <span className="text-purple-700 font-bold">
                        {msg.prediction.predicted_rate}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Confidence:</span> {msg.prediction.confidence}
                    </div>
                    {msg.prediction.matched_patterns.length > 0 && (
                      <div>
                        <span className="font-medium">Matched:</span>{' '}
                        {msg.prediction.matched_patterns.join(', ')}
                      </div>
                    )}
                    {msg.prediction.red_flags.length > 0 && (
                      <div className="text-red-600">
                        <span className="font-medium">Red Flags:</span>{' '}
                        {msg.prediction.red_flags.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                U
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <div className="bg-white border border-purple-200 rounded-lg p-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-purple-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && askSam()}
            placeholder="Ask Sam anything..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:opacity-50"
          />
          <button
            onClick={() => askSam()}
            disabled={loading || (!question && !currentContent)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
