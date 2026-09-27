import { requireAdminPage } from "@/app/lib/admin-auth";
import ProductList from "./products/ProductList";
export default async function AdminPage() {
  await requireAdminPage();
  return <ProductList overview />;
}
