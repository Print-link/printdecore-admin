import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import {
  UserStatsChart,
  OverviewBarChart,
  PrintJobsChart,
  StatusDistributionChart,
} from '../components/Charts';

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
    { label: 'Total Managers', value: stats.users.total, sub: `${stats.users.active} active` },
    { label: 'Total Clerks', value: stats.clerks.total, sub: `${stats.clerks.active} active` },
    { label: 'Total Clients', value: stats.clients.total, sub: `${stats.clients.active} active` },
    { label: 'Print Jobs', value: stats.printJobs.total, sub: `${stats.printJobs.pending} pending` },
    { label: 'Support Tickets', value: stats.supportTickets.total, sub: 'all time' },
  ];

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Overview of your system statistics</p>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-6">
          {statCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">User Distribution</h3>
            <UserStatsChart users={stats.users} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Print Jobs Status</h3>
            <PrintJobsChart printJobs={stats.printJobs} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Overview Statistics</h3>
            <OverviewBarChart users={stats.users} clerks={stats.clerks} clients={stats.clients} />
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Active vs Inactive Status</h3>
            <StatusDistributionChart users={stats.users} clerks={stats.clerks} clients={stats.clients} />
          </div>
        </div>
      </div>
    </Layout>
  );
};
