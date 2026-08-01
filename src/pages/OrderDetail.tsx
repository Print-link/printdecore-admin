import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { orderService, branchService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { OrderItemsTable } from '../components/order/OrderItemsTable';
import { formatDateTime } from '../utils/date';
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

export const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = id!;
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => orderService.getById(orderId),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches', 'for-vendor-assignment'],
    queryFn: () => branchService.getAll({ limit: 500 }),
  });

  const [statusDraft, setStatusDraft] = useState<OrderStatus | ''>('');
  const [vendorDraft, setVendorDraft] = useState('');
  const [notesDraft, setNotesDraft] = useState('');
  const [syncedOrder, setSyncedOrder] = useState(order);

  if (order && order !== syncedOrder) {
    setSyncedOrder(order);
    setStatusDraft(order.status);
    setVendorDraft(order.assignedVendorId || '');
    setNotesDraft(order.internalNotes || '');
  }

  const invalidateOrders = () => {
    queryClient.invalidateQueries({ queryKey: ['orders'] });
    queryClient.invalidateQueries({ queryKey: ['order', orderId] });
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ status }: { status: OrderStatus }) => orderService.updateStatus(orderId, status),
    onSuccess: () => { invalidateOrders(); toast.success('Order status updated'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update status'),
  });

  const assignVendorMutation = useMutation({
    mutationFn: ({ vendorId }: { vendorId: string }) => orderService.assignVendor(orderId, vendorId),
    onSuccess: () => { invalidateOrders(); toast.success('Production partner assigned'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to assign production partner'),
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ note }: { note: string }) => orderService.updateNotes(orderId, note),
    onSuccess: () => { invalidateOrders(); toast.success('Note saved'); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to save note'),
  });

  return (
    <Layout>
      <div>
        <button onClick={() => navigate('/orders')} className="flex items-center gap-1 text-sm font-medium text-brand-hover hover:opacity-70 mb-3">
          <ArrowLeft className="w-4 h-4" /> Orders
        </button>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : !order ? (
          <p className="text-sm text-ios-gray">Order not found.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-ios-label tracking-tight font-mono">#{order.id.slice(-8)}</h1>
              <Badge variant={statusVariant[order.status] || 'neutral'}>{order.status.replace(/_/g, ' ')}</Badge>
            </div>

            <div className="bg-white rounded-ios shadow-ios p-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Customer" value={order.customerName || order.customerEmail || '-'} />
              <Field label="Phone" value={order.customerPhone || '-'} />
              <Field label="Branch" value={order.branchName || order.branchId} />
              <Field label="Total" value={`${order.currency || 'GHS'} ${order.totalPrice?.toFixed(2)}`} />
              <Field label="Commission" value={order.commissionAmount != null ? `${order.currency || 'GHS'} ${order.commissionAmount.toFixed(2)}` : 'N/A'} />
              <Field label="Payment Ref" value={order.paymentReference || '-'} />
              <Field label="Created" value={formatDateTime(order.createdAt)} />
              <Field label="Updated" value={formatDateTime(order.updatedAt)} />
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
                    onClick={() => statusDraft && updateStatusMutation.mutate({ status: statusDraft })}
                    disabled={!statusDraft || statusDraft === order.status || updateStatusMutation.isPending}
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
                    onClick={() => vendorDraft && assignVendorMutation.mutate({ vendorId: vendorDraft })}
                    disabled={!vendorDraft || vendorDraft === order.assignedVendorId || assignVendorMutation.isPending}
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
                onClick={() => updateNotesMutation.mutate({ note: notesDraft })}
                disabled={notesDraft === (order.internalNotes || '') || updateNotesMutation.isPending}
              >
                {updateNotesMutation.isPending ? 'Saving…' : 'Save note'}
              </Button>
            </div>

            {order.comment && (
              <div>
                <p className="text-xs font-medium text-ios-secondary-label mb-1">Customer comment</p>
                <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3 whitespace-pre-wrap">{order.comment}</p>
              </div>
            )}

            {order.items && order.items.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ios-secondary-label mb-2">Items</p>
                <OrderItemsTable items={order.items} />
              </div>
            )}
          </div>
        )}
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
