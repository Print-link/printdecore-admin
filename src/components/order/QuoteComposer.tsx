import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { quotationService, type Quotation } from '../../services/orderService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { FormField, iosInputCls } from '../ui/FormField';
import type { OrderStatus } from '../../types';

/** Statuses at or past payment — the price is locked. */
const LOCKED: OrderStatus[] = [
  'PAID', 'RECEIVED', 'IN_PROGRESS', 'PRINTING', 'QUALITY_CHECK',
  'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED', 'COMPLETED', 'CANCELLED',
];

const money = (n: number) => `GHS ${n.toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface QuoteComposerProps {
  quotation: Quotation;
  /** The order's current status — decides whether the price can still change. */
  orderStatus?: OrderStatus;
  /** Catalog estimate to prefill when there's no amount yet. */
  referencePrice?: number;
  onSent?: (quotation: Quotation) => void;
}

/**
 * The one action that unblocks a quote-on-request order: type the amount the
 * customer pays, send it. Sending emails + pushes the customer and drops the
 * quote into their chat thread, so the copy here says exactly that — ops
 * shouldn't have to wonder what "send" does or whether they need to also
 * message the customer.
 */
export const QuoteComposer = ({ quotation, orderStatus, referencePrice, onSent }: QuoteComposerProps) => {
  const queryClient = useQueryClient();
  const initial = quotation.amount ?? referencePrice;
  const [amount, setAmount] = useState(initial != null ? String(initial) : '');

  // Re-seed when the row we're editing changes (queue modal reused across rows).
  useEffect(() => {
    const next = quotation.amount ?? referencePrice;
    setAmount(next != null ? String(next) : '');
  }, [quotation.id, quotation.amount, referencePrice]);

  const sendMutation = useMutation({
    mutationFn: ({ id, value }: { id: string; value: number }) => quotationService.send(id, value),
    onSuccess: (sent) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      queryClient.invalidateQueries({ queryKey: ['order', quotation.orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Quote sent — ${money(sent.amount ?? 0)}. The customer has been emailed.`);
      onSent?.(sent);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to send quote'),
  });

  const parsed = Number(amount);
  const valid = amount !== '' && Number.isFinite(parsed) && parsed > 0;
  const locked = !!orderStatus && LOCKED.includes(orderStatus);
  const isResend = quotation.status !== 'PENDING';
  const unchanged = isResend && quotation.amount != null && Math.abs(parsed - quotation.amount) < 0.005;

  const submit = () => {
    if (!valid || locked) return;
    sendMutation.mutate({ id: quotation.id, value: Number(parsed.toFixed(2)) });
  };

  return (
    <div className="border border-brand/40 rounded-ios p-4 space-y-3 bg-brand/5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide">Quote</p>
        <QuoteStatus quotation={quotation} orderStatus={orderStatus} />
      </div>

      {locked ? (
        <p className="text-sm text-ios-label">
          Customer paid <span className="font-semibold">{money(quotation.amount ?? 0)}</span>. The price is locked.
        </p>
      ) : (
        <>
          <FormField label="Amount the customer pays (GHS)">
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submit()}
                placeholder="0.00"
                autoFocus={quotation.status === 'PENDING'}
                className={`flex-1 text-lg font-semibold ${iosInputCls}`}
              />
              <Button onClick={submit} disabled={!valid || unchanged || sendMutation.isPending}>
                {sendMutation.isPending ? 'Sending…' : isResend ? 'Send updated quote' : 'Send quote to customer'}
              </Button>
            </div>
          </FormField>

          {referencePrice != null && (
            <p className="text-xs text-ios-gray">
              Catalog estimate: <span className="font-medium text-ios-label">{money(referencePrice)}</span>
              {quotation.amount == null && ' — prefilled above, adjust as needed.'}
            </p>
          )}

          <p className="text-xs text-ios-gray">
            {isResend
              ? 'Sending again replaces the previous price and notifies the customer.'
              : 'The customer gets an email and a push notification, and the quote appears in their chat with an Accept & Pay button.'}
          </p>
        </>
      )}
    </div>
  );
};

const QuoteStatus = ({ quotation, orderStatus }: { quotation: Quotation; orderStatus?: OrderStatus }) => {
  if (orderStatus && LOCKED.includes(orderStatus)) return <Badge variant="success">Paid</Badge>;
  switch (quotation.status) {
    case 'PENDING':
      return <Badge variant="warning">Needs a price</Badge>;
    case 'SENT':
      return <Badge variant="neutral">Sent · awaiting customer</Badge>;
    case 'ACCEPTED':
      return <Badge variant="success">Accepted · awaiting payment</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Customer asked for changes</Badge>;
    default:
      return null;
  }
};
