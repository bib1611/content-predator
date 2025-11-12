'use client';

import { useEffect, useState } from 'react';

interface Stats {
  scansThisWeek: number;
  contentGeneratedThisWeek: number;
  publishedThisWeek: number;
  topScore: number;
  unusedOpportunities: number;
  streak: number;
  mostCommonType: string;
}

export default function StatsWidget() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="border-2 border-[#262626] p-6 mb-8 animate-pulse">
        <div className="h-6 bg-[#262626] w-32 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-16 bg-[#262626]"></div>
          <div className="h-16 bg-[#262626]"></div>
          <div className="h-16 bg-[#262626]"></div>
          <div className="h-16 bg-[#262626]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#262626] p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">STATS THIS WEEK</h2>
        {stats.streak > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            <span className="font-bold text-[#DC2626]">{stats.streak} DAY STREAK</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="SCANS"
          value={stats.scansThisWeek}
          sublabel="this week"
        />
        <StatCard
          label="GENERATED"
          value={stats.contentGeneratedThisWeek}
          sublabel="pieces"
        />
        <StatCard
          label="PUBLISHED"
          value={stats.publishedThisWeek}
          sublabel={`${stats.contentGeneratedThisWeek > 0 ? Math.round((stats.publishedThisWeek / stats.contentGeneratedThisWeek) * 100) : 0}% rate`}
        />
        <StatCard
          label="UNUSED"
          value={stats.unusedOpportunities}
          sublabel="opportunities"
          highlight={stats.unusedOpportunities > 10}
        />
      </div>

      <div className="mt-4 pt-4 border-t border-[#262626] flex justify-between items-center text-sm font-mono">
        <span className="text-[#737373]">
          TOP SCORE: <span className="text-[#DC2626] font-bold">{stats.topScore}/10</span>
        </span>
        <span className="text-[#737373]">
          MOST COMMON: <span className="text-white uppercase">{stats.mostCommonType}</span>
        </span>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  highlight = false,
}: {
  label: string;
  value: number;
  sublabel: string;
  highlight?: boolean;
}) {
  return (
    <div className={`border ${highlight ? 'border-[#DC2626]' : 'border-[#262626]'} p-4 text-center`}>
      <div className={`text-3xl font-bold ${highlight ? 'text-[#DC2626]' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-xs font-bold text-[#737373] mt-1">{label}</div>
      <div className="text-xs text-[#737373] mt-1">{sublabel}</div>
    </div>
  );
}
