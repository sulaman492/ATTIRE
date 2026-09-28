import { loadEnvConfig } from "@next/env";
async function main() {
  loadEnvConfig(process.cwd());
  const ids = process.argv.slice(2);
  if (!ids.length || ids.some((id) => !/^attire\/products\/[0-9a-f-]{36}$/.test(id))) throw new Error("Pass one or more attire/products/<uuid> asset IDs.");
  const { default: pool } = await import("../app/lib/db");
  const { cleanupProductImages } = await import("../app/lib/cloudinary");
  try {
    const referenced = await pool.query("SELECT id FROM product_images WHERE cloudinary_public_id = ANY($1::text[])", [ids]);
    if (referenced.rowCount) throw new Error("Refusing cleanup: an asset is still used by a product.");
    if ((await cleanupProductImages(ids)).length) throw new Error("Some assets could not be deleted. Check server output.");
    console.log("Unused assets deleted.");
  } finally { await pool.end(); }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Cleanup failed"); process.exitCode = 1; });
