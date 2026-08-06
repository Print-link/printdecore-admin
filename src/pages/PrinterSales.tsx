import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, MapPin, Printer } from 'lucide-react';
import { printerOrderService } from '../services/superAdminService';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Layout } from '../components/Layout';
import { Drawer } from '../components/Drawer';
import { DeliveryLocationMap } from '../components/DeliveryLocationMap';
import { PageHeader } from '../components/ui/PageHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { iosInputCls } from '../components/ui/FormField';
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

        {/* Order Detail Drawer */}
        <Drawer isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Printer Order">
          {selectedOrder && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ios-secondary-label">#{selectedOrder.id.slice(-8)}</span>
                <Badge variant={statusVariant[selectedOrder.status]}>{selectedOrder.status.replace(/_/g, ' ')}</Badge>
              </div>

              {/* Item ordered — images, name, price, specs */}
              <div className="border border-ios-gray5 rounded-ios overflow-hidden">
                {selectedOrder.printerImages && selectedOrder.printerImages.length > 0 ? (
                  <>
                    <img src={selectedOrder.printerImages[0]} alt="" className="w-full h-40 object-cover bg-ios-gray6" />
                    {selectedOrder.printerImages.length > 1 && (
                      <div className="flex gap-1.5 p-1.5 overflow-x-auto bg-ios-gray6">
                        {selectedOrder.printerImages.slice(1).map((url) => (
                          <img key={url} src={url} alt="" className="w-12 h-12 rounded object-cover shrink-0 border border-ios-gray5" />
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-32 bg-ios-gray6 flex items-center justify-center">
                    <Printer className="w-8 h-8 text-ios-gray3" />
                  </div>
                )}

                <div className="p-3.5">
                  <p className="text-sm font-semibold text-ios-label">{selectedOrder.printerName || 'Printer'}</p>
                  {selectedOrder.printerTags && selectedOrder.printerTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedOrder.printerTags.map((tag) => (
                        <Badge key={tag} variant="warning">{tag}</Badge>
                      ))}
                    </div>
                  )}

                  {selectedOrder.printerSpecs && selectedOrder.printerSpecs.length > 0 && (
                    <div className="mt-3 space-y-1.5">
                      {selectedOrder.printerSpecs.map((spec) => (
                        <div key={spec} className="flex items-start gap-1.5 text-xs text-ios-secondary-label">
                          <Check className="w-3.5 h-3.5 text-brand-hover shrink-0 mt-0.5" />
                          <span>{spec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-ios-gray5 space-y-1 text-sm">
                    <div className="flex justify-between text-ios-secondary-label">
                      <span>GHS {selectedOrder.unitPrice.toFixed(2)} × {selectedOrder.quantity}</span>
                      <span>GHS {(selectedOrder.unitPrice * selectedOrder.quantity).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-ios-secondary-label">
                      <span>Delivery fee</span>
                      <span>{selectedOrder.deliveryFee > 0 ? `GHS ${selectedOrder.deliveryFee.toFixed(2)}` : 'Free'}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-ios-label pt-1">
                      <span>Total</span>
                      <span>GHS {selectedOrder.totalPrice.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer */}
              <div>
                <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide mb-1.5">Customer</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Name" value={selectedOrder.customerName || '-'} />
                  <Field label="Recipient Phone" value={selectedOrder.recipientPhone} />
                  <Field label="Email" value={selectedOrder.customerEmail || '-'} />
                  <Field label="Payment" value={selectedOrder.paymentMethod === 'momo' ? 'Mobile Money' : 'Pay on Delivery'} />
                </div>
              </div>

              {/* Delivery — address + map */}
              <div>
                <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide mb-1.5">Delivery</p>
                <p className="flex items-start gap-1.5 text-sm text-ios-label bg-ios-gray6 rounded-ios p-3 mb-2">
                  <MapPin className="w-4 h-4 text-brand-hover shrink-0 mt-0.5" />
                  {selectedOrder.deliveryAddress}
                </p>
                <DeliveryLocationMap latitude={selectedOrder.deliveryLatitude} longitude={selectedOrder.deliveryLongitude} />
              </div>

              {selectedOrder.comment && (
                <div>
                  <p className="text-xs font-semibold text-ios-secondary-label uppercase tracking-wide mb-1.5">Notes for the rider</p>
                  <p className="text-sm text-ios-label bg-ios-gray6 rounded-ios p-3 whitespace-pre-wrap">{selectedOrder.comment}</p>
                </div>
              )}

              {selectedOrder.paymentReference && (
                <Field label="Payment Reference" value={selectedOrder.paymentReference} />
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Created" value={formatDateTime(selectedOrder.createdAt)} />
                <Field label="Updated" value={formatDateTime(selectedOrder.updatedAt)} />
              </div>

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
        </Drawer>
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
