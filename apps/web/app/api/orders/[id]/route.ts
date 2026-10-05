import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, auditLogs, locations, orders, orderItems } from "@lefty/db";
import { canTransitionOrder, type OrderStatus } from "@lefty/domain";
import { requireUser } from "@/lib/auth";

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
