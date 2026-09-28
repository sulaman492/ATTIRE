import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";

// Real PostgreSQL, simulated Cloudinary transport. No production bypass exists.
async function main() {
  loadEnvConfig(process.cwd());
  const { default: pool } = await import("../app/lib/db");
  const service = await import("../app/services/product.service");
  const originalFetch = globalThis.fetch;
  const assets = new Set<string>();
  const ids = new Set<string>();
  const fixtureName = `Service fixture ${randomUUID()}`;
  let failUpload = false;
  let induceDatabaseFailure = false;
  let uploadsUntilFailure = Infinity;
  let afterUpload: (() => Promise<void>) | undefined;
  globalThis.fetch = async (url, options) => {
    assert.ok(String(url).startsWith("https://api.cloudinary.com/"));
    // A service must release all database clients before calling the provider.
    // This catches uploads inside BEGIN/COMMIT as well as cleanup before release.
    assert.equal(pool.idleCount, pool.totalCount, "Cloudinary must not run while a DB connection is held");
    const body = options?.body as FormData;
    const id = String(body.get("public_id"));
    if (String(url).endsWith("/destroy")) { assets.delete(id); return Response.json({ result: "ok" }); }
    if (failUpload || uploadsUntilFailure-- === 0) throw new Error("Simulated provider outage");
    assets.add(id);
    const hook = afterUpload;
    afterUpload = undefined;
    await hook?.();
    return Response.json({ public_id: id, secure_url: induceDatabaseFailure ? `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/\u0000bad.png` : `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${id}.png` });
  };
  const file = new File([Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0])], "fixture.png", { type: "image/png" });
  const input = { name: fixtureName, price: "1.00", stock: 1 };
  try {
    const product = await service.createProductService(input, [file, file]); ids.add(product.id);
    assert.equal(product.images.length, 2);
    assert.equal(product.images.filter((image) => image.is_primary).length, 1);
    const other = await service.createProductService(input, [file]); ids.add(other.id);
    const beforeInvalid = new Set(assets);
    await assert.rejects(service.updateProductService(product.id, { imageIds: [other.images[0].id] }, [file]));
    await assert.rejects(service.updateProductService(product.id, { imageIds: [], primaryImage: "new:-1" }, [file]));
    await assert.rejects(service.updateProductService(product.id, { imageIds: [] }));
    assert.deepEqual(assets, beforeInvalid);
    const updated = await service.updateProductService(product.id, { stock: 0, category: null, primaryImage: product.images[1].id });
    assert.equal(updated.images[1].is_primary, true);
    const before = assets.size;
    await service.updateProductService(product.id, { imageIds: [product.images[0].id], primaryImage: "new:0" }, [file]);
    assert.equal(assets.size, before);
    failUpload = true;
    await assert.rejects(service.updateProductService(product.id, { name: "Must not persist" }, [file]));
    assert.equal((await service.getProductByIdService(product.id)).name, fixtureName);
    failUpload = false;
    const beforeFailure = await service.getProductByIdService(product.id);
    const assetsBeforeFailure = new Set(assets);
    uploadsUntilFailure = 1;
    await assert.rejects(service.updateProductService(product.id, { name: "Must not persist" }, [file, file]));
    assert.deepEqual(await service.getProductByIdService(product.id), beforeFailure);
    assert.deepEqual(assets, assetsBeforeFailure, "Partial upload failure must remove newly uploaded assets only");
    uploadsUntilFailure = Infinity;
    // PostgreSQL rejects NUL text after the upload, exercising rollback + compensation.
    induceDatabaseFailure = true;
    const count = (await pool.query("SELECT count(*) FROM products WHERE name = $1", [fixtureName])).rows[0].count;
    await assert.rejects(service.createProductService(input, [file]));
    assert.equal((await pool.query("SELECT count(*) FROM products WHERE name = $1", [fixtureName])).rows[0].count, count);
    assert.equal(assets.size, before);
    await assert.rejects(service.updateProductService(product.id, {
      name: "Must roll back", imageIds: [beforeFailure.images[0].id], primaryImage: "new:0",
    }, [file]));
    assert.deepEqual(await service.getProductByIdService(product.id), beforeFailure);
    assert.deepEqual(assets, assetsBeforeFailure, "Update rollback must retain old assets and delete new uploads");
    induceDatabaseFailure = false;
    const deletedDuringUpload = await service.createProductService(input, [file]); ids.add(deletedDuringUpload.id);
    afterUpload = async () => { await service.deleteProductService(deletedDuringUpload.id); ids.delete(deletedDuringUpload.id); };
    await assert.rejects(service.updateProductService(deletedDuringUpload.id, {}, [file]),
      (error: unknown) => (error as { status?: number }).status === 404);
    assert.deepEqual(assets, assetsBeforeFailure, "Concurrent product deletion must clean up completed uploads");
    await Promise.all([
      service.updateProductService(product.id, { primaryImage: product.images[0].id }),
      service.updateProductService(product.id, { stock: 4 }),
    ]);
    const concurrent = await service.getProductByIdService(product.id);
    assert.equal(concurrent.images.filter((image) => image.is_primary).length, 1);
    assert.equal(concurrent.stock, 4);
    await service.deleteProductService(product.id); ids.delete(product.id);
    await service.deleteProductService(other.id); ids.delete(other.id);
    assert.equal(assets.size, 0);
    console.log("PASS: Cloudinary runs without a held DB connection; update rollback, partial upload cleanup, concurrent deletion, ownership, image replacement and concurrent edits (real DB, Cloudinary simulated).");
  } finally {
    globalThis.fetch = originalFetch;
    for (const id of ids) await pool.query("DELETE FROM products WHERE id = $1", [id]);
    await pool.end();
  }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "Service test failed"); process.exitCode = 1; });
