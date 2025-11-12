'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [formData, setFormData] = useState({
    notifications: '',
    trendingPosts: '',
    substackComments: '',
  });
  const [result, setResult] = useState<{
    opportunities_found: number;
    scan_duration: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setScanning(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scan failed');
      }

      setResult({
        opportunities_found: data.opportunities_found,
        scan_duration: data.scan_duration,
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push('/');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something broke');
    } finally {
      setScanning(false);
    }
  };

  const handlePaste = async (field: 'notifications' | 'trendingPosts' | 'substackComments') => {
    try {
      const text = await navigator.clipboard.readText();
      setFormData(prev => ({ ...prev, [field]: text }));
    } catch (err) {
      alert('Clipboard access denied. Paste manually.');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Content Scanner</h1>
          <p className="text-gray-600">Analyze social media content to discover viral opportunities</p>
        </header>

        {/* Instructions */}
        <section className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">📋</span>
            How to Scan
          </h2>
          <ol className="space-y-2 text-gray-700 list-decimal list-inside text-sm">
            <li>Open X/Twitter in another tab and copy your notifications and trending posts</li>
            <li>Open Substack and copy recent comments and replies from your posts</li>
            <li>Paste the content below (at least one field required)</li>
            <li>Click "Run Scan" and Claude AI will analyze the data</li>
            <li>Review the discovered opportunities on your dashboard</li>
          </ol>
        </section>

      {/* Scan Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Twitter Notifications */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-semibold text-gray-900 flex items-center">
              <span className="text-xl mr-2">🐦</span>
              X/Twitter Notifications
            </label>
            <button
              type="button"
              onClick={() => handlePaste('notifications')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              📋 Paste from Clipboard
            </button>
          </div>
          <textarea
            value={formData.notifications}
            onChange={(e) => setFormData(prev => ({ ...prev, notifications: e.target.value }))}
            placeholder="Paste your X notifications here... mentions, replies, likes, etc."
            className="w-full h-48 bg-gray-50 border border-gray-300 rounded-lg p-4 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
          />
        </div>

        {/* Trending Posts */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-semibold text-gray-900 flex items-center">
              <span className="text-xl mr-2">🔥</span>
              Trending Posts from Timeline
            </label>
            <button
              type="button"
              onClick={() => handlePaste('trendingPosts')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              📋 Paste from Clipboard
            </button>
          </div>
          <textarea
            value={formData.trendingPosts}
            onChange={(e) => setFormData(prev => ({ ...prev, trendingPosts: e.target.value }))}
            placeholder="Paste 5-10 posts that are performing well right now..."
            className="w-full h-48 bg-gray-50 border border-gray-300 rounded-lg p-4 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
          />
        </div>

        {/* Substack Comments */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <label className="text-base font-semibold text-gray-900 flex items-center">
              <span className="text-xl mr-2">📰</span>
              Substack Comments & Replies
            </label>
            <button
              type="button"
              onClick={() => handlePaste('substackComments')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              📋 Paste from Clipboard
            </button>
          </div>
          <textarea
            value={formData.substackComments}
            onChange={(e) => setFormData(prev => ({ ...prev, substackComments: e.target.value }))}
            placeholder="Paste recent Substack engagement... what are people asking? What's resonating?"
            className="w-full h-48 bg-gray-50 border border-gray-300 rounded-lg p-4 text-gray-900 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={scanning || (!formData.notifications && !formData.trendingPosts && !formData.substackComments)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg text-base font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {scanning ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Scanning...
              </span>
            ) : '🔍 Run Scan'}
          </button>

          {scanning && (
            <span className="text-gray-600 text-sm animate-pulse">
              Analyzing content with AI...
            </span>
          )}
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-8 bg-red-50 border border-red-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center">
            <span className="text-xl mr-2">⚠️</span>
            Scan Failed
          </h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {result && (
        <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-6 animate-fadeIn">
          <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
            <span className="text-2xl mr-2">✅</span>
            Scan Complete!
          </h3>
          <div className="space-y-2">
            <p className="text-base text-gray-700">
              <span className="font-medium">Opportunities found:</span>{' '}
              <span className="font-bold text-green-700">{result.opportunities_found}</span>
            </p>
            <p className="text-base text-gray-700">
              <span className="font-medium">Scan duration:</span>{' '}
              <span className="font-bold text-green-700">{result.scan_duration}s</span>
            </p>
            <p className="text-gray-600 mt-4 text-sm">Redirecting to dashboard...</p>
          </div>
        </div>
      )}

      {/* Tips */}
      <section className="mt-12 bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-xl mr-2">💡</span>
          Pro Tips
        </h3>
        <ul className="space-y-2 text-gray-700 text-sm">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>More data leads to better opportunities - paste as much content as possible</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Look for patterns in high-engagement vs. low-engagement content</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Pay attention to frequently asked questions that lack good answers</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Controversial topics tend to generate more engagement</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>Run scans daily to stay on top of trending topics</span>
          </li>
        </ul>
      </section>
      </div>
    </AppLayout>
  );
}
