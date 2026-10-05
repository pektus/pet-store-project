-- ==============================================================================
-- Migration V7: Create Shopping Cart and Cart Items Tables
-- Database: PostgreSQL 16+
-- ==============================================================================

-- 1. Carts Table (Supports authenticated customer carts and guest session carts)
CREATE TABLE carts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    session_token VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE,
    CONSTRAINT uq_carts_user UNIQUE (user_id)
);

CREATE INDEX idx_carts_session ON carts(session_token);

-- 2. Cart Items Table (Polymorphic references to PET or SUPPLY)
CREATE TABLE cart_items (
    id BIGSERIAL PRIMARY KEY,
    cart_id BIGINT NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    pet_id BIGINT,
    supply_id BIGINT,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(9, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_pet FOREIGN KEY (pet_id) REFERENCES pets(id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_supply FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE,
    CONSTRAINT chk_cart_item_type CHECK (item_type IN ('PET', 'SUPPLY')),
    CONSTRAINT chk_cart_item_qty CHECK (quantity >= 1),
    CONSTRAINT chk_cart_item_price CHECK (unit_price >= 0.00),
    CONSTRAINT uq_cart_pet UNIQUE (cart_id, pet_id),
    CONSTRAINT uq_cart_supply UNIQUE (cart_id, supply_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_pet ON cart_items(pet_id);
CREATE INDEX idx_cart_items_supply ON cart_items(supply_id);
