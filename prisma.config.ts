import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Dummy URL only for prisma generate when DATABASE_URL is not set (e.g. postinstall).
// Runtime always uses DATABASE_URL from env in lib/prisma.ts.
const databaseUrl =
  process.env.DATABASE_URL ?? "postgresql://localhost:5432/mvp?schema=public";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: databaseUrl,
  },
});
