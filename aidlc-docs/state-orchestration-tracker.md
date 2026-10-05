# AI-DLC State Orchestration Tracker (`aidlc-docs/state-orchestration-tracker.md`)

> **Global AI-DLC Lifecycle:** `ACTIVE`  
> **Global Project Inception Status:** `STEP 1 [E] EXECUTE COMPLETED (APPROVED)`  
> **Current Global Phase:** `STEP 2: SLICE-BY-SLICE EXECUTION (RECURSIVE PAVE LOOP)`  
> **Active Slice:** `Slice 7: Accounting, Financial Reporting & Sales/Inventory Analytics`

---

## 1. Project Metadata & Configuration Baseline

- **Project Name:** Pet Store Enterprise E-Commerce Platform
- **Architecture Baseline:**
  - **Backend:** Java 21 LTS, Pure Spring Framework 7.0.x (Zero Spring Boot, Zero XML programmatic config), Servlet 6.0+, Spring Security 7.0.x, JJWT 0.12.x
  - **Persistence:** PostgreSQL 16+, Hibernate 7.4.x, HikariCP, Flyway 11.3.x migrations
  - **Frontend:** Angular 24 SPA (100% Signal-First + Exclusive Signal Forms, Zero legacy FormBuilder/ReactiveFormsModule)
- **Approved Inception Spec:** [`project-spec.md`](../project-spec.md)
- **Key Domain Decisions (Approved Q1.1 - Q1.9):**
  - **Q1.1 (Inventory Tagging):** Pets are tagged as `SINGLE` (`quantity = 1` strictly enforced); physical supplies tagged as `MULTIPLE` (`quantity >= 1`).
  - **Q1.2 (Guest Cart):** Anonymous visitors can add pets/supplies locally; cart merges into DB on login/registration.
  - **Q1.3 (Checkout/Payment):** Emulated payment gateway with Luhn algorithm, future expiry, CVV checks, masked cards, and test decline simulation.
  - **Q1.4 (Email Verification):** Customer registration requires email verification/activation token link.
  - **Q1.5 (Frontend):** Angular 24 + Signal Forms exclusively.
  - **Q1.6 (Search):** Type/category and breed dynamic search with debounced Signal Forms.
  - **Q1.7 (Admin Supplies):** Physical supplies management with SKU, stock quantity, low-stock alerts, multiple quantity tag.
  - **Q1.8 (Accounting):** Transactional financial ledger (`accounting_ledger`) recording payments and refunds.
  - **Q1.9 (Reporting):** Sales & inventory reporting per day, week, and month with interactive Signal dashboard & CSV export.

---

## 2. Global AI-DLC PAVE Loop Status

| AI-DLC Global Step | Description | Lifecycle Phase | Status | Artifacts / Output |
| :--- | :--- | :---: | :---: | :--- |
| **Step 1: Global Project Inception** | Project Spec & Blueprint Inception | `[P] -> [A] -> [V] -> [E]` | `COMPLETED` | [`project-spec.md`](../project-spec.md) |
| **Step 2: Recursive Slice Execution** | Vertical Feature Slices (1 to 7) | `PAVE Recursive` | `IN PROGRESS` | `aidlc-docs/slices/` |
| **Step 3: System Integration & E2E** | Multi-Slice Integration & Build Verification | `PAVE` | `PLANNED` | E2E test runs & verification logs |
| **Step 4: Release Readiness & Handover** | Deployment & Documentation Finalization | `PAVE` | `PLANNED` | Release package & deployment guide |

---

## 3. Slice Orchestration Matrix

| Slice ID | Slice Title | Assigned Focus | PAVE Stage | Slice Status | Dependencies |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **Slice 1** | **Customer Identity & Registration** | Auth, Email Verification, JWT, Angular 24 Signal Forms Reg | `[E] EXECUTE` | `COMPLETED` | Base `app_users` table |
| **Slice 2** | **Pet & Supply Search & Exploration** | Multi-Criteria Search API, Scoped Taxonomy, Signal Forms Search | `[E] EXECUTE` | `COMPLETED` | `pets`, `supplies`, `categories` |
| **Slice 3** | **Admin Physical Supply Management** | Supplies CRUD, Stock Replenishment, Low-Stock Alerts, Signal Form | `[E] EXECUTE` | `COMPLETED` | Flyway V6 (`supplies`) |
| **Slice 4** | **Shopping Cart Management** | Cart DB Schema (`PET` vs `SUPPLY`), Cart API, Guest Sync, Signal Cart | `[E] EXECUTE` | `COMPLETED` | Slice 1 (`app_users`), `pets`, `supplies` |
| **Slice 5** | **Checkout & Inventory Reservation** | Order DB Schema, Concurrency Lock, Atomic Checkout, Signal Forms Checkout | `[E] EXECUTE` | `COMPLETED` | Slice 1, Slice 3, Slice 4 |
| **Slice 6** | **Order History & Admin Fulfillment** | Customer History API, Admin Order Dashboard, Signal Forms Filter | `[E] EXECUTE` | `COMPLETED` | Slice 5 |
| **Slice 7** | **Accounting & Analytics Reporting** | Financial Ledger, Daily/Weekly/Monthly Sales & Inventory Reports, Export | `[P] PLAN & [A] ASK` | `ACTIVE IN-FLIGHT` | Slice 3, Slice 5, Slice 6 |

---

## 4. Granular Slice Tracking & Task Backlog

### 🧩 Slice 1: Customer Identity & Registration
- **Status:** `COMPLETED`
- **PAVE Loop State:** `[E]`
- **Tasks:**
  - [x] **S1-P1:** Draft Slice Specification & Technical Contract (`aidlc-docs/slices/slice-1-registration.md`).
  - [x] **S1-A1:** Clarification questions (if any) formatted in slice markdown file.
  - [x] **S1-V1:** Slice Human Approval Gate.
  - [x] **S1-E1:** Database Migration: `V4__customer_registration_and_activation.sql` (`app_users` full_name, phone, verification token, role updates).
  - [x] **S1-E2:** Domain & DTOs (`CustomerRegistrationRequest`, `RegistrationResponse`, `VerifyEmailResponse`, `CustomerProfileUpdateRequest`, `UserProfileDTO`).
  - [x] **S1-E3:** Service Layer: `AuthService` registration, email verification, resend verification token, BCrypt hashing.
  - [x] **S1-E4:** Web Controller & Security: `AuthController` register/verify/resend endpoints, `CustomerProfileController`, Spring Security permitAll/authenticated rules.
  - [x] **S1-E5:** Angular 24 Signal Forms Component: Standalone `CustomerRegistrationComponent` with Signal validation, pending verification modal with dev activation link.
  - [x] **S1-E6:** Standalone `EmailVerificationComponent` for `/verify?token=...` handling and token resend capability.
  - [x] **S1-E7:** Reactive Auth Store & Navigation: Signals for user session state, customer role badges, registration link in navbar.
  - [x] **S1-E8:** Slice Verification: 14 backend unit tests passing, production Angular build passing.

### 🧩 Slice 2: Pet & Supply Search & Exploration
- **Status:** `COMPLETED`
- **PAVE Loop State:** `[E]`
- **Tasks:**
  - [x] **S2-P1:** Draft Slice Specification (`aidlc-docs/slices/slice-2-search.md`).
  - [x] **S2-A1:** Target questions & technical decisions in slice markdown file (300ms debounce, replaceUrl).
  - [x] **S2-V1:** Slice 2 Human Approval Gate.
  - [x] **S2-E1:** Flyway Indexing Migration: `V5__pet_search_optimization_indexes.sql` on `(category_id, breed, status)`, `(status, price)`, and description trigram.
  - [x] **S2-E2:** Multi-Criteria Search API & dynamic query tests in `PetServiceImplTest`.
  - [x] **S2-E3:** Scoped Breed Taxonomy Endpoint (`GET /api/pets/breeds?category={type}`) tested and verified.
  - [x] **S2-E4:** Angular 24 Signal Forms Search Component with Debounced Signals in `CatalogStore` & `PetCatalogComponent`.
  - [x] **S2-E5:** Reactive Scoped Breed Filter, Active Filter Chips dismissal (`[Category ✕]`, `[Breed ✕]`, `[Search ✕]`, `[Price ✕]`), and URL Query Param Sync (`replaceUrl: true`).
  - [x] **S2-E6:** Automated backend and frontend unit tests (26/26 tests passing, Angular build passing).

### 🧩 Slice 3: Admin Catalog & Physical Supply Management
- **Status:** `COMPLETED`
- **PAVE Loop State:** `[E]`
- **Tasks:**
  - [x] **S3-P1:** Draft Slice Specification (`aidlc-docs/slices/slice-3-supplies.md`).
  - [x] **S3-A1:** Target questions & technical decisions in slice markdown file (auto-SKU, 5-unit threshold).
  - [x] **S3-V1:** Slice 3 Human Approval Gate.
  - [x] **S3-E1:** Flyway Migration: `V6__create_supplies_table.sql` with SKU, category, price, stock, threshold, item_type `MULTIPLE`.
  - [x] **S3-E2:** Physical Supply Entity & Repository (`Supply`, `SupplyRepository`).
  - [x] **S3-E3:** Admin Supply CRUD & Stock Replenishment Service (`SupplyService`, `SupplyServiceImpl`, 7/7 unit tests).
  - [x] **S3-E4:** REST Endpoints & Security: `SupplyController` (public `/api/supplies` and admin `/api/admin/supplies`).
  - [x] **S3-E5:** Angular 24 Signal Forms Admin Supply Form Component & Admin Supply Inventory Component with Stock Badges.
  - [x] **S3-E6:** Automated backend and frontend unit tests (33/33 tests passing, production Angular build passing).

### 🧩 Slice 4: Shopping Cart Management
- **Status:** `COMPLETED`
- **PAVE Loop State:** `[E]`
- **Tasks:**
  - [x] **S4-P1:** Draft Slice Specification (`aidlc-docs/slices/slice-4-cart.md`).
  - [x] **S4-A1:** Target questions & technical decisions in slice markdown file (capping merged quantities, pet availability alert).
  - [x] **S4-V1:** Slice 4 Human Approval Gate.
  - [x] **S4-E1:** Flyway Migration: `V7__create_cart_tables.sql` (`carts`, `cart_items` with unique pet and supply constraints).
  - [x] **S4-E2:** Cart JPA Entities & Repositories (`Cart`, `CartItem`, `CartItemType`, `CartRepository`, `CartItemRepository`).
  - [x] **S4-E3:** Cart Service & REST API endpoints (`CartService`, `CartServiceImpl`, `CartController`).
  - [x] **S4-E4:** Guest Cart Synchronization Endpoint (`POST /api/cart/sync`).
  - [x] **S4-E5:** Angular 24 Signal-First CartStore, `CartDrawerComponent`, and customer-facing `SupplyCatalogComponent`.
  - [x] **S4-E6:** Automated backend and frontend unit tests (31/31 backend tests passing, full Angular build passing).

### 🧩 Slice 5: Checkout, Inventory Reservation & Payment Emulation
- **Status:** `COMPLETED`
- **PAVE Loop State:** `[E]`
- **Tasks:**
  - [x] **S5-P1:** Draft Slice Specification (`aidlc-docs/slices/slice-5-checkout.md`).
  - [x] **S5-A1:** Target questions & technical decisions in slice markdown file (Luhn algorithm check, expiry check, CVV check, decline simulation, stock reservation policy).
  - [x] **S5-V1:** Slice 5 Human Approval Gate.
  - [x] **S5-E1:** Flyway Migration: `V8__create_orders_and_order_items_tables.sql`.
  - [x] **S5-E2:** Order & OrderItem Entities, Enums (`OrderStatus`, `PaymentStatus`), and Repositories.
  - [x] **S5-E3:** Payment Emulation Service (`PaymentService`, `PaymentServiceImpl`) with Luhn validator and decline card simulation.
  - [x] **S5-E4:** Atomic Checkout Service (`CheckoutService`, `CheckoutServiceImpl`) with pessimistic/optimistic inventory reservation and cart clearance.
  - [x] **S5-E5:** Checkout REST Endpoints (`POST /api/checkout`).
  - [x] **S5-E6:** Angular 24 Signal Forms Checkout & Payment Component with Masked Card Preview and Confirmation Receipt.
  - [x] **S5-E7:** Automated unit and integration verification (42 backend unit tests passing, frontend production build passing).

### 🧩 Slice 6: Customer Order History & Admin Order Fulfillment
- **Status:** `COMPLETED`
- **PAVE Loop State:** `[E]`
- **Tasks:**
  - [x] **S6-P1:** Draft Slice Specification (`aidlc-docs/slices/slice-6-orders.md`).
  - [x] **S6-A1:** Clarifications & Technical Design Choices in Slice Markdown (Q-S6.1 to Q-S6.3 approved).
  - [x] **S6-V1:** Slice 6 Human Approval Gate.
  - [x] **S6-E1:** Order History API for Customer (`GET /api/customer/orders`, `GET /api/customer/orders/{orderNumber}`, `POST /api/customer/orders/{orderNumber}/cancel`).
  - [x] **S6-E2:** Admin Order Management API (`GET /api/admin/orders`, `PATCH /api/admin/orders/{orderNumber}/status`).
  - [x] **S6-E3:** Order Status Transition Validation & Inventory Rollback on Cancellation (`CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`, or `CANCELLED`).
  - [x] **S6-E4:** Angular 24 Customer "My Orders" History View with Item Details & Status Timeline Stepper.
  - [x] **S6-E5:** Angular 24 Admin Order Management Dashboard with Signal Forms Filter (Status, Customer, Date Range) & Status Transition Controls.
  - [x] **S6-E6:** Automated backend and frontend unit tests & verification (65 backend unit tests passing, clean Angular build).

### 🧩 Slice 7: Accounting, Financial Reporting & Sales/Inventory Analytics
- **Status:** `ACTIVE IN-FLIGHT`
- **PAVE Loop State:** `[P] PLAN & [A] ASK`
- **Tasks:**
  - [ ] **S7-P1:** Draft Slice Specification (`aidlc-docs/slices/slice-7-accounting.md`).
  - [ ] **S7-A1:** Target questions & technical decisions in slice markdown file.
  - [ ] **S7-V1:** Slice 7 Human Approval Gate.
  - [ ] **S7-E1:** Flyway Migration: `accounting_ledger` table with transaction refs, debit/credit entry types, and timestamps.
  - [ ] **S7-E2:** Financial Ledger Entity, Repository, and Automated Posting Engine (recording payments and refunds).
  - [ ] **S7-E3:** Sales Analytics Aggregation API (`daily`, `weekly`, `monthly`).
  - [ ] **S7-E4:** Inventory Analytics Aggregation API (`daily`, `weekly`, `monthly`).
  - [ ] **S7-E5:** CSV Export REST Endpoints (`/api/admin/reports/sales/csv`, `/api/admin/reports/inventory/csv`).
  - [ ] **S7-E6:** Angular 24 Signal Forms Analytics Dashboard with Period Switches (`Day`, `Week`, `Month`) & CSV Download Actions.
  - [ ] **S7-E7:** Automated unit and integration tests.

---

## 5. Decision & Change Audit Log

| Timestamp | Scope | Event / Decision | Rationale | Status |
| :--- | :--- | :--- | :--- | :--- |
| `2026-10-05` | Global | Project Inception initiated | New customer registration, cart, checkout requirements | COMPLETED |
| `2026-10-05` | Global | Upgraded to Angular 24 | User requirement: latest stable version | APPROVED |
| `2026-10-05` | Frontend | Exclusive Signal Forms | User requirement: eliminate legacy Reactive Forms | APPROVED |
| `2026-10-05` | Domain | Added Search Feature (Slice 2) | User requirement: search by pet type and breed | APPROVED |
| `2026-10-05` | Domain | Item Tagging: Pet Single vs Supply Multiple | User answer Q1.1: pets single, supplies multiple quantity | APPROVED |
| `2026-10-05` | Auth | Email Verification / Activation required | User answer Q1.4: account activation link required | APPROVED |
| `2026-10-05` | Cart | Guest cart with login sync | User answer Q1.2: allow visitors to add items locally | APPROVED |
| `2026-10-05` | Checkout | Payment Emulation & Card Validation | User requirement: Luhn algorithm check, expiry, CVV | APPROVED |
| `2026-10-05` | Admin | Added Admin Physical Supplies (Slice 3) | User question: confirm admin support for supplies | APPROVED |
| `2026-10-05` | Accounting | Added Accounting & Reports (Slice 7) | User requirement: sales & inventory per day, week, month | APPROVED |
| `2026-10-05` | Cart | Slice 4 Shopping Cart Implemented | V7 migration, Cart entity, CartService, CartStore, CartDrawer | COMPLETED |
| `2026-10-05` | Checkout | Slice 5 Checkout & Payment Emulated | V8 migration, Order entity, Luhn check, PaymentEmulationService | COMPLETED |
| `2026-10-05` | Orders | Slice 6 Customer Orders & Admin Fulfillment | V9 migration, OrderFulfillmentService, Restock, Signal Views | COMPLETED |
