export const ORDER_STATUSES = ["new", "accepted", "preparing", "ready", "completed", "cancelled"] as const;
export type OrderStatus = typeof ORDER_STATUSES[number];

export const ORDER_TYPES = ["dine_in", "takeaway", "delivery"] as const;
export type OrderType = typeof ORDER_TYPES[number];

export function canTransitionOrder(from: OrderStatus, to: OrderStatus): boolean {
  const transitions: Record<OrderStatus, readonly OrderStatus[]> = {
    new: ["accepted", "cancelled"],
    accepted: ["preparing", "cancelled"],
    preparing: ["ready", "cancelled"],
    ready: ["completed"],
    completed: [],
    cancelled: [],
  };
  return transitions[from].includes(to);
}
