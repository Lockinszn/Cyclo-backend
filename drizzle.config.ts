import { defineConfig } from "drizzle-kit";
import { connectionUri } from "./src/db";
export default defineConfig({
  dialect: "mysql",
  schema: "./src/db/schemas/*.ts",
  out: "./src/db/drizzle",
  dbCredentials: {
    url: connectionUri,
  },
});
