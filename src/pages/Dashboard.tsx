import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';

export const Dashboard = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-32">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !stats) {
    return (
      <Layout>
        <div className="text-center py-32 text-gray-500">
          {error ? 'Error loading dashboard stats' : 'No data available'}
        </div>
      </Layout>
    );
  }

  const statCards = [
    { label: 'Total Managers', value: stats.totalUsers, sub: `${stats.activeUsers} active`, color: 'bg-blue-50 text-blue-700' },
    { label: 'Total Clerks', value: stats.totalClerks, sub: `${stats.activeClerks} active`, color: 'bg-purple-50 text-purple-700' },
    { label: 'Total Clients', value: stats.totalClients, sub: 'all time', color: 'bg-green-50 text-green-700' },
    { label: 'Total Orders', value: stats.totalOrders, sub: `${stats.recentOrders} last 30 days`, color: 'bg-orange-50 text-orange-700' },
    { label: 'Total Branches', value: stats.totalBranches, sub: 'all time', color: 'bg-indigo-50 text-indigo-700' },
  ];

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your platform statistics</p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Platform Overview</h3>
            <div className="space-y-3">
              <StatBar label="Managers" value={stats.totalUsers} active={stats.activeUsers} color="bg-blue-500" />
              <StatBar label="Clerks" value={stats.totalClerks} active={stats.activeClerks} color="bg-purple-500" />
              <StatBar label="Clients" value={stats.totalClients} active={stats.totalClients} color="bg-green-500" />
              <StatBar label="Branches" value={stats.totalBranches} active={stats.totalBranches} color="bg-indigo-500" />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Orders Summary</h3>
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-gray-900">{stats.totalOrders}</p>
                <p className="text-sm text-gray-500 mt-1">Total Orders</p>
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-medium">
                  {stats.recentOrders} in last 30 days
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const StatBar = ({ label, value, active, color }: { label: string; value: number; active: number; color: string }) => {
  const pct = value > 0 ? Math.round((active / value) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="text-gray-900 font-medium">{active}/{value}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
