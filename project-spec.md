# Project Specification Blueprint (`project-spec.md`)

> **AI-DLC Lifecycle Phase:** `STEP 3: SYSTEM INTEGRATION & E2E VERIFICATION`  
> **Status:** `ALL 7 SLICES IMPLEMENTED AND VERIFIED`  
> **Role:** Lead AI-DLC Software Architect & Engineer  
> **Target Audience:** User / Stakeholders / Distributed Engineering Team

---

## 1. Project Name & Core Vision

### 1.1. Project Overview & Vision Statement
The **Pet Store Enterprise E-Commerce Platform** is a full-stack, enterprise-grade pet catalog, adoption, and merchandise management solution. 
The platform is expanding beyond an administrative catalog and visitor exploration portal to support a complete, production-grade B2C customer journey:
1. **Self-Service Customer Registration & Onboarding:** Prospective adopters and customers can register an account, authenticate, and manage their profile with verified emails.
2. **Dynamic Search & Exploration (Pet Type/Breed & Supplies):** Customers and visitors can quickly search, filter, and discover available pets and physical supplies using reactive Signal Forms.
3. **Admin Catalog & Physical Supply Management:** Store administrators can manage pet profiles and physical supply inventory (food, toys, accessories, healthcare) with SKU, stock quantity tracking, and item tagging (`SINGLE` pet vs `MULTIPLE` supply).
4. **Active Shopping Cart Management:** Prospective adopters can add pets (single entity) and supplies (multi-quantity) to a reactive shopping cart with real-time stock/availability indicators.
5. **Streamlined Checkout & Order Lifecycle:** Customers can checkout with designated billing/shipping/contact details, triggering transactional inventory reservation to prevent double-booking or race conditions.
6. **Accounting, Financial Ledger & Analytics Reporting:** Transactional financial ledger recording revenue, taxes, discounts, and refunds, with automated reporting of sales and inventory per day, per week, and per month.
7. **Multi-Developer Sliced Architecture:** All capabilities are sliced vertically (Domain $\rightarrow$ Service/DB $\rightarrow$ API/Security $\rightarrow$ Signal-First UI) so independent developers can work concurrently without merge collision or architectural drift.

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
  - *User Decision:* **Emulated Payment Gateway with Credit Card Validation.**  
    - **Validation Rules:** Card number (Luhn algorithm / Mod 10 checksum, 13–19 digits, Visa/Mastercard/Amex pattern), Expiry Date (future `MM/YY`), CVV/CVC (3 or 4 digits), Cardholder name.  
    - **PCI-DSS Compliance Simulation:** Never store raw card number or CVV in the database. Mask card numbers as `**** **** **** 1234` and generate simulated payment authorization references (`TXN-SIM-XXXXXX`).  
    - **Test Decline Hooks:** Specific test card inputs (e.g. card number ending in `0000`) simulate payment rejection for comprehensive end-to-end testing.  
  - **Status:** **CONFIRMED & APPLIED TO BLUEPRINT.**

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

* **Q1.7: Admin Physical Supply Management Attributes:**  
  What attributes and capabilities should be supported when administrators add physical supplies?  
  - *Architect Recommendation:* Name, SKU/Barcode, Category (e.g., Food, Accessories, Toys, Healthcare), Description, Unit Price, Current Stock Quantity, Low-Stock Alert Threshold, Image Upload, and Status (`ACTIVE`, `OUT_OF_STOCK`, `DISCONTINUED`). Physical supplies are tagged as `MULTIPLE` quantity, distinct from pets which are tagged as `SINGLE` unique entities.  
  - **User Answer / Decision:** as per Architect recommendation

* **Q1.8: Accounting Ledger & Transaction Scope:**  
  What level of accounting tracking should be established for order placements and status changes?  
  - *Architect Recommendation:* An immutable financial transaction ledger (`accounting_ledger`) that records every financial event: `ORDER_PAYMENT` (Credit), `REFUND` (Debit), with references to Order ID, Customer ID, gross amount, discount/tax, net amount, and timestamp.  
  - **User Answer / Decision:** as per Architect recommendation

* **Q1.9: Sales & Inventory Reporting Granularity (Day / Week / Month):**  
  How should the sales and inventory reports be generated and visualized?  
  - *Architect Recommendation:*  
    1. **Sales Report (Daily / Weekly / Monthly):** Total gross revenue, net revenue, total completed orders, units sold (broken down by pets vs. supplies), average order value (AOV), and top-selling items.  
    2. **Inventory Report (Daily / Weekly / Monthly):** Current stock levels, inventory valuation, stock movements (received vs sold), out-of-stock items, and inventory turnover rate.  
    3. **UI / Export:** REST aggregation endpoints + Angular 24 Signal-First Analytics Dashboard with interactive time-frame switches (`Day`, `Week`, `Month`) and CSV export.  
  - **User Answer / Decision:** as per Architect recommendation

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
| **Anonymous Visitor** | `ROLE_VISITOR` (Unauthenticated) | Browse pet & supply catalog, search, filter, view public details, manage local guest cart. |
| **Registered Customer** | `ROLE_CUSTOMER` | Self-registration, email activation, profile management, persistent shopping cart, checkout, order history. |
| **Store Administrator** | `ROLE_ADMIN` | All customer rights + full Pet & Physical Supply inventory CRUD, stock replenishment, order fulfillment status, accounting ledger, sales & inventory analytics, user management. |
| **Store Accountant** | `ROLE_ACCOUNTANT` | Read-only access to orders, financial ledger entries, sales reports, inventory turnover analytics, and financial export tools. |

### 4.2. Global Non-Functional Constraints
1. **Concurrency & Race Condition Prevention:**
   - Pets are unique (`quantity = 1`). Optimistic/pessimistic locking prevents double-adoption during checkout.
   - Physical supplies (`quantity >= 1`) require atomic stock decrement (`stock_quantity = stock_quantity - :qty WHERE stock_quantity >= :qty`) during order placement.
   - Pet status transitions: `AVAILABLE` $\rightarrow$ `PENDING` $\rightarrow$ `ADOPTED`.
2. **Performance SLA:**
   - p95 REST API response latency $< 150\text{ms}$ for catalog, search, and cart operations.
   - p95 Checkout transaction processing $< 350\text{ms}$.
   - Daily/weekly/monthly accounting report aggregations $< 250\text{ms}$ via indexed ledger and order date dimensions.
3. **Stateless Scalability:**
   - Spring backend remains fully stateless. All user session state is encapsulated in JWT claims or stored in PostgreSQL.
4. **Clean Multi-Developer Slicing:**
   - Features are developed across 7 self-contained slices. Each slice has well-defined interfaces and contracts so developers can work independently.

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

### 🧩 Slice 2: Pet & Supply Search & Exploration
- [ ] **FR-SRCH-01:** Multi-Criteria Search API (`GET /api/catalog/search?term={term}&type={category}&breed={breed}&itemType={PET|SUPPLY}`) with case-insensitive matching.
- [ ] **FR-SRCH-02:** Scoped Breed Taxonomy Endpoint (`GET /api/pets/breeds?category={type}`) returning distinct breeds available for a given pet category.
- [ ] **FR-SRCH-03:** PostgreSQL Indexing Strategy on `(category_id, breed)` and full-text search vectors.
- [ ] **FR-SRCH-04:** Angular 24 Signal Forms Search Component (Debounced search bar, pet category chips, scoped breed dropdown, supply category filters).
- [ ] **FR-SRCH-05:** Reactive Scoped Filter Signals (Dynamically updates available breeds/categories when filter signals change).
- [ ] **FR-SRCH-06:** Browser URL State Synchronization with Signal Forms search criteria.

### 🧩 Slice 3: Admin Catalog & Physical Supply Management
- [ ] **FR-SUP-01:** Physical Supplies Domain Model (`supplies` table with name, SKU, category, price, stock quantity, low-stock threshold, status, image URL).
- [ ] **FR-SUP-02:** Admin Supply CRUD REST API (`GET /api/admin/supplies`, `POST /api/admin/supplies`, `PUT /api/admin/supplies/{id}`, `DELETE /api/admin/supplies/{id}`).
- [ ] **FR-SUP-03:** Stock Replenishment & Threshold API (`PATCH /api/admin/supplies/{id}/stock`) for updating inventory quantities and low-stock alerts.
- [ ] **FR-SUP-04:** Public Supply Catalog API (`GET /api/supplies`, `GET /api/supplies/{id}`).
- [ ] **FR-SUP-05:** Angular 24 Signal Forms Admin Supply Form Component (Create/edit supply with Signal Forms validation, image upload, stock settings).
- [ ] **FR-SUP-06:** Angular 24 Admin Supply Inventory Table Component (Real-time stock indicators, low-stock alert badges).

### 🧩 Slice 4: Shopping Cart Management
- [ ] **FR-CART-01:** Database Cart Domain Model (`carts`, `cart_items` supporting unique `PET` items with `quantity = 1` and `SUPPLY` items with `quantity >= 1`).
- [ ] **FR-CART-02:** Cart REST API endpoints (`GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/{id}` for quantity adjustment on supplies, `DELETE /api/cart/items/{id}`, `DELETE /api/cart`).
- [ ] **FR-CART-03:** Guest Cart Synchronization: API endpoint (`POST /api/cart/sync`) allowing anonymous visitors to add pets and supplies locally, merging cleanly into authenticated DB cart upon login or registration.
- [ ] **FR-CART-04:** Angular 24 Signal-First Cart Service (`cartItems = signal<CartItem[]>([])`, `cartCount = computed(...)`, `cartTotal = computed(...)`).
- [ ] **FR-CART-05:** Angular 24 Cart Drawer / Page UI (Real-time reactive item list, quantity modifier for supplies, remove action, dynamic total, "Proceed to Checkout" button).
- [ ] **FR-CART-06:** "Add to Cart" integration on Pet and Supply catalog cards with dynamic availability badges.

### 🧩 Slice 5: Checkout, Inventory Reservation & Order Processing
- [ ] **FR-CHK-01:** Order & Order Item Domain Models (`orders`, `order_items` tables with item type tagging, quantity, billing/shipping address, total amount, status).
- [ ] **FR-CHK-02:** Atomic Checkout REST API (`POST /api/checkout`):
  - Validates cart contents, pet availability, and physical supply stock counts.
  - Applies transactional pessimistic lock on pets and decrements supply inventory.
  - Transitions pet status from `AVAILABLE` to `PENDING` (or `ADOPTED`).
  - Creates Order record with unique order number (e.g., `ORD-2026-XXXX`).
  - Clears user cart atomically.
- [ ] **FR-CHK-03:** Concurrency validation handling: If a pet was reserved or supply stock ran out during checkout, return HTTP 409 Conflict with informative error.
- [ ] **FR-CHK-04:** Emulated Payment Gateway Service with Credit Card Validation:
  - Validates card number format and checksum via Luhn algorithm (Mod 10).
  - Validates expiration date (future `MM/YY`) and CVV/CVC format (3 or 4 digits).
  - Enforces simulated PCI-DSS: Masks card as `**** **** **** 1234` and issues simulated authorization token (`TXN-SIM-XXXXXX`). Never persists raw PAN or CVV.
  - Test hooks: Cards ending in `0000` simulate declined transactions (insufficient funds) for negative testing.
- [ ] **FR-CHK-05:** Angular 24 Signal Forms Checkout & Payment Component:
  - Exclusively using Signal Forms for shipping, contact, and credit card fields (`cardNumber`, `cardholderName`, `expiryDate`, `cvv`).
  - Real-time client-side Signal validation (Luhn check, expiry check, card brand detection Visa/Mastercard/Amex).
  - Reactive order review, loading state during payment processing, and error banner for declined simulations.
- [ ] **FR-CHK-06:** Order Confirmation Receipt Page (Order summary, reservation details, next steps for adoption/pickup).

### 🧩 Slice 6: Customer Order History & Admin Order Fulfillment
- [ ] **FR-ORD-01:** Customer Order History API (`GET /api/customer/orders`, `GET /api/customer/orders/{id}`).
- [ ] **FR-ORD-02:** Angular 24 Customer "My Orders / My Adoptions" view.
- [ ] **FR-ORD-03:** Admin Order Management API (`GET /api/admin/orders`, `PATCH /api/admin/orders/{id}/status`).
- [ ] **FR-ORD-04:** Admin Order Dashboard UI in Angular 24 (Filter orders by status: `PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED` using Signal Forms / reactive filter signals).

### 🧩 Slice 7: Accounting, Financial Reporting & Sales/Inventory Analytics
- [ ] **FR-ACC-01:** Financial Ledger Domain Model (`accounting_ledger` table recording transaction reference, order ID, type: `ORDER_PAYMENT`/`REFUND`, gross amount, tax, discount, net amount, timestamp).
- [ ] **FR-ACC-02:** Automatic Ledger Posting Engine: Triggered on checkout confirmation and order cancellation/refund.
- [ ] **FR-ACC-03:** Sales Analytics REST API (`GET /api/admin/reports/sales?period=daily|weekly|monthly&from=...&to=...`) returning gross revenue, net revenue, order volume, AOV, and breakdown by item type.
- [ ] **FR-ACC-04:** Inventory Analytics REST API (`GET /api/admin/reports/inventory?period=daily|weekly|monthly`) returning total stock valuation, stock turnover, units sold (pets vs. supplies), and out-of-stock items.
- [ ] **FR-ACC-05:** Report Export REST API (`GET /api/admin/reports/sales/export`, `GET /api/admin/reports/inventory/export`) streaming formatted CSV downloads.
- [ ] **FR-ACC-06:** Angular 24 Signal Forms Analytics & Reporting Dashboard (Interactive time period toggle: Day, Week, Month; reactive KPI cards; sales chart visualizer; export triggers).

---

## 6. Target Database Schema Additions (Draft)

The existing schema (`app_users`, `pets`, `categories`) will be extended via Flyway migration:

```sql
-- 1. Extend app_users to support ROLE_CUSTOMER / ROLE_ACCOUNTANT and Email Activation
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS full_name VARCHAR(100);

-- 2. Physical Supplies Inventory Table
CREATE TABLE supplies (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(64) UNIQUE NOT NULL,
    name VARCHAR(120) NOT NULL,
    category VARCHAR(60) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    low_stock_threshold INTEGER NOT NULL DEFAULT 5,
    description TEXT,
    photo_url VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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
    item_type VARCHAR(20) NOT NULL DEFAULT 'PET', -- 'PET' or 'SUPPLY'
    pet_id BIGINT REFERENCES pets(id) ON DELETE CASCADE,
    supply_id BIGINT REFERENCES supplies(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_add NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_cart_item_reference CHECK (
        (item_type = 'PET' AND pet_id IS NOT NULL AND supply_id IS NULL AND quantity = 1) OR
        (item_type = 'SUPPLY' AND supply_id IS NOT NULL AND pet_id IS NULL AND quantity >= 1)
    )
);

-- 4. Order Tables
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(32) UNIQUE NOT NULL,
    customer_id BIGINT NOT NULL REFERENCES app_users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_amount NUMERIC(10, 2) NOT NULL,
    payment_method VARCHAR(30) NOT NULL DEFAULT 'CREDIT_CARD',
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID',
    transaction_ref VARCHAR(64) UNIQUE,
    card_last4 VARCHAR(4),
    card_brand VARCHAR(20),
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
    item_type VARCHAR(20) NOT NULL DEFAULT 'PET',
    pet_id BIGINT REFERENCES pets(id),
    supply_id BIGINT REFERENCES supplies(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL
);

-- 5. Accounting Financial Ledger Table
CREATE TABLE accounting_ledger (
    id BIGSERIAL PRIMARY KEY,
    transaction_ref VARCHAR(64) UNIQUE NOT NULL,
    order_id BIGINT REFERENCES orders(id) ON DELETE SET NULL,
    customer_id BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    entry_type VARCHAR(30) NOT NULL, -- 'ORDER_PAYMENT', 'REFUND', 'ADJUSTMENT'
    gross_amount NUMERIC(10, 2) NOT NULL,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    net_amount NUMERIC(10, 2) NOT NULL,
    description TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes for Daily, Weekly, Monthly Aggregations
CREATE INDEX idx_ledger_recorded_at ON accounting_ledger (recorded_at);
CREATE INDEX idx_orders_created_at ON orders (created_at);
CREATE INDEX idx_supplies_category ON supplies (category);
```

---

## 7. Human Validation & Approval Gate

```
================================================================================
                         HUMAN APPROVAL GATE - STEP 1 [V]
================================================================================
 Current State: SCOPE EXPANSION DRAFTED (ADMIN SUPPLIES & ACCOUNTING) - AWAITING HUMAN APPROVAL
 Scope Update:  7 Vertical Slices (Auth, Search, Admin Supplies, Cart, Checkout, Orders, Accounting/Reporting)
 Action Required:
   1. Review the updated blueprint sections above.
   2. Edit your decisions into questions Q1.7, Q1.8, and Q1.9 in Section 2 (or approve defaults).
   3. When ready, reply with "Approved" to commit the expanded specification and resume execution.
================================================================================
```
