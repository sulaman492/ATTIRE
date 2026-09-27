-- Existing products and product_images tables are NOT recreated.
ALTER TABLE product_images ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;
