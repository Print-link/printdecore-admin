import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { printerOrderService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { formatDateTime } from '../utils/date';
import type { PrinterOrder, PrinterOrderStatus } from '../types';

type BadgeVariant = 'success' | 'neutral' | 'warning' | 'danger';

const statusVariant: Record<PrinterOrderStatus, BadgeVariant> = {
  PROCESSING: 'warning',
  OUT_FOR_DELIVERY: 'neutral',
  DELIVERED: 'success',
  CANCELLED: 'danger',
};

const ALL_STATUSES: PrinterOrderStatus[] = ['PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export const PrinterSales = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrder, setSelectedOrder] = useState<PrinterOrder | null>(null);
  const [statusDraft, setStatusDraft] = useState<PrinterOrderStatus | ''>('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['printer-orders', statusFilter],
    queryFn: () => printerOrderService.getAll({ status: (statusFilter || undefined) as PrinterOrderStatus | undefined, limit: 100 }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PrinterOrderStatus }) => printerOrderService.updateStatus(id, status),
    onSuccess: (updated) => {
      setSelectedOrder(updated);
      queryClient.invalidateQueries({ queryKey: ['printer-orders'] });
      toast.success('Order status updated');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update order'),
  });

  const openOrder = (order: PrinterOrder) => {
    setSelectedOrder(order);
    setStatusDraft(order.status);
  };

  return (
    <Layout>
      <div>
        <PageHeader
          title="Printer Sales"
          subtitle="Orders placed against the printer listings catalogue"
          actions={<Button size="sm" variant="secondary" onClick={() => navigate('/printer-sales/listings')}>Manage Listings</Button>}
        />

        <div className="flex gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
          <div className="bg-white rounded-ios shadow-ios overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-ios-gray6 border-b border-ios-gray5">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Printer</th>
                  <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-ios-secondary-label">Total</th>
                  <th className="text-left px-4 py-3 font-medium text-ios-secondary-label">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-ios-secondary-label">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ios-gray5">
                {data?.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-ios-gray6">
                    <td className="px-4 py-3 font-mono text-xs text-ios-secondary-label">#{order.id.slice(-8)}</td>
                    <td className="px-4 py-3 font-medium text-ios-label">{order.customerName || order.customerPhone || '-'}</td>
                    <td className="px-4 py-3 text-ios-secondary-label">{order.printerName || '-'} × {order.quantity}</td>
                    <td className="px-4 py-3">
                      <Badge variant={statusVariant[order.status]}>{order.status.replace(/_/g, ' ')}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-ios-label">GHS {order.totalPrice.toFixed(2)}</td>
                    <td className="px-4 py-3 text-ios-secondary-label">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => openOrder(order)}>View</Button>
                    </td>
                  </tr>
                ))}
                {(!data?.orders || data.orders.length === 0) && (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-ios-gray">No printer orders yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Detail Modal */}
        <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Printer Order">
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Printer" value={`${selectedOrder.printerName || '-'} × ${selectedOrder.quantity}`} />
                <Field label="Unit Price" value={`GHS ${selectedOrder.unitPrice.toFixed(2)}`} />
                <Field label="Delivery Fee" value={`GHS ${selectedOrder.deliveryFee.toFixed(2)}`} />
                <Field label="Total" value={`GHS ${selectedOrder.totalPrice.toFixed(2)}`} />
                <Field label="Customer" value={selectedOrder.customerName || '-'} />
                <Field label="Customer Email" value={selectedOrder.customerEmail || '-'} />
                <Field label="Recipient Phone" value={selectedOrder.recipientPhone} />
                <Field label="Payment Method" value={selectedOrder.paymentMethod === 'momo' ? 'Mobile Money' : 'Pay on Delivery'} />
                {selectedOrder.paymentReference && <Field label="Payment Reference" value={selectedOrder.paymentReference} />}
                <Field label="Created" value={formatDateTime(selectedOrder.createdAt)} />
                <Field label="Updated" value={formatDateTime(selectedOrder.updatedAt)} />
              </div>

              <div>
                <p className="text-xs font-medium text-ios-secondary-label mb-1">Delivery Address</p>
                <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3">{selectedOrder.deliveryAddress}</p>
              </div>

              {selectedOrder.comment && (
                <div>
                  <p className="text-xs font-medium text-ios-secondary-label mb-1">Notes for the rider</p>
                  <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3 whitespace-pre-wrap">{selectedOrder.comment}</p>
                </div>
              )}

              <div className="border border-ios-gray5 rounded-ios p-4 space-y-3 bg-ios-gray6">
                <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide">Update Status</p>
                <div className="flex gap-2">
                  <select
                    value={statusDraft}
                    onChange={(e) => setStatusDraft(e.target.value as PrinterOrderStatus)}
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
              </div>
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
