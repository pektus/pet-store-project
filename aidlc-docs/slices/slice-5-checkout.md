# Slice 5: Checkout, Inventory Reservation & Payment Emulation (`aidlc-docs/slices/slice-5-checkout.md`)

> **AI-DLC Slice Lifecycle Phase:** `[E] EXECUTE - COMPLETED & VERIFIED`  
> **Status:** `COMPLETED & VERIFIED (BUILD SUCCESS)`  
> **Slice Focus:** Concurrency-Safe Inventory Reservation, Payment Gateway Emulation (Luhn, CVV, Expiry, Masking), Atomic Checkout Pipeline, Pure Signal Forms Checkout UI

---

## 1. Slice Overview & Scope

Slice 5 delivers the end-to-end checkout and payment processing capabilities for the Pet Store platform. It transforms active shopping carts into legally binding customer orders while enforcing strict inventory locking, PCI compliance simulation, and payment gateway emulation.

As established in the approved Inception Blueprint (`project-spec.md` Q1.3 & Q1.1):
1. **Atomic Inventory Reservation:**
   - **Pets (`SINGLE`):** Status atomically transitions from `AVAILABLE` to `ADOPTED`. If another buyer completes checkout for the same pet milliseconds earlier, an optimistic/pessimistic lock conflict triggers an immediate rollback and notifies the customer.
   - **Physical Supplies (`MULTIPLE`):** Stock quantity is atomically decremented (`stock_quantity = stock_quantity - item.quantity`). If remaining stock reaches 0, status is automatically transitioned to `OUT_OF_STOCK`.
2. **Payment Emulation Engine:**
   - Client-side and server-side card validation:
     - Luhn algorithm (mod 10) validation.
     - Expiration date validation (`MM/YY` format, must be in the future).
     - CVV check (3 digits for Visa/Mastercard/Discover, 4 digits for Amex).
   - Test decline simulation for deterministic sandbox testing:
     - Specific card number endings trigger realistic decline codes (`0002` -> Insufficient Funds, `0004` -> Expired Card, `0005` -> Fraud Suspected).
     - Standard test cards authorize successfully with an emulated transaction ID.
3. **PCI Compliance Simulation & Security:**
   - Raw 16-digit Primary Account Numbers (PAN) and CVVs are **never stored** in the database.
   - Only masked card representation (`**** **** **** 1234`), card brand (`VISA`, `MASTERCARD`, `AMEX`, `DISCOVER`), expiration date, and transaction token are stored.
4. **Angular 24 Exclusive Signal Forms Checkout View:**
   - Pure Signal Forms with zero legacy `ReactiveFormsModule`/`FormGroup`.
   - Dynamic real-time card brand detection (Visa icon, Mastercard icon, Amex icon).
   - Auto-formatting card number inputs with spaces (`#### #### #### ####`).
   - Order confirmation and receipt receipt view.

---

## 2. Slice Clarifications & Targeted Questions (For User Review)

> ✍️ **Instructions for User:** Please review the questions below. You can edit this file directly to add your input under `**User Answer / Decision:**`.

* **Q-S5.1: Emulated Payment Decline Sandbox Triggers:**  
  To allow testing both successful checkouts and realistic payment failure scenarios, how should payment declines be triggered?  
  - *Architect Recommendation:* Adopt Stripe/PayPal sandbox conventions:
    - Card numbers ending in `0002`: Simulate `Payment Declined: Insufficient Funds`.
    - Card numbers ending in `0004`: Simulate `Payment Declined: Card Expired`.
    - Card numbers ending in `0005`: Simulate `Payment Declined: Suspected Fraudulent Card`.
    - Any other card passing the Luhn algorithm: Returns `Approved: Authorization Code AUTH-XXXXXX`.  
  - **User Answer / Decision:** accept architect recommendation

* **Q-S5.2: Checkout Guest vs. Registered Customer Policy:**  
  Should customers be required to log in or register before completing checkout?  
  - *Architect Recommendation:* Require authentication prior to final order submission. Unauthenticated guests can assemble their cart freely; clicking "Proceed to Checkout" prompts authentication (or account registration). Upon login, their cart is automatically synced to their account so that order confirmation, invoice emails, and post-purchase order history are properly attached to their profile.  
  - **User Answer / Decision:** accept architect recommendation

* **Q-S5.3: Shipping & Tax Calculation Rules:**  
  How should shipping charges and taxes be computed at checkout?  
  - *Architect Recommendation:*
    - Standard flat shipping fee of **$9.99**, with **Free Shipping** applied for orders with cart totals over **$75.00** (or containing an adopted Pet).
    - Flat estimated sales tax of **8.0%** calculated on subtotal.  
  - **User Answer / Decision:** accept architect recommendation

---

## 3. Technical Contract & Architecture Specifications

### 3.1. Database Schema Plan (`V8__create_orders_and_order_items_tables.sql`)

```sql
-- Orders Table
CREATE TABLE orders (
    id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(32) NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    subtotal NUMERIC(9, 2) NOT NULL,
    tax_amount NUMERIC(9, 2) NOT NULL DEFAULT 0.00,
    shipping_amount NUMERIC(9, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(9, 2) NOT NULL,

    -- Shipping Address & Recipient
    recipient_name VARCHAR(100) NOT NULL,
    recipient_phone VARCHAR(30) NOT NULL,
    shipping_address_line1 VARCHAR(150) NOT NULL,
    shipping_address_line2 VARCHAR(150),
    shipping_city VARCHAR(60) NOT NULL,
    shipping_state VARCHAR(60) NOT NULL,
    shipping_postal_code VARCHAR(20) NOT NULL,
    shipping_country VARCHAR(60) NOT NULL DEFAULT 'United States',

    -- Emulated Payment Data (PCI-safe: NO raw PAN or CVV stored)
    payment_status VARCHAR(20) NOT NULL DEFAULT 'PAID',
    payment_method VARCHAR(20) NOT NULL DEFAULT 'CREDIT_CARD',
    card_brand VARCHAR(20) NOT NULL,
    card_last_four VARCHAR(4) NOT NULL,
    transaction_id VARCHAR(64) NOT NULL UNIQUE,
    failure_reason VARCHAR(255),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE RESTRICT,
    CONSTRAINT chk_orders_status CHECK (status IN ('CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
    CONSTRAINT chk_orders_payment_status CHECK (payment_status IN ('PAID', 'FAILED', 'REFUNDED'))
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Order Items Table (Immutable snapshot of purchase)
CREATE TABLE order_items (
    id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    pet_id BIGINT,
    supply_id BIGINT,
    title VARCHAR(100) NOT NULL,
    subtitle VARCHAR(100),
    unit_price NUMERIC(9, 2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    subtotal NUMERIC(9, 2) NOT NULL,
    photo_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE SET NULL,
    CONSTRAINT fk_order_items_supply FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE SET NULL,
    CONSTRAINT chk_order_items_qty CHECK (quantity >= 1)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
```

---

### 3.2. REST Endpoints Specification

#### `POST /api/checkout` (Authenticated)
Header: `Authorization: Bearer <jwt>`  
Request Body:
```json
{
  "recipientName": "Jane Doe",
  "recipientPhone": "+1-555-0199",
  "shippingAddressLine1": "123 Market Street",
  "shippingAddressLine2": "Apt 4B",
  "shippingCity": "San Francisco",
  "shippingState": "CA",
  "shippingPostalCode": "94105",
  "shippingCountry": "United States",
  "payment": {
    "cardholderName": "Jane Doe",
    "cardNumber": "4000123456789010",
    "expiryMonth": "12",
    "expiryYear": "28",
    "cvv": "123"
  }
}
```

Response (201 Created):
```json
{
  "orderNumber": "ORD-20261005-7281",
  "status": "CONFIRMED",
  "paymentStatus": "PAID",
  "transactionId": "TXN-EMUL-9284716301",
  "cardBrand": "VISA",
  "cardLastFour": "9010",
  "subtotal": 295.00,
  "taxAmount": 23.60,
  "shippingAmount": 0.00,
  "totalAmount": 318.60,
  "recipientName": "Jane Doe",
  "shippingCity": "San Francisco",
  "items": [
    {
      "itemType": "PET",
      "title": "Buddy",
      "subtitle": "Golden Retriever (Dogs)",
      "unitPrice": 250.00,
      "quantity": 1,
      "subtotal": 250.00
    },
    {
      "itemType": "SUPPLY",
      "title": "Dog Kibble 5kg",
      "subtitle": "SKU: FOOD-CANINE-001",
      "unitPrice": 45.00,
      "quantity": 1,
      "subtotal": 45.00
    }
  ],
  "createdAt": "2026-10-05T13:46:00Z"
}
```

---

### 3.3. Angular 24 Exclusive Signal Forms Checkout View Plan

- Route: `/checkout`
- Route Guard: `authGuard` (redirects to login dialog or opens auth drawer if not authenticated).
- State:
  - Shipping address signal models (`recipientName = model('')`, `address1 = model('')`, etc.)
  - Payment signal models (`cardholderName = model('')`, `cardNumber = model('')`, `expiryMonth = model('')`, `expiryYear = model('')`, `cvv = model('')`)
  - Computed Signal validations:
    - Card number: 16 digits, passes client-side Luhn check (`isCardNumberValid`).
    - Expiry: valid 2-digit month (01-12) and future year (`isExpiryValid`).
    - CVV: 3-4 digits numeric (`isCvvValid`).
    - Dynamic Card Brand detection: `detectedCardBrand = computed(() => detectBrand(cardNumber()))`.
  - Order Receipt View:
    - Upon successful checkout, displays high-fidelity receipt with order reference number, delivery address summary, transaction approval code, and link to return to catalog.

---

## 4. Multi-Developer Work Breakdown & Dependencies

- **Developer 1 (Database & Transactional Checkout Pipeline):**
  - Flyway migration `V8__create_orders_and_order_items_tables.sql`.
  - `Order`, `OrderItem`, `OrderStatus`, `PaymentStatus` entities and repositories.
  - `PaymentEmulationService` with Luhn check, card brand detection, and decline simulator.
  - `CheckoutService` with `@Transactional` atomic pet status lock and stock decrement.
  - `CheckoutController` and Spring Security configuration.
  - Comprehensive unit and concurrency tests for checkout.
- **Developer 2 (Frontend Signal Forms Checkout & Receipt UI):**
  - Signal Forms checkout page at `/checkout`.
  - Real-time card formatting (`#### #### #### ####`) and card brand visual indicator.
  - Live order summary calculating subtotal, tax, and shipping.
  - Order success receipt modal/page.

---

## 5. Execution Summary & Verification

### Implemented Artifacts:
- **Database & Flyway:** `V8__create_orders_and_order_items_tables.sql` creating `orders` and `order_items` tables with PCI-safe masking, transaction references, item historical snapshot, and foreign keys.
- **Domain Layer:**
  - Entities: `Order.java`, `OrderItem.java`.
  - Enums: `OrderStatus.java`, `PaymentStatus.java`, `PaymentMethod.java`, `CardBrand.java`.
  - DTOs: `PaymentRequest.java`, `CheckoutRequest.java`, `OrderItemResponseDTO.java`, `OrderResponseDTO.java`, `CheckoutQuoteDTO.java`, `PaymentResult.java`.
- **Persistence & Services:**
  - Repositories: `OrderRepository.java`, `OrderItemRepository.java`.
  - `PaymentEmulationService` / `PaymentEmulationServiceImpl`: Client & server Luhn algorithm validation, expiration & CVV check, dynamic card brand detection, and deterministic decline simulations (`0002` insufficient funds, `0004` expired card, `0005` suspected fraud).
  - `CheckoutService` / `CheckoutServiceImpl`: Atomic inventory locking (transitions pet to `ADOPTED`, decrements supply stock quantity and auto-transitions to `OUT_OF_STOCK` if depleted), cart clearance, shipping & tax computation, order generation.
  - Exceptions: `PaymentProcessingException.java`.
  - Unit tests: `PaymentEmulationServiceImplTest.java` (7/7 passing), `CheckoutServiceImplTest.java` (4/4 passing).
- **Web MVC & Security:**
  - `CheckoutController.java` (`GET /api/checkout/quote`, `POST /api/checkout`).
  - `GlobalExceptionHandler.java` handling `PaymentProcessingException`.
  - `SecurityConfig.java` enforcing `.authenticated()` on `/api/checkout/**`.
- **Frontend (Angular 24 Exclusive Signal Forms):**
  - Models: `order.model.ts`.
  - Services: `checkout.service.ts`.
  - Component: Standalone `CheckoutComponent` with 100% Signal Forms (`model()`), real-time Luhn validation, brand detection badge, card number auto-formatting (`#### #### #### ####`), sandbox test autofill buttons, live order summary, and order confirmation receipt view.
  - Routing: `/checkout` configured in `app.routes.ts`.
- **Build Verification:**
  - Multi-module reactor build: `mvn clean test` across parent, domain, service, web, and frontend -> `BUILD SUCCESS` (42 unit tests passing, zero errors).
  - Frontend production build: `npm.cmd run build` -> `Application bundle generation complete` (zero errors).
