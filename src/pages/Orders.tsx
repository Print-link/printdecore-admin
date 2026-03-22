import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { orderService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import type { Order, OrderStatus } from '../types';

const statusColors: Record<OrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  QUOTED: 'bg-blue-100 text-blue-700',
  PAID: 'bg-indigo-100 text-indigo-700',
  RECEIVED: 'bg-purple-100 text-purple-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
};

export const Orders = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: () => orderService.getAll({ page, limit: 15, status: statusFilter || undefined }),
  });

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

        <div className="flex gap-3 mb-4">
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="QUOTED">Quoted</option>
            <option value="PAID">Paid</option>
            <option value="RECEIVED">Received</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Order ID</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Branch</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Commission</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data?.orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">#{order.id.slice(-8)}</td>
                      <td className="px-4 py-3 font-medium text-gray-900">{order.customerName || order.customerEmail || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{order.branchName || order.branchId}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-gray-900">{order.currency || 'GHS'} {order.totalPrice?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-500">{order.commissionAmount != null ? `${order.currency || 'GHS'} ${order.commissionAmount.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setSelectedOrder(order)} className="text-sm text-gray-600 hover:text-gray-900">View</button>
                      </td>
                    </tr>
                  ))}
                  {(!data?.orders || data.orders.length === 0) && (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-gray-400">No orders found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            {data?.pagination && <Pagination {...data.pagination} onPageChange={setPage} />}
          </>
        )}

        {/* Order Detail Modal */}
        <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details" size="large">
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Order ID" value={selectedOrder.id} />
                <Field label="Status" value={selectedOrder.status} />
                <Field label="Customer" value={selectedOrder.customerName || selectedOrder.customerEmail || '-'} />
                <Field label="Phone" value={selectedOrder.customerPhone || '-'} />
                <Field label="Branch" value={selectedOrder.branchName || selectedOrder.branchId} />
                <Field label="Total" value={`${selectedOrder.currency || 'GHS'} ${selectedOrder.totalPrice?.toFixed(2)}`} />
                <Field label="Commission" value={selectedOrder.commissionAmount != null ? `${selectedOrder.currency || 'GHS'} ${selectedOrder.commissionAmount.toFixed(2)}` : 'N/A'} />
                <Field label="Payment Ref" value={selectedOrder.paymentReference || '-'} />
                <Field label="Created" value={new Date(selectedOrder.createdAt).toLocaleString()} />
                <Field label="Updated" value={new Date(selectedOrder.updatedAt).toLocaleString()} />
              </div>
              {selectedOrder.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{selectedOrder.notes}</p>
                </div>
              )}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-2">Items</p>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Service</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Qty</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Unit Price</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2">{item.serviceName}</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">{item.unitPrice?.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-medium">{item.totalPrice?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

const Field = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-800">{value}</p>
  </div>
);
