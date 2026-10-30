
"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  formatPrice,
  type ProductView,
} from "@/app/lib/product.types";

import styles from "./ProductSection.module.css";

const layouts = [
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
];

function ProductImages({
  product,
  slot,
}: {
  product: ProductView;
  slot: number;
}) {
  const primary =
    product.images.find((image) => image.is_primary) ??
    product.images[0];

  const secondary = product.images.find(
    (image) => image.id !== primary?.id
  );

  const sizes =
    slot < 4
      ? "(min-width: 1024px) 25vw, 50vw"
      : slot === 6
        ? "(min-width: 768px) 50vw, 75vw"
        : slot === 10
          ? "(min-width: 768px) 32vw, 63vw"
          : `(min-width: 768px) 19vw, ${
              slot === 7 || slot === 12 ? "50vw" : "38vw"
            }`;

  return (
    <div
      className={styles.imageWrapper}
      data-cursor="view-more"
    >
      {primary ? (
        <Image
          src={primary.image_url}
          alt={product.name}
          fill
          className={`${styles.image} ${styles.primaryImage}`}
          sizes={sizes}
        />
      ) : (
        <span className={styles.noImage}>
          Image coming soon
        </span>
      )}

      {secondary && (
        <Image
          src={secondary.image_url}
          alt=""
          aria-hidden="true"
          fill
          className={`${styles.image} ${styles.secondaryImage}`}
          sizes={sizes}
        />
      )}
    </div>
  );
}

export default function ProductSection() {
  const [products, setProducts] = useState<ProductView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const rows: {
    start: number;
    end: number;
    opening: boolean;
  }[] = [];

  for (let start = 0; start < products.length; start += layouts.length) {
    for (const [offset, count] of [
      [0, 4],
      [4, 3],
      [7, 3],
      [10, 3],
    ]) {
      if (start + offset < products.length) {
        rows.push({
          start: start + offset,
          end: start + offset + count,
          opening: offset === 0,
        });
      }
    }
  }

  const load = useCallback((signal?: AbortSignal) => {
    return fetch("/api/products", {
      cache: "no-store",
      signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load collection");
        }

        const data: ProductView[] = await response.json();

        setProducts(data);
        setError(false);
      })
      .catch(() => {
        if (!signal?.aborted) {
          setError(true);
        }
      })
      .finally(() => {
        if (!signal?.aborted) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void load(controller.signal);

    const refresh = () => {
      if (document.visibilityState === "visible") {
        void load(controller.signal);
      }
    };

    document.addEventListener("visibilitychange", refresh);

    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  return (
    <section id="shop" className={styles.shop}>
      {loading && (
        <p role="status" className={styles.status}>
          Loading collection…
        </p>
      )}

      {error && (
        <p role="alert" className={styles.status}>
          We couldn&apos;t load the collection.{" "}
          <button
            type="button"
            className={styles.retryButton}
            onClick={() => void load()}
          >
            Try again
          </button>
        </p>
      )}

      {!loading && !error && products.length === 0 && (
        <p className={styles.status}>
          Our next collection is on its way.
        </p>
      )}

      <div className={styles.collection}>
        {rows.map((row) => (
          <div
            key={row.start}
            className={`${styles.grid} ${
              row.opening ? styles.openingRow : ""
            }`}
          >
            {products
              .slice(row.start, row.end)
              .map((product, index) => (
                <article
                  key={product.id}
                  className={`${styles.product} ${
                    styles[
                      layouts[
                        (row.start + index) % layouts.length
                      ]
                    ]
                  }`}
                >
                  <ProductImages
                    product={product}
                    slot={(row.start + index) % layouts.length}
                  />

                  <div className={styles.productInfo}>
                    <div className={styles.productTop}>
                      <h3>{product.name}</h3>
                      <span>{formatPrice(product.price)}</span>
                    </div>

                    <div className={styles.category}>
                      <span className={styles.dot} />
                      {product.category || "ATTIRE"}

                      {product.stock === 0 && " / SOLD OUT"}
                    </div>
                  </div>
                </article>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}
