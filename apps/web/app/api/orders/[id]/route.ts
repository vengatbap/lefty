import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { getDb, auditLogs, locations, orders, orderItems, payments, stockMovements, menuItems } from "@lefty/db";
import { canTransitionOrder, type OrderStatus } from "@lefty/domain";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getPaymentProvider } from "@lefty/payments";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const rows = await getDb().select({ order: orders, item: orderItems }).from(orders)
      .innerJoin(locations, eq(locations.id, orders.locationId))
      .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
      .where(and(eq(orders.id, id), eq(locations.organizationId, user.organizationId)));
    if (!rows[0]) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    return NextResponse.json({ order: rows[0].order, items: rows.filter((r) => r.item).map((r) => r.item) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to load order." }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    if (!can(user.role, "orders.update")) return NextResponse.json({ error: "You do not have permission to update orders." }, { status: 403 });
    const body = await request.json();
    const next = String(body.status) as OrderStatus;
    const rows = await getDb().select({ order: orders }).from(orders)
      .innerJoin(locations, eq(locations.id, orders.locationId))
      .where(and(eq(orders.id, id), eq(locations.organizationId, user.organizationId)))
      .limit(1);
    const current = rows[0]?.order;
    if (!current) return NextResponse.json({ error: "Order not found." }, { status: 404 });
    if (!canTransitionOrder(current.status, next)) return NextResponse.json({ error: `Cannot move order from ${current.status} to ${next}.` }, { status: 409 });

    const [updated] = await getDb().transaction(async (tx) => {
      const result = await tx.update(orders).set({ status: next, updatedAt: new Date() })
        .where(and(eq(orders.id, id), eq(orders.status, current.status))).returning();
      if (result.length !== 1) throw new Error("ORDER_CONFLICT");

      if (next === "cancelled") {
        const paymentProvider = getPaymentProvider("manual");
        const lines = await tx.select({ item: orderItems, menu: menuItems })
          .from(orderItems).innerJoin(menuItems, eq(menuItems.id, orderItems.menuItemId))
          .where(eq(orderItems.orderId, id));
        for (const line of lines) {
          if (line.menu.trackAvailability) {
            const reversalKey = `cancel:${id}:${line.item.menuItemId}`;
            const existing = await tx.select({ id: stockMovements.id }).from(stockMovements).where(eq(stockMovements.idempotencyKey, reversalKey)).limit(1);
            if (!existing[0]) {
              await tx.update(menuItems).set({ quantity: sql`${menuItems.quantity} + ${line.item.quantity}`, updatedAt: new Date() }).where(eq(menuItems.id, line.menu.id));
              await tx.insert(stockMovements).values({
                menuItemId: line.menu.id, locationId: current.locationId, type: "return", quantity: line.item.quantity,
                referenceType: "order_cancellation", referenceId: id, idempotencyKey: reversalKey,
              });
            }
          }
        }
        const paidRows = await tx.select().from(payments).where(and(eq(payments.orderId, id), eq(payments.status, "paid")));
        for (const payment of paidRows) {
          const refund = await paymentProvider.refundPayment({ orderId: id, amount: payment.amount, providerReference: payment.providerReference, idempotencyKey: `refund:${payment.id}` });
          await tx.update(payments).set({ status: refund.status, updatedAt: new Date() }).where(eq(payments.id, payment.id));
        }
      }

      await tx.insert(auditLogs).values({
        organizationId: user.organizationId, actorUserId: user.id, action: `order.status.${next}`,
        entityType: "order", entityId: id, metadata: { from: current.status, to: next },
      });
      return result;
    });
    return NextResponse.json({ order: updated });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "ORDER_CONFLICT") return NextResponse.json({ error: "Order changed; refresh and retry." }, { status: 409 });
    return NextResponse.json({ error: "Unable to update order." }, { status: 500 });
  }
}
