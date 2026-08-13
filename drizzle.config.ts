import { defineConfig } from "drizzle-kit";

const migrationUrl = process.env.DATABASE_URL_UNPOOLED;

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: migrationUrl ?? "postgresql://migration-url-required.invalid/moon_spice",
  },
  strict: true,
  verbose: true,
});
