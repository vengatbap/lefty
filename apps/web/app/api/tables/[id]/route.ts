import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, locations, tables } from "@lefty/db";
import { requireUser } from "@/lib/auth";

const MANAGERS = new Set(["owner","admin","manager","incharge"]);

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    if (!MANAGERS.has(user.role)) return NextResponse.json({ error: "You do not have permission to manage tables." }, { status: 403 });
    const { id } = await context.params;
    const location = (await getDb().select().from(locations).where(and(eq(locations.organizationId, user.organizationId), eq(locations.active, true))).limit(1))[0];
    if (!location) return NextResponse.json({ error: "No active outlet configured." }, { status: 409 });
    const body = await request.json();
    const values: Record<string, unknown> = {};
    if (body.name !== undefined) values.name = String(body.name).trim();
    if (body.capacity !== undefined) values.capacity = Number(body.capacity);
    if (body.active !== undefined) values.active = Boolean(body.active);
    if (values.name === "" || (values.capacity !== undefined && (!Number.isInteger(values.capacity) || Number(values.capacity) < 1))) return NextResponse.json({ error: "Invalid table values." }, { status: 400 });
    const [table] = await getDb().update(tables).set(values).where(and(eq(tables.id, id), eq(tables.locationId, location.id))).returning();
    if (!table) return NextResponse.json({ error: "Table not found." }, { status: 404 });
    return NextResponse.json({ table });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to update table." }, { status: 500 });
  }
}