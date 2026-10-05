import { NextResponse } from "next/server";
import { and, eq, gte, lt, sql } from "drizzle-orm";
import { getDb, locations, orders, payments, stockMovements } from "@lefty/db";
import { requireUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const date = new URL(request.url).searchParams.get("date") ?? new Date().toISOString().slice(0,10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "Invalid date." }, { status: 400 });
    const location = (await getDb().select().from(locations).where(and(eq(locations.organizationId,user.organizationId),eq(locations.active,true))).limit(1))[0];
    if (!location) return NextResponse.json({ report: null });
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start.getTime()+86400000);
    const [sales] = await getDb().select({
      orders: sql<number>`count(*)`,
      gross: sql<string>`coalesce(sum(${orders.total}),0)`,
      completed: sql<number>`count(*) filter (where ${orders.status}='completed')`,
      cancelled: sql<number>`count(*) filter (where ${orders.status}='cancelled')`,
    }).from(orders).where(and(eq(orders.locationId,location.id),gte(orders.createdAt,start),lt(orders.createdAt,end)));
    const [paymentsSummary] = await getDb().select({
      paid: sql<string>`coalesce(sum(${payments.amount}) filter (where ${payments.status}='paid'),0)`,
      refunded: sql<string>`coalesce(sum(${payments.amount}) filter (where ${payments.status}='refunded'),0)`,
    }).from(payments).innerJoin(orders,eq(orders.id,payments.orderId))
      .where(and(eq(orders.locationId,location.id),gte(payments.createdAt,start),lt(payments.createdAt,end)));
    const [stock] = await getDb().select({
      soldUnits: sql<number>`coalesce(sum(-${stockMovements.quantity}) filter (where ${stockMovements.type}='sale'),0)`,
      adjustedUnits: sql<number>`coalesce(sum(${stockMovements.quantity}) filter (where ${stockMovements.type}='adjustment'),0)`,
    }).from(stockMovements).where(and(eq(stockMovements.locationId,location.id),gte(stockMovements.createdAt,start),lt(stockMovements.createdAt,end)));
    return NextResponse.json({ report: { date, location: location.name, sales, payments: paymentsSummary, stock } });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Unable to generate report." }, { status: 500 });
  }
}