"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MAX_FILE_BYTES, MAX_IMAGES, MAX_UPLOAD_BYTES, type ProductView } from "@/app/lib/product.types";
import styles from "../admin.module.css";

export default function ProductForm({ productId }: { productId?: string }) {
  const [product, setProduct] = useState<ProductView | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    fetch(`/api/products/${productId}`, { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Unable to load product.");
        setProduct(data); setError("");
      }).catch((error) => { if (!controller.signal.aborted) setError(error.message || "Unable to load product."); });
    return () => controller.abort();
  }, [productId, attempt]);
  if (error) return <div className={styles.error} role="alert">{error} <button onClick={() => setAttempt((value) => value + 1)}>Retry</button> <Link href="/admin/products">Back to products</Link></div>;
  if (productId && !product) return <p role="status">Loading product…</p>;
  return <Editor key={product?.id ?? "new"} product={product} />;
}

type Preview = { key: string; url: string; id?: string; file?: File };
function Editor({ product }: { product: ProductView | null }) {
  const router = useRouter();
  const [images, setImages] = useState<Preview[]>(() => product?.images.map((image) => ({ key: image.id, id: image.id, url: image.image_url })) ?? []);
  const [primary, setPrimary] = useState(product?.images.find((image) => image.is_primary)?.id ?? product?.images[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [authError, setAuthError] = useState(false);
  const [success, setSuccess] = useState(false);
  const busy = useRef(false);
  const objectUrls = useRef(new Set<string>());
  const errorRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    const urls = objectUrls.current;
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, []);
  useEffect(() => { if (error) errorRef.current?.focus(); }, [error]);

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    const totalBytes = [...images.map((image) => image.file), ...files].reduce((sum, file) => sum + (file?.size ?? 0), 0);
    if (images.length + files.length > MAX_IMAGES || totalBytes > MAX_UPLOAD_BYTES || files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || !file.size || file.size > MAX_FILE_BYTES)) {
      setError("Choose up to 8 JPEG, PNG or WebP images. Each file must be at most 3 MB; new images together must be at most 3.5 MB."); return;
    }
    const additions = files.map((file) => {
      const url = URL.createObjectURL(file); objectUrls.current.add(url);
      return { key: crypto.randomUUID(), url, file };
    });
    setImages((current) => [...current, ...additions]);
    if (!primary && additions.length) setPrimary(additions[0].key);
    setError("");
  }

  function removeImage(key: string) {
    const removed = images.find((image) => image.key === key);
    if (removed?.file) { URL.revokeObjectURL(removed.url); objectUrls.current.delete(removed.url); }
    const remaining = images.filter((image) => image.key !== key);
    setImages(remaining);
    if (primary === key) setPrimary(remaining[0]?.key ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    if (!images.length || !primary) { setError("Add at least one image and select the primary image."); return; }
    const fields = new FormData(event.currentTarget);
    const newImages = images.filter((image) => image.file);
    const chosen = images.find((image) => image.key === primary)!;
    const data = {
      name: fields.get("name"), description: fields.get("description"), price: fields.get("price"),
      category: fields.get("category"), stock: Number(fields.get("stock")),
      imageIds: images.filter((image) => image.id).map((image) => image.id),
      primaryImage: chosen.id ?? `new:${newImages.findIndex((image) => image.key === primary)}`,
    };
    const body = new FormData();
    body.set("data", JSON.stringify(data));
    newImages.forEach((image) => body.append("images", image.file!));
    busy.current = true; setSaving(true); setError(""); setAuthError(false);
    try {
      const response = await fetch(product ? `/api/products/${product.id}` : "/api/products", { method: product ? "PATCH" : "POST", body });
      const result = await response.json();
      if (!response.ok) { setAuthError(response.status === 401 || response.status === 403); throw new Error(result.message || "Unable to save product."); }
      setSuccess(true);
      // This contains only a UI notice, never credentials or tokens.
      try { sessionStorage.setItem("attire-product-notice", result.warning || (product ? "Product updated." : "Product added to your collection.")); } catch { /* Storage can be disabled by the browser. */ }
      router.push("/admin/products"); router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save product. Please check your connection.");
      busy.current = false; setSaving(false);
    }
  }

  return <>
    <Link href="/admin/products" className={styles.back}>← All products</Link>
    <div className={styles.titleRow}><div><p className={styles.eyebrow}>{product ? "REFINE YOUR COLLECTION" : "BUILD YOUR COLLECTION"}</p><h1>{product ? "EDIT PRODUCT" : "ADD PRODUCT"}<span className={styles.red}>.</span></h1></div><p className={styles.small}>* Required fields</p></div>
    <form onSubmit={submit} className={styles.form}>
      {error && <div className={styles.error}><p ref={errorRef} tabIndex={-1} role="alert">{error}</p>{authError && <Link href="/login?next=/admin" target="_blank" rel="noopener noreferrer">Log in in a new tab, then retry here</Link>}</div>}
      {success && <p className={styles.notice} role="status">Product saved. Returning to your collection…</p>}
      <fieldset disabled={saving} className={styles.formGrid}>
        <div className={styles.details}>
          <h2>01 / The details</h2>
          <label>Product name *<input name="name" required maxLength={255} defaultValue={product?.name} placeholder="Oversized Black Tee" /></label>
          <label>Description<textarea name="description" rows={5} maxLength={10000} defaultValue={product?.description ?? ""} placeholder="Fabric, fit, and the details that matter." /></label>
          <div className={styles.fieldPair}><label>Price (PKR) *<input name="price" type="number" min="0" max="99999999.99" step="0.01" required defaultValue={product?.price} placeholder="3499.00" /></label><label>Stock *<input name="stock" type="number" min="0" max="2147483647" step="1" required defaultValue={product?.stock ?? 0} /></label></div>
          <label>Category<input name="category" maxLength={100} defaultValue={product?.category ?? ""} placeholder="e.g. T-Shirts" /></label>
        </div>
        <div className={styles.imagePanel}>
          <h2>02 / Product images *</h2>
          <p className={styles.small} id="image-help">JPEG, PNG or WebP. Up to 8 images. Max 3 MB each and 3.5 MB of new images per save. The primary image appears in the store.</p>
          <label className={styles.upload}>+ Select images<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={selectFiles} aria-describedby="image-help" /></label>
          <div className={styles.imageGrid}>
            {images.map((image, index) => <div key={image.key} className={`${styles.imageCard} ${primary === image.key ? styles.selectedImage : ""}`}>
              <div className={styles.preview}><Image src={image.url} alt={`Product image ${index + 1}`} fill sizes="(max-width: 640px) 40vw, 200px" unoptimized={Boolean(image.file)} /></div>
              <label className={styles.radioLabel}><input type="radio" name="primary" checked={primary === image.key} onChange={() => setPrimary(image.key)} />{primary === image.key ? "Primary image" : "Make primary"}</label>
              <button type="button" className={styles.removeImage} onClick={() => removeImage(image.key)} aria-label={`Remove image ${index + 1}`}>Remove</button>
            </div>)}
          </div>
          {!images.length && <p className={styles.emptyImages}>A front view. A detail. The full picture.<br />Add images to bring your product to life.</p>}
          {product && <p className={styles.small}>Image changes take effect when you save.</p>}
        </div>
      </fieldset>
      <div className={styles.formFooter}><p role="status">{saving ? "Uploading images and saving your product…" : "Saved products appear in your store automatically."}</p><button type="submit" disabled={saving} className={styles.button}>{saving ? "Saving…" : product ? "Save changes ↗" : "Create product ↗"}</button></div>
    </form>
  </>;
}
