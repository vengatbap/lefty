import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, locations, tables } from "@lefty/db";
import { requireUser } from "@/lib/auth";

const MANAGERS = new Set(["owner","admin","manager","incharge"]);

async function locationFor(user: { organizationId: string }) {
  return (await getDb().select().from(locations).where(and(eq(locations.organizationId, user.organizationId), eq(locations.active, true))).limit(1))[0];
}

export async function GET() {
  try {
    const user = await requireUser();
    const location = await locationFor(user);
    if (!location) return NextResponse.json({ tables: [] });
    return NextResponse.json({ tables: await getDb().select().from(tables).where(and(eq(tables.locationId, location.id), eq(tables.active, true))) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to load tables." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    if (!MANAGERS.has(user.role)) return NextResponse.json({ error: "You do not have permission to manage tables." }, { status: 403 });
    const location = await locationFor(user);
    if (!location) return NextResponse.json({ error: "No active outlet configured." }, { status: 409 });
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const capacity = Number(body.capacity);
    if (!name || !Number.isInteger(capacity) || capacity < 1 || capacity > 100) return NextResponse.json({ error: "Table name and valid capacity are required." }, { status: 400 });
    const [table] = await getDb().insert(tables).values({ locationId: location.id, name, capacity, active: true }).returning();
    return NextResponse.json({ table }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to create table." }, { status: 500 });
  }
}