import type { NextRequest } from "next/server";
import { deleteProductController, getProductController, updateProductController } from "@/app/controllers/product.controller";
export const runtime = "nodejs";
type Context = { params: Promise<{ productId: string }> };
export async function GET(_request: NextRequest, context: Context) { return getProductController((await context.params).productId); }
export async function PATCH(request: NextRequest, context: Context) { return updateProductController(request, (await context.params).productId); }
export async function DELETE(request: NextRequest, context: Context) { return deleteProductController(request, (await context.params).productId); }
