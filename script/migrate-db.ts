import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import "dotenv/config";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const MIGRATIONS_FOLDER = "./src/shared/persistence/postgres/migrations";
const databaseUrl = process.env.DATABASE_URL?.trim();
const postgresSchema = process.env.POSTGRES_SCHEMA?.trim() || "public";

if (!databaseUrl) {
    throw new Error("DATABASE_URL is required");
}

const pool = new pg.Pool({
    connectionString: databaseUrl,
    ...(postgresSchema !== "public"
        ? { options: `-c search_path=${postgresSchema}` }
        : {}),
});

function quoteIdentifier(identifier: string): string {
    return `"${identifier.replace(/"/g, "\"\"")}"`;
}

function transformMigrationSql(sql: string, schema: string): string {
    if (schema === "public") {
        return sql;
    }

    const schemaQualified = sql.replace(/"public"\./g, `${quoteIdentifier(schema)}.`);
    return `SET search_path TO ${quoteIdentifier(schema)};\n${schemaQualified}`;
}

function prepareMigrationsFolder(sourceFolder: string, schema: string): string {
    const tempDir = mkdtempSync(join(tmpdir(), "drizzle-migrations-"));
    const metaDir = join(tempDir, "meta");
    mkdirSync(metaDir, { recursive: true });
    cpSync(join(sourceFolder, "meta", "_journal.json"), join(metaDir, "_journal.json"));

    const journal = JSON.parse(
        readFileSync(join(sourceFolder, "meta", "_journal.json"), "utf8"),
    ) as { entries: Array<{ tag: string }> };

    for (const entry of journal.entries) {
        const sql = readFileSync(join(sourceFolder, `${entry.tag}.sql`), "utf8");
        writeFileSync(
            join(tempDir, `${entry.tag}.sql`),
            transformMigrationSql(sql, schema),
        );
    }

    return tempDir;
}

async function ensureSchemaReady(): Promise<void> {
    if (postgresSchema === "public") {
        const result = await pool.query<{ can_create: boolean }>(
            "SELECT has_schema_privilege(current_user, 'public', 'CREATE') AS can_create",
        );

        if (result.rows[0]?.can_create) {
            return;
        }

        throw new Error(
            "Current database user cannot create objects in the public schema.\n"
            + "Either run the GRANT commands as the postgres superuser, or set "
            + "POSTGRES_SCHEMA=ingestion in .env to use a schema your user owns.",
        );
    }

    await pool.query(`CREATE SCHEMA IF NOT EXISTS ${quoteIdentifier(postgresSchema)}`);

    const result = await pool.query<{ can_create: boolean }>(
        "SELECT has_schema_privilege(current_user, $1, 'CREATE') AS can_create",
        [postgresSchema],
    );

    if (!result.rows[0]?.can_create) {
        throw new Error(
            `Current database user cannot create objects in schema "${postgresSchema}".`,
        );
    }
}

async function main(): Promise<void> {
    await ensureSchemaReady();

    const migrationsFolder = postgresSchema === "public"
        ? MIGRATIONS_FOLDER
        : prepareMigrationsFolder(MIGRATIONS_FOLDER, postgresSchema);

    try {
        const db = drizzle(pool);
        await migrate(db, { migrationsFolder });

        const tables = await pool.query<{ tablename: string }>(
            "SELECT tablename FROM pg_tables WHERE schemaname = $1 ORDER BY tablename",
            [postgresSchema],
        );

        console.log(
            `Migrations applied to schema "${postgresSchema}". Tables: ${tables.rows.length}`,
        );
    } finally {
        if (migrationsFolder !== MIGRATIONS_FOLDER) {
            rmSync(migrationsFolder, { recursive: true, force: true });
        }
    }
}

main()
    .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`Migration failed: ${message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await pool.end();
    });
