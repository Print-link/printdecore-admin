import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FileText } from 'lucide-react';
import { quotationService, orderService, branchService, type Quotation } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/ui/PageHeader';
import { ListGroup, ListRow } from '../components/ui/ListGroup';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { FormField, iosInputCls } from '../components/ui/FormField';
import type { Order } from '../types';

type BadgeVariant = 'success' | 'neutral' | 'warning' | 'danger';

const statusVariant: Record<Quotation['status'], BadgeVariant> = {
  PENDING: 'warning',
  SENT: 'neutral',
  ACCEPTED: 'success',
  REJECTED: 'danger',
};

export const QuotationQueue = () => {
  const [statusFilter, setStatusFilter] = useState<Quotation['status'] | ''>('PENDING');
  const [reviewing, setReviewing] = useState<Quotation | null>(null);
  const [amountDraft, setAmountDraft] = useState('');
  const queryClient = useQueryClient();

  const { data: quotations = [], isLoading } = useQuery({
    queryKey: ['quotations', statusFilter],
    queryFn: () => quotationService.getAll(statusFilter || undefined),
  });

  const { data: order, isLoading: isLoadingOrder } = useQuery<Order>({
    queryKey: ['order', reviewing?.orderId],
    queryFn: () => orderService.getById(reviewing!.orderId),
    enabled: !!reviewing,
  });

  const { data: branches } = useQuery({
    queryKey: ['branches', 'for-reassignment'],
    queryFn: () => branchService.getAll({ limit: 500 }),
    enabled: !!reviewing,
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => quotationService.send(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setReviewing(null);
      setAmountDraft('');
    },
  });

  const reassignMutation = useMutation({
    mutationFn: ({ id, branchId }: { id: string; branchId: string }) => orderService.reassignBranch(id, branchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', reviewing?.orderId] });
    },
  });

  const [branchDraft, setBranchDraft] = useState('');

  const openReview = (quotation: Quotation) => {
    setReviewing(quotation);
    setAmountDraft(quotation.amount ? String(quotation.amount) : '');
    setBranchDraft('');
  };

  return (
    <Layout>
      <div>
        <PageHeader
          title="Quotation Queue"
          subtitle="Orders waiting on operations to confirm vendor availability and a final price before the customer can pay."
        />

        <div className="flex gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Quotation['status'] | '')}
            className={`max-w-xs ${iosInputCls}`}
          >
            <option value="">All</option>
            <option value="PENDING">Pending (needs a price)</option>
            <option value="SENT">Sent (awaiting customer)</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="REJECTED">Rejected</option>
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
                title={`#${q.orderId.slice(-8)}`}
                subtitle={`${q.kind} · ${new Date(q.createdAt).toLocaleDateString()}`}
                trailing={
                  <>
                    <span className="text-sm font-medium text-ios-label">
                      {q.amount != null ? `GHS ${q.amount.toFixed(2)}` : '-'}
                    </span>
                    <Badge variant={statusVariant[q.status]}>{q.status}</Badge>
                  </>
                }
                chevron
              />
            ))}
            {quotations.length === 0 && (
              <div className="px-4 py-12 text-center text-ios-gray">No quotations found</div>
            )}
          </ListGroup>
        )}

        <Modal isOpen={!!reviewing} onClose={() => setReviewing(null)} title="Review Quotation" size="large">
          {reviewing && (
            <div className="space-y-4">
              {isLoadingOrder ? (
                <div className="flex justify-center py-8"><LoadingSpinner /></div>
              ) : order ? (
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Customer" value={order.customerName || order.customerEmail || '-'} />
                  <Field label="Phone" value={order.customerPhone || '-'} />
                  <Field label="Order Status" value={order.status} />
                </div>
              ) : null}

              {order && (
                <div className="border border-ios-gray5 rounded-ios p-4 space-y-2 bg-ios-gray6">
                  <FormField label={`Branch (currently: ${order.branchName || order.branchId})`}>
                    <div className="flex gap-2">
                      <select
                        value={branchDraft}
                        onChange={(e) => setBranchDraft(e.target.value)}
                        className={`flex-1 ${iosInputCls}`}
                      >
                        <option value="">Keep current branch</option>
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
                    Use this if the original vendor isn't available and a different one confirmed instead.
                  </p>
                </div>
              )}

              {order?.comment && (
                <div>
                  <p className="text-xs font-medium text-ios-secondary-label mb-1">Customer's description</p>
                  <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3 whitespace-pre-wrap">{order.comment}</p>
                </div>
              )}

              {reviewing.aiSummary && (
                <div>
                  <p className="text-xs font-medium text-ios-secondary-label mb-1">AI summary</p>
                  <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3 whitespace-pre-wrap">{reviewing.aiSummary}</p>
                </div>
              )}
              {!reviewing.aiSummary && (
                <p className="text-xs text-ios-gray italic">No AI summary yet — pricing is manual for now.</p>
              )}

              <div className="border border-ios-gray5 rounded-ios p-4 space-y-2 bg-ios-gray6">
                <FormField label="Quoted price (GHS)">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={amountDraft}
                      onChange={(e) => setAmountDraft(e.target.value)}
                      placeholder="0.00"
                      className={`flex-1 ${iosInputCls}`}
                    />
                    <Button
                      onClick={() => {
                        const amount = Number(amountDraft);
                        if (amount > 0) sendMutation.mutate({ id: reviewing.id, amount });
                      }}
                      disabled={!amountDraft || Number(amountDraft) <= 0 || sendMutation.isPending}
                    >
                      {sendMutation.isPending ? 'Sending…' : 'Send to customer'}
                    </Button>
                  </div>
                </FormField>
                <p className="text-xs text-ios-gray">
                  Sending notifies the customer and moves the order to Quoted — they pay once they accept.
                </p>
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
