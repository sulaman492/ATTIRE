import { requireAdminPage } from "@/app/lib/admin-auth";
import { notFound } from "next/navigation";
import ProductForm from "../../ProductForm";
export default async function EditProductPage({ params }: { params: Promise<{ productId: string }> }) {
  await requireAdminPage();
  const { productId } = await params;
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(productId)) notFound();
  return <ProductForm productId={productId} />;
}
