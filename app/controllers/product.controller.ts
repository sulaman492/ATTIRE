import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/app/lib/api-error";
import { requireAdminRequest } from "@/app/lib/admin-auth";
import * as service from "@/app/services/product.service";

function failure(error: unknown) {
  if (error instanceof ApiError) return NextResponse.json({ message: error.message }, { status: error.status });
  console.error("Product operation failed", { name: error instanceof Error ? error.name : "UnknownError" });
  return NextResponse.json({ message: "Unable to complete the product request. Please try again." }, { status: 500 });
}

async function readProductBody(request: NextRequest) {
  // Bound the bytes read, including requests that omit Content-Length.
  const maxBytes = 4 * 1024 * 1024;
  if (Number(request.headers.get("content-length")) > maxBytes) throw new ApiError(413, "Request exceeds 4 MB.");
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, "Product data is required.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > maxBytes) { await reader.cancel(); throw new ApiError(413, "Request exceeds 4 MB."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const contentType = request.headers.get("content-type") ?? "";
  const body = new Response(Buffer.concat(chunks), { headers: { "Content-Type": contentType } });
  try {
    if (contentType.startsWith("application/json")) return { input: await body.json(), files: [] as File[] };
    if (contentType.startsWith("multipart/form-data")) {
      const form = await body.formData();
      if ([...form.keys()].some((key) => key !== "data" && key !== "images") || form.getAll("data").length !== 1) throw new ApiError(400, "Send one data field and image files.");
      const data = form.get("data");
      const files = form.getAll("images");
      if (typeof data !== "string" || files.some((file) => !(file instanceof File))) throw new ApiError(400, "Invalid product form.");
      return { input: JSON.parse(data) as unknown, files: files as File[] };
    }
    throw new ApiError(415, "Use application/json or multipart/form-data.");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "Invalid JSON or multipart request body.");
  }
}

export async function getProductsController() {
  try { return NextResponse.json(await service.getProductsService(), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return failure(error); }
}
export async function getProductController(id: string) {
  try { return NextResponse.json(await service.getProductByIdService(id), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return failure(error); }
}
export async function createProductController(request: NextRequest) {
  try {
    await requireAdminRequest(request);
    const { input, files } = await readProductBody(request);
    return NextResponse.json(await service.createProductService(input, files), { status: 201 });
  } catch (error) { return failure(error); }
}
export async function updateProductController(request: NextRequest, id: string) {
  try {
    await requireAdminRequest(request);
    service.validateProductId(id);
    const { input, files } = await readProductBody(request);
    return NextResponse.json(await service.updateProductService(id, input, files));
  } catch (error) { return failure(error); }
}
export async function deleteProductController(request: NextRequest, id: string) {
  try {
    await requireAdminRequest(request);
    return NextResponse.json(await service.deleteProductService(id));
  } catch (error) { return failure(error); }
}
