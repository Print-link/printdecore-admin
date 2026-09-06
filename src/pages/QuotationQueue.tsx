import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FileText, MessageSquare } from 'lucide-react';
import {
  quotationService,
  orderService,
  branchService,
  printRequestService,
  type Quotation,
} from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
import { OrderItemsTable } from '../components/order/OrderItemsTable';
import { PrintRequestSpec } from '../components/order/PrintRequestSpec';
import { QuoteComposer } from '../components/order/QuoteComposer';
import type { Order } from '../types';

type BadgeVariant = 'success' | 'neutral' | 'warning' | 'danger';

const statusVariant: Record<Quotation['status'], BadgeVariant> = {
  PENDING: 'warning',
  SENT: 'neutral',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

const statusLabel: Record<Quotation['status'], string> = {
  PENDING: 'Needs a price',
  SENT: 'Awaiting customer',
  ACCEPTED: 'Accepted',
  REJECTED: 'Changes requested',
};

const money = (n: number) => `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const quoteTitle = (q: Quotation) => q.requestNumber || `#${q.orderId.slice(-8)}`;

export const QuotationQueue = () => {
  const [statusFilter, setStatusFilter] = useState<Quotation['status'] | ''>('PENDING');
  const [reviewing, setReviewing] = useState<Quotation | null>(null);
  const [branchDraft, setBranchDraft] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations', statusFilter],
    queryFn: () => quotationService.getAll(statusFilter || undefined),
  });

  const { data: order, isLoading: isLoadingOrder } = useQuery<Order>({
    queryKey: ['order', reviewing?.orderId],
    queryFn: () => orderService.getById(reviewing!.orderId),
    enabled: !!reviewing,
  });

  // The structured spec behind a Print Assistance request — the thing ops
  // actually prices. Plain complex orders fall back to their items + comment.
  const { data: printRequest, isLoading: isLoadingSpec } = useQuery({
    queryKey: ['printRequest', 'byOrder', reviewing?.orderId],
    queryFn: () => printRequestService.getByOrderId(reviewing!.orderId),
    enabled: !!reviewing?.printRequestId,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches', 'for-reassignment'],
    queryFn: () => branchService.getAll({ limit: 500 }),
    enabled: !!reviewing,
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, branchId }: { id: string; branchId: string }) => orderService.reassignBranch(id, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', reviewing?.orderId] });
      setBranchDraft('');
      toast.success('Production partner reassigned');
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to reassign'),
  });

  const openReview = (quotation: Quotation) => {
    setReviewing(quotation);
    setBranchDraft('');
  };

  // Keep the modal's quotation in sync after a send so the status pill and
  // "resend" copy update without closing and reopening.
  const liveReviewing = reviewing ? quotations.find((q) => q.id === reviewing.id) ?? reviewing : null;

  return (
    <Layout>
      <div>
        <PageHeader
          title="Quotation Queue"
          subtitle="Quote-on-request orders. Enter the amount the customer pays and send it — they get an email, a push, and an Accept & Pay button in their chat."
        />

        <div className="flex gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Quotation['status'] | '')}
            className={`max-w-xs ${iosInputCls}`}
          >
            <option value="">All</option>
            <option value="PENDING">Needs a price</option>
            <option value="SENT">Sent (awaiting customer)</option>
            <option value="ACCEPTED">Accepted (awaiting payment)</option>
            <option value="REJECTED">Changes requested</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <ListGroup>
            {quotations.map((q) => (
              <ListRow
                key={q.id}
                onClick={() => openReview(q)}
                leading={
                  <div className="w-10 h-10 rounded-xl bg-brand/15 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-brand-hover" />
                  </div>
                }
                title={`${quoteTitle(q)}${q.serviceName ? ` · ${q.serviceName}` : ''}`}
                subtitle={[q.customerName || q.customerEmail, new Date(q.createdAt).toLocaleDateString()]
                  .filter(Boolean)
                  .join(' · ')}
                trailing={
                  <>
                    <span className="text-sm font-medium text-ios-label">
                      {q.amount != null ? money(q.amount) : q.referencePrice != null ? (
                        <span className="text-ios-gray" title="Catalog estimate">~{money(q.referencePrice)}</span>
                      ) : '—'}
                    </span>
                    <Badge variant={q.orderStatus === 'PAID' ? 'success' : statusVariant[q.status]}>
                      {q.orderStatus === 'PAID' ? 'Paid' : statusLabel[q.status]}
                    </Badge>
                  </>
                }
                chevron
              />
            ))}
            {quotations.length === 0 && (
              <div className="px-4 py-12 text-center text-ios-gray">
                {statusFilter === 'PENDING' ? 'Nothing waiting on a price — all caught up.' : 'No quotations found'}
              </div>
            )}
          </ListGroup>
        )}

        <Modal
          isOpen={!!liveReviewing}
          onClose={() => setReviewing(null)}
          title={liveReviewing ? `Quote ${quoteTitle(liveReviewing)}` : 'Review Quotation'}
          size="large"
        >
          {liveReviewing && (
            <div className="space-y-4">
              {isLoadingOrder ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : order ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Field label="Customer" value={order.customerName || order.customerEmail || '-'} />
                  <Field label="Phone" value={order.customerPhone || '-'} />
                  <Field label="Order status" value={order.status.replace(/_/g, ' ')} />
                  <Field label="Production partner" value={order.branchName || order.branchId} />
                </div>
              ) : null}

              {/* What's being priced */}
              {liveReviewing.printRequestId ? (
                isLoadingSpec ? (
                  <div className="flex justify-center py-6"><LoadingSpinner /></div>
                ) : printRequest ? (
                  <PrintRequestSpec request={printRequest} />
                ) : null
              ) : (
                <>
                  {order?.items && order.items.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-ios-secondary-label mb-1">
                        Items {order.items.length > 1 ? `(${order.items.length})` : ''}
                      </p>
                      <OrderItemsTable items={order.items} />
                    </div>
                  )}
                  {order?.comment && (
                    <div>
                      <p className="text-xs font-medium text-ios-secondary-label mb-1">Customer's description</p>
                      <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3 whitespace-pre-wrap">{order.comment}</p>
                    </div>
                  )}
                </>
              )}

              {/* The primary action */}
              <QuoteComposer
                quotation={liveReviewing}
                orderStatus={order?.status ?? liveReviewing.orderStatus}
                referencePrice={liveReviewing.referencePrice ?? printRequest?.calculatedPrice}
                onSent={() => {
                  // A freshly sent quote drops out of the "Needs a price" filter — close so ops isn't left staring at a row that's gone.
                  if (statusFilter === 'PENDING') setReviewing(null);
                }}
              />

              {/* Secondary: vendor change + jump to the order */}
              {order && (
                <div className="border border-ios-gray5 rounded-ios p-4 space-y-2 bg-ios-gray6">
                  <FormField label="Reassign production partner">
                    <div className="flex gap-2">
                      <select
                        value={branchDraft}
                        onChange={(e) => setBranchDraft(e.target.value)}
                        className={`flex-1 ${iosInputCls}`}
                      >
                        <option value="">Keep {order.branchName || 'current partner'}</option>
                        {branches?.branches
                          .filter((b) => b.id !== order.branchId)
                          .map((b) => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                          ))}
                      </select>
                      <Button
                        variant="secondary"
                        onClick={() => branchDraft && reassignMutation.mutate({ id: order.id, branchId: branchDraft })}
                        disabled={!branchDraft || reassignMutation.isPending}
                      >
                        {reassignMutation.isPending ? 'Reassigning…' : 'Reassign'}
                      </Button>
                    </div>
                  </FormField>
                  <p className="text-xs text-ios-gray">
                    Only if the original partner can't take the job. Reassigning doesn't change the quote.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="ghost" size="sm" onClick={() => navigate(`/orders/${liveReviewing.orderId}`)}>
                  <MessageSquare className="w-4 h-4" /> Open order
                </Button>
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
