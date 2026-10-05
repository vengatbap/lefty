import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import postgres from "postgres";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");

const sql = postgres(url, { max: 1, prepare: false });
const migrationDir = resolve(process.cwd(), "migrations");
const files = (await readdir(migrationDir)).filter((name) => name.endsWith(".sql")).sort();

try {
  await sql`create table if not exists _lefty_migrations (name text primary key, applied_at timestamptz not null default now())`;
  for (const file of files) {
    const existing = await sql`select name from _lefty_migrations where name = ${file} limit 1`;
    if (existing.length) continue;
    const contents = await readFile(resolve(migrationDir, file), "utf8");
    await sql.begin(async (tx) => {
      await tx.unsafe(contents);
      await tx`insert into _lefty_migrations (name) values (${file})`;
    });
    console.log(`Applied ${file}`);
  }
} finally {
  await sql.end();
}
