import { createProductController, getProductsController } from "@/app/controllers/product.controller";
export const runtime = "nodejs";
export const GET = getProductsController;
export const POST = createProductController;
