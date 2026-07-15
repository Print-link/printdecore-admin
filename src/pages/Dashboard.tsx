import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UserCog, Users, UserCheck, ShoppingBag, Building2, ArrowRight } from 'lucide-react';
import { getDashboardStats, reportService, orderService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import type { OrderStatus } from '../types';

type BadgeVariant = 'success' | 'neutral' | 'warning' | 'danger';

const statusVariant: Record<OrderStatus, BadgeVariant> = {
  PENDING: 'warning', QUOTED: 'neutral', PAID: 'success', RECEIVED: 'neutral',
  IN_PROGRESS: 'warning', PRINTING: 'warning', QUALITY_CHECK: 'neutral',
  READY_FOR_PICKUP: 'neutral', OUT_FOR_DELIVERY: 'neutral', DELIVERED: 'success',
  COMPLETED: 'success', CANCELLED: 'danger',
};

export const Dashboard = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
  });
  const { data: report } = useQuery({
    queryKey: ['revenue-report', '7d'],
    queryFn: () => reportService.getRevenue({ period: '7d' }),
  });
  const { data: recentOrders } = useQuery({
    queryKey: ['orders', 'recent'],
    queryFn: () => orderService.getAll({ page: 1, limit: 6 }),
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
    { label: 'Managers', value: stats.totalUsers, sub: `${stats.activeUsers} active`, icon: UserCog },
    { label: 'Clerks', value: stats.totalClerks, sub: `${stats.activeClerks} active`, icon: Users },
    { label: 'Clients', value: stats.totalClients, sub: 'all time', icon: UserCheck },
    { label: 'Orders', value: stats.totalOrders, sub: `${stats.recentOrders} last 30 days`, icon: ShoppingBag },
    { label: 'Branches', value: stats.totalBranches, sub: 'all time', icon: Building2 },
  ];

  const chartData = (report?.dailyTrends || []).map((d) => ({
    day: new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' }),
    revenue: d.revenue,
  }));

  return (
    <Layout>
      <div>
        <PageHeader title="Dashboard" subtitle="Overview of your platform statistics" />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          {statCards.map((card) => (
            <Card key={card.label} className="p-4">
              <div className="w-8 h-8 rounded-lg bg-brand/15 flex items-center justify-center mb-2">
                <card.icon className="w-4 h-4 text-brand-hover" />
              </div>
              <p className="text-xs font-medium text-ios-secondary-label uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-bold text-ios-label mt-1">{card.value}</p>
              <p className="text-xs text-ios-gray mt-0.5">{card.sub}</p>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card className="p-5">
            <p className="text-xs font-medium text-ios-secondary-label uppercase tracking-wide">Transactions</p>
            <p className="text-4xl font-bold text-ios-label mt-2">{stats.totalOrders}</p>
            <p className="text-sm text-ios-secondary-label mt-1">
              Value: <span className="font-semibold text-ios-label">GHS {(report?.totalRevenue ?? 0).toFixed(2)}</span>
            </p>
            <p className="text-xs text-ios-gray mt-3">You've made a total of {stats.totalOrders} orders on Printdecore</p>
            <div className="mt-3">
              <Badge variant="warning">{stats.recentOrders} in last 30 days</Badge>
            </div>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-ios-label">Weekly Activity</p>
              <span className="text-xs text-ios-gray">Last 7 days revenue</span>
            </div>
            {chartData.length === 0 ? (
              <div className="h-55 flex items-center justify-center text-sm text-ios-gray">No activity yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="weeklyActivityFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#fbbf24" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                  <XAxis dataKey="day" style={{ fontSize: '12px' }} tickLine={false} axisLine={false} />
                  <YAxis style={{ fontSize: '12px' }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value: number) => [`GHS ${value.toFixed(2)}`, 'Revenue']} />
                  <Area type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} fill="url(#weeklyActivityFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <Card className="p-5 mb-4">
          <h3 className="text-sm font-semibold text-ios-label mb-4">Platform Overview</h3>
          <div className="space-y-3">
            <StatBar label="Managers" value={stats.totalUsers} active={stats.activeUsers} />
            <StatBar label="Clerks" value={stats.totalClerks} active={stats.activeClerks} />
            <StatBar label="Clients" value={stats.totalClients} active={stats.totalClients} />
            <StatBar label="Branches" value={stats.totalBranches} active={stats.totalBranches} />
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-ios-gray5">
            <h3 className="text-sm font-semibold text-ios-label">Recent Orders</h3>
            <Button size="sm" variant="ghost" onClick={() => navigate('/orders')}>
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
          {!recentOrders || recentOrders.orders.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-ios-gray">No orders yet</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-ios-gray6">
                <tr>
                  <th className="text-left px-5 py-2.5 font-medium text-ios-secondary-label">Order</th>
                  <th className="text-left px-5 py-2.5 font-medium text-ios-secondary-label">Customer</th>
                  <th className="text-left px-5 py-2.5 font-medium text-ios-secondary-label">Branch</th>
                  <th className="text-left px-5 py-2.5 font-medium text-ios-secondary-label">Status</th>
                  <th className="text-right px-5 py-2.5 font-medium text-ios-secondary-label">Total</th>
                  <th className="text-right px-5 py-2.5 font-medium text-ios-secondary-label">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ios-gray5">
                {recentOrders.orders.map((o) => (
                  <tr key={o.id} className="hover:bg-ios-gray6 cursor-pointer" onClick={() => navigate('/orders')}>
                    <td className="px-5 py-3 font-medium text-ios-label">#{o.id.slice(0, 8)}</td>
                    <td className="px-5 py-3 text-ios-secondary-label">{o.customerName || '-'}</td>
                    <td className="px-5 py-3 text-ios-secondary-label">{o.branchName || '-'}</td>
                    <td className="px-5 py-3"><Badge variant={statusVariant[o.status]}>{o.status.replace(/_/g, ' ')}</Badge></td>
                    <td className="px-5 py-3 text-right text-ios-label">GHS {Number(o.totalPrice).toFixed(2)}</td>
                    <td className="px-5 py-3 text-right text-ios-gray">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
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
