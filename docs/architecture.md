# LEFTY architecture — initial vertical slice

## Delivered now

The browser application implements a usable POS-to-kitchen vertical slice: staff select a sale type and items, create one order, and advance its authoritative lifecycle through the order queue and kitchen board. Orders persist in browser storage for a useful local demo. This storage is **not** a production database and the application does not claim server-side multi-tenancy, authentication, payments, or channel integration.

## Production boundary

Production implementation must move `src/order-engine.js` unchanged in concept into a server-owned domain service, backed by relational `orders`, `order_items`, `order_status_history`, `kitchen_orders`, `payments`, `availability`, and `audit_logs` tables. Every query must scope organization and outlet from the authenticated session, and transitions must run in a database transaction. Channel adapters should normalize external events into the same create-order command using an idempotency key.

## Performance decision

For the delivered small operational queue, in-memory filtering is appropriate. For production order lists, it is **required** to filter, sort, and cursor-page in the database using `(outlet_id, created_at)` and status-oriented indexes only after query-plan verification. Do not download historical orders to filter in the browser.

## Realtime decision

Use short polling initially for low-volume operational data, progressing to SSE when multi-screen kitchen/order updates need lower latency. The command API remains authoritative; clients reconcile after transient failures. Offline POS is not implemented.
