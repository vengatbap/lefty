import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, auditLogs, locations, menuItems, stockMovements } from "@lefty/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

const ROLES = new Set(["owner", "admin", "manager", "incharge"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!can(user.role, "inventory.adjust")) return NextResponse.json({ error: "You do not have permission to adjust availability." }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const delta = Number(body.delta);
    if (!Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 100000) return NextResponse.json({ error: "Delta must be a non-zero integer." }, { status: 400 });

    const locationRows = await getDb().select().from(locations).where(eq(locations.organizationId, user.organizationId)).limit(1);
    const location = locationRows[0];
    if (!location) return NextResponse.json({ error: "No outlet configured." }, { status: 409 });

    const result = await getDb().transaction(async (tx) => {
      const currentRows = await tx.select().from(menuItems).where(and(eq(menuItems.id, id), eq(menuItems.locationId, location.id))).limit(1);
      const item = currentRows[0];
      if (!item) throw new Error("NOT_FOUND");
      const next = item.quantity + delta;
      if (next < 0) throw new Error("QUANTITY_NEGATIVE");
      const [updated] = await tx.update(menuItems).set({ quantity: next, updatedAt: new Date() }).where(eq(menuItems.id, id)).returning();
      await tx.insert(stockMovements).values({ menuItemId: id, locationId: location.id, type: "adjustment", quantity: delta, referenceType: "manual_adjustment" });
      await tx.insert(auditLogs).values({ organizationId: user.organizationId, actorUserId: user.id, action: "menu.availability.adjusted", entityType: "menu_item", entityId: id, metadata: { from: item.quantity, to: next, delta } });
      return updated;
    });
    return NextResponse.json({ item: result });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message === "NOT_FOUND") return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    if (error instanceof Error && error.message === "QUANTITY_NEGATIVE") return NextResponse.json({ error: "Quantity cannot be negative." }, { status: 409 });
    return NextResponse.json({ error: "Unable to adjust availability." }, { status: 500 });
  }
}
