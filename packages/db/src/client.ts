import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let client: ReturnType<typeof postgres> | undefined;

export function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is required at runtime.");
  client ??= postgres(url, { max: 10, prepare: false });
  return client;
}

export function getDb() {
  return drizzle(getSql(), { schema });
}
