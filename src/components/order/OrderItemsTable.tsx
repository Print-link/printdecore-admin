import type { OrderItem } from '../../types';
import { FilePreviewList } from './FilePreviewList';

/**
 * Reusable per-item breakdown for an order — service, resolved configuration,
 * price, and any attached files. Shared by the order detail page and the
 * quotation review modal, since both need ops to see exactly what's being
 * priced, especially now that one order can carry multiple services.
 */
export const OrderItemsTable = ({ items }: { items?: OrderItem[] }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white border border-ios-gray5 rounded-ios overflow-hidden divide-y divide-ios-gray5">
      {items.map((item) => (
        <div key={item.id} className="p-3 space-y-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-ios-label">{item.serviceName}</p>
            <p className="text-sm font-semibold text-ios-label flex-shrink-0">
              GHS {item.totalPrice?.toFixed(2)}
            </p>
          </div>
          <p className="text-xs text-ios-gray">
            Qty {item.quantity}
            {item.configSummary && item.configSummary.length > 0 ? ` · ${item.configSummary.join(' · ')}` : ''}
          </p>
          <FilePreviewList files={item.files} />
        </div>
      ))}
    </div>
  );
};
