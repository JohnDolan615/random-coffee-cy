'use client';

import { useEffect, useState } from 'react';
import type { DashboardStats } from '@random-coffee/shared';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
}

function StatsCard({ title, value, change, icon }: StatsCardProps) {
  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {icon && <div className="text-gray-400">{icon}</div>}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {change && (
                  <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                    change.type === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change.type === 'increase' ? '↗' : '↘'} {Math.abs(change.value)}%
                  </div>
                )}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardStatsComponent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (!response.ok) throw new Error('Failed to fetch stats');
        
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
            <div className="p-5">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-sm text-red-600">
          {error || 'Failed to load dashboard stats'}
        </div>
      </div>
    );
  }

  const revenueChange = stats.revenue.thisMonth > stats.revenue.lastMonth 
    ? { type: 'increase' as const, value: Math.round(((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth) * 100) }
    : { type: 'decrease' as const, value: Math.round(((stats.revenue.lastMonth - stats.revenue.thisMonth) / stats.revenue.lastMonth) * 100) };

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Users"
        value={stats.totalUsers.toLocaleString()}
        icon={<span>👥</span>}
      />
      
      <StatsCard
        title="Active Users"
        value={stats.activeUsers.toLocaleString()}
        icon={<span>✅</span>}
      />
      
      <StatsCard
        title="Today's Pairings"
        value={stats.todaysPairings.toLocaleString()}
        icon={<span>☕</span>}
      />
      
      <StatsCard
        title="Acceptance Rate"
        value={`${(stats.acceptanceRate * 100).toFixed(1)}%`}
        icon={<span>📊</span>}
      />
      
      <StatsCard
        title="Show-up Rate"
        value={`${(stats.showUpRate * 100).toFixed(1)}%`}
        icon={<span>📅</span>}
      />
      
      <StatsCard
        title="Average Rating"
        value={`${stats.avgRating.toFixed(1)}/5`}
        icon={<span>⭐</span>}
      />
      
      <StatsCard
        title="Revenue (This Month)"
        value={`${stats.revenue.thisMonth} XTR`}
        change={revenueChange}
        icon={<span>💰</span>}
      />
      
      <StatsCard
        title="Revenue (Last Month)"
        value={`${stats.revenue.lastMonth} XTR`}
        icon={<span>📈</span>}
      />
    </div>
  );
}