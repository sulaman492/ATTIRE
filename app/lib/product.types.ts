export const MAX_IMAGES = 8;
export const MAX_FILE_BYTES = 3 * 1024 * 1024;
export const MAX_UPLOAD_BYTES = 3.5 * 1024 * 1024;
export type ProductImageView = {
  id: string;
  image_url: string;
  is_primary: boolean;
  position: number;
};
export type ProductView = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  category: string | null;
  stock: number;
  images: ProductImageView[];
};
export const formatPrice = (price: string) => new Intl.NumberFormat("en-PK", {
  style: "currency", currency: "PKR", maximumFractionDigits: 2,
}).format(Number(price));
