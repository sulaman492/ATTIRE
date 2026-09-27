import type { PoolClient } from "pg";
import * as repo from "@/app/repositories/product.repository";
import { ApiError } from "@/app/lib/api-error";
import { cleanupProductImages, uploadProductImage } from "@/app/lib/cloudinary";
import { MAX_FILE_BYTES, MAX_IMAGES, MAX_UPLOAD_BYTES, type ProductView } from "@/app/lib/product.types";

export function validateProductId(id: string) {
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) throw new ApiError(400, "Invalid product or image ID.");
}

function validateInput(input: unknown, creating: boolean) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new ApiError(400, "Product data must be an object.");
  const body = input as Record<string, unknown>;
  const allowed = ["name", "description", "price", "category", "stock", "imageIds", "primaryImage"];
  if (Object.keys(body).some((key) => !allowed.includes(key))) throw new ApiError(400, "Unknown product field.");
  const data: Partial<repo.ProductInput> = {};
  for (const [key, max] of [["name", 255], ["description", 10000], ["category", 100]] as const) {
    if (body[key] !== undefined || (creating && key === "name")) {
      const value = body[key];
      if (key !== "name" && value === null) { data[key] = null; continue; }
      if (typeof value !== "string" || value.trim().length > max || (key === "name" && !value.trim())) {
        throw new ApiError(400, `${key} must be ${key === "name" ? "non-empty and " : ""}at most ${max} characters.`);
      }
      data[key] = value.trim();
    }
  }
  if (creating || body.price !== undefined) {
    if ((typeof body.price !== "string" && typeof body.price !== "number") ||
        !/^\d{1,8}(\.\d{1,2})?$/.test(String(body.price))) {
      throw new ApiError(400, "Price must be between 0 and 99999999.99 with at most two decimal places.");
    }
    data.price = Number(body.price).toFixed(2);
  }
  if (creating || body.stock !== undefined) {
    if (typeof body.stock !== "number" || !Number.isInteger(body.stock) || body.stock < 0 || body.stock > 2147483647) {
      throw new ApiError(400, "Stock must be a non-negative whole number.");
    }
    data.stock = body.stock;
  }
  let imageIds: string[] | undefined;
  if (body.imageIds !== undefined) {
    if (!Array.isArray(body.imageIds) || body.imageIds.length > MAX_IMAGES ||
        body.imageIds.some((id) => typeof id !== "string")) throw new ApiError(400, "Invalid image selection.");
    imageIds = body.imageIds as string[];
    imageIds.forEach(validateProductId);
    if (new Set(imageIds).size !== imageIds.length || (creating && imageIds.length)) throw new ApiError(400, "Invalid image selection.");
  }
  if (body.primaryImage !== undefined && (typeof body.primaryImage !== "string" || body.primaryImage.length > 40)) {
    throw new ApiError(400, "Invalid primary image.");
  }
  return { data, imageIds, primaryImage: body.primaryImage as string | undefined };
}

async function validateFiles(files: File[]) {
  if (files.length > MAX_IMAGES || files.reduce((sum, file) => sum + file.size, 0) > MAX_UPLOAD_BYTES) {
    throw new ApiError(400, "Use up to 8 images and at most 3.5 MB of new images per save.");
  }
  for (const file of files) {
    if (!file.size || file.size > MAX_FILE_BYTES) throw new ApiError(400, "Each image must be between 1 byte and 3 MB.");
    const bytes = Buffer.from(await file.slice(0, 12).arrayBuffer());
    const valid = (file.type === "image/jpeg" && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) ||
      (file.type === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (file.type === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP");
    if (!valid) throw new ApiError(400, "Only JPEG, PNG and WebP image files are supported.");
  }
}

function toView(product: repo.Product & { images: repo.ProductImage[] }): ProductView {
  return {
    id: product.id, name: product.name, description: product.description,
    price: product.price, category: product.category, stock: product.stock,
    images: product.images.map(({ id, image_url, is_primary, position }) => ({ id, image_url, is_primary, position })),
  };
}

export async function getProductsService() { return (await repo.getProductCatalog()).map(toView); }

export async function getProductByIdService(id: string) {
  validateProductId(id);
  const [product] = await repo.getProductCatalog(id);
  if (!product) throw new ApiError(404, "Product not found.");
  return toView(product);
}

type Upload = Awaited<ReturnType<typeof uploadProductImage>>;
async function saveImages(id: string, existing: repo.ProductImage[], uploads: Upload[], primary: string | undefined, client: PoolClient) {
  const images = [...existing];
  for (const upload of uploads) images.push(await repo.createProductImage(id, { ...upload, position: images.length }, client));
  let primaryId = primary;
  if (primary?.startsWith("new:")) primaryId = images[existing.length + Number(primary.slice(4))]?.id;
  if (!primary) primaryId = images.find((image) => image.is_primary)?.id ?? images[0]?.id;
  if (!primaryId || !images.some((image) => image.id === primaryId)) throw new ApiError(400, "Select a primary image belonging to this product.");
  for (const [position, image] of images.entries()) await repo.updateImagePosition(id, image.id, position, client);
  await repo.setPrimaryImage(id, primaryId, client);
}

export async function createProductService(input: unknown, files: File[] = []) {
  const { data, primaryImage } = validateInput(input, true);
  await validateFiles(files);
  if (!files.length) throw new ApiError(400, "At least one product image is required.");
  validatePrimary(primaryImage, [], files.length);
  const uploads: Upload[] = [];
  try {
    for (const file of files) uploads.push(await uploadProductImage(file));
    return await repo.withProductTransaction(async (client) => {
      const product = await repo.createProduct(data as repo.ProductInput, client);
      await saveImages(product.id, [], uploads, primaryImage, client);
      return toView((await repo.getProductCatalog(product.id, client))[0]);
    });
  } catch (error) {
    await cleanupProductImages(uploads.map((image) => image.cloudinary_public_id));
    throw error;
  }
}

function validatePrimary(primary: string | undefined, retained: repo.ProductImage[], newCount: number) {
  if (primary === undefined) return;
  if (retained.some((image) => image.id === primary)) return;
  if (/^new:[0-7]$/.test(primary) && Number(primary.slice(4)) < newCount) return;
  throw new ApiError(400, "Select a primary image belonging to this product.");
}

function selectRetainedImages(existing: repo.ProductImage[], imageIds: string[] | undefined, primaryImage: string | undefined, newCount: number) {
  if (imageIds?.some((imageId) => !existing.some((image) => image.id === imageId))) throw new ApiError(400, "An image no longer belongs to this product. Reload and try again.");
  const retained = imageIds ? imageIds.map((imageId) => existing.find((image) => image.id === imageId)!) : existing;
  if (retained.length + newCount < 1 || retained.length + newCount > MAX_IMAGES) throw new ApiError(400, "A product needs between 1 and 8 images.");
  validatePrimary(primaryImage, retained, newCount);
  return retained;
}

export async function updateProductService(id: string, input: unknown, files: File[] = []) {
  validateProductId(id);
  const { data, imageIds, primaryImage } = validateInput(input, false);
  await validateFiles(files);
  // Reject invalid selections before uploading, without holding a transaction.
  const [current] = await repo.getProductCatalog(id);
  if (!current) throw new ApiError(404, "Product not found.");
  selectRetainedImages(current.images, imageIds, primaryImage, files.length);
  const uploads: Upload[] = [];
  const removed: (string | null)[] = [];
  let product: ProductView;
  try {
    for (const file of files) uploads.push(await uploadProductImage(file));
    product = await repo.withProductTransaction(async (client) => {
      if (!await repo.lockProduct(id, client)) throw new ApiError(404, "Product not found.");
      const existing = await repo.getProductImages(id, client);
      // Another admin may have changed/deleted images during the upload.
      // Recheck against the latest rows while holding the product lock.
      const retained = selectRetainedImages(existing, imageIds, primaryImage, uploads.length);
      for (const image of existing) {
        if (!retained.some((kept) => kept.id === image.id)) {
          await repo.deleteProductImage(id, image.id, client);
          removed.push(image.cloudinary_public_id);
        }
      }
      await repo.updateProduct(id, data, client);
      await saveImages(id, retained, uploads, primaryImage, client);
      return toView((await repo.getProductCatalog(id, client))[0]);
    });
  } catch (error) {
    await cleanupProductImages(uploads.map((image) => image.cloudinary_public_id));
    throw error;
  }
  // Only delete old assets AFTER commit: a rollback must leave existing images usable.
  const failed = await cleanupProductImages(removed);
  return { ...product, ...(failed.length ? { warning: "Product saved. Some old images need storage cleanup; the server log contains their IDs." } : {}) };
}

export async function deleteProductService(id: string) {
  validateProductId(id);
  const images = await repo.withProductTransaction(async (client) => {
    if (!await repo.lockProduct(id, client)) throw new ApiError(404, "Product not found.");
    const images = await repo.getProductImages(id, client);
    await repo.deleteProduct(id, client);
    return images;
  });
  const failed = await cleanupProductImages(images.map((image) => image.cloudinary_public_id));
  return { message: "Product deleted.", ...(failed.length ? { warning: "Some images need storage cleanup; the server log contains their IDs." } : {}) };
}
