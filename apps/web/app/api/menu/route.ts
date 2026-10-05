import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, locations, menuCategories, menuItems } from "@lefty/db";
import { requireUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await requireUser();
    const rows = await db.select({ item: menuItems, category: menuCategories.name })
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
