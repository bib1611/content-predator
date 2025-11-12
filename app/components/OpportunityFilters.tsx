'use client';

import { useState, useEffect } from 'react';

export interface FilterState {
  platform: string;
  type: string;
  minScore: number;
  dateRange: string;
  search: string;
}

interface OpportunityFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export default function OpportunityFilters({ onFilterChange }: OpportunityFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    platform: 'all',
    type: 'all',
    minScore: 6,
    dateRange: 'all',
    search: '',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load saved filters from localStorage
    const saved = localStorage.getItem('opportunity_filters');
    if (saved) {
      const savedFilters = JSON.parse(saved);
      setFilters(savedFilters);
      onFilterChange(savedFilters);
    }
  }, []);

  const handleFilterChange = (key: keyof FilterState, value: string | number) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
    localStorage.setItem('opportunity_filters', JSON.stringify(newFilters));
  };

  const resetFilters = () => {
    const defaultFilters: FilterState = {
      platform: 'all',
      type: 'all',
      minScore: 6,
      dateRange: 'all',
      search: '',
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
    localStorage.setItem('opportunity_filters', JSON.stringify(defaultFilters));
  };

  return (
    <div className="border-2 border-[#262626] p-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-lg font-bold hover:text-[#DC2626] transition-colors"
        >
          {isExpanded ? '▼' : '▶'} FILTERS
        </button>
        {!isExpanded && (
          <div className="flex gap-2 text-sm font-mono">
            {filters.platform !== 'all' && (
              <span className="bg-[#262626] px-2 py-1">{filters.platform.toUpperCase()}</span>
            )}
            {filters.type !== 'all' && (
              <span className="bg-[#262626] px-2 py-1">{filters.type.toUpperCase()}</span>
            )}
            {filters.minScore > 6 && (
              <span className="bg-[#262626] px-2 py-1">{filters.minScore}+ SCORE</span>
            )}
            {filters.search && (
              <span className="bg-[#262626] px-2 py-1">"{filters.search}"</span>
            )}
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-bold mb-2 text-[#737373]">SEARCH</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search in content, angle, or hook..."
              className="w-full bg-[#0a0a0a] border-2 border-[#262626] p-2 text-white focus:outline-none focus:border-[#DC2626]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Platform Filter */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[#737373]">PLATFORM</label>
              <select
                value={filters.platform}
                onChange={(e) => handleFilterChange('platform', e.target.value)}
                className="w-full bg-[#0a0a0a] border-2 border-[#262626] p-2 text-white focus:outline-none focus:border-[#DC2626]"
              >
                <option value="all">All Platforms</option>
                <option value="twitter">Twitter</option>
                <option value="substack">Substack</option>
                <option value="linkedin">LinkedIn</option>
                <option value="reddit">Reddit</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[#737373]">TYPE</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full bg-[#0a0a0a] border-2 border-[#262626] p-2 text-white focus:outline-none focus:border-[#DC2626]"
              >
                <option value="all">All Types</option>
                <option value="gap">Gap</option>
                <option value="viral_format">Viral Format</option>
                <option value="trending_topic">Trending Topic</option>
              </select>
            </div>

            {/* Min Score Filter */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[#737373]">
                MIN SCORE ({filters.minScore}+)
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={filters.minScore}
                onChange={(e) => handleFilterChange('minScore', parseInt(e.target.value))}
                className="w-full h-2 bg-[#262626] appearance-none cursor-pointer"
                style={{
                  accentColor: '#DC2626',
                }}
              />
              <div className="flex justify-between text-xs text-[#737373] mt-1">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-bold mb-2 text-[#737373]">DATE</label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className="w-full bg-[#0a0a0a] border-2 border-[#262626] p-2 text-white focus:outline-none focus:border-[#DC2626]"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-end">
            <button
              onClick={resetFilters}
              className="text-sm text-[#737373] hover:text-white font-bold transition-colors"
            >
              RESET FILTERS
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
