'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { ContentOpportunity } from '@/lib/supabase';

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

  useEffect(() => {
    fetchOpportunities();
    fetchScanStatus();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await fetch('/api/opportunities?unused=true&limit=10&minScore=6');
      const data = await response.json();
      if (data.success) {
        setOpportunities(data.opportunities);
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

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-8">
        {/* Header Stats */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          {scanStatus && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Scans today:</span>
                <span className="font-semibold text-gray-900">{scanStatus.scans_today}/{scanStatus.daily_limit}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-gray-600">Remaining:</span>
                <span className={`font-semibold ${scanStatus.scans_remaining > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scanStatus.scans_remaining}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link
            href="/scan"
            className="group p-6 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md hover:shadow-lg transition-all text-white"
          >
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="text-xl font-bold mb-1">Hunt for Opportunities</h3>
            <p className="text-red-100 text-sm">Scan social media for viral content ideas</p>
          </Link>
          <Link
            href="/studio"
            className="group p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md hover:shadow-lg transition-all text-white"
          >
            <div className="text-3xl mb-2">✨</div>
            <h3 className="text-xl font-bold mb-1">Content Studio</h3>
            <p className="text-blue-100 text-sm">Generate and refine marketing content</p>
          </Link>
        </div>

        {/* Opportunities */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Top Opportunities
            </h2>
            <span className="text-sm text-gray-600">{opportunities.length} opportunities</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-600 text-lg mb-6">
                No opportunities found. Run a scan to discover content ideas.
              </p>
              <Link
                href="/scan"
                className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Run Your First Scan
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 text-white font-bold text-lg rounded-lg">
                          {opp.priority_score}
                        </span>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full uppercase">
                            {opp.opportunity_type.replace('_', ' ')}
                          </span>
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full uppercase">
                            {opp.platform}
                          </span>
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full uppercase">
                            {opp.suggested_format}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2">{opp.hook}</h3>
                      <p className="text-gray-600 mb-3">{opp.suggested_angle}</p>

                      {opp.content_snippet && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3 text-sm text-gray-700">
                          {opp.content_snippet}
                        </div>
                      )}

                      <p className="text-sm text-red-600 font-medium">{opp.cta}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-4">
                    <button
                      onClick={() => handleGenerate(opp)}
                      disabled={generatingId === opp.id}
                      className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-medium hover:from-red-600 hover:to-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {generatingId === opp.id ? '⚡ Generating...' : '⚡ Weaponize This'}
                    </button>

                    <button
                      onClick={() => handleMarkUsed(opp.id)}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      ✓ Mark Used
                    </button>
                  </div>

                  {/* Generated Content */}
                  {generatedContent[opp.id] && (
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-base font-bold text-gray-900 flex items-center">
                          <span className="mr-2">✨</span>
                          Generated {generatedContent[opp.id].format}
                        </h4>
                        <button
                          onClick={() => copyToClipboard(generatedContent[opp.id].content)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          📋 Copy
                        </button>
                      </div>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
                        {generatedContent[opp.id].content}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
