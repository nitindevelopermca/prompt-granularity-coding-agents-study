# Specification freeze (canonical)

This freeze is the source of truth for every experimental run. Where it conflicts with the original PDF or the UX images, **this freeze wins**.

Official runs using this freeze are a **new protocol**. Earlier P1/P3 rows logged against the minimum shop are a pilot only.

## Technology

- React + TypeScript.
- Frontend only. No custom backend or server-side framework.
- Application must run at `http://localhost:8080`.
- Use **only** DummyJSON URLs listed below. Do not use Fake Store API or any substitute.

## Required user flow

Login → View Products (first page) → Load more products → Search products → Open reviews → Add a comment → Add to Cart → Open Cart → Modify Cart → Place Order

## APIs (use these exact URLs and fields)

### Login

- `POST https://dummyjson.com/auth/login`
- Content-Type: `application/json`
- Test account: username `emilys`, password `emilyspass`
- Request may include `expiresInMins`.
- On success, retain at least `id` (cart `userId` and comment `userId`) and `accessToken`. `refreshToken` may be retained.

### Product listing (lazy load)

- First page: `GET https://dummyjson.com/products?limit=10&skip=0`
- Load more: same URL with `skip` increased by `limit` (10, then 20, …) until `skip + products.length >= total`.
- Do **not** call `limit=0` (do not download all ~194 products at once).
- Use: `id`, `title`, `description`, `price`, `discountPercentage`, `rating`, `brand`, `thumbnail`, `images`, `reviews`.
- `brand` is often missing — show a fallback.
- `images` may have one or many URLs. Main photo uses `thumbnail` or `images[0]`. Thumbnail strip uses `images[]` (one thumb is OK).

### Search

- `GET https://dummyjson.com/products/search?q={query}`
- Trigger when the user submits search or after a short debounce. Empty query returns to the lazy-loaded catalog (not search).
- Display search hits from `products[]`. Handle no matches.

### Reviews (read)

- Use `products[].reviews` on the product already loaded. Fields: `reviewerName`, `rating`, `comment`, `date`.
- Do not invent DummyJSON reviews. Do not GET `/comments` as the product review list.

### Add a comment (write, simulated)

- `POST https://dummyjson.com/comments/add`
- Content-Type: `application/json`
- Body: `{ "body": "<comment text>", "postId": <product id>, "userId": <login id> }`
- DummyJSON **does not persist** this. After HTTP success, **append** the comment to that product’s review list **in frontend state** so it shows in the modal immediately.
- Require non-empty comment text. Optional 1–5 star rating in the UI; if collected, show it on the local review row (DummyJSON comment POST has no rating field).
- On POST failure, keep existing reviews and show an error.

### Add to cart

- `POST https://dummyjson.com/carts/add` with `userId` and `products: [{ id, quantity }]`.
- No GET-cart API. Quantity/remove/totals are local after add.
- Cart add does not require an Authorization header. Bearer token optional.
- On add failure, keep existing valid cart state.

## Live DummyJSON notes (re-checked 31 Aug 2026)

| Call | Observed |
|------|----------|
| Login `emilys` / `emilyspass` | HTTP 200, `id` = 1, `accessToken` (no legacy `token`) |
| Wrong password | HTTP 400 `{ "message": "Invalid credentials" }` |
| `GET /products?limit=10&skip=0` | HTTP 200, 10 items, `total` ≈ 194 |
| `GET /products?limit=10&skip=10` | Next 10 items (first id continues, e.g. 11) |
| `GET /products/search?q=phone` | HTTP 200, matching products |
| `images[]` | Present; some products have only **1** image |
| `POST /comments/add` | Simulated create; will not appear on a later GET products |
| CORS | Browser `fetch` from `http://localhost:8080` allowed |
| `POST /carts/add` | HTTP 201 |

## In-scope screens

Product names/photos in UX images are examples. Render DummyJSON data.

### Login

MyShop + bag icon, Welcome Back, username, password, show/hide, Login, loading, empty-field validation, invalid credentials, network error. On success → products.

UX: `spec/ux/ux-design-of-login.png`

### Product listing

Header with MyShop and cart badge. Heading All Products and a showing-count that updates with loaded items. **Search** field. Grid of cards: main image, **thumbnail strip** from `images[]`, title, description, price, discount, rating/review control, brand when present, Add to Cart. **Load more** control at the bottom (not a full dump of 194 items). Loading and end-of-list state (hide/disable Load more when no more pages).

UX: `spec/ux/ux-design-of-product-detail.png` and `spec/ux/ux-design-of-product-listing.png` (listing). Thumbnail strip close-up: `spec/ux/ux-design-of-product-thumbnails.png`.

### Review modal + add comment

Open from the rating/review control. Dialog: existing reviews (name, rating, comment, date), empty state, close/Escape/focus. **Add a comment** form in the modal (text + optional stars + submit). After successful POST, the new comment appears in the list without a full page reload.

UX: `spec/ux/ux-design-of-review-popup.png`

### Cart / order

Unchanged intent: line items, stepper, Remove, Continue Shopping, subtotal, total, Place Order, in-app success. No payment. Use product thumbnail on cart lines.

UX: `spec/ux/ux-design-of-cart.png`

## Out of scope

- Forgot Password
- Categories / About Us as real pages (inert header links OK)
- Shipping form, payment, tax / Free shipping rows as required
- Matching DummyJSON catalog to mock electronics
- SSR solely for SEO
- Fake Store API
- `GET /carts/user/:id` as the session cart
- `GET /comments` as the product review source
- Fetching all products with `limit=0`

## Non-functional requirements

- Accessibility: semantic HTML, labels, keyboard, visible focus, names, alt text, accessible errors, dialog semantics, ARIA only when needed. Thumbnail buttons must have names (e.g. “Image 2 of 3”).
- Errors: login, network, product API, search failure, empty search, load-more failure (keep already loaded products), comment POST failure, cart failure, missing images, no reviews, invalid form input.
- Performance: lazy product pages (do not fetch all products up front); stable keys; reasonable image loading.
- SEO: title, meta description, heading hierarchy, alt text, document structure. No SSR solely for SEO.
- Code: TypeScript for API data, avoid `any` where reasonable, handle async/side effects.

## Completion

The required flow works at `http://localhost:8080` with DummyJSON only and no custom backend.
