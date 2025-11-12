'use client';

import { useState } from 'react';

interface Variation {
  version: number;
  style: string;
  hook: string;
  content: string;
  cta: string;
  why_this_works: string;
}

interface ContentVariationsProps {
  opportunity: any;
  format: string;
  onClose: () => void;
}

export default function ContentVariations({ opportunity, format, onClose }: ContentVariationsProps) {
  const [variations, setVariations] = useState<Variation[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedParts, setSelectedParts] = useState<{
    hook: number | null;
    body: number | null;
    cta: number | null;
  }>({
    hook: null,
    body: null,
    cta: null,
  });
  const [combined, setCombined] = useState('');

  const generateVariations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity, format }),
      });

      const data = await response.json();
      if (data.success) {
        setVariations(data.variations);
      } else {
        alert('Generation failed: ' + data.error);
      }
    } catch (error) {
      console.error('Variation generation failed:', error);
      alert('Generation failed. Network issue.');
    } finally {
      setLoading(false);
    }
  };

  const combineBestParts = () => {
    if (selectedParts.hook === null || selectedParts.body === null || selectedParts.cta === null) {
      alert('Select hook, body, and CTA from different versions');
      return;
    }

    const hookVar = variations[selectedParts.hook - 1];
    const bodyVar = variations[selectedParts.body - 1];
    const ctaVar = variations[selectedParts.cta - 1];

    const combinedContent = `${hookVar.hook}\n\n${bodyVar.content}\n\n${ctaVar.cta}`;
    setCombined(combinedContent);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  if (variations.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-black border-2 border-[#DC2626] max-w-2xl w-full mx-4 p-8" onClick={e => e.stopPropagation()}>
          <h2 className="text-2xl font-bold mb-4">GENERATE 3 VARIATIONS</h2>
          <p className="text-[#737373] mb-6">
            Create 3 different versions with unique hooks, angles, and CTAs. Then mix and match the best parts.
          </p>

          {loading ? (
            <div className="text-center py-8">
              <div className="text-[#DC2626] font-bold mb-2">GENERATING VARIATIONS...</div>
              <div className="text-sm text-[#737373]">This takes 15-20 seconds</div>
            </div>
          ) : (
            <div className="flex gap-4">
              <button
                onClick={generateVariations}
                className="bg-[#DC2626] text-white px-6 py-3 font-bold hover:bg-[#B91C1C]"
              >
                GENERATE 3 VERSIONS
              </button>
              <button
                onClick={onClose}
                className="border-2 border-[#262626] px-6 py-3 font-bold hover:border-white"
              >
                CANCEL
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-black border-2 border-[#DC2626] max-w-6xl w-full mx-4 my-8 p-8" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">3 VARIATIONS</h2>
          <button onClick={onClose} className="text-[#737373] hover:text-white text-2xl">×</button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          {variations.map((v) => (
            <div key={v.version} className="border-2 border-[#262626] p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-[#DC2626]">VERSION {v.version}</h3>
                <span className="text-xs bg-[#262626] px-2 py-1">{v.style}</span>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[#737373]">HOOK</span>
                    <button
                      onClick={() => setSelectedParts(prev => ({ ...prev, hook: v.version }))}
                      className={`text-xs px-2 py-1 ${
                        selectedParts.hook === v.version
                          ? 'bg-[#DC2626] text-white'
                          : 'bg-[#262626] hover:bg-[#404040]'
                      }`}
                    >
                      {selectedParts.hook === v.version ? '✓ SELECTED' : 'SELECT'}
                    </button>
                  </div>
                  <div className="bg-[#0a0a0a] p-2 text-xs">{v.hook}</div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[#737373]">BODY</span>
                    <button
                      onClick={() => setSelectedParts(prev => ({ ...prev, body: v.version }))}
                      className={`text-xs px-2 py-1 ${
                        selectedParts.body === v.version
                          ? 'bg-[#DC2626] text-white'
                          : 'bg-[#262626] hover:bg-[#404040]'
                      }`}
                    >
                      {selectedParts.body === v.version ? '✓ SELECTED' : 'SELECT'}
                    </button>
                  </div>
                  <div className="bg-[#0a0a0a] p-2 text-xs max-h-32 overflow-y-auto">{v.content}</div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-[#737373]">CTA</span>
                    <button
                      onClick={() => setSelectedParts(prev => ({ ...prev, cta: v.version }))}
                      className={`text-xs px-2 py-1 ${
                        selectedParts.cta === v.version
                          ? 'bg-[#DC2626] text-white'
                          : 'bg-[#262626] hover:bg-[#404040]'
                      }`}
                    >
                      {selectedParts.cta === v.version ? '✓ SELECTED' : 'SELECT'}
                    </button>
                  </div>
                  <div className="bg-[#0a0a0a] p-2 text-xs">{v.cta}</div>
                </div>

                <div className="pt-2 border-t border-[#262626]">
                  <p className="text-xs text-[#737373] italic">{v.why_this_works}</p>
                </div>

                <button
                  onClick={() => copyToClipboard(`${v.hook}\n\n${v.content}\n\n${v.cta}`)}
                  className="w-full bg-[#262626] px-3 py-2 text-xs font-bold hover:bg-[#404040]"
                >
                  COPY VERSION {v.version}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Combine Best Parts Section */}
        <div className="border-t-2 border-[#262626] pt-6">
          <h3 className="font-bold mb-3">COMBINE BEST PARTS</h3>
          <p className="text-sm text-[#737373] mb-4">
            Select your favorite hook, body, and CTA from different versions above
          </p>

          <div className="flex gap-4 mb-4">
            <button
              onClick={combineBestParts}
              disabled={selectedParts.hook === null || selectedParts.body === null || selectedParts.cta === null}
              className="bg-[#DC2626] text-white px-6 py-2 font-bold hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              COMBINE SELECTED PARTS
            </button>
            {combined && (
              <button
                onClick={() => copyToClipboard(combined)}
                className="bg-[#262626] px-6 py-2 font-bold hover:bg-[#404040]"
              >
                COPY COMBINED
              </button>
            )}
          </div>

          {combined && (
            <div className="bg-[#0a0a0a] border border-[#DC2626] p-4 font-mono text-sm whitespace-pre-wrap">
              {combined}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
