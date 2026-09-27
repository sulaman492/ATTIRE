"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, type ProductView } from "@/app/lib/product.types";
import styles from "../admin.module.css";

export default function ProductList({ overview = false }: { overview?: boolean }) {
  const [products, setProducts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const busy = useRef(false);
  const load = useCallback((signal?: AbortSignal) => {
    return fetch("/api/products", { cache: "no-store", signal }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to load products.");
      setProducts(data);
      setError("");
      try {
        const saved = sessionStorage.getItem("attire-product-notice");
        if (saved) { setNotice(saved); sessionStorage.removeItem("attire-product-notice"); }
      } catch { /* Notices are optional when browser storage is unavailable. */ }
    }).catch((error) => {
      if (!signal?.aborted) setError(error instanceof Error ? error.message : "Unable to load products.");
    }).finally(() => { if (!signal?.aborted) setLoading(false); });
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function remove(product: ProductView) {
    if (busy.current || !window.confirm(`Delete “${product.name}”? This permanently removes the product and its images.`)) return;
    busy.current = true; setDeleting(product.id); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to delete product.");
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setNotice(data.warning ? `${data.message} ${data.warning}` : "Product deleted.");
    } catch (error) { setError(error instanceof Error ? error.message : "Unable to delete product."); }
    finally { busy.current = false; setDeleting(null); }
  }

  return <>
    <div className={styles.titleRow}><div><p className={styles.eyebrow}>{overview ? "STORE OVERVIEW" : "YOUR COLLECTION"}</p><h1>{overview ? "ADMIN" : "PRODUCTS"}<span className={styles.red}>.</span></h1></div><Link className={styles.button} href="/admin/products/new">+ Add product</Link></div>
    {notice && <p className={styles.notice} role="status">{notice}</p>}
    {error && <div className={styles.error} role="alert">{error} <button onClick={() => void load()}>Retry</button> <Link href="/login?next=/admin">Log in again</Link></div>}
    {loading ? <p className={styles.empty} role="status">Loading collection…</p> : !error && <>
      {overview ? <>
        <div className={styles.stats}>
          <div><span>Total products</span><strong>{products.length.toString().padStart(2, "0")}</strong></div>
          <div><span>Low stock · 1–5 units</span><strong>{products.filter((product) => product.stock > 0 && product.stock <= 5).length.toString().padStart(2, "0")}</strong></div>
          <div><span>Out of stock</span><strong>{products.filter((product) => product.stock === 0).length.toString().padStart(2, "0")}</strong></div>
        </div>
        <div className={styles.overviewBottom}><h2>A considered collection.<br />Every detail, in your hands.</h2><Link className={styles.outlineButton} href="/admin/products">Manage products ↗</Link></div>
      </> : products.length === 0 ? <div className={styles.empty}><h2>Your collection starts here.</h2><p>Add your first product to make it available in the store.</p><Link className={styles.outlineButton} href="/admin/products/new">Add product</Link></div> : <>
        <p className={styles.small}>{products.length} products / Prices in PKR</p>
        <div className={styles.tableWrap}><table className={styles.table}><caption className={styles.srOnly}>ATTIRE products</caption><thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead><tbody>
          {products.map((product) => {
            const image = product.images.find((image) => image.is_primary) ?? product.images[0];
            return <tr key={product.id}><td><div className={styles.productCell}><div className={styles.thumbnail}>{image ? <Image src={image.image_url} alt={product.name} fill sizes="64px" /> : <span>No image</span>}</div><Link href={`/admin/products/${product.id}/edit`}>{product.name}</Link></div></td><td>{product.category || "—"}</td><td className={styles.nowrap}>{formatPrice(product.price)}</td><td><span className={product.stock <= 5 ? styles.red : undefined}>{product.stock === 0 ? "Out of stock" : `${product.stock} units`}</span></td><td><div className={styles.actions}><Link href={`/admin/products/${product.id}/edit`}>Edit</Link><button disabled={deleting !== null} onClick={() => void remove(product)} aria-label={`Delete ${product.name}`}>{deleting === product.id ? "Deleting…" : "Delete"}</button></div></td></tr>;
          })}
        </tbody></table></div>
      </>}
    </>}
  </>;
}
