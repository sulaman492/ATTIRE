import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAIAAAD91JpzAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVQImWP4L8X1X4qLAUIBACO2BI1obAwhAAAAAElFTkSuQmCC", "base64");
function form(data: Record<string, unknown>, count = 1) {
  const body = new FormData();
  body.set("data", JSON.stringify(data));
  for (let i = 0; i < count; i++) body.append("images", new Blob([png], { type: "image/png" }), `test-${i}.png`);
  return body;
}
async function main() {
  loadEnvConfig(process.cwd());
  const { default: pool } = await import("../app/lib/db");
  const { cleanupProductImages } = await import("../app/lib/cloudinary");
  const originalFetch = globalThis.fetch;
  const simulated = process.argv.includes("--simulate-cloudinary");
  if (simulated) {
    const { NextRequest } = await import("next/server");
    const collection = await import("../app/api/products/route");
    const single = await import("../app/api/products/[productId]/route");
    globalThis.fetch = async (url, options) => {
      if (String(url).startsWith("https://api.cloudinary.com/")) {
        const id = String((options?.body as FormData).get("public_id"));
        return Response.json(String(url).endsWith("/destroy") ? { result: "ok" } : {
          public_id: id, secure_url: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${id}.png`,
        });
      }
      const parsed = new URL(String(url));
      if (!parsed.pathname.startsWith("/api/products")) return originalFetch(url, options);
      const request = new NextRequest(new Request(String(url), options));
      if (parsed.pathname === "/api/products") return request.method === "GET" ? collection.GET() : collection.POST(request);
      const context = { params: Promise.resolve({ productId: parsed.pathname.split("/")[3] }) };
      if (request.method === "PATCH") return single.PATCH(request, context);
      if (request.method === "DELETE") return single.DELETE(request, context);
      return single.GET(request, context);
    };
  }
  const adminId = randomUUID(), customerId = randomUUID();
  const password = randomUUID();
  const productIds = new Set<string>();
  const assetIds = new Set<string>();
  let adminCookie = "";
  async function request(path: string, status: number, options?: RequestInit) {
    const response = await fetch(`${base}${path}`, options);
    const body = await response.json();
    assert.equal(response.status, status, `${options?.method ?? "GET"} ${path}: ${JSON.stringify(body)}`);
    return { response, body };
  }
  async function login(email: string) {
    const { response } = await request("/api/login", 200, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const cookie = response.headers.getSetCookie().find((value) => value.startsWith("accessToken="));
    assert.ok(cookie);
    assert.ok(cookie.toLowerCase().includes("httponly"));
    return cookie.split(";")[0];
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    for (const [id, role] of [[adminId, "ADMIN"], [customerId, "CUSTOMER"]]) {
      await pool.query("INSERT INTO users (id, name, email, password, role, auth_provider) VALUES ($1, $2, $3, $4, $5, 'LOCAL')", [id, "ATTIRE integration fixture", `${id}@attire-test.invalid`, hash, role]);
    }
    adminCookie = await login(`${adminId}@attire-test.invalid`);
    const customerCookie = await login(`${customerId}@attire-test.invalid`);
    for (const path of ["/admin", "/admin/products", "/admin/products/new", `/admin/products/${randomUUID()}/edit`]) {
      const anonymous = await originalFetch(`${base}${path}`, { redirect: "manual" });
      assert.equal(anonymous.status, 307, `${path} must reject anonymous access`);
      assert.ok(anonymous.headers.get("location")?.startsWith("/login"));
      const customer = await originalFetch(`${base}${path}`, { headers: { Cookie: customerCookie }, redirect: "manual" });
      assert.equal(customer.status, 307, `${path} must reject customer access`);
      assert.equal(customer.headers.get("location"), "/access-denied");
      const admin = await originalFetch(`${base}${path}`, { headers: { Cookie: adminCookie }, redirect: "manual" });
      assert.equal(admin.status, 200, `${path} must render for admins`);
      assert.ok((await admin.text()).includes("ATTIRE"));
    }
    console.log("PASS: every admin page rejects anonymous/customer access and renders for an authenticated admin.");
    assert.ok(Array.isArray((await request("/api/products", 200)).body));
    await request("/api/products/not-a-uuid", 400);
    await request(`/api/products/${randomUUID()}`, 404);
    for (const [cookie, status] of [["", 401], ["accessToken=invalid", 401], [customerCookie, 403]] as const) {
      for (const [method, path] of [["POST", "/api/products"], ["PATCH", `/api/products/${randomUUID()}`], ["DELETE", `/api/products/${randomUUID()}`]]) {
        await request(path, status, { method, headers: { Cookie: cookie, "Content-Type": "application/json" }, body: method === "DELETE" ? undefined : "{}" });
      }
    }
    const expired = jwt.sign({ userId: adminId, role: "ADMIN" }, process.env.ACCESS_TOKEN_SECRET!, { expiresIn: -1 });
    await request("/api/products", 401, { method: "POST", headers: { Cookie: `accessToken=${expired}` } });
    await request("/api/products", 403, { method: "POST", headers: { Cookie: adminCookie, Origin: "https://other.invalid" } });
    await request("/api/products", 400, { method: "POST", headers: { Cookie: adminCookie, "Content-Type": "application/json" }, body: "{" });
    for (const data of [{ name: "", price: "1.00", stock: 1 }, { name: "Test", price: "-1", stock: 1 }, { name: "Test", price: "1.001", stock: 1 }, { name: "Test", price: "1.00", stock: -1 }, { name: "Test", price: "1.00", stock: 1 }]) {
      await request("/api/products", 400, { method: "POST", headers: { Cookie: adminCookie, "Content-Type": "application/json" }, body: JSON.stringify(data) });
    }
    console.log("PASS: public reads, login cookies, authorization, expired JWT, CSRF and validation.");
    const { body: product } = await request("/api/products", 201, {
      method: "POST", headers: { Cookie: adminCookie }, body: form({ name: `ATTIRE API test ${randomUUID()}`, price: "3499.00", stock: 10, category: "T-Shirts", primaryImage: "new:1" }, 2),
    });
    productIds.add(product.id);
    assert.equal(product.images.length, 2);
    assert.equal(product.images[1].is_primary, true);
    assert.equal(product.price, "3499.00");
    const savedAssets = await pool.query("SELECT cloudinary_public_id FROM product_images WHERE product_id = $1", [product.id]);
    savedAssets.rows.forEach((row) => assetIds.add(row.cloudinary_public_id));
    const { body: catalog } = await request("/api/products", 200);
    assert.ok(catalog.some((item: { id: string }) => item.id === product.id));
    assert.equal((await request(`/api/products/${product.id}`, 200)).body.name, product.name);
    const patch = async (data: Record<string, unknown>, status = 200) => request(`/api/products/${product.id}`, status, { method: "PATCH", headers: { Cookie: adminCookie, "Content-Type": "application/json" }, body: JSON.stringify(data) });
    await patch({ imageIds: [randomUUID()] }, 400);
    await patch({ imageIds: [] }, 400);
    await patch({ primaryImage: "new:-1" }, 400);
    const { body: updated } = await patch({ name: "Updated integration fixture", stock: 0, category: null, price: "0.00", primaryImage: product.images[0].id });
    assert.equal(updated.stock, 0);
    assert.equal(updated.category, null);
    assert.equal(updated.images[0].is_primary, true);
    const { body: edited } = await request(`/api/products/${product.id}`, 200, { method: "PATCH", headers: { Cookie: adminCookie }, body: form({ imageIds: [product.images[0].id], primaryImage: "new:0" }) });
    assert.equal(edited.images.length, 2);
    assert.equal(edited.images[1].is_primary, true);
    const currentAssets = await pool.query("SELECT cloudinary_public_id FROM product_images WHERE product_id = $1", [product.id]);
    currentAssets.rows.forEach((row) => assetIds.add(row.cloudinary_public_id));
    assert.equal(edited.warning, undefined);
    const { body: deleted } = await request(`/api/products/${product.id}`, 200, { method: "DELETE", headers: { Cookie: adminCookie } });
    assert.equal(deleted.warning, undefined);
    await request(`/api/products/${product.id}`, 404);
    assert.equal((await pool.query("SELECT id FROM product_images WHERE product_id = $1", [product.id])).rowCount, 0);
    await pool.query("UPDATE users SET role = 'CUSTOMER' WHERE id = $1", [adminId]);
    await request("/api/products", 403, { method: "POST", headers: { Cookie: adminCookie } });
    console.log(`PASS: ${simulated ? "route handlers with simulated Cloudinary" : "HTTP routes with real Cloudinary"}, product create/read/edit/delete, primary images, asset cleanup, cascade, and immediate admin demotion.`);
  } finally {
    try {
      for (const id of productIds) {
        const images = await pool.query("SELECT cloudinary_public_id FROM product_images WHERE product_id = $1", [id]);
        images.rows.forEach((row) => assetIds.add(row.cloudinary_public_id));
        await pool.query("DELETE FROM products WHERE id = $1", [id]);
      }
      await cleanupProductImages([...assetIds]);
      await pool.query("DELETE FROM users WHERE id = ANY($1::uuid[])", [[adminId, customerId]]);
      console.log("Temporary accounts, products and Cloudinary assets cleaned up.");
    } finally { globalThis.fetch = originalFetch; await pool.end(); }
  }
}
main().catch((error: unknown) => { console.error(error instanceof Error ? error.message : "API test failed"); process.exitCode = 1; });
