import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, Store, Headset } from 'lucide-react';
import { marketplaceService, type FulfilmentMode, type MarketplaceStatus } from '../../services/marketplaceService';
import { Badge } from '../ui/Badge';
import { Switch } from '../ui/Switch';
import { LoadingSpinner } from '../LoadingSpinner';

const MODES: { value: FulfilmentMode; title: string; body: string; icon: typeof Store }[] = [
  {
    value: 'managed',
    title: 'Printdecore manages',
    body: 'Your team prices and confirms each order, then passes it to this vendor.',
    icon: Headset,
  },
  {
    value: 'self_managed',
    title: 'Manages own orders',
    body: 'The vendor accepts and runs orders in the vendor app. Can be listed for customers to choose.',
    icon: Store,
  },
];

/** The one-line state ops cares about, shown as the card's badge. */
const summary = (s: MarketplaceStatus): { label: string; variant: 'success' | 'warning' | 'neutral' } => {
  if (s.fulfilmentMode === 'managed') return { label: 'Managed by Printdecore', variant: 'neutral' };
  if (s.live) return { label: 'Live on marketplace', variant: 'success' };
  if (s.marketplaceListed && !s.acceptingOrders) return { label: 'Paused by vendor', variant: 'warning' };
  if (s.marketplaceListed && !s.ready) return { label: 'Listed · hidden until ready', variant: 'warning' };
  return { label: 'Not on marketplace', variant: 'neutral' };
};

/**
 * How this vendor works with Printdecore. Starts as a two-way choice; only
 * when the vendor runs its own orders does the marketplace checklist and the
 * listing switch appear, and the switch stays off until the checklist is done.
 */
export const VendorModeCard = ({ branchId }: { branchId: string }) => {
  const queryClient = useQueryClient();
  const queryKey = ['branch', branchId, 'marketplace'];

  const { data: status, isLoading } = useQuery({
    queryKey,
    queryFn: () => marketplaceService.getStatus(branchId),
  });

  const mutation = useMutation({
    mutationFn: (data: { fulfilmentMode?: FulfilmentMode; marketplaceListed?: boolean }) =>
      marketplaceService.update(branchId, data),
    onSuccess: (next, vars) => {
      queryClient.setQueryData(queryKey, next);
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      if (vars.marketplaceListed === true) toast.success('Listed — customers nearby can now find and order from this shop');
      else if (vars.marketplaceListed === false) toast.success('Removed from the marketplace');
      else if (vars.fulfilmentMode === 'self_managed') toast.success('This vendor now runs its own orders');
      else toast.success('Printdecore manages this vendor again');
    },
    onError: (e: { response?: { data?: { message?: string } } }) =>
      toast.error(e.response?.data?.message || "Couldn't update this vendor"),
  });

  if (isLoading || !status) {
    return (
      <div className="bg-white rounded-ios shadow-ios p-6 mb-4 flex justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const chooseMode = (mode: FulfilmentMode) => {
    if (mode === status.fulfilmentMode || mutation.isPending) return;
    if (
      mode === 'managed' &&
      status.marketplaceListed &&
      !window.confirm('This takes the shop off the marketplace. Orders already placed stay with the vendor. Continue?')
    ) {
      return;
    }
    mutation.mutate({ fulfilmentMode: mode });
  };

  const badge = summary(status);
  const selfManaged = status.fulfilmentMode === 'self_managed';
  const vendorChecklist = status.checklist.filter((c) => c.key !== 'self_managed');
  const doneCount = vendorChecklist.filter((c) => c.done).length;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-3.5 mb-1">
        <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide">How this vendor works</p>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </div>

      <div className="bg-white rounded-ios shadow-ios p-3.5 space-y-4">
        <div role="radiogroup" aria-label="How this vendor works" className="grid sm:grid-cols-2 gap-2">
          {MODES.map(({ value, title, body, icon: Icon }) => {
            const active = status.fulfilmentMode === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={mutation.isPending}
                onClick={() => chooseMode(value)}
                className={`text-left rounded-ios border p-3 transition-colors ${
                  active ? 'border-brand bg-brand/10' : 'border-ios-gray5 hover:bg-ios-gray6'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-ios-label">
                  <Icon className={`w-4 h-4 ${active ? 'text-brand-hover' : 'text-ios-gray'}`} />
                  {title}
                </span>
                <span className="block text-xs text-ios-secondary-label mt-1">{body}</span>
              </button>
            );
          })}
        </div>

        {selfManaged && (
          <>
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <p className="text-sm font-semibold text-ios-label">Ready for the marketplace</p>
                <p className="text-xs text-ios-secondary-label">
                  {doneCount} of {vendorChecklist.length}
                </p>
              </div>
              <div className="h-1.5 rounded-full bg-ios-gray5 overflow-hidden mb-3">
                <div
                  className="h-full bg-ios-green transition-all"
                  style={{ width: `${(doneCount / vendorChecklist.length) * 100}%` }}
                />
              </div>
              <ul className="space-y-2">
                {vendorChecklist.map((item) => (
                  <li key={item.key} className="flex items-start gap-2.5">
                    {item.done ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-ios-green shrink-0 mt-px" aria-label="Done" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-ios-gray3 shrink-0 mt-px" aria-label="Not done" />
                    )}
                    <div className="min-w-0">
                      <p className={`text-sm ${item.done ? 'text-ios-label' : 'text-ios-label font-medium'}`}>{item.label}</p>
                      {!item.done && (
                        <p className="text-xs text-ios-secondary-label">
                          {item.hint} {item.owner === 'vendor' && <span className="text-ios-gray">· vendor does this</span>}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-ios-gray5 pt-3">
              <div>
                <p className="text-sm font-medium text-ios-label">Show on marketplace</p>
                <p className="text-xs text-ios-secondary-label">
                  {status.live
                    ? 'Customers nearby can find this shop and order from it.'
                    : status.marketplaceListed && !status.acceptingOrders
                      ? 'Listed, but the vendor has paused new orders.'
                      : status.ready
                        ? 'Ready to go live.'
                        : 'Finish the checklist to list this shop.'}
                </p>
              </div>
              <Switch
                checked={status.marketplaceListed}
                disabled={mutation.isPending || (!status.marketplaceListed && !status.ready)}
                onChange={() => mutation.mutate({ marketplaceListed: !status.marketplaceListed })}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};
