'use client';

import { useState } from 'react';
import {
  generateGensparkPrompt,
  getProductSuggestions,
  getOptimalPricing,
  type ProductIdea,
  type GensparkPrompt,
} from '@/lib/genspark-product-generator';

interface ProductCreatorProps {
  opportunityContext?: string;
  onClose: () => void;
}

export default function ProductCreator({ opportunityContext, onClose }: ProductCreatorProps) {
  const [step, setStep] = useState<'select' | 'customize' | 'generate'>('select');
  const [selectedTemplate, setSelectedTemplate] = useState<ProductIdea | null>(null);
  const [customIdea, setCustomIdea] = useState<ProductIdea>({
    title: '',
    niche: 'Masculine Leadership',
    description: '',
    targetAudience: 'Christian men aged 25-45',
    pricePoint: 27,
    pageCount: 25,
  });
  const [generatedPrompt, setGeneratedPrompt] = useState<GensparkPrompt | null>(null);
  const [copied, setCopied] = useState(false);

  const suggestions = opportunityContext
    ? getProductSuggestions(opportunityContext)
    : getProductSuggestions('leadership');

  const handleSelectTemplate = (template: ProductIdea) => {
    setSelectedTemplate(template);
    setCustomIdea(template);
    setStep('customize');
  };

  const handleGenerate = () => {
    const prompt = generateGensparkPrompt(customIdea);
    setGeneratedPrompt(prompt);
    setStep('generate');
  };

  const handleCopyPrompt = () => {
    if (generatedPrompt) {
      navigator.clipboard.writeText(generatedPrompt.prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const niches = [
    'Masculine Leadership',
    'Marriage & Relationships',
    'Purpose & Calling',
    'Spiritual Discipline',
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Product Creator</h2>
            <p className="text-sm text-gray-600 mt-1">
              Generate high-converting Gumroad products with Genspark Max
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
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'select' && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">
                Choose a product template or start from scratch
              </h3>

              {/* Suggested Templates */}
              <div className="space-y-3 mb-6">
                <p className="text-sm font-medium text-gray-700">Suggested Products:</p>
                {suggestions.map((template, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectTemplate(template)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 group-hover:text-red-600">
                          {template.title}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>${template.pricePoint} price point</span>
                          <span>•</span>
                          <span>{template.pageCount} pages</span>
                          <span>•</span>
                          <span className="text-green-600 font-medium">3-5% conversion</span>
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5 text-gray-400 group-hover:text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>

              {/* Custom Product */}
              <button
                onClick={() => setStep('customize')}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all text-center"
              >
                <span className="text-gray-600 hover:text-red-600 font-medium">
                  + Create Custom Product
                </span>
              </button>
            </div>
          )}

          {step === 'customize' && (
            <div className="space-y-6">
              <button
                onClick={() => setStep('select')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Title
                </label>
                <input
                  type="text"
                  value={customIdea.title}
                  onChange={(e) => setCustomIdea({ ...customIdea, title: e.target.value })}
                  placeholder="The 7-Step Masculine Leadership Blueprint"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Niche</label>
                <select
                  value={customIdea.niche}
                  onChange={(e) => setCustomIdea({ ...customIdea, niche: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  {niches.map((niche) => (
                    <option key={niche} value={niche}>
                      {niche}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={customIdea.description}
                  onChange={(e) => setCustomIdea({ ...customIdea, description: e.target.value })}
                  placeholder="A comprehensive guide for Christian men seeking masculine leadership..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Point
                  </label>
                  <select
                    value={customIdea.pricePoint}
                    onChange={(e) =>
                      setCustomIdea({ ...customIdea, pricePoint: parseInt(e.target.value) })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value={9}>$9 (Quick decision)</option>
                    <option value={19}>$19 (Impulse buy)</option>
                    <option value={27}>$27 (Sweet spot)</option>
                    <option value={37}>$37 (Premium)</option>
                    <option value={47}>$47 (High-value)</option>
                    <option value={97}>$97 (Authority)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Count
                  </label>
                  <input
                    type="number"
                    value={customIdea.pageCount}
                    onChange={(e) =>
                      setCustomIdea({ ...customIdea, pageCount: parseInt(e.target.value) })
                    }
                    min={15}
                    max={50}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Optimal: 20-30 pages</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={customIdea.targetAudience}
                  onChange={(e) =>
                    setCustomIdea({ ...customIdea, targetAudience: e.target.value })
                  }
                  placeholder="Christian men aged 25-45 struggling with leadership"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={!customIdea.title || !customIdea.description}
                className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Generate Genspark Prompt
              </button>
            </div>
          )}

          {step === 'generate' && generatedPrompt && (
            <div className="space-y-6">
              <button
                onClick={() => setStep('customize')}
                className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Edit Product
              </button>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-green-600 mt-0.5"
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
                  <div>
                    <h4 className="font-semibold text-green-900">Prompt Generated!</h4>
                    <p className="text-sm text-green-700 mt-1">
                      Estimated conversion rate: {generatedPrompt.estimatedConversionRate} on
                      Gumroad
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Genspark Max Prompt</h3>
                  <button
                    onClick={handleCopyPrompt}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
                  >
                    {copied ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Copy Prompt
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto font-mono text-sm text-gray-800 whitespace-pre-wrap">
                  {generatedPrompt.prompt}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">Next Steps:</h4>
                <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
                  <li>Copy the prompt above</li>
                  <li>
                    Go to{' '}
                    <a
                      href="https://genspark.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      Genspark Max
                    </a>
                  </li>
                  <li>Paste the prompt and let it generate your product</li>
                  <li>Review and refine the content</li>
                  <li>Export as PDF and upload to Gumroad</li>
                  <li>Use Content Predator to write your sales page</li>
                </ol>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
