import { useQuery } from '@tanstack/react-query';
import { getDashboardStats } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';

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
        <div className="text-center py-32 text-ios-gray">
          {error ? 'Error loading dashboard stats' : 'No data available'}
        </div>
      </Layout>
    );
  }

  const statCards = [
    { label: 'Total Managers', value: stats.totalUsers, sub: `${stats.activeUsers} active` },
    { label: 'Total Clerks', value: stats.totalClerks, sub: `${stats.activeClerks} active` },
    { label: 'Total Clients', value: stats.totalClients, sub: 'all time' },
    { label: 'Total Orders', value: stats.totalOrders, sub: `${stats.recentOrders} last 30 days` },
    { label: 'Total Branches', value: stats.totalBranches, sub: 'all time' },
  ];

  return (
    <Layout>
      <div>
        <PageHeader title="Dashboard" subtitle="Overview of your platform statistics" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map((card) => (
            <Card key={card.label} className="p-4">
              <p className="text-xs font-medium text-ios-secondary-label uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold text-ios-label mt-1">{card.value}</p>
              <p className="text-xs text-ios-gray mt-0.5">{card.sub}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ios-label mb-4">Platform Overview</h3>
            <div className="space-y-3">
              <StatBar label="Managers" value={stats.totalUsers} active={stats.activeUsers} />
              <StatBar label="Clerks" value={stats.totalClerks} active={stats.activeClerks} />
              <StatBar label="Clients" value={stats.totalClients} active={stats.totalClients} />
              <StatBar label="Branches" value={stats.totalBranches} active={stats.totalBranches} />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-semibold text-ios-label mb-4">Orders Summary</h3>
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <p className="text-4xl font-bold text-ios-label">{stats.totalOrders}</p>
                <p className="text-sm text-ios-secondary-label mt-1">Total Orders</p>
                <div className="mt-3 inline-block">
                  <Badge variant="warning">{stats.recentOrders} in last 30 days</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

const StatBar = ({ label, value, active }: { label: string; value: number; active: number }) => {
  const pct = value > 0 ? Math.round((active / value) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-ios-secondary-label">{label}</span>
        <span className="text-ios-label font-medium">{active}/{value}</span>
      </div>
      <div className="h-2 bg-ios-gray5 rounded-full overflow-hidden">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};
