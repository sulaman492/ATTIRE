import type { PoolClient } from "pg";
import pool from "@/app/lib/db";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  // pg returns NUMERIC as a string to preserve decimal precision.
  price: string;
  category: string | null;
  stock: number;
  created_at: Date | null;
  updated_at: Date | null;
};

export type ProductImage = {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  position: number;
  cloudinary_public_id: string | null;
  created_at: Date | null;
};

export type ProductInput = Pick<Product, "name" | "price" | "stock"> & {
  description?: string | null;
  category?: string | null;
};

export type ProductImageInput = {
  image_url: string;
  position?: number;
  cloudinary_public_id?: string | null;
};

// Pass the SAME client to every operation inside a service transaction.
// Otherwise each operation uses the existing shared connection pool.
type Database = Pick<PoolClient, "query">;

export async function createProduct(data: ProductInput, db: Database = pool) {
  const result = await db.query<Product>(
    `INSERT INTO products (name, description, price, category, stock)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.name, data.description ?? null, data.price, data.category ?? null, data.stock],
  );
  return result.rows[0];
}

export async function getAllProducts(db: Database = pool) {
  const result = await db.query<Product>(
    "SELECT * FROM products ORDER BY created_at DESC, id DESC",
  );
  return result.rows;
}

export async function getProductById(productId: string, db: Database = pool) {
  const result = await db.query<Product>(
    "SELECT * FROM products WHERE id = $1",
    [productId],
  );
  return result.rows[0] ?? null;
}

// A presence flag distinguishes an omitted PATCH field from an explicit null.
// All SQL identifiers are fixed; only values come from the caller.
export async function updateProduct(
  productId: string,
  data: Partial<ProductInput>,
  db: Database = pool,
) {
  if (Object.values(data).every((value) => value === undefined)) {
    return getProductById(productId, db);
  }
  const result = await db.query<Product>(
    `UPDATE products SET
       name = CASE WHEN $2 THEN $3 ELSE name END,
       description = CASE WHEN $4 THEN $5 ELSE description END,
       price = CASE WHEN $6 THEN $7::numeric ELSE price END,
       category = CASE WHEN $8 THEN $9 ELSE category END,
       stock = CASE WHEN $10 THEN $11::integer ELSE stock END,
       updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING *`,
    [productId,
      data.name !== undefined, data.name ?? null,
      data.description !== undefined, data.description ?? null,
      data.price !== undefined, data.price ?? null,
      data.category !== undefined, data.category ?? null,
      data.stock !== undefined, data.stock ?? null],
  );
  return result.rows[0] ?? null;
}

export async function deleteProduct(productId: string, db: Database = pool) {
  // The existing foreign key cascades deletion to product_images.
  const result = await db.query<Product>(
    "DELETE FROM products WHERE id = $1 RETURNING *",
    [productId],
  );
  return result.rows[0] ?? null;
}

export async function createProductImage(
  productId: string,
  data: ProductImageInput,
  db: Database = pool,
) {
  // Insert as non-primary; the service selects the primary image with
  // setPrimaryImage in the same transaction after inserting the images.
  const result = await db.query<ProductImage>(
    `INSERT INTO product_images (product_id, image_url, position, cloudinary_public_id)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [productId, data.image_url, data.position ?? 0, data.cloudinary_public_id ?? null],
  );
  return result.rows[0];
}

export async function getProductImages(productId: string, db: Database = pool) {
  const result = await db.query<ProductImage>(
    `SELECT * FROM product_images WHERE product_id = $1
     ORDER BY position ASC, created_at ASC, id ASC`,
    [productId],
  );
  return result.rows;
}

export async function deleteProductImage(
  productId: string,
  imageId: string,
  db: Database = pool,
) {
  // Scope image mutations to the owning product, not just an image ID.
  const result = await db.query<ProductImage>(
    "DELETE FROM product_images WHERE product_id = $1 AND id = $2 RETURNING *",
    [productId, imageId],
  );
  return result.rows[0] ?? null;
}

export async function deleteProductImages(productId: string, db: Database = pool) {
  const result = await db.query<ProductImage>(
    "DELETE FROM product_images WHERE product_id = $1 RETURNING *",
    [productId],
  );
  return result.rows;
}

/** Requires an active transaction. Lock this parent row before any service
 * operation that changes its images, so concurrent edits are serialized. */
export async function setPrimaryImage(
  productId: string,
  imageId: string,
  client: PoolClient,
) {
  await client.query("SELECT id FROM products WHERE id = $1 FOR UPDATE", [productId]);
  const result = await client.query<ProductImage>(
    `UPDATE product_images SET is_primary = (id = $2)
     WHERE product_id = $1
       AND EXISTS (
         SELECT 1 FROM product_images WHERE product_id = $1 AND id = $2
       )
     RETURNING *`,
    [productId, imageId],
  );
  // An image owned by another product must not clear the existing selection.
  return result.rows.find((image) => image.id === imageId) ?? null;
}

export async function withProductTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

export async function lockProduct(productId: string, client: PoolClient) {
  const result = await client.query<Product>("SELECT * FROM products WHERE id = $1 FOR UPDATE", [productId]);
  return result.rows[0] ?? null;
}

export async function updateImagePosition(productId: string, imageId: string, position: number, client: PoolClient) {
  await client.query("UPDATE product_images SET position = $3 WHERE product_id = $1 AND id = $2", [productId, imageId, position]);
}

// One query gives the public catalog a consistent snapshot without N+1 queries.
export async function getProductCatalog(
  productId?: string,
  db: Database = pool
) {
  const result = await db.query<Product & { images: ProductImage[] }>(
    `
      SELECT
        p.*,
        COALESCE(
          (
            SELECT jsonb_agg(
              to_jsonb(i)
              ORDER BY i.position, i.created_at, i.id
            )
            FROM product_images i
            WHERE i.product_id = p.id
          ),
          '[]'::jsonb
        ) AS images
      FROM products p
      WHERE ($1::uuid IS NULL OR p.id = $1)
      ORDER BY p.created_at ASC, p.id ASC
    `,
    [productId ?? null]
  );
  return result.rows;
}