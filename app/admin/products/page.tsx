import { requireAdminPage } from "@/app/lib/admin-auth";
import ProductList from "./ProductList";
export default async function ProductsPage() {
  await requireAdminPage();
  return <ProductList />;
}
