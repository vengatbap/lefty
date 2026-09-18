import test from 'node:test';
import assert from 'node:assert/strict';
import { ORDER_STATUS, createOrder, transitionOrder } from './order-engine.js';

const order = { status: ORDER_STATUS.NEW, history: [] };
test('allows the kitchen lifecycle and records history', () => {
    const accepted = transitionOrder(order, ORDER_STATUS.ACCEPTED);
    assert.equal(accepted.status, ORDER_STATUS.ACCEPTED);
    assert.equal(accepted.history.length, 1);
});
test('rejects an invalid lifecycle jump', () => {
    assert.throws(() => transitionOrder(order, ORDER_STATUS.READY), /Cannot move/);
});
test('creates a unified order from a POS cart', () => {
    const created = createOrder({ type: 'Takeaway', paymentMethod: 'Cash', items: [{ name: 'Coke', price: 50, quantity: 1 }] });
    assert.equal(created.total, 50);
    assert.equal(created.status, ORDER_STATUS.NEW);
});
