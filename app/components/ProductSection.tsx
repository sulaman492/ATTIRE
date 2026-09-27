"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { formatPrice, type ProductView } from "@/app/lib/product.types";
import styles from "./ProductSection.module.css";

const layouts = ["one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];

export default function ProductSection() {
  const [products, setProducts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const load = useCallback((signal?: AbortSignal) => {
    return fetch("/api/products", { cache: "no-store", signal }).then(async (response) => {
      if (!response.ok) throw new Error("Unable to load collection");
      setProducts(await response.json());
      setError(false);
    }).catch(() => { if (!signal?.aborted) setError(true); })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    const refresh = () => { if (document.visibilityState === "visible") void load(controller.signal); };
    document.addEventListener("visibilitychange", refresh);
    return () => { controller.abort(); document.removeEventListener("visibilitychange", refresh); };
  }, [load]);

  return (
    <section id="shop" className={styles.shop}>
      <div className={styles.shopHeader}>
        <div><span className={styles.smallTitle}>ATTIRE</span></div>
        <div className={styles.description}>Created for everyday wear. A collection built around simple forms,
          strong typography and pieces made to stand out.</div>
        <div className={styles.links}><span>SHOP</span><span>SHIPPING &amp; RETURNS</span></div>
      </div>
      {loading && <p role="status">Loading collection…</p>}
      {error && <p role="alert">We couldn’t load the collection. <button className="underline cursor-pointer" onClick={() => void load()}>Try again</button></p>}
      {!loading && !error && !products.length && <p>Our next collection is on its way.</p>}
      <div className={styles.grid}>
        {products.map((product, index) => {
          const image = product.images.find((image) => image.is_primary) ?? product.images[0];
          return <article key={product.id} className={`${styles.product} ${styles[layouts[index % layouts.length]]}`}>
            <div className={styles.imageWrapper} data-cursor="view-more">
              {image ? <Image src={image.image_url} alt={product.name} fill className={styles.image}
                sizes="(max-width: 600px) 90vw, (max-width: 1000px) 50vw, 60vw" /> : <span>Image coming soon</span>}
            </div>
            <div className={styles.productInfo}>
              <div className={styles.productTop}><h3>{product.name}</h3><span>{formatPrice(product.price)}</span></div>
              <div className={styles.category}><span className={styles.dot} />{product.category || "ATTIRE"}{product.stock === 0 && " / SOLD OUT"}</div>
            </div>
          </article>;
        })}
      </div>
    </section>
  );
}
