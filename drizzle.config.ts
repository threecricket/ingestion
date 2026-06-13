import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/shared/persistence/postgres/schema/index.ts",
    out: "./src/shared/persistence/postgres/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
