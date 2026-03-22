import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export const Reports = () => {
  const [period, setPeriod] = useState('30d');
  const [branchId] = useState('');

  const { data: report, isLoading } = useQuery({
    queryKey: ['revenue-report', period, branchId],
    queryFn: () => reportService.getRevenue({ period, branchId: branchId || undefined }),
  });

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Revenue Reports</h1>
        <p className="text-sm text-gray-500 mb-6">Analytics and revenue breakdown</p>

        <div className="flex gap-3 mb-6">
          <select value={period} onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : report ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              <StatCard label="Total Revenue" value={`GHS ${report.totalRevenue?.toFixed(2) || '0.00'}`} />
              <StatCard label="Paid Revenue" value={`GHS ${report.paidRevenue?.toFixed(2) || '0.00'}`} />
              <StatCard label="Pending Revenue" value={`GHS ${report.pendingRevenue?.toFixed(2) || '0.00'}`} />
              <StatCard label="Orders" value={String(report.orderCount || 0)} />
              <StatCard label="Avg Order Value" value={`GHS ${report.averageOrderValue?.toFixed(2) || '0.00'}`} />
            </div>

            {/* Daily Trends Chart */}
            {report.dailyTrends && report.dailyTrends.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Revenue Trend</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={report.dailyTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" style={{ fontSize: '11px' }} />
                    <YAxis style={{ fontSize: '11px' }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#111827" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="orders" stroke="#6B7280" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Category Performance */}
            {report.categoryPerformance && report.categoryPerformance.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Category Performance</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={report.categoryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="category" style={{ fontSize: '11px' }} />
                    <YAxis style={{ fontSize: '11px' }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#111827" radius={[6, 6, 0, 0]} name="Revenue" />
                    <Bar dataKey="orders" fill="#D1D5DB" radius={[6, 6, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top Services Table */}
            {report.topServices && report.topServices.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700">Top Services</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">#</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">Service</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Revenue</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-500">Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {report.topServices.map((svc, i) => (
                      <tr key={svc.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{svc.name}</td>
                        <td className="px-4 py-3 text-right text-gray-700">GHS {svc.revenue?.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-gray-500">{svc.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 text-gray-400">No report data available</div>
        )}
      </div>
    </Layout>
  );
};

const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-4">
    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
    <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
  </div>
);
