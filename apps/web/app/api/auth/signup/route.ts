import { NextResponse } from "next/server";
import { getDb, locations, organizations, users } from "@lefty/db";
import { createPasswordHash, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const restaurantName = String(body.restaurantName ?? "").trim();

    if (!name || !email || !restaurantName) return NextResponse.json({ error: "Name, email and restaurant name are required." }, { status: 400 });

    const result = await getDb().transaction(async (tx) => {
      const slug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || `restaurant-${Date.now()}`;
      const [org] = await tx.insert(organizations).values({ name: restaurantName, slug }).returning();
      if (!org) throw new Error("Unable to create organization.");
      const [location] = await tx.insert(locations).values({ organizationId: org.id, name: "Main outlet" }).returning();
      if (!location) throw new Error("Unable to create location.");
      const hash = await createPasswordHash(password);
      const [user] = await tx.insert(users).values({ organizationId: org.id, email, name, role: "owner", passwordHash: hash }).returning({ id: users.id });
      if (!user) throw new Error("Unable to create owner.");
      return user;
    });

    await createSession(result.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
