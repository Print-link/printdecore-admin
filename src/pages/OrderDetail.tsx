import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { orderService, branchService, quotationService, printRequestService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { OrderItemsTable } from '../components/order/OrderItemsTable';
import { PrintRequestSpec } from '../components/order/PrintRequestSpec';
import { QuoteComposer } from '../components/order/QuoteComposer';
import { formatDateTime } from '../utils/date';
import { nextStatusesFor } from '../utils/orderStatusFlow';
import { DeliveryLocationMap } from '../components/DeliveryLocationMap';
import type { OrderStatus } from '../types';
import { useAuth } from '../contexts/AuthContext';

type BadgeVariant = 'success' | 'neutral' | 'warning' | 'danger';

const statusVariant: Record<OrderStatus, BadgeVariant> = {
  PENDING: 'warning',
  QUOTED: 'neutral',
  AWAITING_PAYMENT: 'warning',
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
  'PENDING', 'QUOTED', 'AWAITING_PAYMENT', 'PAID', 'CONFIRMING_AVAILABILITY', 'RECEIVED', 'IN_PROGRESS', 'PRINTING',
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

  // What this admin may do here, at this order's branch (the server checks the same)
  const { can } = useAuth();
  const orderBranch = order?.branchId ?? null;
  const canManage = can('orders.manage', orderBranch);
  const canAssign = can('orders.assign', orderBranch);
  const canQuote = can('quotes.manage', orderBranch);

  const { data: branches } = useQuery({
    queryKey: ['branches', 'for-vendor-assignment'],
    queryFn: () => branchService.getAll({ limit: 500 }),
    enabled: can('orders.assign'),
  });

  // Quote-on-request orders carry a quotation row from the moment they're
  // created; pricing it is the step that unblocks everything else, so it
  // lives here next to vendor assignment rather than only on the queue page.
  const { data: quotations = [] } = useQuery({
    queryKey: ['quotations', 'byOrder', orderId],
    queryFn: () => quotationService.getAll(undefined, orderId),
  });
  const quotation = quotations[0];

  const { data: printRequest } = useQuery({
    queryKey: ['printRequest', 'byOrder', orderId],
    queryFn: () => printRequestService.getByOrderId(orderId),
  });

  const { data: timeline = [] } = useQuery({
    queryKey: ['order', orderId, 'timeline'],
    queryFn: () => orderService.getTimeline(orderId),
  });

  const [statusDraft, setStatusDraft] = useState<OrderStatus | ''>('');
  const [showAllStatuses, setShowAllStatuses] = useState(false);
  // datetime-local value; required when marking an order RECEIVED
  const [readyByDraft, setReadyByDraft] = useState('');
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
    mutationFn: ({ status, readyBy }: { status: OrderStatus; readyBy?: string }) =>
      orderService.updateStatus(orderId, status, undefined, readyBy ? new Date(readyBy).toISOString() : undefined),
    onSuccess: () => {
      invalidateOrders();
      queryClient.invalidateQueries({ queryKey: ['order', orderId, 'timeline'] });
      setReadyByDraft('');
      toast.success('Order status updated');
    },
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
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-ios-label tracking-tight font-mono">
                {printRequest?.requestNumber || `#${order.id.slice(-8)}`}
              </h1>
              <Badge variant={statusVariant[order.status] || 'neutral'}>{order.status.replace(/_/g, ' ')}</Badge>
              {printRequest && <Badge variant="neutral">Print Assistance</Badge>}
              {order.channel === 'marketplace' && <Badge variant="success">Marketplace · shop runs this order</Badge>}
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

            {order.declineReason && (
              <div className="bg-ios-red/5 border border-ios-red/20 rounded-ios p-4">
                <p className="text-sm font-semibold text-ios-label">Declined by the shop</p>
                <p className="text-sm text-ios-label mt-0.5">“{order.declineReason}”</p>
                <p className={`text-xs mt-2 ${order.refundStatus === 'failed' ? 'text-ios-red font-semibold' : 'text-ios-secondary-label'}`}>
                  {order.refundStatus === 'processed'
                    ? 'Customer refunded.'
                    : order.refundStatus === 'pending'
                      ? 'Refund in progress with Paystack.'
                      : 'Automatic refund failed — refund this customer from the Paystack dashboard.'}
                </p>
              </div>
            )}

            {order.fulfilmentType && !printRequest && (
              <div className="bg-white rounded-ios shadow-ios p-4 space-y-3">
                <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide">
                  {order.fulfilmentType === 'pickup' ? 'Customer will pick up' : 'Deliver to'}
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {order.fulfilmentType === 'delivery' && <Field label="Address" value={order.deliveryAddress || '-'} />}
                  <Field label="Contact phone" value={order.recipientPhone || order.customerPhone || '-'} />
                </div>
                {order.fulfilmentType === 'delivery' && order.deliveryLatitude != null && order.deliveryLongitude != null && (
                  <DeliveryLocationMap latitude={order.deliveryLatitude} longitude={order.deliveryLongitude} />
                )}
              </div>
            )}

            {printRequest && <PrintRequestSpec request={printRequest} />}

            {quotation && canQuote && (
              <QuoteComposer
                quotation={quotation}
                orderStatus={order.status}
                referencePrice={quotation.referencePrice ?? printRequest?.calculatedPrice}
              />
            )}

            {/* Ops actions — never visible to the customer; each shown only to admins allowed to use it */}
            {(canManage || canAssign) && (
            <div className="border border-ios-gray5 rounded-ios p-4 space-y-4 bg-ios-gray6">
              <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide">Operations</p>

              {canManage && (
              <FormField label="Move to">
                {(() => {
                  const next = showAllStatuses ? ALL_STATUSES : nextStatusesFor(order.status, order.fulfilmentType);
                  const options = [order.status, ...next.filter((s) => s !== order.status)];
                  // Accepting a paid order starts production; the customer gets the ready-by time
                  const needsReadyBy = statusDraft === 'RECEIVED' || (order.status === 'PAID' && statusDraft === 'IN_PROGRESS');
                  const blocked = !statusDraft || statusDraft === order.status || (needsReadyBy && !readyByDraft);
                  return (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <select
                          value={statusDraft}
                          onChange={(e) => setStatusDraft(e.target.value as OrderStatus)}
                          className={`flex-1 ${iosInputCls}`}
                        >
                          {options.map((s) => (
                            <option key={s} value={s}>
                              {s === order.status ? `${s.replace(/_/g, ' ')} (current)` : s.replace(/_/g, ' ')}
                            </option>
                          ))}
                        </select>
                        <Button
                          size="sm"
                          onClick={() =>
                            statusDraft && !blocked && updateStatusMutation.mutate({ status: statusDraft, readyBy: readyByDraft || undefined })
                          }
                          disabled={blocked || updateStatusMutation.isPending}
                        >
                          {updateStatusMutation.isPending ? 'Saving…' : 'Update'}
                        </Button>
                      </div>
                      {needsReadyBy && (
                        <div>
                          <p className="text-xs text-ios-secondary-label mb-1">Ready by — sent to the customer</p>
                          <input
                            type="datetime-local"
                            value={readyByDraft}
                            onChange={(e) => setReadyByDraft(e.target.value)}
                            className={iosInputCls}
                          />
                        </div>
                      )}
                      {next.length === 0 && !showAllStatuses && (
                        <p className="text-xs text-ios-gray">
                          {order.status === 'PENDING' || order.status === 'CONFIRMING_AVAILABILITY' || order.status === 'QUOTED'
                            ? 'Waiting on the quote / payment — send the price above.'
                            : 'This order is closed.'}
                        </p>
                      )}
                      <label className="flex items-center gap-2 text-xs text-ios-secondary-label">
                        <input type="checkbox" checked={showAllStatuses} onChange={(e) => setShowAllStatuses(e.target.checked)} />
                        Show all statuses (corrections only)
                      </label>
                    </div>
                  );
                })()}
              </FormField>
              )}

              {canAssign && (
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
              )}

              {canManage && (<>
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
              </>)}
            </div>
            )}

            {order.comment && !printRequest && (
              <div>
                <p className="text-xs font-medium text-ios-secondary-label mb-1">Customer comment</p>
                <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3 whitespace-pre-wrap">{order.comment}</p>
              </div>
            )}

            {timeline.length > 0 && (
              <div>
                <p className="text-xs font-medium text-ios-secondary-label mb-2">History</p>
                <ol className="bg-white rounded-ios shadow-ios divide-y divide-ios-gray5">
                  {timeline.map((entry) => (
                    <li key={entry.id} className="px-4 py-2.5 flex items-start justify-between gap-4 text-sm">
                      <div>
                        <p className="text-ios-label font-medium">{entry.status.replace(/_/g, ' ')}</p>
                        {entry.note && <p className="text-xs text-ios-gray">{entry.note}</p>}
                      </div>
                      <p className="text-xs text-ios-gray whitespace-nowrap">{formatDateTime(entry.createdAt)}</p>
                    </li>
                  ))}
                </ol>
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
