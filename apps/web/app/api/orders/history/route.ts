import { NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb, locations, orders } from "@lefty/db";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const locationId = new URL(request.url).searchParams.get("locationId");
    const location = (await getDb().select().from(locations).where(and(eq(locations.organizationId,user.organizationId),eq(locations.active,true),locationId ? eq(locations.id,locationId) : undefined)).limit(1))[0];
    if (!location) return NextResponse.json({ orders: [] });
    const rows = await getDb().select().from(orders).where(eq(orders.locationId,location.id)).orderBy(desc(orders.createdAt)).limit(100);
    return NextResponse.json({ orders: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to load order history." }, { status: 500 });
  }
}