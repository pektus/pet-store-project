-- ==============================================================================
-- Migration V8: Create Orders and Order Items Tables
-- Database: PostgreSQL 16+
-- ==============================================================================

-- 1. Orders Table
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
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- 2. Order Items Table (Immutable historical snapshot of purchase)
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
    CONSTRAINT chk_order_items_type CHECK (item_type IN ('PET', 'SUPPLY')),
    CONSTRAINT chk_order_items_qty CHECK (quantity >= 1)
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
