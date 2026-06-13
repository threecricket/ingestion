import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@/shared/persistence/postgres/schema/index";

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseClient {
    db: Database;
    pool: pg.Pool;
}

export function createDatabaseClient(connectionString: string): DatabaseClient {
    const pool = new pg.Pool({ connectionString });
    const db = drizzle(pool, { schema });
    return { db, pool };
}
