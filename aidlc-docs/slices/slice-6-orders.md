# Slice 6: Customer Order History & Admin Order Fulfillment (`aidlc-docs/slices/slice-6-orders.md`)

> **AI-DLC Slice Lifecycle Phase:** `[E] EXECUTE - COMPLETED & VERIFIED`  
> **Status:** `COMPLETED & VERIFIED (BUILD SUCCESS)`  
> **Slice Focus:** Customer Order Tracking & History, Admin Order Fulfillment Pipeline, Inventory Rollback on Cancellation, Signal Forms Filters

---

## 1. Slice Overview & Scope

Slice 6 delivers complete post-purchase lifecycle management across both customer and administrator personas:
1. **Customer Order Self-Service ("My Orders"):**
   - Customers can browse their historical orders with chronological pagination.
   - Dedicated order detail view displaying items purchased, snapshot prices, pet adoption details, recipient shipping address, and tracking status.
   - Self-service order cancellation for orders in the `CONFIRMED` state prior to warehouse processing.
2. **Administrator Order Fulfillment Dashboard:**
   - Unified fulfillment operations dashboard allowing administrators to filter orders by lifecycle status (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), search by order number / customer email / recipient name, and filter by date range.
   - Lifecycle status progression controls (`CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`) with carrier and tracking number assignment.
   - Administrative cancellation and refund processing.
3. **Automated Inventory Restocking & Reversal:**
   - When an order is cancelled (either via customer self-service or admin cancellation):
     - Adopted pets are automatically released: pet status transitions from `ADOPTED` back to `AVAILABLE`.
     - Physical supplies are restocked: item quantity is atomically credited back (`stock_quantity = stock_quantity + item.quantity`), and if status was `OUT_OF_STOCK`, it automatically restores to `IN_STOCK`.
     - Order payment status transitions to `REFUNDED`.
4. **Angular 24 Exclusive Signal Forms Architecture:**
   - 100% Signal Forms (`model()`, computed validations, debounced filters). Zero legacy Reactive Forms.
   - Responsive status timeline badge stepper (`CONFIRMED` -> `PROCESSING` -> `SHIPPED` -> `DELIVERED`).
   - Admin fulfillment management toolbar with Signal filter bindings and status update dialogs.

---

## 2. Slice Clarifications & Targeted Questions (For User Review)

> ✍️ **Instructions for User:** Please review the questions below. You can edit this file directly to add your input under `**User Answer / Decision:**` or respond in chat with your confirmation.

* **Q-S6.1: Customer Self-Service Cancellation Window:**  
  Should customers be permitted to cancel their own orders, and under what conditions?  
  - *Architect Recommendation:* Yes, allow customers to cancel their order as long as the order status is still `CONFIRMED` (before the store marks it as `PROCESSING` or `SHIPPED`). Once an order enters `PROCESSING` or subsequent states, the customer must contact support and only an Administrator can cancel or refund the order.  
  - **User Answer / Decision:** accept Architect recommendation

* **Q-S6.2: Pet & Supply Inventory Reversal on Cancellation:**  
  When an order is cancelled (by either customer or admin), should inventory be automatically restocked?  
  - *Architect Recommendation:* Yes, automatic and transactional rollback:
    - Pet items (`SINGLE`): Pet status transitions from `ADOPTED` back to `AVAILABLE`.
    - Physical Supplies (`MULTIPLE`): Supply `stock_quantity` is incremented by the cancelled quantity. If the supply was previously flagged as `OUT_OF_STOCK`, it automatically returns to `IN_STOCK`.
    - Payment status transitions from `PAID` to `REFUNDED`.  
  - **User Answer / Decision:** accept Architect recommendation

* **Q-S6.3: Fulfillment Tracking Metadata (Carrier & Tracking Number):**  
  When an administrator transitions an order to `SHIPPED`, should tracking number and carrier information be captured and displayed to the customer?  
  - *Architect Recommendation:* Yes. Add optional fulfillment fields: `carrier` (e.g., FedEx, UPS, USPS, DHL) and `tracking_number` (string). When populated, these are presented on the customer's order detail view alongside status progression timestamps (`shipped_at`, `delivered_at`).  
  - **User Answer / Decision:** accept Architect recommendation

---

## 3. Technical Contract & Architecture Specifications

### 3.1. Database Migration Plan (`V9__add_order_fulfillment_fields.sql`)

```sql
-- Migration V9: Add fulfillment and cancellation tracking fields to orders
ALTER TABLE orders 
    ADD COLUMN carrier VARCHAR(50),
    ADD COLUMN tracking_number VARCHAR(100),
    ADD COLUMN cancellation_reason VARCHAR(255),
    ADD COLUMN cancelled_at TIMESTAMPTZ,
    ADD COLUMN shipped_at TIMESTAMPTZ,
    ADD COLUMN delivered_at TIMESTAMPTZ;

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);
```

### 3.2. REST Endpoints Specification

#### Customer Endpoints (`/api/customer/orders`)
- **`GET /api/customer/orders`** (Requires `ROLE_CUSTOMER` or `ROLE_ADMIN`):
  - Query Params: `page` (default: 0), `size` (default: 10), `sort` (default: `createdAt,desc`).
  - Response: Paginated list of `OrderResponseDTO` belonging strictly to the authenticated user.
- **`GET /api/customer/orders/{orderNumber}`** (Requires authentication):
  - Verifies ownership (customer can only view their own order; admin can view any).
  - Returns complete `OrderResponseDTO` with item list, shipping address, and tracking metadata.
- **`POST /api/customer/orders/{orderNumber}/cancel`** (Requires authentication):
  - Request Body: `{ "reason": "Changed my mind" }` (optional).
  - Validates that order is owned by the user and status is currently `CONFIRMED`.
  - Atomically restocks pets to `AVAILABLE`, restocks supplies, sets status to `CANCELLED`, paymentStatus to `REFUNDED`.

#### Admin Endpoints (`/api/admin/orders`)
- **`GET /api/admin/orders`** (Requires `ROLE_ADMIN`):
  - Query Params: `query` (search order number, customer email, recipient name), `status` (`CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`), `page`, `size`, `sort`.
  - Dynamic multi-criteria JPA Specification execution.
  - Response: Paginated list of `OrderResponseDTO`.
- **`PATCH /api/admin/orders/{orderNumber}/status`** (Requires `ROLE_ADMIN`):
  - Request Body:
    ```json
    {
      "status": "SHIPPED",
      "carrier": "FedEx",
      "trackingNumber": "FX-9402819482",
      "cancellationReason": null
    }
    ```
  - State machine transition validation:
    - `CONFIRMED` -> `PROCESSING` or `CANCELLED`
    - `PROCESSING` -> `SHIPPED` or `CANCELLED`
    - `SHIPPED` -> `DELIVERED` or `CANCELLED`
    - `DELIVERED` -> Terminal state (cannot transition)
    - `CANCELLED` -> Terminal state (cannot transition)
  - If target state is `CANCELLED`: executes automatic inventory restock and refund.

---

### 3.3. Angular 24 Exclusive Signal Forms Architecture

#### 1. Customer "My Orders" Route (`/orders` & `/orders/:orderNumber`)
- Protected by `authGuard`.
- Component: Standalone `CustomerOrdersComponent`.
- Layout:
  - Header with summary stats (Active orders count, Completed orders).
  - Signal-driven order card list with status badge colors:
    - `CONFIRMED`: Blue badge
    - `PROCESSING`: Amber badge
    - `SHIPPED`: Purple badge
    - `DELIVERED`: Green badge
    - `CANCELLED`: Red badge
  - Visual Stepper Progress Bar showing tracking milestones.
  - "Cancel Order" button enabled only if status is `CONFIRMED`, triggering confirmation dialog with Signal Form for optional cancellation reason.
  - Expandable / linkable item details showing item photos, titles, SKUs, and prices.

#### 2. Admin Order Fulfillment Dashboard (`/admin/orders`)
- Protected by `adminGuard`.
- Component: Standalone `AdminOrdersComponent`.
- Toolbar with Pure Signal Forms:
  - `statusFilter = model<string>('ALL')`
  - `searchQuery = model<string>('')` (debounced Signal query)
  - Real-time filtered tabular view showing Order #, Date, Customer/Recipient, Items count, Total, Status, and Action buttons.
  - Status Progression Dialog:
    - When advancing to `SHIPPED`, prompts Signal Form inputs for `carrier = model('')` and `trackingNumber = model('')`.
    - When cancelling, prompts Signal Form input for `cancellationReason = model('')`.

---

## 4. Multi-Developer Work Breakdown & Dependencies

- **Developer 1 (Database, Domain & Fulfillment Business Logic):**
  - Flyway migration `V9__add_order_fulfillment_fields.sql`.
  - Update `Order` entity with fulfillment fields (`carrier`, `trackingNumber`, `shippedAt`, etc.).
  - Update `OrderResponseDTO` and create `OrderStatusUpdateRequest.java`, `OrderCancelRequest.java`.
  - Extend `OrderRepository` with `JpaSpecificationExecutor<Order>` and ownership lookup methods.
  - Create `OrderFulfillmentService` & `OrderFulfillmentServiceImpl` with transactional cancellation rollback engine.
  - Unit tests for status transition state machine and restock logic.
- **Developer 2 (REST Controllers & Spring Security):**
  - Create `CustomerOrderController.java` (`/api/customer/orders/**`).
  - Create `AdminOrderController.java` (`/api/admin/orders/**`).
  - Configure Spring Security endpoints with `@PreAuthorize` / security matcher rules.
  - Controller integration tests.
- **Developer 3 (Frontend Angular 24 Signal-First Views):**
  - Create `OrderService` in `src/app/core/services/order.service.ts`.
  - Create `CustomerOrdersComponent` (`/orders`) with Signal-driven order list and cancellation dialog.
  - Create `AdminOrdersComponent` (`/admin/orders`) with Signal Forms search toolbar and fulfillment modal.
  - Add navigation links to `NavbarComponent` ("My Orders" for customers, "Orders" for admins).
  - Configure routes in `app.routes.ts`.

---

## 5. Verification & Acceptance Criteria

1. **Customer Order Exploration:** Authenticated customer can view all and only their own orders with correct financial amounts and item breakdowns.
2. **Order Lifecycle Stepper:** Status transitions correctly reflect on the customer order tracking view.
3. **Customer Cancellation:** Customer can cancel a `CONFIRMED` order; the order status changes to `CANCELLED`, payment status changes to `REFUNDED`, and inventory is immediately restored.
4. **Admin Fulfillment & Filtering:** Administrator can search orders by customer/order number, filter by status, and transition orders through `PROCESSING` -> `SHIPPED` -> `DELIVERED` with tracking info.
5. **Architectural Conformance:**
   - Pure Spring Framework 7 programmatic config (Zero Spring Boot, Zero XML).
   - Pure Angular 24 Signal Forms (`model()`). Zero `ReactiveFormsModule`/`FormGroup`.
   - 100% build pass: `mvn clean test` and `npm.cmd run build`.

---

## 6. Human Approval Gate

Approved by User on 2026-10-05.

---

## 7. Execution Summary & Verification

### Implemented Artifacts:
- **Database & Flyway Migration:**
  - [`V9__add_order_fulfillment_fields.sql`](../../pet-store-web/src/main/resources/db/migration/V9__add_order_fulfillment_fields.sql): Added `carrier`, `tracking_number`, `cancellation_reason`, `cancelled_at`, `shipped_at`, and `delivered_at` columns plus status and tracking indexes on `orders`.
- **Domain & DTOs:**
  - Entities & DTOs: Updated [`Order.java`](../../pet-store-domain/src/main/java/com/petstore/domain/entity/Order.java) and [`OrderResponseDTO.java`](../../pet-store-domain/src/main/java/com/petstore/domain/dto/OrderResponseDTO.java) with tracking, carrier, and cancellation metadata.
  - Request DTOs: Created [`OrderStatusUpdateRequest.java`](../../pet-store-domain/src/main/java/com/petstore/domain/dto/OrderStatusUpdateRequest.java) and [`OrderCancelRequest.java`](../../pet-store-domain/src/main/java/com/petstore/domain/dto/OrderCancelRequest.java).
- **Service & Repositories:**
  - [`OrderRepository.java`](../../pet-store-service/src/main/java/com/petstore/service/repository/OrderRepository.java): Extended with `JpaSpecificationExecutor<Order>` and order query methods with user verification and eager item loading.
  - [`OrderFulfillmentService.java`](../../pet-store-service/src/main/java/com/petstore/service/service/OrderFulfillmentService.java) & [`OrderFulfillmentServiceImpl.java`](../../pet-store-service/src/main/java/com/petstore/service/service/impl/OrderFulfillmentServiceImpl.java): Implemented customer order history, customer self-cancellation, admin dynamic query specification, state machine transitions, and automated inventory rollback (restoring pets to `AVAILABLE`, restocking supply quantities, setting `REFUNDED` status).
  - Unit Tests: [`OrderFulfillmentServiceImplTest.java`](../../pet-store-service/src/test/java/com/petstore/service/service/impl/OrderFulfillmentServiceImplTest.java) (10 unit tests passing).
- **Web MVC & Security:**
  - [`CustomerOrderController.java`](../../pet-store-web/src/main/java/com/petstore/web/controller/CustomerOrderController.java): Secure authenticated customer endpoints (`GET /api/customer/orders`, `GET /api/customer/orders/{orderNumber}`, `POST /api/customer/orders/{orderNumber}/cancel`).
  - [`AdminOrderController.java`](../../pet-store-web/src/main/java/com/petstore/web/controller/AdminOrderController.java): Role-protected endpoints (`GET /api/admin/orders`, `GET /api/admin/orders/{orderNumber}`, `PATCH /api/admin/orders/{orderNumber}/status`).
  - [`SecurityConfig.java`](../../pet-store-web/src/main/java/com/petstore/web/config/SecurityConfig.java): Added `@EnableMethodSecurity` and endpoint authorization matchers.
  - Unit Tests: [`CustomerOrderControllerTest.java`](../../pet-store-web/src/test/java/com/petstore/web/controller/CustomerOrderControllerTest.java) (4 unit tests passing), [`AdminOrderControllerTest.java`](../../pet-store-web/src/test/java/com/petstore/web/controller/AdminOrderControllerTest.java) (3 unit tests passing).
- **Frontend (Angular 24 Exclusive Signal Forms):**
  - Guards: Created [`authGuard`](../../pet-store-frontend/src/app/core/guards/auth.guard.ts).
  - Models & Services: Updated [`order.model.ts`](../../pet-store-frontend/src/app/core/models/order.model.ts) and created [`OrderService`](../../pet-store-frontend/src/app/core/services/order.service.ts).
  - Customer Orders View: Standalone [`CustomerOrdersComponent`](../../pet-store-frontend/src/app/features/orders/customer-orders.component.ts) with status timeline progression stepper, tracking details, and Signal-based cancellation dialog.
  - Admin Fulfillment Dashboard: Standalone [`AdminOrdersComponent`](../../pet-store-frontend/src/app/features/admin/orders/admin-orders.component.ts) with Signal Forms search toolbar (`model()`), status transition dialogs, carrier/tracking assignment, and cancellation restock processing.
  - Navigation & Routing: Updated [`app.routes.ts`](../../pet-store-frontend/src/app/app.routes.ts), [`navbar.component.ts`](../../pet-store-frontend/src/app/shared/components/navbar/navbar.component.ts), and [`checkout.component.ts`](../../pet-store-frontend/src/app/features/checkout/checkout.component.ts).
- **Verification Results:**
  - Multi-module reactor build: `mvn clean test` across parent, domain, service, web, and frontend -> `BUILD SUCCESS` (65 unit tests passing, zero errors).
  - Frontend production build: `npm.cmd run build` -> `Application bundle generation complete` (zero errors, zero budget warnings).
