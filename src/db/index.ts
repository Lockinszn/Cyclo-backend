import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schemas from "@/db/schemas";

// Database configuration
const connectionConfig = {
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "4000"),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "cyclo_db",
  ssl: { rejectUnauthorized: true },
};

export const connectionUri = `mysql://${connectionConfig.user}:${connectionConfig.password}@${connectionConfig.host}:${connectionConfig.port}/${connectionConfig.database}?ssl={"rejectUnauthorized":true}`;
// Create connection pool
const pool = mysql.createPool({
  ...connectionConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Create Drizzle instance
export const db = drizzle(pool, {
  schema: schemas,
  mode: "planetscale",
});

// Export the connection pool for direct queries if needed
export { pool };

// Database connection test function
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("✅ Database connection successful");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Graceful shutdown function
export async function closeConnection() {
  try {
    await pool.end();
    console.log("✅ Database connection pool closed");
  } catch (error) {
    console.error("❌ Error closing database connection:", error);
  }
}

export default db;
