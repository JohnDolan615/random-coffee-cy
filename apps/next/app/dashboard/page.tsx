import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import DashboardStats from '@/components/dashboard/stats';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Admin Dashboard - Random Coffee',
  description: 'Admin dashboard for Random Coffee bot management',
};

export default async function DashboardPage() {
  // Verify admin access
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <span className="text-2xl">☕</span>
              <h1 className="ml-2 text-xl font-bold text-gray-900">Random Coffee Admin</h1>
            </div>
            <nav className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost">← Back to Site</Button>
              </Link>
              <Link href="/api/match/trigger">
                <Button>Manual Match Trigger</Button>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600">Monitor bot performance and manage operations</p>
        </div>

        {/* Stats Cards */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Key Metrics</h2>
          <DashboardStats />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-4">
              <Link href="/api/match/trigger" className="block">
                <Button className="w-full justify-start">
                  <span className="mr-2">🎯</span>
                  Trigger Manual Matching
                </Button>
              </Link>
              
              <Link href="/dashboard/users" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <span className="mr-2">👥</span>
                  Manage Users
                </Button>
              </Link>
              
              <Link href="/dashboard/payments" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <span className="mr-2">💰</span>
                  Payment Management
                </Button>
              </Link>
              
              <Link href="/dashboard/pairings" className="block">
                <Button variant="secondary" className="w-full justify-start">
                  <span className="mr-2">☕</span>
                  View Pairings
                </Button>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">●</span>
                  <span className="text-sm font-medium">Bot Status</span>
                </div>
                <span className="text-sm text-green-600">Online</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">●</span>
                  <span className="text-sm font-medium">Database</span>
                </div>
                <span className="text-sm text-green-600">Connected</span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <span className="text-green-500 mr-2">●</span>
                  <span className="text-sm font-medium">Queue System</span>
                </div>
                <span className="text-sm text-green-600">Running</span>
              </div>
              
              <Link href="/api/health">
                <Button variant="ghost" size="sm" className="w-full">
                  View Detailed Health →
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <span className="text-green-500 mr-3">✅</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Daily matching completed</p>
                    <p className="text-xs text-gray-500">Europe/London timezone - 12 pairs created</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">2 minutes ago</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <span className="text-blue-500 mr-3">👤</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">New user registered</p>
                    <p className="text-xs text-gray-500">Software Engineer from New York</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">15 minutes ago</span>
              </div>
              
              <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <span className="text-purple-500 mr-3">💰</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Pro subscription purchased</p>
                    <p className="text-xs text-gray-500">770 XTR - Product Manager</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">1 hour ago</span>
              </div>
              
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center">
                  <span className="text-orange-500 mr-3">☕</span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Coffee meeting completed</p>
                    <p className="text-xs text-gray-500">5-star rating, positive feedback</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">3 hours ago</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}