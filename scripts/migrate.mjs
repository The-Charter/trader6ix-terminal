// Applies the SQL migrations in src/server/migrations, tracking them in a
// schema_migrations table. Run with: npm run migrate
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "src", "server", "migrations");

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("Missing DATABASE_URL. Add it to .env.local before running migrations.");
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
