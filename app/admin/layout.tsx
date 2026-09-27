import Link from "next/link";
import { requireAdminPage } from "@/app/lib/admin-auth";
import styles from "./admin.module.css";

export const metadata = { title: "ATTIRE — Admin", robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();
  return <div className={styles.shell}>
    <header className={styles.header}>
      <Link href="/admin" className={styles.brand}>ATTIRE<span> / ADMIN</span></Link>
      <nav aria-label="Admin navigation"><Link href="/admin">Overview</Link><Link href="/admin/products">Products</Link><Link href="/">View store ↗</Link></nav>
    </header>
    <main className={styles.main}>{children}</main>
    <footer className={styles.footer}>ATTIRE / COLLECTION MANAGEMENT</footer>
  </div>;
}
