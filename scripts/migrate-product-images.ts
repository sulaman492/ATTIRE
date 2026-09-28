import { loadEnvConfig } from "@next/env";
import { readFile } from "node:fs/promises";

async function main() {
  loadEnvConfig(process.cwd());
  const { default: pool } = await import("../app/lib/db");
  try {
    await pool.query(await readFile("database/001-product-image-cloudinary.sql", "utf8"));
    console.log("Product image metadata migration applied.");
  } finally { await pool.end(); }
}
main().catch(() => { console.error("Migration failed. Check database connectivity and permissions."); process.exitCode = 1; });
