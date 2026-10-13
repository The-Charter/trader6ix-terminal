// Applies the SQL migrations in src/server/migrations, tracking them in a
// schema_migrations table. Run with: npm run migrate
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import pg from "pg";

// @next/env is CommonJS; a named ESM import of it fails at runtime.
const { loadEnvConfig } = createRequire(import.meta.url)("@next/env");

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "src", "server", "migrations");

// Parse .env.local exactly the way Next.js does. `node --env-file` is NOT
// equivalent: dotenv expands `$VAR` references inside values and it does not,
// so the two can silently disagree about a connection string's password.
loadEnvConfig(join(here, ".."));

// `||`, not `??`: an EMPTY DIRECT_URL is not nullish, so `??` would select it and
// skip the populated DATABASE_URL entirely.
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL (or DIRECT_URL). Add it to .env.local before running migrations.");
  process.exit(1);
}

const client = new pg.Client({ connectionString });

async function main() {
  await client.connect();
  await client.query(
    `create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`
  );

  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();
  const applied = new Set((await client.query("select name from schema_migrations")).rows.map((row) => row.name));

  for (const file of files) {
    if (applied.has(file)) {
      console.log(`skip  ${file}`);
      continue;
    }
    console.log(`apply ${file}`);
    await client.query("begin");
    try {
      await client.query(readFileSync(join(migrationsDir, file), "utf8"));
      await client.query("insert into schema_migrations (name) values ($1)", [file]);
      await client.query("commit");
    } catch (err) {
      await client.query("rollback");
      throw err;
    }
  }

  console.log("migrations complete");
}

main()
  .catch((err) => {
    console.error("migration failed:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => client.end());
