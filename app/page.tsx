'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ContentOpportunity } from '@/lib/supabase';
import { useKeyboardShortcuts } from '@/lib/useKeyboardShortcuts';
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal';
import StatsWidget from './components/StatsWidget';
import OpportunityFilters, { FilterState } from './components/OpportunityFilters';
import ContentVariations from './components/ContentVariations';
import ProductCreator from './components/ProductCreator';
import TwitterAuthModal from './components/TwitterAuthModal';

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
  const [autoScanning, setAutoScanning] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    platform: 'all',
    type: 'all',
    minScore: 6,
    dateRange: 'all',
    search: '',
  });
  const [showVariations, setShowVariations] = useState<ContentOpportunity | null>(null);
  const [selectedOpps, setSelectedOpps] = useState<Set<string>>(new Set());
  const [bulkGenerating, setBulkGenerating] = useState(false);
  const [showProductCreator, setShowProductCreator] = useState(false);
  const [productCreatorContext, setProductCreatorContext] = useState<string>('');
  const [showTwitterAuth, setShowTwitterAuth] = useState(false);

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

  const handleAutoScan = async () => {
    setAutoScanning(true);
    try {
      const response = await fetch('/api/auto-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Auto-scan complete! Found ${data.opportunities_found} opportunities from ${data.content_scraped} scraped posts.`);
        // Refresh opportunities and scan status
        await fetchOpportunities();
        await fetchScanStatus();
      } else {
        alert(`Auto-scan failed: ${data.error}\n\n${data.hint || ''}`);
      }
    } catch (error) {
      console.error('Auto-scan failed:', error);
      alert('Auto-scan failed. Check console for details.');
    } finally {
      setAutoScanning(false);
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
      alert('Generation failed. Try again.');
    } finally {
      setGeneratingId(null);
    }
  };

  const handleBulkGenerate = async () => {
    if (selectedOpps.size === 0) return;

    setBulkGenerating(true);
    const selectedArray = Array.from(selectedOpps);

    for (let i = 0; i < selectedArray.length; i++) {
      const oppId = selectedArray[i];
      const opp = opportunities.find(o => o.id === oppId);
      if (opp) {
        await handleGenerate(opp);
      }
    }

    setBulkGenerating(false);
    setSelectedOpps(new Set());
  };

  const toggleSelectOpp = (id: string) => {
    const newSelected = new Set(selectedOpps);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOpps(newSelected);
  };

  const selectAll = () => {
    setSelectedOpps(new Set(opportunities.map(o => o.id)));
  };

  const deselectAll = () => {
    setSelectedOpps(new Set());
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
    alert('Copied to clipboard!');
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
    <main className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Content Predator</h1>
              <p className="text-gray-600 text-sm mt-1">AI-powered content intelligence for high-performance creators</p>
            </div>

            {scanStatus && (
              <div className="flex items-center gap-6 text-sm">
                <div className="text-right">
                  <div className="text-gray-500 text-xs">Scans Today</div>
                  <div className="text-gray-900 font-semibold">{scanStatus.scans_today}/{scanStatus.daily_limit}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-500 text-xs">Remaining</div>
                  <div className={`font-semibold ${scanStatus.scans_remaining > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {scanStatus.scans_remaining}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Bar */}
          <div className="flex gap-3 items-center">
            <Link
              href="/scan"
              className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm"
            >
              Scan for Opportunities
            </Link>
            <button
              onClick={handleAutoScan}
              disabled={autoScanning}
              className="bg-purple-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {autoScanning ? 'Auto-Scanning...' : 'Auto-Scan (AI)'}
            </button>
            <button
              onClick={() => setShowTwitterAuth(true)}
              className="border border-blue-600 bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Connect X
            </button>
            <Link
              href="/studio"
              className="border border-gray-300 bg-white text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Content Studio
            </Link>
            <button
              onClick={() => {
                setProductCreatorContext('');
                setShowProductCreator(true);
              }}
              className="border border-green-600 bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              Create Product
            </button>

            {selectedOpps.size > 0 && (
              <>
                <button
                  onClick={handleBulkGenerate}
                  disabled={bulkGenerating}
                  className="ml-auto bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {bulkGenerating ? `Generating ${selectedOpps.size}...` : `Generate ${selectedOpps.size} Selected`}
                </button>
                <button
                  onClick={deselectAll}
                  className="border border-gray-300 bg-white text-gray-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Deselect All
                </button>
              </>
            )}

            {selectedOpps.size === 0 && opportunities.length > 0 && (
              <button
                onClick={selectAll}
                className="ml-auto border border-gray-300 bg-white text-gray-700 px-4 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Select All
              </button>
            )}

            <button
              onClick={() => setShowShortcuts(true)}
              className="text-gray-500 hover:text-gray-700 text-sm transition-colors"
            >
              Press <kbd className="bg-gray-100 px-2 py-1 rounded border border-gray-300 text-xs">?</kbd> for shortcuts
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats Widget */}
        <StatsWidget />

        {/* Filters */}
        <OpportunityFilters onFilterChange={setFilters} />

        {/* Opportunities */}
        <section className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Top Opportunities
              {opportunities.length > 0 && (
                <span className="ml-2 text-gray-500 text-base font-normal">
                  ({opportunities.length})
                </span>
              )}
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="text-gray-600 mt-3">Loading opportunities...</p>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center shadow-sm">
              <div className="text-gray-400 text-5xl mb-4">🎯</div>
              <p className="text-gray-900 text-lg font-semibold mb-2">
                No opportunities found
              </p>
              <p className="text-gray-600 mb-6">
                Run a scan to discover content opportunities
              </p>
              <Link
                href="/scan"
                className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Run Your First Scan
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className={`bg-white border rounded-xl p-6 hover:shadow-md transition-all ${
                    selectedOpps.has(opp.id)
                      ? 'border-blue-500 ring-2 ring-blue-100'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex gap-4">
                    {/* Checkbox */}
                    <div className="flex-shrink-0 pt-1">
                      <input
                        type="checkbox"
                        checked={selectedOpps.has(opp.id)}
                        onChange={() => toggleSelectOpp(opp.id)}
                        className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-bold text-2xl">
                            {opp.priority_score}/10
                          </span>
                          <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-700 uppercase">
                            {opp.opportunity_type}
                          </span>
                          <span className="bg-blue-50 px-3 py-1 rounded-full text-xs font-medium text-blue-700 uppercase">
                            {opp.platform}
                          </span>
                          <span className="bg-purple-50 px-3 py-1 rounded-full text-xs font-medium text-purple-700 uppercase">
                            {opp.suggested_format}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{opp.hook}</h3>
                      <p className="text-gray-600 mb-3">{opp.suggested_angle}</p>

                      {opp.content_snippet && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-3 text-sm text-gray-700">
                          {opp.content_snippet}
                        </div>
                      )}

                      <p className="text-sm text-red-600 font-semibold mb-4">{opp.cta}</p>

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleGenerate(opp)}
                          disabled={generatingId === opp.id}
                          className="bg-red-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
                        >
                          {generatingId === opp.id ? 'Generating...' : 'Generate Content'}
                        </button>

                        <button
                          onClick={() => setShowVariations(opp)}
                          className="border border-blue-600 text-blue-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
                        >
                          3 Variations
                        </button>

                        <button
                          onClick={() => {
                            setProductCreatorContext(opp.content_snippet || opp.suggested_angle);
                            setShowProductCreator(true);
                          }}
                          className="border border-green-600 text-green-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors"
                        >
                          Create Product
                        </button>

                        <button
                          onClick={() => handleMarkUsed(opp.id)}
                          className="border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                        >
                          Mark Used
                        </button>
                      </div>

                      {/* Generated Content */}
                      {generatedContent[opp.id] && (
                        <div className="mt-4 border-t border-gray-200 pt-4">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                              Generated {generatedContent[opp.id].format}
                            </h4>
                            <button
                              onClick={() => copyToClipboard(generatedContent[opp.id].content)}
                              className="bg-gray-100 px-4 py-1.5 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-colors"
                            >
                              Copy
                            </button>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono">
                            {generatedContent[opp.id].content}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Keyboard Shortcuts Modal */}
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Product Creator Modal */}
      {showProductCreator && (
        <ProductCreator
          opportunityContext={productCreatorContext}
          onClose={() => setShowProductCreator(false)}
        />
      )}

      {/* Twitter Auth Modal */}
      <TwitterAuthModal
        isOpen={showTwitterAuth}
        onClose={() => setShowTwitterAuth(false)}
        onSuccess={() => {
          // Refresh opportunities after successful auth
          fetchOpportunities();
        }}
      />

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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setQuickScanOpen(false)}>
          <div className="bg-white rounded-xl max-w-2xl w-full p-8 shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quick Scan</h2>
            <p className="text-gray-600 mb-4">Paste content from any platform and analyze it instantly</p>
            <textarea
              className="w-full h-64 bg-white border border-gray-300 rounded-lg p-4 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Paste content here..."
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setQuickScanOpen(false)}
                className="bg-red-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm"
              >
                Analyze
              </button>
              <button
                onClick={() => setQuickScanOpen(false)}
                className="border border-gray-300 bg-white text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
