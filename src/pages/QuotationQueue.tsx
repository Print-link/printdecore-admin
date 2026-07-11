import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationService, orderService, type Quotation } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Modal } from '../components/Modal';
import type { Order } from '../types';

const statusColors: Record<Quotation['status'], string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
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

  const sendMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) => quotationService.send(id, amount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setReviewing(null);
      setAmountDraft('');
    },
  });

  const openReview = (quotation: Quotation) => {
    setReviewing(quotation);
    setAmountDraft(quotation.amount ? String(quotation.amount) : '');
  };

  return (
    <Layout>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Quotation Queue</h1>
        <p className="text-sm text-gray-500 mb-6">
          Complex and custom orders waiting on a price from operations before the customer can pay.
        </p>

        <div className="flex gap-3 mb-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as Quotation['status'] | '')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
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
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Kind</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Created</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">#{q.orderId.slice(-8)}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{q.kind}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[q.status]}`}>
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {q.amount != null ? `GHS ${q.amount.toFixed(2)}` : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{new Date(q.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openReview(q)} className="text-sm text-gray-600 hover:text-gray-900">
                        {q.status === 'PENDING' ? 'Price & Send' : 'Review'}
                      </button>
                    </td>
                  </tr>
                ))}
                {quotations.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No quotations found</td></tr>
                )}
              </tbody>
            </table>
          </div>
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
                  <Field label="Branch" value={order.branchName || order.branchId} />
                  <Field label="Order Status" value={order.status} />
                </div>
              ) : null}

              {order?.comment && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Customer's description</p>
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{order.comment}</p>
                </div>
              )}

              {reviewing.aiSummary && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">AI summary</p>
                  <p className="text-sm text-gray-800 bg-gray-50 rounded-lg p-3 whitespace-pre-wrap">{reviewing.aiSummary}</p>
                </div>
              )}
              {!reviewing.aiSummary && (
                <p className="text-xs text-gray-400 italic">No AI summary yet — pricing is manual for now.</p>
              )}

              <div className="border border-gray-200 rounded-lg p-4 space-y-2 bg-gray-50">
                <label className="text-xs font-medium text-gray-500 block">Quoted price (GHS)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amountDraft}
                    onChange={(e) => setAmountDraft(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                  <button
                    onClick={() => {
                      const amount = Number(amountDraft);
                      if (amount > 0) sendMutation.mutate({ id: reviewing.id, amount });
                    }}
                    disabled={!amountDraft || Number(amountDraft) <= 0 || sendMutation.isPending}
                    className="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg disabled:opacity-40"
                  >
                    {sendMutation.isPending ? 'Sending…' : 'Send to customer'}
                  </button>
                </div>
                <p className="text-xs text-gray-400">
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
    <p className="text-xs font-medium text-gray-500">{label}</p>
    <p className="text-sm text-gray-800">{value}</p>
  </div>
);
