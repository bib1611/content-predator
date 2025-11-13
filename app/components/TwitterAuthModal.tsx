'use client';

import { useState } from 'react';

interface TwitterAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TwitterAuthModal({ isOpen, onClose, onSuccess }: TwitterAuthModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showManualInstructions, setShowManualInstructions] = useState(false);

  if (!isOpen) return null;

  const handleAutoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/twitter-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.error || 'Authentication failed');
        if (data.hint) {
          setError(`${data.error}\n\n${data.hint}`);
        }
        // If verification required, show manual instructions
        if (data.error.includes('verification')) {
          setShowManualInstructions(true);
        }
      }
    } catch (err) {
      setError('Failed to connect to authentication service');
    } finally {
      setLoading(false);
    }
  };

  const handleManualSync = () => {
    // Open Browserbase dashboard in new tab
    window.open('https://www.browserbase.com/sessions', '_blank');
    setShowManualInstructions(true);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Connect Your X/Twitter Account</h2>
            <p className="text-sm text-gray-600 mt-1">
              Enable auto-scan to access your Twitter feed
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
              <svg
                className="w-16 h-16 text-green-600 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Successfully Connected!
              </h3>
              <p className="text-green-700">
                Your Twitter account is now synced. Auto-scan will use your authenticated session.
              </p>
            </div>
          ) : showManualInstructions ? (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Manual Session Sync</h3>
                <p className="text-sm text-blue-800 mb-4">
                  Follow these steps to manually authenticate your Twitter account:
                </p>
                <ol className="space-y-3 text-sm text-blue-900">
                  <li className="flex gap-3">
                    <span className="font-bold">1.</span>
                    <div>
                      <span className="font-medium">Open Browserbase Dashboard</span>
                      <p className="text-blue-700 mt-1">
                        Click the button below to open Browserbase in a new tab
                      </p>
                      <button
                        onClick={handleManualSync}
                        className="mt-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                      >
                        Open Browserbase Dashboard →
                      </button>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold">2.</span>
                    <div>
                      <span className="font-medium">Create New Session</span>
                      <p className="text-blue-700 mt-1">Click "New Session" button</p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold">3.</span>
                    <div>
                      <span className="font-medium">Login to Twitter</span>
                      <p className="text-blue-700 mt-1">
                        In the live browser view, go to twitter.com and login with your account
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold">4.</span>
                    <div>
                      <span className="font-medium">Save Session ID</span>
                      <p className="text-blue-700 mt-1">
                        Copy the session ID (will be reused for future auto-scans)
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-bold">5.</span>
                    <div>
                      <span className="font-medium">Test Auto-Scan</span>
                      <p className="text-blue-700 mt-1">
                        Return here and click "Auto-Scan (AI)" to test
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              <button
                onClick={() => setShowManualInstructions(false)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to automatic login
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Auto Login Form */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Option 1: Automatic Login</h3>
                <form onSubmit={handleAutoLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter Username or Email
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="@yourusername or email"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Your Twitter password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={loading}
                      required
                    />
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800 whitespace-pre-line">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !username || !password}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Connecting...
                      </>
                    ) : (
                      'Connect Twitter Account'
                    )}
                  </button>
                </form>
              </div>

              {/* Manual Sync Option */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Option 2: Manual Session Sync
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  If automatic login fails (2FA, verification, etc.), you can manually login via
                  Browserbase dashboard.
                </p>
                <button
                  onClick={handleManualSync}
                  className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Manual Setup Instructions →
                </button>
              </div>

              {/* Privacy Note */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <svg
                    className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-gray-900 mb-1">Privacy & Security</p>
                    <p className="text-xs text-gray-600">
                      Your credentials are sent directly to Browserbase's secure browser
                      environment. We don't store your password. Session cookies are saved to
                      enable auto-scan functionality.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
