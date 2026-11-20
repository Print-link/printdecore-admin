import type { OrderStatus } from '../types';

/**
 * The statuses ops can move an order to next. Price and payment steps
 * (QUOTED, PAID) aren't here: sending a quote and the customer paying set
 * those. Anything off-path is still reachable via "Show all statuses".
 */
export const NEXT_STATUSES: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CANCELLED'],
  CONFIRMING_AVAILABILITY: ['CANCELLED'],
  QUOTED: ['CANCELLED'],
  AWAITING_PAYMENT: ['CANCELLED'],
  PAID: ['RECEIVED', 'CANCELLED'],
  RECEIVED: ['PRINTING', 'IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['PRINTING', 'QUALITY_CHECK'],
  PRINTING: ['QUALITY_CHECK'],
  QUALITY_CHECK: ['READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'],
  READY_FOR_PICKUP: ['COMPLETED', 'OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Steps that make no sense for how the customer is getting the order. */
export const nextStatusesFor = (status: OrderStatus, fulfilment?: 'delivery' | 'pickup'): OrderStatus[] =>
  NEXT_STATUSES[status].filter((s) =>
    fulfilment === 'pickup' ? s !== 'OUT_FOR_DELIVERY' : fulfilment === 'delivery' ? s !== 'READY_FOR_PICKUP' : true,
  );
