# AI-DLC State Orchestration Tracker (`aidlc-docs/state-orchestration-tracker.md`)

> **Global AI-DLC Lifecycle:** `ACTIVE`  
> **Global Project Inception Status:** `STEP 1 [E] EXECUTE COMPLETED (APPROVED)`  
> **Current Global Phase:** `STEP 2: SLICE-BY-SLICE EXECUTION (RECURSIVE PAVE LOOP)`  
> **Active Slice:** `Slice 1: Customer Identity & Registration`

---

## 1. Project Metadata & Configuration Baseline

- **Project Name:** Pet Store Enterprise E-Commerce Platform
- **Architecture Baseline:**
  - **Backend:** Java 21 LTS, Pure Spring Framework 7.0.x (Zero Spring Boot, Zero XML programmatic config), Servlet 6.0+, Spring Security 7.0.x, JJWT 0.12.x
  - **Persistence:** PostgreSQL 16+, Hibernate 7.4.x, HikariCP, Flyway 11.3.x migrations
  - **Frontend:** Angular 24 SPA (100% Signal-First + Exclusive Signal Forms, Zero legacy FormBuilder/ReactiveFormsModule)
- **Approved Inception Spec:** [`project-spec.md`](../project-spec.md)
- **Key Domain Decisions (Approved Q1.1 - Q1.6):**
  - **Q1.1 (Inventory Tagging):** Pets are tagged as `SINGLE` (`quantity = 1` strictly enforced); physical supplies tagged as `MULTIPLE` (`quantity >= 1`).
  - **Q1.2 (Guest Cart):** Anonymous visitors can add pets/supplies locally; cart merges into DB on login/registration.
  - **Q1.3 (Checkout/Payment):** Order placement with simulated payment / in-store pickup gateway.
  - **Q1.4 (Email Verification):** Customer registration requires email verification/activation token link.
  - **Q1.5 (Frontend):** Angular 24 + Signal Forms exclusively.
  - **Q1.6 (Search):** Type/category and breed dynamic search with debounced Signal Forms.

---

## 2. Global AI-DLC PAVE Loop Status

| AI-DLC Global Step | Description | Lifecycle Phase | Status | Artifacts / Output |
| :--- | :--- | :---: | :---: | :--- |
| **Step 1: Global Project Inception** | Project Spec & Blueprint Inception | `[P] -> [A] -> [V] -> [E]` | `COMPLETED` | [`project-spec.md`](../project-spec.md) |
| **Step 2: Recursive Slice Execution** | Vertical Feature Slices (1 to 5) | `PAVE Recursive` | `IN PROGRESS` | `aidlc-docs/slices/` |
| **Step 3: System Integration & E2E** | Multi-Slice Integration & Build Verification | `PAVE` | `PLANNED` | E2E test runs & verification logs |
| **Step 4: Release Readiness & Handover** | Deployment & Documentation Finalization | `PAVE` | `PLANNED` | Release package & deployment guide |

---

## 3. Slice Orchestration Matrix

| Slice ID | Slice Title | Assigned Focus | PAVE Stage | Slice Status | Dependencies |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **Slice 1** | **Customer Identity & Registration** | Auth, Email Verification, JWT, Angular 24 Signal Forms Reg | `[P] PLAN` | `READY FOR PLANNING` | Base `app_users` table |
| **Slice 2** | **Pet Search & Discovery (Type & Breed)** | Scoped Taxonomy, Faceted Search API, Signal Forms Filter | `[P] PLAN` | `QUEUED` | `pets`, `categories` |
| **Slice 3** | **Shopping Cart Management** | Cart DB Schema (`SINGLE` vs `MULTIPLE`), Cart API, Guest Sync, Signal Cart | `[P] PLAN` | `QUEUED` | Slice 1 (`app_users`), `pets` |
| **Slice 4** | **Checkout & Inventory Reservation** | Order DB Schema, Concurrency Lock, Atomic Checkout, Signal Forms Checkout | `[P] PLAN` | `QUEUED` | Slice 1, Slice 3 |
| **Slice 5** | **Order History & Admin Fulfillment** | Customer History API, Admin Order Dashboard, Signal Forms Filter | `[P] PLAN` | `QUEUED` | Slice 4 |

---

## 4. Granular Slice Tracking & Task Backlog

### 🧩 Slice 1: Customer Identity & Registration
- **Status:** `READY FOR [P] PLAN`
- **PAVE Loop State:** `[P]`
- **Tasks:**
  - [ ] **S1-P1:** Draft Slice Specification & Technical Contract (`aidlc-docs/slices/slice-1-registration.md`).
  - [ ] **S1-A1:** Clarification questions (if any) formatted in slice markdown file.
  - [ ] **S1-V1:** Slice Human Approval Gate.
  - [ ] **S1-E1:** Database Migration: `app_users` email verification & role updates.
  - [ ] **S1-E2:** Domain & DTOs (`UserRegistrationRequest`, `EmailVerificationResponse`, `CustomerProfileDTO`).
  - [ ] **S1-E3:** Service Layer: Registration service, verification token generation/validation, BCrypt hashing.
  - [ ] **S1-E4:** Web Controller & Security: Registration & Verification endpoints, Spring Security authorization.
  - [ ] **S1-E5:** Angular 24 Signal Forms Component: Registration form with Signal validation, pending verification modal.
  - [ ] **S1-E6:** Reactive Auth Store & Navigation: Signals for user session state.
  - [ ] **S1-E7:** Slice Verification & Automated Tests.

### 🧩 Slice 2: Pet Search & Discovery by Type and Breed
- **Status:** `QUEUED`
- **PAVE Loop State:** `NOT STARTED`
- **Tasks:**
  - [ ] **S2-P1:** Draft Slice Specification (`aidlc-docs/slices/slice-2-search.md`).
  - [ ] **S2-E1:** Flyway Indexing Migration on `(category_id, breed)`.
  - [ ] **S2-E2:** Scoped Breed Taxonomy Endpoint (`GET /api/pets/breeds?category={type}`).
  - [ ] **S2-E3:** Enhanced Search Specification with Case-Insensitive Matching.
  - [ ] **S2-E4:** Angular 24 Signal Forms Search Component with Debounced Signals.
  - [ ] **S2-E5:** Reactive Breed Dropdown Scoped to Category Signal.

### 🧩 Slice 3: Shopping Cart Management
- **Status:** `QUEUED`
- **PAVE Loop State:** `NOT STARTED`
- **Tasks:**
  - [ ] **S3-P1:** Draft Slice Specification (`aidlc-docs/slices/slice-3-cart.md`).
  - [ ] **S3-E1:** Flyway Migration: `carts`, `cart_items` with item tagging & check constraint.
  - [ ] **S3-E2:** Cart JPA Entities & Repositories (`Cart`, `CartItem`).
  - [ ] **S3-E3:** Cart Service: Add/update/remove with `SINGLE` pet vs `MULTIPLE` supply rules.
  - [ ] **S3-E4:** Cart REST API endpoints (`GET`, `POST`, `PUT`, `DELETE`).
  - [ ] **S3-E5:** Guest Cart Synchronization Endpoint (`POST /api/cart/sync`).
  - [ ] **S3-E6:** Angular 24 Signal-First Cart Service & Cart Drawer Component.

### 🧩 Slice 4: Checkout, Inventory Reservation & Order Processing
- **Status:** `QUEUED`
- **PAVE Loop State:** `NOT STARTED`
- **Tasks:**
  - [ ] **S4-P1:** Draft Slice Specification (`aidlc-docs/slices/slice-4-checkout.md`).
  - [ ] **S4-E1:** Flyway Migration: `orders`, `order_items` tables.
  - [ ] **S4-E2:** Order JPA Entities & Repositories (`Order`, `OrderItem`).
  - [ ] **S4-E3:** Atomic Checkout Service with Concurrency Locking & Pet State Transition (`AVAILABLE` -> `PENDING`).
  - [ ] **S4-E4:** Checkout REST API (`POST /api/checkout`).
  - [ ] **S4-E5:** Angular 24 Signal Forms Checkout Component & Order Receipt.

### 🧩 Slice 5: Customer Order History & Admin Order Fulfillment
- **Status:** `QUEUED`
- **PAVE Loop State:** `NOT STARTED`
- **Tasks:**
  - [ ] **S5-P1:** Draft Slice Specification (`aidlc-docs/slices/slice-5-orders.md`).
  - [ ] **S5-E1:** Order History API for Customer & Admin.
  - [ ] **S5-E2:** Order Status Transition API for Admin.
  - [ ] **S5-E3:** Angular 24 Customer "My Orders" View.
  - [ ] **S5-E4:** Angular 24 Admin Order Management Dashboard with Signal Forms Filter.

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
| `2026-10-05` | Checkout | Simulated Payment Gateway for MVP | User answer Q1.3: in-store pickup / demo payment | APPROVED |
