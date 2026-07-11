import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService, branchService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { Pagination } from '../components/Pagination';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
import type { Order, OrderStatus } from '../types';

type BadgeVariant = 'success' | 'neutral' | 'warning' | 'danger';

const statusVariant: Record<OrderStatus, BadgeVariant> = {
  PENDING: 'warning',
  QUOTED: 'neutral',
  PAID: 'success',
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
  'PENDING', 'QUOTED', 'PAID', 'RECEIVED', 'IN_PROGRESS', 'PRINTING',
  'QUALITY_CHECK', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED',
  'COMPLETED', 'CANCELLED',
];

export const Orders = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusDraft, setStatusDraft] = useState<OrderStatus | ''>('');
  const [vendorDraft, setVendorDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders', page, statusFilter],
    queryFn: () => orderService.getAll({ page, limit: 15, status: statusFilter || undefined }),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches', 'for-vendor-assignment'],
    queryFn: () => branchService.getAll({ limit: 500 }),
    enabled: !!selectedOrder,
  });

  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => orderService.updateStatus(id, status),
    onSuccess: (updated) => {
      setSelectedOrder(updated);
      invalidateOrders();
    },
  });

  const assignVendorMutation = useMutation({
    mutationFn: ({ id, vendorId }: { id: string; vendorId: string }) => orderService.assignVendor(id, vendorId),
    onSuccess: (updated) => {
      setSelectedOrder(updated);
      invalidateOrders();
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => orderService.updateNotes(id, note),
    onSuccess: (updated) => {
      setSelectedOrder(updated);
      invalidateOrders();
    },
  });

  const openOrder = (order: Order) => {
    setSelectedOrder(order);
    setStatusDraft(order.status);
    setVendorDraft(order.assignedVendorId || '');
    setNotesDraft(order.internalNotes || '');
  };

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
                    <tr key={order.id} className="hover:bg-ios-gray6">
                      <td className="px-4 py-3 font-mono text-xs text-ios-secondary-label">#{order.id.slice(-8)}</td>
                      <td className="px-4 py-3 font-medium text-ios-label">{order.customerName || order.customerEmail || '-'}</td>
                      <td className="px-4 py-3 text-ios-secondary-label">{order.branchName || order.branchId}</td>
                      <td className="px-4 py-3">
                        <Badge variant={statusVariant[order.status] || 'neutral'}>{order.status}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-ios-label">{order.currency || 'GHS'} {order.totalPrice?.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-ios-secondary-label">{order.commissionAmount != null ? `${order.currency || 'GHS'} ${order.commissionAmount.toFixed(2)}` : '-'}</td>
                      <td className="px-4 py-3 text-ios-secondary-label">{new Date(order.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => openOrder(order)}>View</Button>
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

              {/* Ops actions — never visible to the customer */}
              <div className="border border-ios-gray5 rounded-ios p-4 space-y-4 bg-ios-gray6">
                <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide">Operations</p>

                <FormField label="Status">
                  <div className="flex gap-2">
                    <select
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value as OrderStatus)}
                      className={`flex-1 ${iosInputCls}`}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => statusDraft && updateStatusMutation.mutate({ id: selectedOrder.id, status: statusDraft })}
                      disabled={!statusDraft || statusDraft === selectedOrder.status || updateStatusMutation.isPending}
                    >
                      {updateStatusMutation.isPending ? 'Saving…' : 'Update'}
                    </Button>
                  </div>
                </FormField>

                <FormField label="Assigned production partner">
                  <div className="flex gap-2">
                    <select
                      value={vendorDraft}
                      onChange={(e) => setVendorDraft(e.target.value)}
                      className={`flex-1 ${iosInputCls}`}
                    >
                      <option value="">Unassigned</option>
                      {branches?.branches.map((b) => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      onClick={() => vendorDraft && assignVendorMutation.mutate({ id: selectedOrder.id, vendorId: vendorDraft })}
                      disabled={!vendorDraft || vendorDraft === selectedOrder.assignedVendorId || assignVendorMutation.isPending}
                    >
                      {assignVendorMutation.isPending ? 'Saving…' : 'Assign'}
                    </Button>
                  </div>
                </FormField>

                <FormField label="Internal notes (never shown to the customer)">
                  <textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={3}
                    className={iosInputCls}
                    placeholder="e.g. vendor confirmed by phone, expect delay on stock"
                  />
                </FormField>
                <Button
                  size="sm"
                  onClick={() => updateNotesMutation.mutate({ id: selectedOrder.id, note: notesDraft })}
                  disabled={notesDraft === (selectedOrder.internalNotes || '') || updateNotesMutation.isPending}
                >
                  {updateNotesMutation.isPending ? 'Saving…' : 'Save note'}
                </Button>
              </div>

              {selectedOrder.comment && (
                <div>
                  <p className="text-xs font-medium text-ios-secondary-label mb-1">Customer comment</p>
                  <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3 whitespace-pre-wrap">{selectedOrder.comment}</p>
                </div>
              )}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-ios-secondary-label mb-2">Items</p>
                  <div className="border border-ios-gray5 rounded-ios overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-ios-gray6">
                        <tr>
                          <th className="text-left px-3 py-2 text-xs font-medium text-ios-secondary-label">Service</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-ios-secondary-label">Qty</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-ios-secondary-label">Unit Price</th>
                          <th className="text-right px-3 py-2 text-xs font-medium text-ios-secondary-label">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-ios-gray5">
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id}>
                            <td className="px-3 py-2 text-ios-label">{item.serviceName}</td>
                            <td className="px-3 py-2 text-right text-ios-label">{item.quantity}</td>
                            <td className="px-3 py-2 text-right text-ios-label">{item.unitPrice?.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right font-medium text-ios-label">{item.totalPrice?.toFixed(2)}</td>
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
    <p className="text-xs font-medium text-ios-secondary-label">{label}</p>
    <p className="text-sm text-ios-label">{value}</p>
  </div>
);
