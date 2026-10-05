import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, auditLogs, locations, menuCategories, menuItems } from "@lefty/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!can(user.role, "menu.manage")) return NextResponse.json({ error: "You do not have permission to manage the menu." }, { status: 403 });
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const price = Number(body.price);
    const quantity = Number(body.quantity ?? 0);
    const lowStockThreshold = Number(body.lowStockThreshold ?? 3);
    if (!name || !Number.isFinite(price) || price <= 0 || !Number.isInteger(quantity) || quantity < 0 || !Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) {
      return NextResponse.json({ error: "Name, positive price, quantity and valid low-stock threshold are required." }, { status: 400 });
    }
    const locationRows = await getDb().select().from(locations).where(eq(locations.organizationId, user.organizationId)).limit(1);
    const location = locationRows[0];
    if (!location) return NextResponse.json({ error: "No outlet configured." }, { status: 409 });
    const [item] = await getDb().insert(menuItems).values({
      locationId: location.id, name, price: price.toFixed(3), quantity, lowStockThreshold,
      trackAvailability: body.trackAvailability !== false, active: true,
    }).returning();
    if (!item) return NextResponse.json({ error: "Unable to create menu item." }, { status: 500 });
    await getDb().insert(auditLogs).values({
      organizationId: user.organizationId, actorUserId: user.id, action: "menu.item.created",
      entityType: "menu_item", entityId: item.id, metadata: { name, price, quantity },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to create menu item." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await getDb().select({ item: menuItems, category: menuCategories.name })
      .from(menuItems)
      .leftJoin(menuCategories, eq(menuCategories.id, menuItems.categoryId))
      .innerJoin(locations, eq(locations.id, menuItems.locationId))
      .where(eq(locations.organizationId, user.organizationId));
    return NextResponse.json({ items: rows.map(({ item, category }) => ({ ...item, category })) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to load menu." }, { status: 500 });
  }
}
