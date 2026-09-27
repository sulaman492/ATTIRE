import { createHash, randomUUID } from "node:crypto";
import { ApiError } from "./api-error";

function configuration() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret) throw new ApiError(503, "Image storage is not configured.");
  return { cloud, key, secret };
}

async function cloudinaryRequest(action: "upload" | "destroy", parameters: Record<string, string>, file?: File) {
  const { cloud, key, secret } = configuration();
  const values = { ...parameters, timestamp: String(Math.floor(Date.now() / 1000)) };
  const signature = createHash("sha256")
    .update(Object.entries(values).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => `${k}=${v}`).join("&") + secret)
    .digest("hex");
  const body = new FormData();
  Object.entries(values).forEach(([k, v]) => body.set(k, v));
  body.set("api_key", key);
  body.set("signature", signature);
  if (file) body.set("file", file);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud)}/image/${action}`, {
    method: "POST", body, signal: AbortSignal.timeout(30_000), cache: "no-store",
  });
  if (!response.ok) {
    const details = await response.json().catch(() => null);
    const providerMessage = String(details?.error?.message ?? "Unknown provider error")
      .replaceAll(secret, "[redacted]").replaceAll(key, "[redacted]");
    // Only a bounded, credential-redacted error message goes to server logs.
    console.error("Cloudinary request failed", { action, status: response.status, message: providerMessage.slice(0, 220) });
    throw new ApiError(502, "Image storage request failed. Please try again.");
  }
  return response.json();
}

export async function uploadProductImage(file: File) {
  const publicId = `attire/products/${randomUUID()}`;
  try {
    const result = await cloudinaryRequest("upload", {
      public_id: publicId, overwrite: "false", allowed_formats: "jpg,png,webp",
    }, file);
    const cloud = configuration().cloud;
    if (result.public_id !== publicId || typeof result.secure_url !== "string" ||
        !result.secure_url.startsWith(`https://res.cloudinary.com/${cloud}/image/upload/`)) {
      throw new ApiError(502, "Image storage returned an invalid image.");
    }
    return { image_url: result.secure_url as string, cloudinary_public_id: publicId };
  } catch (error) {
    // A timeout can happen after Cloudinary accepted the file; the ID is known.
    await cleanupProductImages([publicId]);
    if (error instanceof ApiError) throw error;
    throw new ApiError(502, "Image upload failed. Please try again.");
  }
}

export async function cleanupProductImages(ids: (string | null)[]) {
  const failed: string[] = [];
  for (const id of new Set(ids.filter((value): value is string => Boolean(value)))) {
    // Only assets created by this application can be destroyed.
    if (!/^attire\/products\/[0-9a-f-]{36}$/.test(id)) {
      failed.push(id);
      continue;
    }
    let deleted = false;
    for (let attempt = 0; attempt < 3 && !deleted; attempt++) {
      try {
        const result = await cloudinaryRequest("destroy", { public_id: id, invalidate: "true" });
        deleted = result.result === "ok" || result.result === "not found";
      } catch { /* Retry transient failures; do not leak provider responses. */ }
    }
    if (!deleted) failed.push(id);
  }
  // Preserve asset IDs in server logs for an operator retry if Cloudinary is down.
  if (failed.length) console.error("Cloudinary cleanup requires retry", { publicIds: failed });
  return failed;
}
