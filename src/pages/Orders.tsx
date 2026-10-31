import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Pagination } from '../components/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { iosInputCls } from '../components/ui/FormField';
import { formatDate } from '../utils/date';
import type { OrderStatus } from '../types';

type BadgeVariant = 'success' | 'neutral' | 'warning' | 'danger';

const statusVariant: Record<OrderStatus, BadgeVariant> = {
  PENDING: 'warning',
  QUOTED: 'neutral',
  PAID: 'success',
  CONFIRMING_AVAILABILITY: 'warning',
  RECEIVED: 'neutral',
  IN_PROGRESS: 'warning',
  PRINTING: 'warning',
  QUALITY_CHECK: 'neutral',
  READY_FOR_PICKUP: 'neutral',
  OUT_FOR_DELIVERY: 'neutral',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'danger',
};

const ALL_STATUSES: OrderStatus[] = [
  'PENDING', 'QUOTED', 'PAID', 'CONFIRMING_AVAILABILITY', 'RECEIVED', 'IN_PROGRESS', 'PRINTING',
  'QUALITY_CHECK', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED',
  'COMPLETED', 'CANCELLED',
];

export const Orders = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: () => orderService.getAll({ page, limit: 15, status: statusFilter || undefined }),
    refetchInterval: 30_000,
  });

  return (
    <Layout>
      <div>
        <PageHeader title="Orders" />

        <div className="flex gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className={`max-w-xs ${iosInputCls}`}
          >
            <option value="">All Status</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="bg-white rounded-ios shadow-ios overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-ios-gray6 border-b border-ios-gray5">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Order ID</th>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Branch</th>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-ios-secondary-label">Total</th>
                    <th className="text-right px-4 py-3 font-medium text-ios-secondary-label">Commission</th>
                    <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-ios-secondary-label">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ios-gray5">
                  {data?.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-ios-gray6 cursor-pointer" onClick={() => navigate(`/orders/${order.id}`)}>
                      <td className="px-4 py-3 font-mono text-xs text-ios-secondary-label">#{order.id.slice(-8)}</td>
                      <td className="px-4 py-3 font-medium text-ios-label">{order.customerName || order.customerEmail || '-'}</td>
                      <td className="px-4 py-3 text-ios-secondary-label">{order.branchName || order.branchId}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[order.status] || 'neutral'}>{order.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ios-label">{order.currency || 'GHS'} {order.totalPrice?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-ios-secondary-label">{order.commissionAmount != null ? `${order.currency || 'GHS'} ${order.commissionAmount.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3 text-ios-secondary-label">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); navigate(`/orders/${order.id}`); }}>View</Button>
                      </td>
                    </tr>
                  ))}
                  {(!data?.orders || data.orders.length === 0) && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-ios-gray">No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}
      </div>
    </Layout>
  );
};
