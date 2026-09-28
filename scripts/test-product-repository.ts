import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";

// Run with: npx tsx scripts/test-product-repository.ts
// All fixture writes use one transaction which is ALWAYS rolled back.
async function main() {
  loadEnvConfig(process.cwd());
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const { default: pool } = await import("../app/lib/db");
  const repo = await import("../app/repositories/product.repository");
  try {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query("SET LOCAL statement_timeout = '10s'");
      const name = `Repository test ${randomUUID()} '); DROP TABLE products; --`;
      const product = await repo.createProduct({
        name, price: "3499.00", stock: 10, category: "T-Shirts",
      }, client);
      assert.equal(product.name, name);
      assert.equal(product.price, "3499.00");
      assert.equal(product.description, null);
      assert.ok((await repo.getAllProducts(client)).some((row) => row.id === product.id));
      assert.equal((await repo.getProductById(product.id, client))?.name, name);
      const updated = await repo.updateProduct(product.id, { stock: 5, category: null }, client);
      assert.equal(updated?.stock, 5);
      assert.equal(updated?.category, null);
      assert.equal(updated?.name, name);
      assert.equal(updated?.price, "3499.00");

      const first = await repo.createProductImage(product.id, {
        image_url: "https://example.com/test-front.jpg", position: 0,
      }, client);
      const second = await repo.createProductImage(product.id, {
        image_url: "https://example.com/test-back.jpg", position: 1,
      }, client);
      assert.equal((await repo.setPrimaryImage(product.id, first.id, client))?.is_primary, true);
      await repo.setPrimaryImage(product.id, second.id, client);
      const images = await repo.getProductImages(product.id, client);
      assert.deepEqual(images.map((image) => image.id), [first.id, second.id]);
      assert.deepEqual(images.filter((image) => image.is_primary).map((image) => image.id), [second.id]);

      const other = await repo.createProduct({ name: "Other fixture", price: "0.00", stock: 0 }, client);
      const otherImage = await repo.createProductImage(other.id, { image_url: "https://example.com/other.jpg" }, client);
      assert.equal(await repo.setPrimaryImage(product.id, otherImage.id, client), null);
      assert.equal(await repo.deleteProductImage(product.id, otherImage.id, client), null);
      assert.equal((await repo.getProductImages(product.id, client)).find((image) => image.is_primary)?.id, second.id);
      assert.equal((await repo.deleteProductImage(product.id, first.id, client))?.id, first.id);
      assert.equal((await repo.deleteProductImages(other.id, client)).length, 1);

      assert.equal((await repo.deleteProduct(product.id, client))?.id, product.id);
      assert.deepEqual(await repo.getProductImages(product.id, client), []);
      assert.equal(await repo.getProductById(product.id, client), null);
      assert.equal(await repo.updateProduct(product.id, { stock: 1 }, client), null);
      assert.equal(await repo.deleteProduct(product.id, client), null);

      // Check the existing database constraint without aborting our outer transaction.
      await client.query("SAVEPOINT invalid_stock");
      await assert.rejects(
        repo.createProduct({ name: "Invalid fixture", price: "1.00", stock: -1 }, client),
        (error: unknown) => (error as { code?: string }).code === "23514",
      );
      await client.query("ROLLBACK TO SAVEPOINT invalid_stock");
      console.log("PASS: product CRUD, partial updates, image ordering/ownership, primary selection, cascade, and stock constraint.");
    } finally {
      try { await client.query("ROLLBACK"); }
      finally { client.release(); }
    }
    console.log("All test writes rolled back; no tables created or changed.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  // Avoid printing connection objects or environment values on failure.
  const code = (error as { code?: string })?.code;
  console.error("Repository test failed:", code ?? "", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
