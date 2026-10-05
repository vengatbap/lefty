import { NextResponse } from "next/server";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { customers, getDb } from "@lefty/db";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const q = new URL(request.url).searchParams.get("q")?.trim();
    const rows = await getDb().select().from(customers)
      .where(q ? and(eq(customers.organizationId, user.organizationId), or(ilike(customers.name, `%${q}%`), ilike(customers.phone, `%${q}%`), ilike(customers.email, `%${q}%`))) : eq(customers.organizationId, user.organizationId))
      .orderBy(desc(customers.createdAt)).limit(100);
    return NextResponse.json({ customers: rows });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to load customers." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim() || null;
    const email = String(body.email ?? "").trim().toLowerCase() || null;
    if (!name) return NextResponse.json({ error: "Customer name is required." }, { status: 400 });
    const [customer] = await getDb().insert(customers).values({ organizationId: user.organizationId, name, phone, email, notes: String(body.notes ?? "").trim() || null }).returning();
    return NextResponse.json({ customer }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (error instanceof Error && error.message.includes("customers_organization_phone_unique")) return NextResponse.json({ error: "A customer with this phone already exists." }, { status: 409 });
    return NextResponse.json({ error: "Unable to create customer." }, { status: 500 });
  }
}