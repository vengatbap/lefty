# LEFTY Production v1

LEFTY v1 is a multi-tenant restaurant operations SaaS intended for real commercial use.

## Non-negotiable production rules

1. The server/database is authoritative. Browser state is never the source of truth for orders, stock, payments, permissions, or financial totals.
2. Business records are scoped to an organization and, where operationally relevant, a location.
3. Inventory is first-class: ingredients, recipes, balances, movements, consumption, waste, purchasing and availability must reconcile.
4. Money uses fixed-precision database values and server-side calculations.
5. State transitions are explicit and validated.
6. Mutations that can duplicate financial or inventory effects must be idempotent.
7. Authorization is enforced server-side.
8. Important mutations create audit records.
9. Integrations are adapters; core operations do not depend on one external provider.
10. A feature is not complete until persistence, authorization, validation, errors and automated tests exist.

## Required production domains

- Identity and organization onboarding
- Locations and staff
- Menu, categories, modifiers and pricing
- Tables and floor operations
- POS and orders
- Kitchen display and routing
- Payments, refunds and reconciliation
- Inventory, recipes, stock movements and purchasing
- Customers
- Taxes, discounts and receipts
- Reporting and daily closing
- Notifications and integrations
- Audit, security and observability
- Subscription and commercial SaaS billing

## Migration rule

The original browser POS prototype remains preserved on the main branch. Production v1 absorbs validated behavior instead of blindly replacing it.

## Release rule

Do not label LEFTY production-ready because the UI is complete. Production readiness requires critical domains to be database-backed, secured, tested end-to-end, observable and deployable with repeatable migrations and rollback procedures.
