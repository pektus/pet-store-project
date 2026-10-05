-- ==============================================================================
-- Migration V6: Create Physical Supplies Table
-- Database: PostgreSQL 16+
-- ==============================================================================

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
    CONSTRAINT chk_supplies_threshold CHECK (low_stock_threshold >= 0),
    CONSTRAINT chk_supplies_status CHECK (status IN ('ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED')),
    CONSTRAINT chk_supplies_item_type CHECK (item_type = 'MULTIPLE')
);

CREATE INDEX idx_supplies_sku ON supplies(sku);
CREATE INDEX idx_supplies_category_status ON supplies(category, status);
CREATE INDEX idx_supplies_stock ON supplies(stock_quantity);
CREATE INDEX idx_supplies_name_trgm ON supplies USING gin (name gin_trgm_ops);
CREATE INDEX idx_supplies_desc_trgm ON supplies USING gin (description gin_trgm_ops);
