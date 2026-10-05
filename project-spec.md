# Project Specification Blueprint (`project-spec.md`)

> **AI-DLC Lifecycle Phase:** `STEP 1: GLOBAL PROJECT INCEPTION (PAVE LOOP)`  
> **Status:** `[E] APPROVED BY USER & INITIALIZED`  
> **Role:** Lead AI-DLC Software Architect & Engineer  
> **Target Audience:** User / Stakeholders / Distributed Engineering Team

---

## 1. Project Name & Core Vision

### 1.1. Project Overview & Vision Statement
The **Pet Store Enterprise E-Commerce Platform** is a full-stack, enterprise-grade pet catalog, adoption, and merchandise management solution. 
The platform is expanding beyond an administrative catalog and visitor exploration portal to support a complete, production-grade B2C customer journey:
1. **Self-Service Customer Registration & Onboarding:** Prospective adopters and customers can register an account, authenticate, and manage their profile.
2. **Dynamic Pet Search & Exploration (Pet Type & Breed):** Customers and visitors can quickly search, filter, and discover available pets by pet type/category and breed using reactive Signal Forms.
3. **Active Shopping Cart Management:** Prospective adopters can add pets (and related products/services) to a reactive shopping cart with real-time stock/availability indicators.
4. **Streamlined Checkout & Order Lifecycle:** Customers can checkout with designated billing/shipping/contact details, triggering transactional inventory reservation to prevent double-booking or race conditions.
5. **Multi-Developer Sliced Architecture:** All capabilities are sliced vertically (Domain $\rightarrow$ Service/DB $\rightarrow$ API/Security $\rightarrow$ Signal-First UI) so independent developers can work concurrently without merge collision or architectural drift.

---

## 2. Inception Clarifications & Targeted Questions (For User Review)

> ✍️ **Instructions for User:** Please review the questions below. You can directly edit this markdown file to insert your answers, adjustments, or decisions under each `**User Answer / Decision:**` block. When you are finished editing, inform the AI architect in the chat.

### 2.1. Vision & Domain Questions
* **Q1.1: Single-Item Inventory vs. Multi-Quantity:**  
  Are pets treated as unique individual entities (Quantity = 1, e.g., unique microchip/ID, where adding to cart reserves or locks the individual pet upon checkout), or can pets/items have quantities $> 1$?  
  - *Architect Recommendation:* Pets are unique single entities (`quantity = 1`). A cart item for a pet references `pet_id` with quantity 1. If physical supplies (food, toys) are added later, quantity $> 1$ can be supported.  
  - **User Answer / Decision:** I want to add support for adding physical supplies, aside from pet. Please add a tag in the database for pets to be single, and for physical supplies to be multiple.

* **Q1.2: Guest Cart vs. Authenticated-Only Cart:**  
  Can anonymous visitors add pets to cart before logging in/registering, and merge their cart upon login, or must a user register/log in before adding items to the cart?  
  - *Architect Recommendation:* Allow guest cart stored client-side (Angular Signal state + localStorage), with seamless cart synchronization/merge to the PostgreSQL cart table upon customer login or registration.  
  - **User Answer / Decision:** as recommended, and allow anonymous visitors to add items and pets to cart.

* **Q1.3: Checkout & Payment Scope for MVP:**  
  What level of payment integration is required for this phase?  
  - *Architect Recommendation:* Provide a robust checkout workflow with Order placement, shipping/contact form, and simulated payment ("Demo Gateway / Pay on Adoption / In-Store Pickup") with order state transitions (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`), leaving external webhook integrations (e.g. Stripe) for a subsequent pluggable slice.  
  - **User Answer / Decision:** as recommended.

* **Q1.4: Customer Account Activation:**  
  Does customer registration require email verification/activation link, or should registration immediately log the user in and issue a JWT?  
  - *Architect Recommendation:* Immediate activation upon registration for MVP with instant JWT issuance, but include an `is_email_verified` boolean flag in PostgreSQL schema to support async email confirmation when mail services are wired.  
  - **User Answer / Decision:** yes, registration requires email verification/activation link. this is to bind users to their emails.

* **Q1.5: Frontend Version & Forms Architecture:**  
  Angular baseline version and form management architecture across all components:  
  - *User Decision:* **Upgraded to latest stable Angular v24.** All forms (Registration, Cart edits, Checkout/Billing, Admin Order Management) must **exclusively use Angular Signal Forms** (`model()`, signal-based field validation, signal state derivations), with zero legacy `ReactiveFormsModule`, `FormGroup`, `FormControl`, or `FormBuilder`.  
  - **Status:** **CONFIRMED & APPLIED TO BLUEPRINT.**

* **Q1.6: Pet Search & Filtering Dynamics:**  
  How should the search feature for pet type and breed behave across client and backend?  
  - *Architect Recommendation:* Multi-criteria search supporting pet type (category) selection, dynamic breed selection/autocomplete (scoped reactively when a category is chosen), and keyword search. Implemented with Angular 24 Signal Forms providing debounced updates without full page reloads.  
  - **User Answer / Decision:** as recommended

---

## 3. Target Tech Stack & Baseline Constraints

The application strictly aligns with the existing production-ready repository standards:

| Layer | Technology | Architectural Role & Version Constraints |
| :--- | :--- | :--- |
| **Language Baseline** | Java 21 LTS | Sealed records, pattern matching, Virtual Threads capability. |
| **Backend Framework** | Spring Framework 7.0.x | **Zero Spring Boot, Zero XML.** Programmatic Java config via `WebApplicationInitializer`. |
| **Web Container** | Servlet 6.0+ | Deployed to Apache Tomcat 10.1+ / 11.0+. |
| **Security & Auth** | Spring Security 7.0.x & JJWT 0.12.x | Database-backed credentials, BCrypt password hashing, stateless Bearer token validation. |
| **Persistence & DB** | PostgreSQL 16+ & Hibernate 7.4.x | Spring Data JPA repositories, HikariCP connection pooling. |
| **Database Migrations** | Flyway 11.3.x | Immutable, forward-only SQL migration scripts in `pet-store-web/src/main/resources/db/migration/`. |
| **Frontend Platform** | Angular 24 SPA | **100% Signal-First Reactive Architecture with Exclusive Signal Forms** (Angular v24 latest stable, Signal Forms API, `signal()`, `computed()`, `input()`, `output()`, `model()`, standalone components). Zero legacy decorators (`@Input`, `@Output`, `EventEmitter`) and zero legacy form modules (`FormGroup`, `FormControl`, `FormBuilder`, `ReactiveFormsModule`). |
| **Reverse Proxy / Host** | Apache HTTP Server (httpd 2.4+) | Static asset serving + mod_proxy forwarding `/api/*` to Tomcat on `:8080`. |

---

## 4. User Roles & Global Constraints

### 4.1. Security & User Roles Matrix

| Role | Principal Role Key | Access Rights & Scope |
| :--- | :--- | :--- |
| **Anonymous Visitor** | `ROLE_VISITOR` (Unauthenticated) | Browse pet catalog, search, filter, view public details, manage local guest cart. |
| **Registered Customer** | `ROLE_CUSTOMER` | Self-registration, login, profile management, persistent shopping cart, checkout, view order history. |
| **Store Administrator** | `ROLE_ADMIN` | All customer rights + full Pet inventory CRUD, image upload/replacement, order fulfillment status management, user administration. |

### 4.2. Global Non-Functional Constraints
1. **Concurrency & Race Condition Prevention:**
   - Pets are unique. When two customers attempt to check out the same pet concurrently, database-level optimistic locking (`@Version`) or explicit row-level locking (`SELECT ... FOR UPDATE`) must prevent double-selling.
   - Status transition state machine: `AVAILABLE` $\rightarrow$ `PENDING` (during order placement) $\rightarrow$ `ADOPTED` (upon order completion).
2. **Performance SLA:**
   - p95 REST API response latency $< 150\text{ms}$ for catalog and cart operations.
   - p95 Checkout transaction processing $< 350\text{ms}$.
3. **Stateless Scalability:**
   - Spring backend remains fully stateless. All user session state is encapsulated in JWT claims or stored in PostgreSQL.
4. **Clean Multi-Developer Slicing:**
   - Features are developed across 5 self-contained slices. Each slice has well-defined interfaces and contracts so developers can work independently.

---

## 5. Functionality Map & Slice Decomposition (MVP Scope)

Below is the unchecked functionality map for the MVP. Every item will be tracked through its own recursive PAVE cycle during execution:

### 🧩 Slice 1: Customer Identity & Registration
- [ ] **FR-AUTH-01:** Customer Registration API (`POST /api/auth/register`) with validation (username, email, password strength, full name). Generates pending inactive user account with cryptographically secure activation token.
- [ ] **FR-AUTH-02:** Password encryption using BCrypt (work factor 12) with duplicate email/username conflict detection.
- [ ] **FR-AUTH-03:** Email Verification & Account Activation API (`GET /api/auth/verify?token=...`) that verifies token validity, marks email as verified, enables account (`ROLE_CUSTOMER`), and issues JWT authentication token.
- [ ] **FR-AUTH-04:** Customer Profile API (`GET /api/customer/profile`, `PUT /api/customer/profile`) for updating personal/contact info.
- [ ] **FR-AUTH-05:** Angular 24 Signal Forms Registration UI (Standalone component, exclusively using Angular Signal Forms with signal inputs, inline error handling, zero legacy Reactive Forms, email verification pending screen).
- [ ] **FR-AUTH-06:** Navigation & Session State Integration (Reactive auth service with Signals: `currentUser`, `isAuthenticated`, `isCustomer`, `isAdmin`).

### 🧩 Slice 2: Pet Search & Discovery by Type and Breed
- [ ] **FR-SRCH-01:** Pet Search API Enhancement (`GET /api/pets?search={term}&category={type}&breed={breed}`) with multi-criteria dynamic filtering and case-insensitivity.
- [ ] **FR-SRCH-02:** Scoped Breed Taxonomy Endpoint (`GET /api/pets/breeds?category={type}`) returning distinct breeds available for a given pet type/category.
- [ ] **FR-SRCH-03:** PostgreSQL Indexing Strategy on `(category_id, breed)` and text search vectors for sub-50ms search response times.
- [ ] **FR-SRCH-04:** Angular 24 Signal Forms Search Component (Exclusively using Angular Signal Forms for search query, pet type selector, and breed selector).
- [ ] **FR-SRCH-05:** Reactive Scoped Breed Filter (Computed Signal that dynamically updates available breed options when the user changes pet type/category).
- [ ] **FR-SRCH-06:** Debounced Real-Time Search & URL State Sync (Signal-based debouncing preventing excessive API hits, bidirectional sync with browser query params).

### 🧩 Slice 3: Shopping Cart Management
- [ ] **FR-CART-01:** Database Cart Domain Model (`carts`, `cart_items` tables with item tagging: pets tagged as `SINGLE` quantity strictly capped at 1, physical supplies tagged as `MULTIPLE` quantity $\ge 1$).
- [ ] **FR-CART-02:** Cart REST API endpoints:
  - `GET /api/cart`: Retrieve current active cart with pet & supply details and calculated subtotal.
  - `POST /api/cart/items`: Add pet/supply to cart with validation (pets must be `AVAILABLE` and quantity = 1; supplies allow quantity increment).
  - `PUT /api/cart/items/{itemId}`: Update item quantity (allowed for supplies; forbidden for single-entity pets).
  - `DELETE /api/cart/items/{itemId}`: Remove item from cart.
  - `DELETE /api/cart`: Clear entire cart.
- [ ] **FR-CART-03:** Guest Cart Synchronization: API endpoint (`POST /api/cart/sync`) allowing anonymous visitors to add pets and supplies locally, merging cleanly into authenticated DB cart upon login or registration.
- [ ] **FR-CART-04:** Angular 24 Signal-First Cart Service (`cartItems = signal<CartItem[]>([])`, `cartCount = computed(...)`, `cartTotal = computed(...)`).
- [ ] **FR-CART-05:** Angular 24 Cart Drawer / Page UI (Real-time reactive item list, quantity modifier for supplies, remove action, dynamic total, "Proceed to Checkout" button).
- [ ] **FR-CART-06:** "Add to Cart" integration on Pet Detail & Catalog cards with dynamic availability badges.

### 🧩 Slice 4: Checkout, Inventory Reservation & Order Processing
- [ ] **FR-CHK-01:** Order & Order Item Domain Models (`orders`, `order_items` tables with item type tagging, quantity, billing/shipping address, total amount, status).
- [ ] **FR-CHK-02:** Atomic Checkout REST API (`POST /api/checkout`):
  - Validates cart contents and active pet statuses.
  - Applies transactional pessimistic/optimistic lock on selected pets.
  - Transitions pet status from `AVAILABLE` to `PENDING` (or `ADOPTED`).
  - Creates Order record with unique order number (e.g., `ORD-2026-XXXX`).
  - Clears user cart atomically.
- [ ] **FR-CHK-03:** Concurrency validation handling: If a pet was adopted/reserved by another customer during checkout, return HTTP 409 Conflict with informative error.
- [ ] **FR-CHK-04:** Simulated Payment / Fulfillment Confirmation integration ("Demo Gateway / Pay on Adoption / In-Store Pickup").
- [ ] **FR-CHK-05:** Angular 24 Signal Forms Checkout Component (Multi-step or clean single-page checkout, exclusively using Signal Forms for shipping/contact/billing, order review, place order button with loading state).
- [ ] **FR-CHK-06:** Order Confirmation Receipt Page (Order summary, reservation details, next steps for adoption/pickup).

### 🧩 Slice 5: Customer Order History & Admin Order Fulfillment
- [ ] **FR-ORD-01:** Customer Order History API (`GET /api/customer/orders`, `GET /api/customer/orders/{id}`).
- [ ] **FR-ORD-02:** Angular 24 Customer "My Orders / My Adoptions" view.
- [ ] **FR-ORD-03:** Admin Order Management API (`GET /api/admin/orders`, `PATCH /api/admin/orders/{id}/status`).
- [ ] **FR-ORD-04:** Admin Order Dashboard UI in Angular 24 (Filter orders by status: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` using Signal Forms / reactive filter signals).

---

## 6. Target Database Schema Additions (Draft)

The existing schema (`app_users`, `pets`, `categories`) will be extended via Flyway migration:

```sql
-- 1. Extend app_users to support ROLE_CUSTOMER and Email Activation
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMP WITH TIME ZONE;

-- 2. Add inventory item tag to pets (SINGLE) and support physical supplies
ALTER TABLE pets ADD COLUMN IF NOT EXISTS item_type VARCHAR(20) NOT NULL DEFAULT 'PET';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_single_quantity BOOLEAN NOT NULL DEFAULT TRUE;

-- 3. Shopping Cart Tables
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    pet_id BIGINT REFERENCES pets(id) ON DELETE CASCADE,
    item_type VARCHAR(20) NOT NULL DEFAULT 'PET',
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_add NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_cart_pet UNIQUE (cart_id, pet_id),
    CONSTRAINT chk_cart_item_qty CHECK (
        (item_type = 'PET' AND quantity = 1) OR (item_type <> 'PET' AND quantity >= 1)
    )
);

-- 4. Order Tables
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(32) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL REFERENCES app_users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_amount NUMERIC(10, 2) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    shipping_address TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    pet_id BIGINT REFERENCES pets(id),
    item_type VARCHAR(20) NOT NULL DEFAULT 'PET',
    quantity INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(10, 2) NOT NULL
);
```

---

## 7. Human Validation & Approval Gate

```
================================================================================
                         HUMAN APPROVAL GATE - STEP 1 [V]
================================================================================
 Current State: APPROVED BY USER (Q1.1 - Q1.6 RESOLVED)
 Execution:     Step 1 [E] EXECUTE Active - State Orchestration Initialized
================================================================================
```
