# Slice 7: Accounting, Financial Reporting & Sales/Inventory Analytics (`aidlc-docs/slices/slice-7-accounting.md`)

> **AI-DLC Slice Lifecycle Phase:** `[P] PLAN & [A] ASK`  
> **Status:** `AWAITING USER REVIEW & APPROVAL`  
> **Slice Focus:** Transactional Financial Ledger (`accounting_ledger`), Automated Double-Entry Posting, Sales & Inventory Aggregation Engine (Day/Week/Month), CSV Export API, Angular 24 Signal-First Analytics Dashboard

---

## 1. Slice Overview & Scope

Slice 7 completes the operational requirements established in the approved Project Inception (`project-spec.md` Q1.8 & Q1.9):
1. **Transactional Financial Accounting Ledger (`accounting_ledger`):**
   - Immutable audit trail recording financial events with transaction type (`PAYMENT`, `REFUND`), order references, card brand, masked PAN (`card_last_four`), external transaction reference, and timestamps.
   - Automated posting engine hooked into checkout authorizations (`PAYMENT`) and order cancellations (`REFUND`).
   - Historical backfill migration to ensure ledger consistency with previously placed test orders.
2. **Sales & Revenue Analytics Engine:**
   - Multi-period sales aggregations: `DAY` (last 30 days), `WEEK` (last 12 weeks), and `MONTH` (last 12 months).
   - Core financial KPIs: Gross Revenue, Net Revenue, Total Orders, Average Order Value (AOV), Total Refund Amount, Pets Adopted count, Supplies Units Sold count.
3. **Inventory Valuation & Movement Analytics:**
   - Real-time catalog snapshot: total pet count by species/category and status (`AVAILABLE` vs `ADOPTED`), total supply stock valuation (cost/price $\times$ stock), low-stock alert inventory items ($\le$ threshold), and out-of-stock items.
4. **CSV Export Capabilities:**
   - Streaming REST endpoints returning RFC 4180 compliant CSV files:
     - `GET /api/admin/reports/sales/csv?period={DAY|WEEK|MONTH}`
     - `GET /api/admin/reports/inventory/csv`
5. **Angular 24 Exclusive Signal Forms Analytics Dashboard (`/admin/reports`):**
   - 100% Signal-First state and Signal Forms (`model()`). Zero legacy Reactive Forms.
   - Interactive KPI metric cards with period toggles (`Day`, `Week`, `Month`).
   - Revenue and inventory breakdown tables with export buttons.

---

## 2. Slice Clarifications & Targeted Questions (For User Review)

> ✍️ **Instructions for User:** Please review the questions below. You can edit this file directly to add your input under `**User Answer / Decision:**` or respond in chat with your confirmation.

* **Q-S7.1: Financial Ledger Entry Representation for Refunds:**  
  How should payment vs refund amounts be recorded in the `accounting_ledger`?  
  - *Architect Recommendation:* Store amounts as positive numbers with an explicit `transaction_type` enum (`PAYMENT`, `REFUND`). Gross revenue is computed as $\sum \text{PAYMENT}$, net revenue is computed as $\sum \text{PAYMENT} - \sum \text{REFUND}$.  
  - **User Answer / Decision:** 

* **Q-S7.2: Sales Reporting Period Windows:**  
  What default time windows should be aggregated when viewing by Day, Week, and Month?  
  - *Architect Recommendation:*
    - **Day:** Past 30 calendar days (day-by-day).
    - **Week:** Past 12 calendar weeks (week-by-week).
    - **Month:** Past 12 calendar months (month-by-month).  
  - **User Answer / Decision:** 

* **Q-S7.3: Database Migration Backfill Policy:**  
  Should the Flyway migration automatically backfill `accounting_ledger` entries for previously placed orders in the database?  
  - *Architect Recommendation:* Yes. Include a backfill `INSERT INTO accounting_ledger ... SELECT ... FROM orders` statement inside `V10__create_accounting_ledger_and_reporting.sql` so that existing orders immediately reflect in the financial ledger and reports without data discrepancies.  
  - **User Answer / Decision:** 

---

## 3. Technical Contract & Architecture Specifications

### 3.1. Database Migration Plan (`V10__create_accounting_ledger_and_reporting.sql`)

```sql
-- 1. Accounting Ledger Table
CREATE TABLE accounting_ledger (
    id BIGSERIAL PRIMARY KEY,
    transaction_type VARCHAR(20) NOT NULL,
    order_id BIGINT,
    order_number VARCHAR(32) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CREDIT_CARD',
    card_brand VARCHAR(20),
    card_last_four VARCHAR(4),
    external_reference VARCHAR(64) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_accounting_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    CONSTRAINT chk_ledger_type CHECK (transaction_type IN ('PAYMENT', 'REFUND')),
    CONSTRAINT chk_ledger_amount CHECK (amount >= 0)
);

CREATE INDEX idx_ledger_type ON accounting_ledger(transaction_type);
CREATE INDEX idx_ledger_order_number ON accounting_ledger(order_number);
CREATE INDEX idx_ledger_created_at ON accounting_ledger(created_at);

-- 2. Backfill existing orders into accounting ledger
INSERT INTO accounting_ledger (
    transaction_type, order_id, order_number, amount, payment_method, 
    card_brand, card_last_four, external_reference, description, created_at
)
SELECT 
    'PAYMENT', id, order_number, total_amount, payment_method, 
    card_brand, card_last_four, transaction_id, 'Initial order checkout payment', created_at
FROM orders;

-- Backfill refunds for already cancelled orders
INSERT INTO accounting_ledger (
    transaction_type, order_id, order_number, amount, payment_method, 
    card_brand, card_last_four, external_reference, description, created_at
)
SELECT 
    'REFUND', id, order_number, total_amount, payment_method, 
    card_brand, card_last_four, CONCAT('REF-', transaction_id), 'Order cancellation refund', COALESCE(cancelled_at, updated_at)
FROM orders 
WHERE status = 'CANCELLED' AND payment_status = 'REFUNDED';
```

---

### 3.2. REST Endpoints Specification (`/api/admin/reports`)

Requires `ROLE_ADMIN`.

#### 1. Sales Report Endpoint
- **`GET /api/admin/reports/sales?period={DAY|WEEK|MONTH}`**
- Response Body:
  ```json
  {
    "period": "DAY",
    "grossRevenue": 1540.00,
    "refundAmount": 162.00,
    "netRevenue": 1378.00,
    "totalOrders": 8,
    "averageOrderValue": 192.50,
    "petsAdopted": 4,
    "suppliesSold": 12,
    "dataPoints": [
      {
        "periodLabel": "2026-10-05",
        "grossRevenue": 480.60,
        "refundAmount": 0.00,
        "netRevenue": 480.60,
        "ordersCount": 2,
        "petsCount": 1,
        "suppliesCount": 3
      }
    ]
  }
  ```

#### 2. Inventory Report Endpoint
- **`GET /api/admin/reports/inventory`**
- Response Body:
  ```json
  {
    "totalPets": 24,
    "availablePets": 18,
    "adoptedPets": 6,
    "totalSupplySkus": 15,
    "inStockSuppliesCount": 13,
    "lowStockSuppliesCount": 2,
    "outOfStockSuppliesCount": 0,
    "totalSuppliesStockUnits": 340,
    "totalSuppliesValuation": 8450.00,
    "lowStockAlerts": [
      {
        "sku": "FOOD-CANINE-001",
        "name": "Dog Kibble 5kg",
        "stockQuantity": 2,
        "lowStockThreshold": 5,
        "unitPrice": 45.00
      }
    ],
    "petCategoryBreakdown": [
      {
        "category": "Dogs",
        "total": 12,
        "available": 9,
        "adopted": 3
      }
    ]
  }
  ```

#### 3. CSV Export Endpoints
- **`GET /api/admin/reports/sales/csv?period={DAY|WEEK|MONTH}`**
  - Content-Type: `text/csv; charset=UTF-8`
  - Header: `Content-Disposition: attachment; filename="sales-report-{period}-{timestamp}.csv"`
- **`GET /api/admin/reports/inventory/csv`**
  - Content-Type: `text/csv; charset=UTF-8`
  - Header: `Content-Disposition: attachment; filename="inventory-report-{timestamp}.csv"`

---

### 3.3. Angular 24 Exclusive Signal Forms Reporting View (`/admin/reports`)

- Route: `/admin/reports` (protected by `adminGuard`).
- Component: Standalone `AdminReportsComponent`.
- Layout:
  - Header with Report Type Toggle (Sales Analytics vs Inventory Analytics) and CSV Export triggers.
  - Sales Analytics Tab:
    - Period Switcher using Signals: `selectedPeriod = model<'DAY' | 'WEEK' | 'MONTH'>('DAY')`.
    - Key Metric KPI Cards: Gross Revenue, Net Revenue, Orders Count, Avg Order Value, Pets Adopted, Units Sold.
    - Tabular Time-Series Breakdown (`Date / Period`, `Gross`, `Refunds`, `Net Revenue`, `Orders`, `Pets`, `Supplies`).
  - Inventory Analytics Tab:
    - Inventory Health KPI Cards: Pet Adoption Rate, In-Stock SKU Count, Low-Stock Warnings, Total Valuation.
    - Low-Stock Alert Table with direct replenishment navigation link.
    - Pet Taxonomy Distribution Table (Species, Available, Adopted, Adoption Rate %).

---

## 4. Multi-Developer Work Breakdown & Dependencies

- **Developer 1 (Database, Accounting Ledger & Event Hooks):**
  - Flyway migration `V10__create_accounting_ledger_and_reporting.sql`.
  - Create `AccountingLedger` entity, `LedgerTransactionType` enum, `AccountingLedgerRepository`.
  - Create `AccountingLedgerService` with `@Transactional` methods: `recordPayment(Order order)`, `recordRefund(Order order, String reason)`.
  - Integrate `recordPayment` into `CheckoutServiceImpl` and `recordRefund` into `OrderFulfillmentServiceImpl`.
- **Developer 2 (Analytics Aggregation & CSV Export Engine):**
  - Create `AnalyticsReportService` & `AnalyticsReportServiceImpl` executing aggregation queries.
  - Implement RFC 4180 CSV serializer for sales and inventory datasets.
  - Create `AdminReportController` with `@PreAuthorize("hasRole('ADMIN')")`.
  - Comprehensive unit and integration test coverage.
- **Developer 3 (Frontend Angular 24 Analytics Dashboard):**
  - Create `report.model.ts` and `ReportService`.
  - Create `AdminReportsComponent` with Signal-driven period tabs and CSV file download action.
  - Add navigation link to `NavbarComponent` ("Reports" for admin persona).
  - Configure route in `app.routes.ts`.

---

## 5. Verification & Acceptance Criteria

1. **Automated Ledger Posting:** Every checkout automatically records a `PAYMENT` ledger row; every cancellation automatically records a `REFUND` ledger row.
2. **Sales Analytics Accuracy:** Daily, Weekly, and Monthly aggregations compute gross, net, refund, orders, and item counts without discrepancy.
3. **Inventory Valuation & Low-Stock Alerts:** Inventory snapshot accurately tallies current stock, total valuation, and highlights items below threshold.
4. **CSV Export:** Generated CSV files download correctly, contain proper headers, RFC 4180 quoting, and parse cleanly in Excel/Google Sheets.
5. **Zero Spring Boot / Zero XML / Exclusive Signal Forms:** Strict architectural conformance and 100% build pass (`mvn clean test`, `npm.cmd run build`).

---

## 6. Human Approval Gate

```markdown
================================================================================
AI-DLC HUMAN APPROVAL GATE: SLICE 7 (ACCOUNTING & ANALYTICS REPORTING)
================================================================================
Please review this specification and questions Q-S7.1 to Q-S7.3 above.
To approve and begin execution, reply with:
  "Approved" (or provide your answers to Q-S7.1 - Q-S7.3)
================================================================================
```
