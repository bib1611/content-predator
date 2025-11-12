'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentOpportunity } from '@/lib/supabase';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import StatsWidget from './components/StatsWidget';
import OpportunityFilters, { FilterState } from './components/OpportunityFilters';
import ContentVariations from './components/ContentVariations';

export default function Dashboard() {
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanStatus, setScanStatus] = useState<{
    scans_today: number;
    daily_limit: number;
    scans_remaining: number;
  } | null>(null);
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [generatedContent, setGeneratedContent] = useState<{
    [key: string]: { content: string; format: string };
  }>({});
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [quickScanOpen, setQuickScanOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    platform: 'all',
    type: 'all',
    minScore: 6,
    dateRange: 'all',
    search: '',
  });
  const [showVariations, setShowVariations] = useState<ContentOpportunity | null>(null);

  useEffect(() => {
    fetchOpportunities();
  }, [filters]);

  useEffect(() => {
    fetchScanStatus();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const params = new URLSearchParams({
        unused: 'true',
        limit: '50',
        minScore: filters.minScore.toString(),
      });

      if (filters.platform !== 'all') {
        params.append('platform', filters.platform);
      }
      if (filters.type !== 'all') {
        params.append('type', filters.type);
      }

      const response = await fetch(`/api/opportunities?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        let filtered = data.opportunities;

        // Client-side filtering for date range
        if (filters.dateRange !== 'all') {
          const now = new Date();
          const cutoff = new Date();
          if (filters.dateRange === 'today') {
            cutoff.setHours(0, 0, 0, 0);
          } else if (filters.dateRange === 'week') {
            cutoff.setDate(now.getDate() - 7);
          } else if (filters.dateRange === 'month') {
            cutoff.setMonth(now.getMonth() - 1);
          }
          filtered = filtered.filter((opp: ContentOpportunity) =>
            new Date(opp.date_scanned) >= cutoff
          );
        }

        // Client-side search filtering
        if (filters.search) {
          const searchLower = filters.search.toLowerCase();
          filtered = filtered.filter((opp: ContentOpportunity) =>
            opp.content_snippet?.toLowerCase().includes(searchLower) ||
            opp.suggested_angle?.toLowerCase().includes(searchLower) ||
            opp.hook?.toLowerCase().includes(searchLower)
          );
        }

        setOpportunities(filtered);
      }
    } catch (error) {
      console.error('Failed to fetch opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScanStatus = async () => {
    try {
      const response = await fetch('/api/scan');
      const data = await response.json();
      setScanStatus(data);
    } catch (error) {
      console.error('Failed to fetch scan status:', error);
    }
  };

  const handleGenerate = async (opp: ContentOpportunity) => {
    setGeneratingId(opp.id);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunity: {
            id: opp.id,
            type: opp.opportunity_type,
            platform: opp.platform,
            description: opp.content_snippet || opp.suggested_angle,
            viral_potential: opp.priority_score,
            suggested_format: opp.suggested_format,
            hook: opp.hook || '',
            angle: opp.suggested_angle,
            cta: opp.cta || 'Join the Brotherhood',
            engagement_estimate: '1K-5K',
          },
        }),
      });

      const data = await response.json();
      if (data.success) {
        setGeneratedContent(prev => ({
          ...prev,
          [opp.id]: {
            content: data.content.content,
            format: data.content.format,
          },
        }));
      }
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Generation failed. Try again or quit whining.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleMarkUsed = async (id: string) => {
    try {
      await fetch('/api/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, used: true }),
      });
      setOpportunities(prev => prev.filter(opp => opp.id !== id));
    } catch (error) {
      console.error('Failed to mark as used:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied. Now go post it.');
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      description: 'Quick scan',
      action: () => setQuickScanOpen(true),
    },
    {
      key: '?',
      description: 'Show shortcuts',
      action: () => setShowShortcuts(true),
    },
    {
      key: 'Escape',
      description: 'Close modal',
      action: () => {
        setShowShortcuts(false);
        setQuickScanOpen(false);
      },
    },
  ]);

  return (
    <main className="min-h-screen bg-black text-white p-8">
      {/* Header */}
      <header className="border-b-2 border-[#262626] pb-6 mb-8">
        <h1 className="text-4xl font-bold mb-2 tracking-tight">CONTENT PREDATOR</h1>
        <p className="text-[#737373] text-lg">Hunt for blood in the digital wasteland</p>

        {scanStatus && (
          <div className="mt-4 flex items-center gap-4 text-sm font-mono">
            <span className="text-[#737373]">
              SCANS TODAY: <span className="text-white">{scanStatus.scans_today}/{scanStatus.daily_limit}</span>
            </span>
            <span className="text-[#737373]">
              REMAINING: <span className={scanStatus.scans_remaining > 0 ? 'text-[#DC2626]' : 'text-[#737373]'}>
                {scanStatus.scans_remaining}
              </span>
            </span>
          </div>
        )}
      </header>

      {/* Action Bar */}
      <div className="mb-8 flex gap-4 items-center">
        <Link
          href="/scan"
          className="inline-block bg-[#DC2626] text-white px-8 py-4 text-lg font-bold hover:bg-[#B91C1C] transition-colors border-2 border-[#DC2626]"
        >
          HUNT FOR BLOOD
        </Link>
        <Link
          href="/studio"
          className="inline-block border-2 border-[#DC2626] text-[#DC2626] px-8 py-4 text-lg font-bold hover:bg-[#DC2626] hover:text-white transition-colors"
        >
          CONTENT STUDIO
        </Link>
        <button
          onClick={() => setShowShortcuts(true)}
          className="ml-auto text-[#737373] hover:text-white font-mono text-sm transition-colors"
        >
          Press <kbd className="bg-[#262626] px-2 py-1 mx-1 border border-[#404040]">?</kbd> for shortcuts
        </button>
      </div>

      {/* Stats Widget */}
      <StatsWidget />

      {/* Filters */}
      <OpportunityFilters onFilterChange={setFilters} />

      {/* Opportunities */}
      <section>
        <h2 className="text-2xl font-bold mb-6 border-b border-[#262626] pb-2">
          TOP OPPORTUNITIES
        </h2>

        {loading ? (
          <div className="text-[#737373] font-mono">Loading opportunities...</div>
        ) : opportunities.length === 0 ? (
          <div className="border-2 border-[#262626] p-8 text-center">
            <p className="text-[#737373] text-lg mb-4">
              Nothing worth your time. Hunt harder.
            </p>
            <Link
              href="/scan"
              className="inline-block bg-[#DC2626] text-white px-6 py-3 font-bold hover:bg-[#B91C1C] transition-colors"
            >
              RUN SCAN
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="border-2 border-[#262626] p-6 hover:border-[#DC2626] transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[#DC2626] font-bold font-mono text-2xl">
                        {opp.priority_score}/10
                      </span>
                      <span className="bg-[#262626] px-3 py-1 text-sm font-mono uppercase">
                        {opp.opportunity_type}
                      </span>
                      <span className="bg-[#262626] px-3 py-1 text-sm font-mono uppercase">
                        {opp.platform}
                      </span>
                      <span className="bg-[#262626] px-3 py-1 text-sm font-mono uppercase">
                        {opp.suggested_format}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold mb-2">{opp.hook}</h3>
                    <p className="text-[#737373] mb-3">{opp.suggested_angle}</p>

                    {opp.content_snippet && (
                      <div className="bg-[#0a0a0a] border border-[#262626] p-3 mb-3 font-mono text-sm">
                        {opp.content_snippet}
                      </div>
                    )}

                    <p className="text-sm text-[#DC2626] font-bold">{opp.cta}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => handleGenerate(opp)}
                    disabled={generatingId === opp.id}
                    className="bg-[#DC2626] text-white px-6 py-2 font-bold hover:bg-[#B91C1C] transition-colors disabled:opacity-50"
                  >
                    {generatingId === opp.id ? 'WEAPONIZING...' : 'WEAPONIZE THIS'}
                  </button>

                  <button
                    onClick={() => setShowVariations(opp)}
                    className="border-2 border-[#DC2626] text-[#DC2626] px-6 py-2 font-bold hover:bg-[#DC2626] hover:text-white transition-colors"
                  >
                    3 VARIATIONS
                  </button>

                  <button
                    onClick={() => handleMarkUsed(opp.id)}
                    className="border-2 border-[#262626] px-6 py-2 font-bold hover:border-white transition-colors"
                  >
                    MARK USED
                  </button>
                </div>

                {/* Generated Content */}
                {generatedContent[opp.id] && (
                  <div className="mt-6 border-t-2 border-[#262626] pt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-lg font-bold text-[#DC2626]">
                        GENERATED {generatedContent[opp.id].format.toUpperCase()}
                      </h4>
                      <button
                        onClick={() => copyToClipboard(generatedContent[opp.id].content)}
                        className="bg-[#262626] px-4 py-2 text-sm font-bold hover:bg-[#737373] transition-colors"
                      >
                        COPY
                      </button>
                    </div>
                    <div className="bg-[#0a0a0a] border border-[#262626] p-4 font-mono text-sm whitespace-pre-wrap">
                      {generatedContent[opp.id].content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Content Variations Modal */}
      {showVariations && (
        <ContentVariations
          opportunity={{
            id: showVariations.id,
            type: showVariations.opportunity_type,
            platform: showVariations.platform,
            description: showVariations.content_snippet || showVariations.suggested_angle,
            viral_potential: showVariations.priority_score,
            suggested_format: showVariations.suggested_format,
            hook: showVariations.hook || '',
            angle: showVariations.suggested_angle,
            cta: showVariations.cta || 'Join the Brotherhood',
          }}
          format={showVariations.suggested_format}
          onClose={() => setShowVariations(null)}
        />
      )}

      {/* Quick Scan Modal */}
      {quickScanOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={() => setQuickScanOpen(false)}>
          <div className="bg-black border-2 border-[#DC2626] max-w-2xl w-full mx-4 p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-4">QUICK SCAN</h2>
            <p className="text-[#737373] mb-4">Paste content from any platform and hit Enter</p>
            <textarea
              className="w-full h-64 bg-[#0a0a0a] border-2 border-[#262626] p-4 text-white font-mono text-sm focus:outline-none focus:border-[#DC2626]"
              placeholder="Paste content here..."
              autoFocus
            />
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setQuickScanOpen(false)}
                className="bg-[#DC2626] text-white px-6 py-2 font-bold hover:bg-[#B91C1C]"
              >
                ANALYZE
              </button>
              <button
                onClick={() => setQuickScanOpen(false)}
                className="border-2 border-[#262626] px-6 py-2 font-bold hover:border-white"
              >
                CANCEL
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
