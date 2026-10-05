import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db, users } from "@lefty/db";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });

    const rows = await db.select().from(users).where(and(eq(users.email, email), eq(users.active, true))).limit(10);
    let user = null;
    for (const candidate of rows) {
      if (candidate.passwordHash && await verifyPassword(password, candidate.passwordHash)) { user = candidate; break; }
    }
    if (!user || !user.passwordHash) return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });

    await createSession(user.id);
    return NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
