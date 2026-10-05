# Slice 3: Admin Catalog & Physical Supply Management (`aidlc-docs/slices/slice-3-supplies.md`)

> **AI-DLC Slice Lifecycle Phase:** `[P] PLAN & [A] ASK`  
> **Status:** `[V] VALIDATION GATE - PENDING HUMAN REVIEW`  
> **Slice Focus:** Physical Supply Inventory, SKU Tracking, Low-Stock Alerts, Multi-Quantity Tagging, Angular 24 Signal Forms

---

## 1. Slice Overview & Scope

Slice 3 extends the Pet Store enterprise platform beyond live animals to support physical merchandise and supplies (food, toys, grooming, healthcare, accessories). 

As established in the approved Project Inception Blueprint (`project-spec.md` Q1.1 & Q1.7):
- **Pets** are tagged as `SINGLE` unique entities (`quantity = 1`).
- **Physical Supplies** are tagged as `MULTIPLE` entities supporting bulk quantities (`quantity >= 1`), stock replenishment, inventory decrement upon purchase, and low-stock threshold notifications.

### Key Objectives:
1. **Database Schema & Flyway Migration `V6__create_supplies_table.sql`:**
   - Table `supplies` with columns: `id`, `sku` (unique), `name`, `category` (enum/string), `price`, `stock_quantity`, `low_stock_threshold`, `status` (`ACTIVE`, `OUT_OF_STOCK`, `DISCONTINUED`), `description`, `photo_url`, `item_type` (`MULTIPLE`), and timestamps.
   - B-Tree indexes on `sku`, `(category, status)`, and `stock_quantity`.
2. **Domain, Enums & DTOs:**
   - Domain Entity `Supply.java` with optimistic locking (`@Version`).
   - Enums `SupplyCategory` (e.g., `FOOD`, `TOYS`, `HEALTHCARE`, `ACCESSORIES`, `GROOMING`) and `SupplyStatus` (`ACTIVE`, `OUT_OF_STOCK`, `DISCONTINUED`).
   - DTOs: `SupplyCreateRequest`, `SupplyUpdateRequest`, `SupplyResponseDTO`, `SupplyStockAdjustmentRequest`.
3. **Service Layer:**
   - `SupplyService` interface and `SupplyServiceImpl` implementation.
   - Automated stock management: replenishing inventory, adjusting stock, marking `OUT_OF_STOCK` when quantity reaches zero, and triggering low-stock alerts.
   - Unit tests covering CRUD operations, SKU uniqueness validations, and stock thresholds.
4. **Web REST Endpoints & Security:**
   - Public: `GET /api/supplies` (filtered exploration, pagination, search), `GET /api/supplies/{id}`.
   - Admin Protected (`ROLE_ADMIN`): `POST /api/admin/supplies`, `PUT /api/admin/supplies/{id}`, `PATCH /api/admin/supplies/{id}/stock`, `DELETE /api/admin/supplies/{id}`.
   - Spring Security rules updated in `SecurityConfig.java`.
5. **Angular 24 Signal Forms Frontend Components:**
   - Standalone `AdminSupplyFormComponent` built **exclusively with Angular Signal Forms** (`model()`, signal validation, zero `ReactiveFormsModule`).
   - Standalone `AdminSupplyInventoryComponent` displaying physical supplies with stock badges (Green: In Stock, Yellow: Low Stock, Red: Out of Stock).
   - Stock replenishment modal with signal-based numeric adjustment.

---

## 2. Slice Clarifications & Targeted Questions (For User Review)

> ✍️ **Instructions for User:** Please review the questions below. You can edit this file directly to add your input under `**User Answer / Decision:**`.

* **Q-S3.1: SKU / Barcode Auto-Generation vs Manual Input:**  
  Should administrators manually input the SKU (e.g. `SUP-DOG-001`), or should the system auto-generate a unique SKU if left blank?  
  - *Architect Recommendation:* Allow optional manual input with format validation (alphanumeric and hyphens, uppercase), and auto-generate an alphanumeric SKU (e.g. `SKU-XXXXXX`) if left blank by the administrator.  
  - **User Answer / Decision:** `[Adopt recommendation / Specify changes]`

* **Q-S3.2: Default Low-Stock Threshold:**  
  What should be the default low-stock threshold alert level when creating new physical supplies?  
  - *Architect Recommendation:* Default threshold of 5 units. When `stock_quantity <= low_stock_threshold`, the item displays a "Low Stock" warning badge in the admin table and alerts the store manager.  
  - **User Answer / Decision:** `[Adopt recommendation (5 units) / Specify changes]`

---

## 3. Technical Contract & API Specifications

### 3.1. REST Endpoints Specification

#### `GET /api/supplies` (Public)
Query Parameters:
- `search` (optional string): Match name, SKU, or description.
- `category` (optional string): Supply category.
- `inStockOnly` (optional boolean, default false).
- `minPrice` / `maxPrice` (optional decimal).
- `page`, `size`, `sort`.

#### `POST /api/admin/supplies` (Protected - `ROLE_ADMIN`)
**Request Body:**
```json
{
  "sku": "FOOD-CANINE-001",
  "name": "Organic Grain-Free Salmon Dog Kibble 15kg",
  "category": "FOOD",
  "price": 64.99,
  "stockQuantity": 40,
  "lowStockThreshold": 5,
  "description": "High protein, omega-3 rich dry food for adult dogs.",
  "photoUrl": "/api/media/kibble.jpg"
}
```
**Response (201 Created):**
```json
{
  "id": 1,
  "sku": "FOOD-CANINE-001",
  "name": "Organic Grain-Free Salmon Dog Kibble 15kg",
  "category": "FOOD",
  "price": 64.99,
  "stockQuantity": 40,
  "lowStockThreshold": 5,
  "status": "ACTIVE",
  "isLowStock": false,
  "itemType": "MULTIPLE",
  "description": "High protein, omega-3 rich dry food for adult dogs.",
  "photoUrl": "/api/media/kibble.jpg",
  "createdAt": "2026-10-05T12:00:00Z"
}
```

#### `PATCH /api/admin/supplies/{id}/stock` (Protected - `ROLE_ADMIN`)
**Request Body:**
```json
{
  "adjustment": 20,
  "reason": "Restock shipment PO-9843"
}
```
**Response (200 OK):** Updated supply entity with new stock level and audit history.

---

### 3.2. Database Schema Plan (`V6__create_supplies_table.sql`)

```sql
CREATE TABLE supplies (
    id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price NUMERIC(9, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT NOT NULL DEFAULT 5,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    item_type VARCHAR(20) NOT NULL DEFAULT 'MULTIPLE',
    description TEXT,
    photo_url VARCHAR(255),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_supplies_sku UNIQUE (sku),
    CONSTRAINT chk_supplies_price CHECK (price >= 0.00),
    CONSTRAINT chk_supplies_stock CHECK (stock_quantity >= 0),
    CONSTRAINT chk_supplies_status CHECK (status IN ('ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED')),
    CONSTRAINT chk_supplies_item_type CHECK (item_type = 'MULTIPLE')
);

CREATE INDEX idx_supplies_sku ON supplies(sku);
CREATE INDEX idx_supplies_category_status ON supplies(category, status);
CREATE INDEX idx_supplies_stock ON supplies(stock_quantity);
```

---

### 3.3. Angular 24 Signal Forms Implementation Plan

- **Exclusive Signal Forms Pattern:**
  - Standalone `AdminSupplyFormComponent`:
    - `sku = signal('')`
    - `name = signal('')`
    - `category = signal<SupplyCategory>('FOOD')`
    - `price = signal<number>(19.99)`
    - `stockQuantity = signal<number>(10)`
    - `lowStockThreshold = signal<number>(5)`
    - `description = signal('')`
    - `photoUrl = signal<string | null>(null)`
    - Signal validators: `skuError`, `nameError`, `priceError`, `stockError`, `isFormValid`.
  - Zero `ReactiveFormsModule`, zero `FormGroup`, zero `FormControl`.

---

## 4. Multi-Developer Work Breakdown & Dependencies

- **Developer 1 (Database & Backend):**
  - Create Flyway migration `V6__create_supplies_table.sql`.
  - Implement `Supply` entity, `SupplyRepository`, `SupplyService`, and `SupplyController`.
  - Add backend tests in `SupplyServiceImplTest`.
- **Developer 2 (Frontend Signal Forms & Admin Inventory):**
  - Implement `AdminSupplyInventoryComponent` and `AdminSupplyFormComponent`.
  - Link admin navigation tabs between "Pets Inventory" and "Supplies Inventory".

---

## 5. Human Validation & Approval Gate

```
================================================================================
                         HUMAN APPROVAL GATE - SLICE 3 [V]
================================================================================
 Current State: SLICE 3 SPECIFICATION DRAFTED - AWAITING HUMAN REVIEW & APPROVAL
 Target Spec:   aidlc-docs/slices/slice-3-supplies.md
 Action Required:
   1. Review Slice 3 physical supply architecture, database schema, and Signal Forms.
   2. Edit your decisions into Q-S3.1 and Q-S3.2 above (or adopt recommendations).
   3. When ready, state "Approved" (or "Approved Slice 3") in chat to begin Slice 3 [E] Execution.
================================================================================
```
