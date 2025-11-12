'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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
    <main className="min-h-screen bg-black text-white p-8">
      <header className="border-b-2 border-[#262626] pb-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight">HUNT FOR BLOOD</h1>
            <p className="text-[#737373] text-lg">Manual intelligence gathering</p>
          </div>
          <Link
            href="/"
            className="border-2 border-[#262626] px-6 py-3 font-bold hover:border-white transition-colors"
          >
            BACK TO DASHBOARD
          </Link>
        </div>
      </header>

      {/* Instructions */}
      <section className="mb-8 border-2 border-[#DC2626] p-6">
        <h2 className="text-xl font-bold mb-4 text-[#DC2626]">INSTRUCTIONS</h2>
        <ol className="space-y-2 text-[#737373] list-decimal list-inside">
          <li>Open X/Twitter in another tab. Copy your notifications and trending posts from your timeline.</li>
          <li>Open Substack. Copy recent comments and replies from your posts.</li>
          <li>Paste the data below. At least one field required.</li>
          <li>Hit scan. Claude will analyze and extract opportunities.</li>
          <li>Go weaponize the results.</li>
        </ol>
      </section>

      {/* Scan Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Twitter Notifications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-lg font-bold">X/TWITTER NOTIFICATIONS</label>
            <button
              type="button"
              onClick={() => handlePaste('notifications')}
              className="bg-[#262626] px-4 py-2 text-sm font-bold hover:bg-[#737373] transition-colors"
            >
              PASTE FROM CLIPBOARD
            </button>
          </div>
          <textarea
            value={formData.notifications}
            onChange={(e) => setFormData(prev => ({ ...prev, notifications: e.target.value }))}
            placeholder="Paste your X notifications here... mentions, replies, likes, etc."
            className="w-full h-48 bg-[#0a0a0a] border-2 border-[#262626] p-4 text-white font-mono text-sm focus:border-[#DC2626] focus:outline-none resize-none"
          />
        </div>

        {/* Trending Posts */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-lg font-bold">TRENDING POSTS FROM YOUR TIMELINE</label>
            <button
              type="button"
              onClick={() => handlePaste('trendingPosts')}
              className="bg-[#262626] px-4 py-2 text-sm font-bold hover:bg-[#737373] transition-colors"
            >
              PASTE FROM CLIPBOARD
            </button>
          </div>
          <textarea
            value={formData.trendingPosts}
            onChange={(e) => setFormData(prev => ({ ...prev, trendingPosts: e.target.value }))}
            placeholder="Paste 5-10 posts that are crushing it right now..."
            className="w-full h-48 bg-[#0a0a0a] border-2 border-[#262626] p-4 text-white font-mono text-sm focus:border-[#DC2626] focus:outline-none resize-none"
          />
        </div>

        {/* Substack Comments */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-lg font-bold">SUBSTACK COMMENTS & REPLIES</label>
            <button
              type="button"
              onClick={() => handlePaste('substackComments')}
              className="bg-[#262626] px-4 py-2 text-sm font-bold hover:bg-[#737373] transition-colors"
            >
              PASTE FROM CLIPBOARD
            </button>
          </div>
          <textarea
            value={formData.substackComments}
            onChange={(e) => setFormData(prev => ({ ...prev, substackComments: e.target.value }))}
            placeholder="Paste recent Substack engagement... what are people asking? What's resonating?"
            className="w-full h-48 bg-[#0a0a0a] border-2 border-[#262626] p-4 text-white font-mono text-sm focus:border-[#DC2626] focus:outline-none resize-none"
          />
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={scanning || (!formData.notifications && !formData.trendingPosts && !formData.substackComments)}
            className="bg-[#DC2626] text-white px-12 py-4 text-xl font-bold hover:bg-[#B91C1C] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {scanning ? 'SCANNING...' : 'RUN SCAN'}
          </button>

          {scanning && (
            <span className="text-[#737373] font-mono animate-pulse">
              Analyzing intelligence...
            </span>
          )}
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="mt-8 border-2 border-[#DC2626] p-6 bg-[#DC2626]/10">
          <h3 className="text-xl font-bold text-[#DC2626] mb-2">SCAN FAILED</h3>
          <p className="text-white">{error}</p>
        </div>
      )}

      {/* Success Display */}
      {result && (
        <div className="mt-8 border-2 border-[#DC2626] p-6 animate-slideUp">
          <h3 className="text-2xl font-bold text-[#DC2626] mb-4">SCAN COMPLETE</h3>
          <div className="space-y-2 font-mono">
            <p className="text-lg">
              <span className="text-[#737373]">OPPORTUNITIES FOUND:</span>{' '}
              <span className="text-white font-bold">{result.opportunities_found}</span>
            </p>
            <p className="text-lg">
              <span className="text-[#737373]">SCAN DURATION:</span>{' '}
              <span className="text-white font-bold">{result.scan_duration}s</span>
            </p>
            <p className="text-[#737373] mt-4">Redirecting to dashboard...</p>
          </div>
        </div>
      )}

      {/* Tips */}
      <section className="mt-12 border-t border-[#262626] pt-8">
        <h3 className="text-xl font-bold mb-4">HUNTING TIPS</h3>
        <ul className="space-y-2 text-[#737373]">
          <li>• More data = better opportunities. Don't be lazy.</li>
          <li>• Look for patterns in what people engage with vs. what they ignore.</li>
          <li>• Pay attention to questions that get asked repeatedly but never answered well.</li>
          <li>• Controversy and confrontation get engagement. Soft takes get ignored.</li>
          <li>• Run scans daily. Social media moves fast.</li>
        </ul>
      </section>
    </main>
  );
}
