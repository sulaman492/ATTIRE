# ATTIRE product administration

## Setup

Keep these values in `.env` locally and in server-side environment settings when deploying:

```dotenv
DATABASE_URL=postgresql://...
ACCESS_TOKEN_SECRET=...
REFRESH_TOKEN_SECRET=...
CLOUDINARY_CLOUD_NAME=your_cloudinary_product_environment_cloud_name
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
# Optional when a reverse proxy changes the origin seen by Next.js:
APP_ORIGIN=https://your-store.example
```

The Cloudinary cloud name is the identifier from Cloudinary settings, not the ATTIRE brand/display name. Secrets never use a `NEXT_PUBLIC_` prefix. Restart Next.js after changing Cloudinary configuration; image remotePatterns are set at startup/build time.

Existing product tables are reused. Apply only the additive metadata migration on another environment:

```sh
npx tsx scripts/migrate-product-images.ts
```

Promote your own account in Neon, then log in again to get an ADMIN access JWT:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = '<admin-email>';
```

Visit `/admin`. Admin login now routes there automatically. Every admin page checks the HttpOnly access cookie server-side. Every mutation verifies the JWT (HS256, expiry, user ID, role) and the current database role. Demotion takes effect immediately. Public product reads stay open.

The existing 15-minute access and 7-day refresh authentication are preserved. This project did not have a refresh endpoint, so expired admin access asks you to log in again. An expired form can be kept open while signing in in another tab. No JWT is stored in localStorage or sessionStorage.

## Data flow and image lifecycle

Route → controller → service → repository → PostgreSQL. Controllers parse bounded requests and return HTTP errors. Services validate business rules and coordinate uploads/transactions. Repositories contain parameterized SQL. Public reads use one catalog query, including images, rather than one query per product.

POST and PATCH accept multipart forms with one JSON `data` field and repeated `images` file fields. PATCH also accepts JSON for changes without new uploads. Cloudinary upload happens on the server inside the save workflow; there is no unauthenticated or unsigned upload endpoint. This uses Cloudinary's [authenticated Upload API](https://cloudinary.com/documentation/authentication_signatures).

Each product needs 1–8 images. JPEG, PNG and WebP are allowed; file signatures and content types are checked, and Cloudinary decodes the image. Each image is limited to 3 MiB, new images together to 3.5 MiB per save, and the complete HTTP body to 4 MiB. Compress photos or add them in separate saves if necessary. These conservative limits avoid buffering large uploads and leave room for multipart overhead.

The server generates asset IDs under `attire/products/`. It stores `image_url` and `cloudinary_public_id`, not binaries. Clients cannot submit arbitrary Cloudinary URLs or asset IDs. Both create and update upload new images before opening a database transaction. Updates validate the current image selection before uploading, then recheck it under the product lock in case another admin changed the product meanwhile. Only database operations run inside the transaction. New uploads are deleted if an upload batch or the DB transaction fails. Parent-row locks serialize image edits so one primary image remains selected.

After a successful update/delete commit, removed assets are destroyed server-side, with CDN invalidation and up to three attempts. Persistent provider failures return a warning and log the asset IDs; retry those assets using the cleanup script below. Database and Cloudinary cannot share a transaction: a process crash between the commit and cleanup may leave an orphan that must be removed from Cloudinary. There is intentionally no background worker/queue. Legacy rows without a public ID are retained as unmanaged assets; the app will not guess which asset to delete.

```sh
npx tsx scripts/cleanup-product-images.ts attire/products/<uuid>
```

The cleanup script refuses an ID still referenced by a product image.

## Exact API examples

Examples use curl; on Windows use `curl.exe`. Replace file paths and UUIDs with your own. Log in through the existing API and save its HttpOnly cookies in a local cookie jar (do not commit it):

```sh
curl -c cookies.txt -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"your-password"}' http://localhost:3000/api/login
```

### Public reads

```sh
curl http://localhost:3000/api/products
curl http://localhost:3000/api/products/<product-id>
```

Expected: `200` and an array (collection) or object (single product):

```json
{
  "id": "<uuid>",
  "name": "Oversized Black Tee",
  "description": "Heavyweight cotton, relaxed fit.",
  "price": "3499.00",
  "category": "T-Shirts",
  "stock": 10,
  "images": [{"id":"<image-uuid>","image_url":"https://res.cloudinary.com/...","is_primary":true,"position":0}]
}
```

### Create, including multiple images

```sh
curl -b cookies.txt -X POST http://localhost:3000/api/products \
  -F 'data={"name":"Oversized Black Tee","description":"Heavyweight cotton, relaxed fit.","price":"3499.00","category":"T-Shirts","stock":10,"primaryImage":"new:0"}' \
  -F 'images=@front.jpg;type=image/jpeg' \
  -F 'images=@back.jpg;type=image/jpeg'
```

Expected: `201`, the created product with its image records. `new:0` selects the first uploaded image. If omitted, the first image becomes primary.

### Edit fields

```sh
curl -b cookies.txt -X PATCH -H "Content-Type: application/json" \
  -d '{"price":"2999.00","stock":5,"category":"Essentials"}' \
  http://localhost:3000/api/products/<product-id>
```

Expected: `200`, updated product. Omitted fields remain unchanged. Use `null` to clear description/category. Price allows 0–99999999.99 with at most two decimals; stock is a non-negative integer.

### Replace/add/remove images and select primary

```sh
curl -b cookies.txt -X PATCH http://localhost:3000/api/products/<product-id> \
  -F 'data={"imageIds":["<existing-image-to-keep>"],"primaryImage":"new:0"}' \
  -F 'images=@detail.jpg;type=image/jpeg'
```

Expected: `200`. `imageIds` lists existing images to retain, in display order; omitted existing IDs are removed. Omit `imageIds` entirely to keep all existing images. New images are appended. To select an existing primary image, use its image UUID as `primaryImage`. Removing the current primary without choosing another selects the first retained/new image. Removing every image without adding a replacement returns `400`.

### Delete

```sh
curl -b cookies.txt -X DELETE http://localhost:3000/api/products/<product-id>
```

Expected: `200`, `{"message":"Product deleted."}`. A subsequent GET returns `404`. The admin UI asks for confirmation first.

### Failure responses

Errors are `{ "message": "..." }` with the appropriate status:

| Scenario | Status |
| --- | --- |
| Missing/invalid/expired access token | 401 |
| Valid customer token, demoted admin, cross-site write | 403 |
| Invalid UUID, JSON, fields, image selection, file type | 400 |
| Product does not exist | 404 |
| Request body exceeds 4 MiB | 413 |
| Unsupported request content type | 415 |
| Cloudinary unavailable/rejects upload | 502 |
| Cloudinary configuration missing | 503 |
| Unexpected database/server failure | 500 |

## Verification

```sh
npx tsc --noEmit
npm run lint
npm run build
npx tsx scripts/test-product-repository.ts
npx tsx scripts/test-product-service.ts
# Start npm run dev before this HTTP integration test:
npx tsx scripts/test-product-api.ts
# If provider credentials are unavailable, exercise actual route handlers
# with real Neon and simulated Cloudinary (this is NOT a live upload test):
npx tsx scripts/test-product-api.ts --simulate-cloudinary
```

Repository tests always roll back. Service/API tests create uniquely named temporary records and remove them in finally blocks. The live API test also uploads and destroys temporary Cloudinary images. Run on a development database/cloud environment when possible. The tests never promote an existing account.

Manual flow: log in as admin → `/admin` → Add product → select multiple images → choose primary → save → check list → open store → confirm product/image → edit stock/category/images → save → delete after confirmation. Check `/admin` without a session and as CUSTOMER; neither should render admin controls. Verify narrow/mobile widths, loading/empty/error states, expired-session messages and duplicate-click prevention.
