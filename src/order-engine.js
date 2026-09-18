export const ORDER_STATUS = Object.freeze({
  NEW: 'new', ACCEPTED: 'accepted', PREPARING: 'preparing', READY: 'ready', COMPLETED: 'completed', CANCELLED: 'cancelled',
});

const TRANSITIONS = Object.freeze({
  [ORDER_STATUS.NEW]: [ORDER_STATUS.ACCEPTED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.ACCEPTED]: [ORDER_STATUS.PREPARING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PREPARING]: [ORDER_STATUS.READY, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.READY]: [ORDER_STATUS.COMPLETED],
  [ORDER_STATUS.COMPLETED]: [], [ORDER_STATUS.CANCELLED]: [],
});

export const nextAction = {
  new: ['Accept order', ORDER_STATUS.ACCEPTED],
  accepted: ['Start preparing', ORDER_STATUS.PREPARING],
  preparing: ['Mark ready', ORDER_STATUS.READY],
  ready: ['Complete order', ORDER_STATUS.COMPLETED],
};

export function transitionOrder(order, nextStatus, actor = 'Current user') {
  if (!TRANSITIONS[order.status]?.includes(nextStatus)) {
    throw new Error(`Cannot move an ${order.status} order to ${nextStatus}.`);
  }
  const at = new Date().toISOString();
  return { ...order, status: nextStatus, updatedAt: at, history: [...order.history, { status: nextStatus, at, actor }] };
}

export function createOrder({ type, items, paymentMethod, table }) {
  if (!items?.length) throw new Error('Add at least one item before creating an order.');
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const at = new Date().toISOString();
  return {
    id: crypto.randomUUID(), number: `L-${String(Date.now()).slice(-5)}`, type, table: table || null,
    status: ORDER_STATUS.NEW, items, total, paymentMethod, createdAt: at, updatedAt: at,
    history: [{ status: ORDER_STATUS.NEW, at, actor: 'Cashier' }],
  };
}
