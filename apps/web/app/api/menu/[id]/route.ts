import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auditLogs, getDb, locations, menuItems } from "@lefty/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!can(user.role, "menu.manage")) return NextResponse.json({ error: "You do not have permission to manage the menu." }, { status: 403 });
    const { id } = await context.params;
    const body = await request.json();
    const values: Record<string, unknown> = {};
    if (body.name !== undefined) values.name = String(body.name).trim();
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (!Number.isFinite(price) || price <= 0) return NextResponse.json({ error: "Price must be positive." }, { status: 400 });
      values.price = price.toFixed(3);
    }
    if (body.lowStockThreshold !== undefined) {
      const threshold = Number(body.lowStockThreshold);
      if (!Number.isInteger(threshold) || threshold < 0) return NextResponse.json({ error: "Invalid low-stock threshold." }, { status: 400 });
      values.lowStockThreshold = threshold;
    }
    if (body.trackAvailability !== undefined) values.trackAvailability = Boolean(body.trackAvailability);
    if (body.active !== undefined) values.active = Boolean(body.active);
    if (!Object.keys(values).length) return NextResponse.json({ error: "No changes supplied." }, { status: 400 });
    const location = (await getDb().select().from(locations).where(and(eq(locations.organizationId,user.organizationId),eq(locations.active,true))).limit(1))[0];
    if (!location) return NextResponse.json({ error: "No active outlet configured." }, { status: 409 });
    const [item] = await getDb().update(menuItems).set({ ...values, updatedAt: new Date() }).where(and(eq(menuItems.id,id),eq(menuItems.locationId,location.id))).returning();
    if (!item) return NextResponse.json({ error: "Menu item not found." }, { status: 404 });
    await getDb().insert(auditLogs).values({ organizationId:user.organizationId,actorUserId:user.id,action:"menu.item.updated",entityType:"menu_item",entityId:id,metadata:values });
    return NextResponse.json({ item });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to update menu item." }, { status: 500 });
  }
}