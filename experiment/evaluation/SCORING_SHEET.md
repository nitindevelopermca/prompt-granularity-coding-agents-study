# Frozen scoring sheet

Do not change this instrument after official runs begin. Score the **final** repository after the validation prompt `V` has finished. Score failed builds; do not drop runs.

Raters should be blind to model and condition (`P1`/`P3`/`P6`/`P10`) when doing UX and accessibility items. Functional, API, and tool-based scores may be collected by script.

Disagreement on a 0/1/2 item: confer once; if still split, record the lower score and a note.

Credentials: username `emilys`, password `emilyspass`.

---

## A. Functional correctness (primary quality DV)

Each item is `0` or `1`. Sum is **FunctionalScore** in `0…16`.

| ID | Item | Pass (1) if and only if |
|----|------|-------------------------|
| F1 | App starts | App is reachable at `http://localhost:8080` after the project’s documented start command. |
| F2 | Valid login | Submitting `emilys` / `emilyspass` authenticates and reaches a products view. |
| F3 | Invalid login | A wrong password does not authenticate; a user-visible error is shown; app does not crash. DummyJSON returns HTTP 400 `{ "message": "Invalid credentials" }`. |
| F4 | Products from API | First page shows DummyJSON data from `limit=10` (not a hard-coded headphones catalog, not all ~194 at once). |
| F5 | Required product fields | A typical card shows main image, title, description, price, discount, rating/review control, Add to Cart. Brand when present. |
| F6 | Review modal opens | Activating the rating/review control opens a dialog/modal. |
| F7 | Correct reviews | Modal lists that product’s `reviews[]` (name, rating, comment, date). No invented DummyJSON reviews. |
| F8 | Add to Cart succeeds | Adding a listed product succeeds (UI and/or HTTP 201/200). |
| F9 | Cart badge | Header cart count increases with successful add. |
| F10 | Quantity modify | On cart page, +/− changes quantity and totals. |
| F11 | Remove item | Remove deletes that line and updates totals/badge. |
| F12 | Place Order | In-app success confirmation without a payment provider. |
| F13 | Lazy load | Load more (or equivalent) requests the **next** page (`skip` increased); more products appear; already loaded items remain. |
| F14 | Search | Search uses `/products/search?q=`; results match the query; empty query returns to the catalog. |
| F15 | Thumbnails | Card exposes `images[]` thumbs (one image is OK); activating a thumb changes the main image. |
| F16 | Add comment | Submitting a non-empty comment calls `POST /comments/add` with `postId` = product id and `userId` = login id; the new comment appears in the modal (local append). |

If F1 is 0, remaining functional items are 0 unless a later URL still works (record a note).

**Empty username/password** is scored under error handling (E2), not here.

---

## B. API contract correctness

From the run’s network log (browser DevTools or Playwright). Each `0` or `1`. Sum is **ApiScore** in `0…12`.

| ID | Item | Pass (1) |
|----|------|----------|
| A1 | Login URL | Login uses `POST https://dummyjson.com/auth/login`. |
| A2 | Login body | JSON includes `username` and `password` (test account on the happy path). |
| A3 | Products URL | Listing uses `GET https://dummyjson.com/products` with `limit` and `skip` (not `limit=0`). |
| A4 | No substitute catalog API | No Fake Store or other product host on the happy path. |
| A5 | Cart URL | Add uses `POST https://dummyjson.com/carts/add`. |
| A6 | Cart userId | Cart body `userId` equals the login response `id`. |
| A7 | Cart product id | Cart body includes the selected product’s `id`. |
| A8 | No GET-cart requirement | App does not fail because DummyJSON has no GET cart. Local cart after add is acceptable. |
| A9 | Lazy load skip | A second listing request uses a larger `skip` than the first. |
| A10 | Search URL | Search uses `GET https://dummyjson.com/products/search`. |
| A11 | Comment URL | Add comment uses `POST https://dummyjson.com/comments/add`. |
| A12 | Comment ids | Comment body `postId` is the product id and `userId` is the login id. |

A8 is `1` if the cart flow works locally after add, **or** if the app never needed GET cart. It is `0` only if the app incorrectly requires a missing GET-cart API and the cart flow fails for that reason.

---

## C. UX fidelity (in-scope structure only)

Score `0` = absent/wrong, `1` = present but major mismatch, `2` = structurally aligned with the mock.

**Ignore:** DummyJSON product photos/names vs mock electronics; Forgot Password; histogram; Verified Buyer; Sort by as required; Categories/About as real pages; shipping form; tax / Free shipping rows.

Sum is **UxScore** in `0…24`.

### Login (`ux-design-of-login.png`)

| ID | Item |
|----|------|
| U1 | Centered card on a light page; MyShop + bag-style mark |
| U2 | “Welcome Back” (or equivalent primary heading) and login instruction text |
| U3 | Username labeled field with leading user icon and placeholder |
| U4 | Password labeled field with lock icon, show/hide control, placeholder |
| U5 | Primary full-width Login button |

### Product listing (`ux-design-of-product-detail.png` is the listing grid)

| ID | Item |
|----|------|
| U6 | Header: MyShop mark, text nav, cart icon with numeric badge |
| U7 | “All Products” heading, showing-count, **search field**, and **Load more** (or equivalent pagination control) |
| U8 | Responsive product cards with main image **and** thumbnail strip from `images[]` |
| U9 | Price emphasized; discount shown; Add to Cart is a full-width primary button |

### Review modal (`ux-design-of-review-popup.png`)

| ID | Item |
|----|------|
| U10 | Overlay modal with title indicating Reviews and a close control |
| U11 | Review rows (identity, stars, comment, date) **and** an add-comment form (text + submit) |

### Cart (`ux-design-of-cart.png`)

| ID | Item |
|----|------|
| U12 | “Your Cart (N)” (or equivalent count in the heading) and a product table/list with Product / Price / Quantity / Total |
| U13 | Stepper + Remove per line; Continue Shopping control |
| U14 | Order summary with subtotal, total, and primary Place Order button |

---

## D. Accessibility

Automated: run axe-core on Login, Products (modal closed), Products (modal open), Cart. Record violation counts (critical/serious/moderate/minor). **AxeCountSeriousPlus** = critical + serious.

Manual checklist, each `0` or `1`. Sum is **A11yManual** in `0…8`.

| ID | Item |
|----|------|
| X1 | Form fields have associated labels (not placeholder-only). |
| X2 | Keyboard can tab to login fields and Login. |
| X3 | Visible focus indicator on interactive controls. |
| X4 | Images that convey meaning have alt text; decorative images are empty/hidden. |
| X5 | Buttons/links have accessible names (not icon-only without a name). |
| X6 | Review UI is a dialog (role or native `<dialog>`), not a non-modal div only. |
| X7 | Escape closes the review dialog. |
| X8 | Focus is trapped or otherwise managed so background is not the tab target while the dialog is open. |

---

## E. Error handling

Induce each scenario. `0` or `1`. Sum is **ErrorScore** in `0…8`.

| ID | Scenario | How to induce | Pass (1) |
|----|----------|---------------|----------|
| E1 | Invalid credentials | Wrong password | User-visible error; no crash; no stack trace |
| E2 | Empty fields | Submit login with empty username and/or password | Blocked or validated; no successful login |
| E3 | Login network failure | Block `dummyjson.com/auth/login` | User-visible failure; no crash |
| E4 | Products API failure | Block `dummyjson.com/products` after login | User-visible failure/empty-error; no crash |
| E5 | Empty products | Mock products `[]` if feasible; else N/A and leave blank, exclude from denominator | Empty state (only if induced) |
| E6 | No reviews | Open modal on a product with `reviews: []` (pick or mock) | Empty-review message |
| E7 | Broken image | Break one thumbnail URL if feasible | Fallback/alt; card still usable |
| E8 | Cart add failure | Block `dummyjson.com/carts/add` after a valid cart exists | Error shown; previous cart remains |

If E5 or E7 cannot be induced without changing app code, mark `NA` and compute ErrorScore over the remaining items (do not give a free 1).

---

## F. SEO (client-side)

Each `0` or `1`. Sum is **SeoScore** in `0…4`.

| ID | Item |
|----|------|
| S1 | Document title is meaningful (not the raw bundler default only). |
| S2 | Meta description exists and is non-empty. |
| S3 | Heading hierarchy exists (one logical `h1` per view; no skipped levels required beyond “no `h4` as the only heading”). |
| S4 | At least one in-scope view uses semantic landmarks or equivalent structure (`header`/`main`/`nav` or ARIA landmarks). |

---

## G. Performance (report raw; band only for optional composite)

Collect on production build of the products view after login, desktop, cached vs uncached as noted.

| ID | Metric | Record |
|----|--------|--------|
| P1 | Production build success | 0/1 |
| P2 | Approximate JS bundle size (kB, main+vendor if reported) | number |
| P3 | Product listing request count to DummyJSON on first products view | integer |
| P4 | Lighthouse Performance score, if collected | 0–100 or NA |

Do not fail a run for not using lazy routes. Band (optional, pre-registered): P2 `<150` kB gzipped main = good; use raw in the paper.

---

## H. Code quality

Static + short rubric on the final tree. Each `0` or `1`. Sum is **CodeScore** in `0…6`.

| ID | Item |
|----|------|
| C1 | `tsc --noEmit` (or project equivalent) exits 0. |
| C2 | Production build exits 0. |
| C3 | API responses have TypeScript types/interfaces (not only `any`). |
| C4 | No widespread `any` (zero in app `src` excluding generated files, or ≤2 with a note). |
| C5 | Fetch/API calls are not copy-pasted independently in every component (some shared module or function). |
| C6 | List renders use stable keys (not array index only, unless the list is static). |

---

## I. Efficiency (process DVs)

Record per prompt and as run totals.

| Field | Definition |
|-------|------------|
| UserPrompts | Number of operator prompts sent, including `V` (P1=2, P3=4, P6=7, P10=11). |
| ToolActions | Agent tool/file/terminal invocations, from logs. |
| InputTokens | Sum of input tokens over the run. |
| OutputTokens | Sum of output tokens over the run. |
| TotalTokens | Input + output. |
| WallTimeSec | Operator start of first prompt to agent stop after `V`. |
| HumanInterventions | Must be 0 on official runs. If >0, mark the run invalid. |
| EstCostUSD | From vendor pricing for the frozen model version. |

---

## J. Out-of-scope extras (descriptive only)

Count presence (`0/1`) of: Forgot Password, shipping form, tax row, extra pages, Sort by. **Do not add these into quality scores.** Add-comment is **in scope** (F16).

---

## Pre-registered summaries (do not invent new indexes after seeing results)

Report all of the above as separate dependent variables.

Optional composites, defined now:

- **FunctionalRate** = FunctionalScore / 16
- **NfrRate** = mean of (UxScore/24, A11yManual/8, ErrorScore/k, SeoScore/4, CodeScore/6) where `k` is the number of non-NA error items
- **Cost** = TotalTokens (primary cost DV); also report WallTimeSec and EstCostUSD

Do **not** use Quality/Cost as a hypothesis-test statistic. It is exploratory visualization only.

Primary confirmatory outcomes for RQ1–RQ3: FunctionalScore (0–16), NfrRate (descriptive), TotalTokens, WallTimeSec.
