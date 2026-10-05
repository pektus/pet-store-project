# Slice 4: Shopping Cart Management (`aidlc-docs/slices/slice-4-cart.md`)

> **AI-DLC Slice Lifecycle Phase:** `[E] EXECUTE - COMPLETED & VERIFIED`  
> **Status:** `COMPLETED & VERIFIED (BUILD SUCCESS)`  
> **Slice Focus:** Active Shopping Cart, Pet vs Supply Quantity Rules, Guest Cart Synchronization, Signal-First Cart Drawer

---

## 1. Slice Overview & Scope

Slice 4 establishes active shopping cart capabilities for the Pet Store platform. It bridges catalog exploration with the upcoming checkout flow, accommodating both anonymous visitors and authenticated customers.

As defined in the approved Project Inception Blueprint (`project-spec.md` Q1.1 & Q1.2):
- **Pets (`SINGLE` entity):** Exactly 1 unit permitted per cart. If a pet is already in the cart or marked as `ADOPTED`/`PENDING`, adding it is prohibited.
- **Physical Supplies (`MULTIPLE` entity):** Multi-quantity supported (`quantity >= 1`), constrained only by current warehouse inventory stock.
- **Guest-to-Authenticated Cart Sync:** Unauthenticated visitors can build a cart saved in client Signal state and `localStorage`. When the customer logs in or verifies their email, their local cart merges into the database cart.

### Key Objectives:
1. **Database Schema & Flyway Migration `V7__create_cart_tables.sql`:**
   - Table `carts`: `id`, `user_id` (nullable for anonymous sessions, foreign key to `app_users`), `session_token` (UUID for anonymous tracking), `created_at`, `updated_at`.
   - Table `cart_items`: `id`, `cart_id` (FK to `carts`), `item_type` (`PET` vs `SUPPLY`), `pet_id` (nullable FK to `pets`), `supply_id` (nullable FK to `supplies`), `quantity` (INT, CHECK `quantity >= 1`), `unit_price` (numeric), `created_at`.
   - Unique constraints: A pet cannot be duplicated in the same cart. A supply row is unique per `cart_id` + `supply_id`.
2. **Domain Layer & DTOs:**
   - Entities `Cart.java` and `CartItem.java` with cascade operations and helper methods.
   - Enums: `CartItemType` (`PET`, `SUPPLY`).
   - DTOs: `AddToCartRequest`, `UpdateCartItemRequest`, `CartSyncRequest`, `CartResponseDTO`, `CartItemResponseDTO`.
3. **Service Layer:**
   - `CartService` and `CartServiceImpl` implementing item addition, quantity modification, item removal, cart clearing, stock availability validation, and guest cart synchronization.
   - Unit tests covering pet single-lock rules, supply quantity updates against warehouse stock, and guest cart merging.
4. **Web REST Endpoints & Security:**
   - `GET /api/cart`: Retrieve current user or session cart.
   - `POST /api/cart/items`: Add pet or supply to cart.
   - `PUT /api/cart/items/{itemId}`: Update supply quantity.
   - `DELETE /api/cart/items/{itemId}`: Remove item from cart.
   - `DELETE /api/cart`: Clear entire cart.
   - `POST /api/cart/sync`: Merge guest cart items into authenticated user cart upon login/activation.
5. **Angular 24 Signal-First Frontend Components:**
   - `CartStore`: 100% Signal-First cart state management (`items = signal([])`, `totalCount = computed()`, `totalAmount = computed()`, `isDrawerOpen = signal(false)`).
   - Standalone `CartDrawerComponent`: Off-canvas responsive slide-over drawer accessible from any page.
   - Navbar badge showing reactive real-time cart item count.
   - "Add to Cart" buttons integrated into Pet Cards, Pet Detail Modal, and Supply Cards.

---

## 2. Slice Clarifications & Targeted Questions (For User Review)

> ✍️ **Instructions for User:** Please review the questions below. You can edit this file directly to add your input under `**User Answer / Decision:**`.

* **Q-S4.1: Cart Merge Conflict Policy on Login:**  
  When an anonymous user adds a physical supply to their guest cart (e.g. 2 units of Kibble), and then logs in to an account that already had 3 units of the same Kibble in their saved DB cart, how should quantities merge?  
  - *Architect Recommendation:* Sum the quantities (`2 + 3 = 5 units`), capped at the available warehouse stock quantity. If the sum exceeds warehouse inventory, set quantity to maximum available stock and display a notification.  
  - **User Answer / Decision:** Accept Architect recommendation

* **Q-S4.2: Pet Availability in Cart Notice:**  
  If another customer adopts a pet while it is sitting in someone's cart, how should the cart react?  
  - *Architect Recommendation:* During cart fetch (`GET /api/cart`), the system inspects pet status; if status is no longer `AVAILABLE`, the item is flagged with `isAvailable: false` and a warning badge "No longer available (Adopted)" appears in the cart, preventing checkout until removed.  
  - **User Answer / Decision:** Accept Architect recommendation

---

## 3. Technical Contract & API Specifications

### 3.1. REST Endpoints Specification

#### `GET /api/cart` (Public / Authenticated)
Header: Optional `Authorization: Bearer <jwt>` or `X-Session-Token: <uuid>`.  
**Response (200 OK):**
```json
{
  "cartId": 12,
  "totalItems": 3,
  "totalPrice": 349.98,
  "items": [
    {
      "id": 101,
      "itemType": "PET",
      "itemId": 5,
      "title": "Rocky",
      "subtitle": "German Shepherd (Dog)",
      "unitPrice": 250.00,
      "quantity": 1,
      "photoUrl": "/api/media/rocky.jpg",
      "isAvailable": true,
      "stockAvailable": 1
    },
    {
      "id": 102,
      "itemType": "SUPPLY",
      "itemId": 3,
      "title": "Salmon Dog Food 10kg",
      "subtitle": "SKU: FOOD-CANINE-001",
      "unitPrice": 49.99,
      "quantity": 2,
      "photoUrl": "/api/media/kibble.jpg",
      "isAvailable": true,
      "stockAvailable": 35
    }
  ]
}
```

#### `POST /api/cart/items` (Public / Authenticated)
**Request Body:**
```json
{
  "itemType": "SUPPLY",
  "itemId": 3,
  "quantity": 1
}
```

#### `POST /api/cart/sync` (Authenticated)
Transfers client-side guest cart items into customer's persistent database cart upon login or activation.

---

### 3.2. Database Schema Plan (`V7__create_cart_tables.sql`)

```sql
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    session_token VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT uq_carts_user UNIQUE (user_id)
);

CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    pet_id BIGINT,
    supply_id BIGINT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(9, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_supply FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_item_type CHECK (item_type IN ('PET', 'SUPPLY')),
    CONSTRAINT chk_cart_item_qty CHECK (quantity >= 1)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
```

---

### 3.3. Angular 24 Signal-First Cart Architecture Plan

- **`CartStore` Signals:**
  - `items = signal<CartItem[]>`
  - `totalCount = computed(() => items().reduce((acc, i) => acc + i.quantity, 0))`
  - `totalAmount = computed(() => items().reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0))`
  - `isDrawerOpen = signal<boolean>(false)`
  - Methods: `addToCart(item, qty)`, `updateQuantity(itemId, qty)`, `removeFromCart(itemId)`, `clearCart()`, `syncGuestCart()`.
- **Exclusive Signal Forms:**
  - In `CartDrawerComponent`, quantity adjustments for supplies use Signal models (`model()`), with instant feedback and disabled buttons when quantity reaches warehouse limit or minimum of 1.

---

## 4. Multi-Developer Work Breakdown & Dependencies

- **Developer 1 (Database & Backend):**
  - Flyway migration `V7__create_cart_tables.sql`.
  - `Cart` & `CartItem` JPA entities, repositories, and `CartServiceImpl`.
  - Backend unit tests for cart rules and guest sync.
- **Developer 2 (Frontend Signal-First Cart UI):**
  - Implement `CartStore` with localStorage caching and sync.
  - Implement `CartDrawerComponent` with responsive slide-over and quantity controls.
  - Add "Add to Cart" triggers to catalog cards and detail modals.

---

## 5. Execution Summary & Verification

### Implemented Artifacts:
- **Database & Flyway:** `V7__create_cart_tables.sql` with `carts` and `cart_items` tables, polymorphic pet/supply constraints, and session tracking.
- **Domain Entities & DTOs:**
  - `Cart.java`, `CartItem.java`, `CartItemType.java`
  - `AddToCartRequest.java`, `UpdateCartItemRequest.java`, `CartSyncRequest.java`, `CartResponseDTO.java`, `CartItemResponseDTO.java`
- **Persistence & Service Layer:**
  - `CartRepository.java`, `CartItemRepository.java`
  - `CartService.java`, `CartServiceImpl.java` (pet single-lock, supply quantity merge up to stock, guest sync)
  - Unit tests: `CartServiceImplTest.java` (7/7 tests passing; all 31 service & domain tests passing)
- **Web MVC & Security:**
  - `CartController.java` (`GET /api/cart`, `POST /api/cart/items`, `PUT /api/cart/items/{id}`, `DELETE /api/cart/items/{id}`, `DELETE /api/cart`, `POST /api/cart/sync`)
  - `SecurityConfig.java` configured for public guest access and authenticated sync.
  - `GlobalExceptionHandler.java` handling `IllegalStateException` and `IllegalArgumentException`.
- **Frontend (Angular 24 Signal-First):**
  - Models: `cart.model.ts`
  - Services: `cart.service.ts` with session token management.
  - State: `CartStore.ts` with reactive signals, computed totals, and guest sync.
  - Components:
    - Standalone `CartDrawerComponent` (slide-over drawer with quantity steppers, availability flags, and checkout triggers).
    - `NavbarComponent` with reactive cart badge and drawer toggle.
    - "Adopt / Add to Cart" integration on `PetCardComponent`, `PetListRowComponent`, and `PetDetailModalComponent`.
    - Customer-facing `SupplyCatalogComponent` (`/supplies`) with real-time stock badges and "Add to Cart" actions.
- **Build Verification:**
  - Backend: `mvn clean test` across parent, domain, service, and web -> `BUILD SUCCESS` (31 unit tests passing).
  - Frontend: `npm.cmd run build` -> `Application bundle generation complete` (0 errors).
