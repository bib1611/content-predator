'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentOpportunity } from '@/lib/supabase';
import SamAssistant from '../components/SamAssistant';

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
  launch_email: 'Launch Email (Direct Response)',
  feature_email: 'Feature Announcement',
  ben_settle_email: 'Ben Settle Style Email',
  gary_halbert_letter: 'Gary Halbert Sales Letter',
  long_tweet: 'Long Tweet (280+)',
  thread_10x: 'Twitter Thread (10-15 tweets)',
  landing_page: 'Landing Page',
  sales_page: 'Long-Form Sales Page',
  tweet: 'Single Tweet (250 chars)',
  thread: 'Thread (6-8 tweets)',
  article: 'Substack Article',
};

export default function ContentStudio() {
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [selectedOpp, setSelectedOpp] = useState<ContentOpportunity | null>(null);
  const [format, setFormat] = useState<MarketingFormat>('launch_email');
  const [content, setContent] = useState('');
  const [critique, setCritique] = useState('');
  const [generating, setGenerating] = useState(false);
  const [critiquing, setCritiquing] = useState(false);
  const [implementing, setImplementing] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  useEffect(() => {
    const words = content.trim().split(/\s+/).length;
    const chars = content.length;
    setWordCount(content.trim() ? words : 0);
    setCharCount(chars);
  }, [content]);

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

    setGenerating(true);
    setCritique('');

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
    if (!content.trim()) {
      alert('Write some content first.');
      return;
    }

    setCritiquing(true);

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
        setCritique(data.critique);
      } else {
        alert('Critique failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Critique failed:', error);
      alert('Critique failed. Try again.');
    } finally {
      setCritiquing(false);
    }
  };

  const handleImplementFixes = async () => {
    if (!critique || !content) return;

    setImplementing(true);

    try {
      // Ask Claude to apply the fixes to the content
      const response = await fetch('/api/critique', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          format: FORMAT_LABELS[format],
          applyFixes: true,
          critique: critique,
        }),
      });

      const data = await response.json();
      if (data.success && data.fixedContent) {
        setContent(data.fixedContent);
        setCritique('');
        alert('Fixes applied! Run critique again to verify.');
      } else {
        alert('Could not apply fixes automatically. Please apply manually.');
      }
    } catch (error) {
      console.error('Implementation failed:', error);
      alert('Implementation failed. Apply fixes manually.');
    } finally {
      setImplementing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    alert('Copied to clipboard');
  };

  const clearContent = () => {
    if (confirm('Clear all content?')) {
      setContent('');
      setCritique('');
    }
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#e9e9e7] bg-white sticky top-0 z-10 shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-[#37352f] mb-1">Content Studio</h1>
              <p className="text-[#787774] text-sm">Generate, edit, and critique marketing content</p>
            </div>
            <Link
              href="/"
              className="border border-[#e9e9e7] bg-white px-4 py-2 text-sm font-medium text-[#37352f] hover:bg-[#f7f6f3] transition-colors"
            >
              ← Dashboard
            </Link>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-end">
            {/* Opportunity Selector */}
            <div className="flex-1 min-w-[300px]">
              <label className="text-xs font-medium text-[#787774] block mb-2 uppercase tracking-wide">Opportunity</label>
              <select
                value={selectedOpp?.id || ''}
                onChange={(e) => {
                  const opp = opportunities.find(o => o.id === e.target.value);
                  setSelectedOpp(opp || null);
                }}
                className="w-full bg-white border border-[#e9e9e7] px-3 py-2 text-sm text-[#37352f] focus:border-[#DC2626] focus:outline-none hover:bg-[#f7f6f3] transition-colors"
              >
                {opportunities.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    {opp.priority_score}/10 - {opp.hook?.substring(0, 60)}...
                  </option>
                ))}
              </select>
            </div>

            {/* Format Selector */}
            <div className="flex-1 min-w-[250px]">
              <label className="text-xs font-medium text-[#787774] block mb-2 uppercase tracking-wide">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as MarketingFormat)}
                className="w-full bg-white border border-[#e9e9e7] px-3 py-2 text-sm text-[#37352f] focus:border-[#DC2626] focus:outline-none hover:bg-[#f7f6f3] transition-colors"
              >
                <optgroup label="Emails">
                  <option value="launch_email">{FORMAT_LABELS.launch_email}</option>
                  <option value="feature_email">{FORMAT_LABELS.feature_email}</option>
                  <option value="ben_settle_email">{FORMAT_LABELS.ben_settle_email}</option>
                  <option value="gary_halbert_letter">{FORMAT_LABELS.gary_halbert_letter}</option>
                </optgroup>
                <optgroup label="Twitter">
                  <option value="long_tweet">{FORMAT_LABELS.long_tweet}</option>
                  <option value="thread_10x">{FORMAT_LABELS.thread_10x}</option>
                  <option value="tweet">{FORMAT_LABELS.tweet}</option>
                  <option value="thread">{FORMAT_LABELS.thread}</option>
                </optgroup>
                <optgroup label="Long-Form">
                  <option value="landing_page">{FORMAT_LABELS.landing_page}</option>
                  <option value="sales_page">{FORMAT_LABELS.sales_page}</option>
                  <option value="article">{FORMAT_LABELS.article}</option>
                </optgroup>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleGenerate}
                disabled={generating || !selectedOpp}
                className="bg-[#DC2626] text-white px-5 py-2 text-sm font-medium hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
              >
                {generating ? 'Generating...' : 'Generate'}
              </button>
              <button
                onClick={handleCritique}
                disabled={critiquing || !content.trim()}
                className="border border-[#DC2626] bg-white text-[#DC2626] px-5 py-2 text-sm font-medium hover:bg-[#DC2626] hover:text-white transition-colors disabled:opacity-50"
              >
                {critiquing ? 'Analyzing...' : 'Critique'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 3-Column Layout: Editor | Critique | Sam */}
      <div className="flex h-[calc(100vh-220px)]">
        {/* Editor Pane */}
        <div className="w-1/3 flex flex-col border-r border-[#e9e9e7]">
          <div className="flex items-center justify-between px-6 py-3 border-b border-[#e9e9e7] bg-[#fbfbfa]">
            <div className="flex gap-6 text-xs font-medium">
              <span className="text-[#787774]">
                {wordCount} words
              </span>
              <span className="text-[#787774]">
                {charCount} characters
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyToClipboard}
                disabled={!content.trim()}
                className="bg-white border border-[#e9e9e7] px-3 py-1.5 text-xs font-medium text-[#37352f] hover:bg-[#f7f6f3] transition-colors disabled:opacity-50"
              >
                Copy
              </button>
              <button
                onClick={clearContent}
                disabled={!content.trim()}
                className="bg-white border border-[#e9e9e7] px-3 py-1.5 text-xs font-medium text-[#37352f] hover:bg-[#f7f6f3] transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Generated content appears here. Edit as needed..."
            className="flex-1 w-full bg-white text-[#37352f] px-6 py-4 text-[15px] leading-relaxed focus:outline-none resize-none"
            spellCheck={false}
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
          />
        </div>

        {/* Critique Pane */}
        <div className="w-1/3 flex flex-col bg-[#fbfbfa] border-r border-[#e9e9e7]">
          <div className="px-6 py-4 border-b border-[#e9e9e7] bg-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[#37352f]">AI Critique</h2>
                <p className="text-xs text-[#787774] mt-0.5">Actionable feedback & fixes</p>
              </div>
              {critique && (
                <button
                  onClick={handleImplementFixes}
                  disabled={implementing}
                  className="bg-[#DC2626] text-white px-3 py-1.5 text-xs font-medium hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
                >
                  {implementing ? 'Applying...' : 'Implement Fixes'}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {critique ? (
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#37352f] bg-white p-4 rounded-md border border-[#e9e9e7] shadow-sm">
                  {critique}
                </pre>
              </div>
            ) : (
              <div className="text-[#787774] text-center mt-16">
                <div className="text-4xl mb-4">✍️</div>
                <p className="mb-2 text-sm font-medium text-[#37352f]">No critique yet</p>
                <p className="text-xs">
                  Write or generate content, then click Critique for real-time feedback.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sam Assistant Pane */}
        <div className="w-1/3 flex flex-col">
          <SamAssistant currentContent={content} format={format} />
        </div>
      </div>
    </main>
  );
}
