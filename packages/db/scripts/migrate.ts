import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const sql = postgres(url, { max: 1, prepare: false });
const file = "0001_initial.sql";
const contents = await readFile(resolve(process.cwd(), "migrations", file), "utf8");

try {
  await sql`create table if not exists _lefty_migrations (name text primary key, applied_at timestamptz not null default now())`;
  const existing = await sql`select name from _lefty_migrations where name = ${file} limit 1`;
  if (existing.length === 0) {
    await sql.begin(async (tx) => {
      await tx.unsafe(contents);
      await tx`insert into _lefty_migrations (name) values (${file})`;
    });
    console.log(`Applied ${file}`);
  } else {
    console.log(`${file} already applied`);
  }
} finally {
  await sql.end();
}
