import { requireAdminPage } from "@/app/lib/admin-auth";
import ProductForm from "../ProductForm";
export default async function NewProductPage() {
  await requireAdminPage();
  return <ProductForm />;
}
