import { NextResponse } from "next/server";
import { and, eq, inArray, sql } from "drizzle-orm";
import { db, auditLogs, locations, menuItems, orderItems, orders, payments, stockMovements } from "@lefty/db";
import { requireUser } from "@/lib/auth";

const POS_ROLES = new Set(["owner", "admin", "manager", "incharge", "cashier"]);

function normalizeItems(input: unknown) {
  if (!Array.isArray(input) || input.length === 0) throw new Error("At least one item is required.");
  const map = new Map<string, number>();
  for (const raw of input) {
    const id = String((raw as { menuItemId?: unknown })?.menuItemId ?? "");
    const quantity = Number((raw as { quantity?: unknown })?.quantity ?? 0);
    if (!id || !Number.isInteger(quantity) || quantity <= 0) throw new Error("Each item must have a positive integer quantity.");
    map.set(id, (map.get(id) ?? 0) + quantity);
  }
  return [...map.entries()].map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!POS_ROLES.has(user.role)) return NextResponse.json({ error: "You do not have permission to create orders." }, { status: 403 });

    const body = await request.json();
    const type = body.type === "dine_in" || body.type === "delivery" ? body.type : "takeaway";
    const requestedItems = normalizeItems(body.items);
    const idempotencyKey = body.idempotencyKey ? String(body.idempotencyKey) : null;
    if (idempotencyKey) {
      const existing = await db.select({ order: orders }).from(payments).innerJoin(orders, eq(orders.id, payments.orderId)).where(eq(payments.idempotencyKey, idempotencyKey)).limit(1);
      if (existing[0]?.order) return NextResponse.json({ order: existing[0].order, idempotentReplay: true });
    }
    const locationRows = await db.select().from(locations).where(eq(locations.organizationId, user.organizationId)).limit(1);
    const location = locationRows[0];
    if (!location) return NextResponse.json({ error: "No active outlet is configured." }, { status: 409 });

    const order = await db.transaction(async (tx) => {
      const ids = requestedItems.map((item) => item.menuItemId);
      const products = await tx.select().from(menuItems).where(and(eq(menuItems.locationId, location.id), inArray(menuItems.id, ids)));
      if (products.length !== ids.length) throw new Error("One or more menu items are invalid.");

      const byId = new Map(products.map((item) => [item.id, item]));
      let subtotal = 0;
      const lineItems: Array<{ menuItemId: string; quantity: number; unitPrice: string; total: string }> = [];

      for (const requested of requestedItems) {
        const product = byId.get(requested.menuItemId);
        if (!product || !product.active) throw new Error("A selected menu item is unavailable.");
        if (product.trackAvailability) {
          const updated = await tx.update(menuItems)
            .set({ quantity: sql`${menuItems.quantity} - ${requested.quantity}`, updatedAt: new Date() })
            .where(and(eq(menuItems.id, product.id), eq(menuItems.locationId, location.id), sql`${menuItems.quantity} >= ${requested.quantity}`))
            .returning({ id: menuItems.id });
          if (updated.length !== 1) throw new Error(`${product.name} does not have enough availability.`);
        }
        const unit = Number(product.price);
        const total = unit * requested.quantity;
        subtotal += total;
        lineItems.push({ menuItemId: product.id, quantity: requested.quantity, unitPrice: product.price, total: total.toFixed(3) });
      }

      const total = subtotal;
      const number = `L-${Date.now().toString().slice(-8)}`;
      const [created] = await tx.insert(orders).values({
        locationId: location.id, number, type, status: "new", tableId: body.tableId || null,
        subtotal: subtotal.toFixed(3), tax: "0", discount: "0", total: total.toFixed(3), createdBy: user.id,
      }).returning();
      if (!created) throw new Error("Unable to create order.");

      await tx.insert(orderItems).values(lineItems.map((line) => ({ ...line, orderId: created.id })));
      await tx.insert(payments).values({
        orderId: created.id, provider: "manual", method: String(body.paymentMethod ?? "cash"),
        status: "paid", amount: total.toFixed(3), idempotencyKey: body.idempotencyKey ? String(body.idempotencyKey) : undefined,
      });

      for (const line of requestedItems) {
        const product = byId.get(line.menuItemId);
        if (product?.trackAvailability) {
          await tx.insert(stockMovements).values({
            menuItemId: product.id, locationId: location.id, type: "sale", quantity: -line.quantity,
            referenceType: "order", referenceId: created.id,
            idempotencyKey: idempotencyKey ? `${idempotencyKey}:${product.id}` : undefined,
          });
        }
      }

      await tx.insert(auditLogs).values({
        organizationId: user.organizationId, actorUserId: user.id, action: "order.created",
        entityType: "order", entityId: created.id, metadata: { number: created.number, total: created.total },
      });
      return created;
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const message = error instanceof Error ? error.message : "Unable to create order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
