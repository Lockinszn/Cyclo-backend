import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schemas/*.ts",
  out: "./src/db/drizzle",
});
