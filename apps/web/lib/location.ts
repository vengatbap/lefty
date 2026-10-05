import { and, eq } from "drizzle-orm";
import { getDb, locations } from "@lefty/db";

export async function resolveLocation(organizationId: string, requestedId?: string | null) {
  const condition = requestedId
    ? and(eq(locations.id, requestedId), eq(locations.organizationId, organizationId), eq(locations.active, true))
    : and(eq(locations.organizationId, organizationId), eq(locations.active, true));
  return (await getDb().select().from(locations).where(condition).limit(1))[0] ?? null;
}