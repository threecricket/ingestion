import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/infrastructure/persistence/postgres/schema.ts",
    out: "./src/infrastructure/persistence/postgres/migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL!,
    },
});
