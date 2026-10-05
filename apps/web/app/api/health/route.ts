import { NextResponse } from "next/server";
import { sql } from "@lefty/db";

export async function GET() {
  try {
    await sql`select 1`;
    return NextResponse.json({ status: "ok", service: "lefty-web", database: "ok" });
  } catch {
    return NextResponse.json({ status: "degraded", service: "lefty-web", database: "unavailable" }, { status: 503 });
  }
}
